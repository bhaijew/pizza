/**
 * High-Performance Database In-Memory Cache Engine
 * Provides sub-millisecond RAM caching for Supabase database queries
 * with automatic TTL expiration, in-flight query deduplication,
 * and instant tag-based invalidation on admin mutations.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: string;
  totalEntries: number;
  savedQueries: number;
}

class DatabaseCacheEngine {
  private store: Map<string, CacheEntry<any>> = new Map();
  private inFlightPromises: Map<string, Promise<any>> = new Map();
  private hits = 0;
  private misses = 0;

  /**
   * Fetch data from cache, or invoke the fetcher and cache the result.
   * Includes thundering-herd protection (in-flight request deduplication).
   */
  async wrap<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttlSeconds?: number;
      tags?: string[];
      shouldCache?: (data: T) => boolean;
    }
  ): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key);

    // Cache hit
    if (entry && entry.expiresAt > now) {
      this.hits++;
      return entry.data as T;
    }

    // Deduplicate concurrent requests for the exact same key
    const existingPromise = this.inFlightPromises.get(key);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    // Cache miss — fetch fresh from database
    this.misses++;
    const ttlSeconds = options?.ttlSeconds ?? 60; // default 60s
    const tags = options?.tags ?? [];
    const shouldCache =
      options?.shouldCache ??
      ((val: any) => {
        if (val === null || val === undefined) return false;
        // Don't cache if result object indicates an error
        if (typeof val === "object" && "error" in val && val.error !== null && val.data === null) {
          return false;
        }
        return true;
      });

    const fetchPromise = (async () => {
      try {
        const freshData = await fetcher();

        // Only cache valid data if predicate passes
        if (shouldCache(freshData)) {
          this.store.set(key, {
            data: freshData,
            expiresAt: Date.now() + ttlSeconds * 1000,
            tags,
            createdAt: Date.now(),
          });
        }

        return freshData;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Invalidate all cache entries matching one or more tags.
   * E.g. dbCache.invalidateTag("products", "menu");
   */
  invalidateTag(...tags: string[]): number {
    let evictedCount = 0;
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));

    for (const [key, entry] of this.store.entries()) {
      const hasMatchingTag = entry.tags.some((tag) =>
        tagSet.has(tag.toLowerCase())
      );
      if (hasMatchingTag) {
        this.store.delete(key);
        evictedCount++;
      }
    }

    return evictedCount;
  }

  /**
   * Invalidate cache entries by key prefix.
   */
  invalidatePrefix(prefix: string): number {
    let evictedCount = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        evictedCount++;
      }
    }
    return evictedCount;
  }

  /**
   * Invalidate a single key.
   */
  invalidateKey(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.store.clear();
    this.inFlightPromises.clear();
  }

  /**
   * Telemetry stats for admin dashboard and monitoring.
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRateNum = total > 0 ? (this.hits / total) * 100 : 100;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRateNum.toFixed(1)}%`,
      totalEntries: this.store.size,
      savedQueries: this.hits,
    };
  }
}

// Global singleton across Next.js dev server hot reloads
const globalForCache = globalThis as unknown as {
  __dbCacheEngine?: DatabaseCacheEngine;
};

export const dbCache =
  globalForCache.__dbCacheEngine ?? new DatabaseCacheEngine();

if (process.env.NODE_ENV !== "production") {
  globalForCache.__dbCacheEngine = dbCache;
}
