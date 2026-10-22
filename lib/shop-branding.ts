import fs from "fs";
import path from "path";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { dbCache } from "@/lib/db-cache";

export type MenuLayoutType =
  | "kfc"
  | "cheezious"
  | "mcdonalds"
  | "classic"
  | "modern_bistro"
  | "street_express";

export interface ShopBranding {
  logo_url: string | null;
  menu_layout: MenuLayoutType;
}

const DEFAULT_BRANDING: ShopBranding = {
  logo_url: null,
  menu_layout: "classic",
};

const DATA_FILE = path.join(process.cwd(), "data", "shop-branding.json");

function readLocalBranding(): Record<string, ShopBranding> {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) || {};
  } catch (err) {
    console.warn("[shop-branding] Failed to read local branding file:", err);
    return {};
  }
}

function writeLocalBranding(data: Record<string, ShopBranding>): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[shop-branding] Failed to write local branding file:", err);
  }
}

/**
 * Get branding (logo_url and menu_layout) for a given shopId (or null for master store).
 */
export async function getShopBranding(shopId?: number | null): Promise<ShopBranding> {
  const targetKey = shopId ? String(shopId) : "main";

  // 1. Check local persistent store first
  const localStore = readLocalBranding();
  const localRecord = localStore[targetKey];

  // 2. Try fetching from Supabase if configured
  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      if (shopId) {
        const { data } = await db
          .from("shops")
          .select("logo_url, menu_layout")
          .eq("id", shopId)
          .maybeSingle();

        if (data && (data.logo_url !== undefined || data.menu_layout !== undefined)) {
          return {
            logo_url: data.logo_url ?? localRecord?.logo_url ?? null,
            menu_layout: (data.menu_layout as MenuLayoutType) || localRecord?.menu_layout || "classic",
          };
        }
      } else {
        const { data } = await db
          .from("shop_settings")
          .select("logo_url, menu_layout")
          .eq("id", "main")
          .maybeSingle();

        if (data && (data.logo_url !== undefined || data.menu_layout !== undefined)) {
          return {
            logo_url: data.logo_url ?? localRecord?.logo_url ?? null,
            menu_layout: (data.menu_layout as MenuLayoutType) || localRecord?.menu_layout || "classic",
          };
        }
      }
    } catch {
      // Column may not be in DB yet, seamlessly fall back to local record
    }
  }

  if (localRecord) {
    return {
      logo_url: localRecord.logo_url ?? null,
      menu_layout: localRecord.menu_layout || "classic",
    };
  }

  return DEFAULT_BRANDING;
}

/**
 * Save branding (logo_url and menu_layout) for a given shopId (or null for master store).
 */
export async function saveShopBranding(
  shopId: number | null | undefined,
  branding: { logo_url?: string | null; menu_layout?: MenuLayoutType }
): Promise<{ success: boolean; data: ShopBranding; error?: string }> {
  const targetKey = shopId ? String(shopId) : "main";

  // 1. Update local persistent store
  const localStore = readLocalBranding();
  const current = localStore[targetKey] || { ...DEFAULT_BRANDING };

  const updated: ShopBranding = {
    logo_url: branding.logo_url !== undefined ? branding.logo_url : current.logo_url,
    menu_layout: branding.menu_layout || current.menu_layout || "classic",
  };

  localStore[targetKey] = updated;
  writeLocalBranding(localStore);

  // 2. Attempt updating Supabase
  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      const payload: Record<string, any> = {};
      if (branding.logo_url !== undefined) payload.logo_url = branding.logo_url;
      if (branding.menu_layout !== undefined) payload.menu_layout = branding.menu_layout;

      if (Object.keys(payload).length > 0) {
        if (shopId) {
          await db.from("shops").update(payload).eq("id", shopId);
        } else {
          await db.from("shop_settings").update(payload).eq("id", "main");
        }
      }
    } catch (err) {
      console.warn("[shop-branding] Supabase DB write skipped (falling back to persistent local storage):", err);
    }
  }

  // 3. Invalidate relevant caches
  dbCache.invalidateTag("shops", "settings", "branding", "menu");

  return { success: true, data: updated };
}
