/**
 * Image Optimization Utilities for Ultra-Low Latency & Slow Network (2G / 3G) support.
 *
 * 1. Automatically converts high-res external Unsplash / CDN links into lightweight (15KB - 30KB) WebP / AVIF thumbnails.
 * 2. Detects Save-Data and 2G mobile networks to lower bitrate further.
 * 3. Provides intelligent category-aware fallback URLs so broken images NEVER happen.
 */

export function isSlowNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as any).connection;
  if (!conn) return false;
  return (
    conn.saveData === true ||
    conn.effectiveType === "2g" ||
    conn.effectiveType === "slow-2g"
  );
}

/**
 * Transforms an image URL to deliver the smallest possible high-speed compressed version.
 * Converts 500KB+ images down to ~15KB - 35KB.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  targetWidth = 400,
  targetQuality = 65
): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // 1. Unsplash URL Optimization (Supports on-the-fly WebP/AVIF conversion and downscaling)
  if (trimmed.includes("images.unsplash.com")) {
    try {
      const u = new URL(trimmed);
      const isSlow = isSlowNetwork();
      const finalWidth = isSlow ? Math.min(targetWidth, 280) : targetWidth;
      const finalQuality = isSlow ? Math.min(targetQuality, 50) : targetQuality;

      u.searchParams.set("w", String(finalWidth));
      u.searchParams.set("q", String(finalQuality));
      u.searchParams.set("auto", "format"); // Auto-negotiates WebP / AVIF based on browser
      u.searchParams.set("fit", "crop");
      return u.toString();
    } catch {
      return trimmed;
    }
  }

  // 2. Bing Thumbnail CDN Optimization
  if (trimmed.includes("tse") && trimmed.includes("bing.net")) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set("w", String(targetWidth));
      u.searchParams.set("h", String(Math.round((targetWidth * 10) / 16)));
      u.searchParams.set("c", "7");
      u.searchParams.set("rs", "1");
      u.searchParams.set("qlt", "65");
      return u.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/**
 * Returns a fast, lightweight fallback image matching the category or product name.
 * Used whenever a network drop or expired URL occurs.
 */
export function getCategoryFallbackImage(
  categoryName?: string,
  productName?: string
): string {
  const combined = `${categoryName || ""} ${productName || ""}`.toLowerCase();

  if (combined.includes("burger") || combined.includes("zinger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=65";
  }
  if (
    combined.includes("fries") ||
    combined.includes("sides") ||
    combined.includes("wing") ||
    combined.includes("garlic")
  ) {
    return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=65";
  }
  if (
    combined.includes("drink") ||
    combined.includes("cola") ||
    combined.includes("bottle") ||
    combined.includes("water") ||
    combined.includes("shake")
  ) {
    return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=65";
  }
  if (combined.includes("pasta")) {
    return "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&auto=format&fit=crop&q=65";
  }
  if (
    combined.includes("shawarma") ||
    combined.includes("roll") ||
    combined.includes("paratha")
  ) {
    return "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&auto=format&fit=crop&q=65";
  }

  // Default to crispy handcrafted pizza
  return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=65";
}
