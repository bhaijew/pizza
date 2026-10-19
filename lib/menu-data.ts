/**
 * Server-side data fetching functions for the menu page.
 * Reads from real Supabase tables only — no fallback/fake data.
 *
 * IMPORTANT: The tables queried here (categories, products) must exist
 * in the Supabase database. If they do not exist, the functions return
 * { data: null, error: <message> } and the UI renders the empty/error state.
 */
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import type { Category, Product, RestaurantTable } from "@/types/menu";

// ─── Helper ───────────────────────────────────────────────────────
async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

// ─── Categories ───────────────────────────────────────────────────
export async function fetchCategories(shopId?: number | null): Promise<{
  data: Category[] | null;
  error: string | null;
  tableMissing: boolean;
}> {
  const supabase = await getSupabase();

  let query = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (shopId !== undefined) {
    if (shopId !== null) {
      query = query.eq("shop_id", shopId);
    } else {
      query = query.is("shop_id", null);
    }
  } else {
    const cookieStore = await cookies();
    const branchShopId = cookieStore.get("pizza_admin_shop_id")?.value;
    if (branchShopId) {
      query = query.eq("shop_id", parseInt(branchShopId, 10));
    } else {
      query = query.is("shop_id", null);
    }
  }

  const { data, error } = await query;

  if (error) {
    const tableMissing = error.message.includes("schema cache") || error.code === "PGRST205";
    return { data: null, error: error.message, tableMissing };
  }

  return { data: data as Category[], error: null, tableMissing: false };
}

// ─── Products ─────────────────────────────────────────────────────
export async function fetchProducts(
  categoryId?: string | number | null,
  shopId?: number | null
): Promise<{
  data: Product[] | null;
  error: string | null;
  tableMissing: boolean;
}> {
  const supabase = await getSupabase();

  let query = supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .order("sort_order", { ascending: true });

  if (categoryId != null) {
    query = query.eq("category_id", categoryId);
  }

  if (shopId !== undefined) {
    if (shopId !== null) {
      query = query.eq("shop_id", shopId);
    } else {
      query = query.is("shop_id", null);
    }
  } else {
    const cookieStore = await cookies();
    const branchShopId = cookieStore.get("pizza_admin_shop_id")?.value;
    if (branchShopId) {
      query = query.eq("shop_id", parseInt(branchShopId, 10));
    }
  }

  const { data, error } = await query;

  if (error) {
    const tableMissing = error.message.includes("schema cache") || error.code === "PGRST205";
    return { data: null, error: error.message, tableMissing };
  }

  return { data: data as Product[], error: null, tableMissing: false };
}

// ─── Shop Settings & Mobile Promo Slider ──────────────────────────
import { DEFAULT_PROMO_SLIDES, type PromoSlide } from "./preset-images";
export type { PromoSlide };
export { DEFAULT_PROMO_SLIDES };

export interface ShopSettings {
  shop_name: string;
  menu_title: string;
  meta_title: string;
  meta_description: string;
  currency_symbol: string;
  shop_id?: number | null;
  whatsapp_session_id?: string | null;
  whatsapp_api_key?: string | null;
  opening_time?: string;
  closing_time?: string;
  theme_color?: string;
  slider_enabled?: boolean;
  slider_height_mobile?: number;
  slider_images?: PromoSlide[] | string | null;
}

const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: "Pizza Shop",
  menu_title: "Our Menu",
  meta_title: "Pizza Shop — Order Online",
  meta_description: "Fresh, made-to-order pizzas.",
  currency_symbol: "$",
  shop_id: null,
  whatsapp_session_id: null,
  whatsapp_api_key: null,
  opening_time: "11:00",
  closing_time: "01:00",
  theme_color: "#ea580c",
  slider_enabled: true,
  slider_height_mobile: 180,
  slider_images: DEFAULT_PROMO_SLIDES,
};

export async function fetchShopBySlugOrId(identifier: string | number): Promise<any | null> {
  try {
    const supabase = await getSupabase();
    const isNumeric = typeof identifier === "number" || /^\d+$/.test(String(identifier));
    
    let query = supabase.from("shops").select("*");
    if (isNumeric) {
      query = query.eq("id", Number(identifier));
    } else {
      query = query.eq("slug", String(identifier));
    }

    const { data } = await query.maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export async function fetchSettings(shopId?: number | null): Promise<ShopSettings> {
  const supabase = await getSupabase();
  const cookieStore = await cookies();
  const targetShopId =
    shopId !== undefined
      ? shopId
      : cookieStore.get("pizza_admin_shop_id")?.value
      ? parseInt(cookieStore.get("pizza_admin_shop_id")!.value, 10)
      : null;

  if (targetShopId) {
    try {
      const { data: branchData } = await supabase
        .from("shops")
        .select("id, name, currency_symbol, status, whatsapp_session_id, whatsapp_api_key, opening_time, closing_time, theme_color, slider_enabled, slider_height_mobile, slider_images")
        .eq("id", targetShopId)
        .maybeSingle();

      if (branchData) {
        let parsedSlides = (branchData as any).slider_images;
        if (typeof parsedSlides === "string") {
          try {
            parsedSlides = JSON.parse(parsedSlides);
          } catch {
            parsedSlides = DEFAULT_PROMO_SLIDES;
          }
        }
        return {
          shop_name: branchData.name,
          menu_title: `${branchData.name} Menu`,
          meta_title: `${branchData.name} — Order Online`,
          meta_description: `Order fresh from ${branchData.name}.`,
          currency_symbol: branchData.currency_symbol || "Rs.",
          shop_id: branchData.id,
          whatsapp_session_id: (branchData as any).whatsapp_session_id || null,
          whatsapp_api_key: (branchData as any).whatsapp_api_key || null,
          opening_time: (branchData as any).opening_time || "11:00",
          closing_time: (branchData as any).closing_time || "01:00",
          theme_color: (branchData as any).theme_color || "#ea580c",
          slider_enabled: (branchData as any).slider_enabled !== false,
          slider_height_mobile: Number((branchData as any).slider_height_mobile) || 180,
          slider_images: Array.isArray(parsedSlides) && parsedSlides.length > 0 ? parsedSlides : DEFAULT_PROMO_SLIDES,
        };
      }
    } catch {
      // Continue to default
    }
  }

  try {
    const { data, error } = await supabase
      .from("shop_settings")
      .select("shop_name, menu_title, meta_title, meta_description, currency_symbol, whatsapp_session_id, whatsapp_api_key, opening_time, closing_time, theme_color, slider_enabled, slider_height_mobile, slider_images")
      .eq("id", "main")
      .single();

    if (!error && data) {
      let parsedSlides = (data as any).slider_images;
      if (typeof parsedSlides === "string") {
        try {
          parsedSlides = JSON.parse(parsedSlides);
        } catch {
          parsedSlides = DEFAULT_PROMO_SLIDES;
        }
      }
      return {
        ...data,
        currency_symbol: data.currency_symbol || "$",
        shop_id: null,
        opening_time: (data as any).opening_time || "11:00",
        closing_time: (data as any).closing_time || "01:00",
        theme_color: (data as any).theme_color || "#ea580c",
        slider_enabled: (data as any).slider_enabled !== false,
        slider_height_mobile: Number((data as any).slider_height_mobile) || 180,
        slider_images: Array.isArray(parsedSlides) && parsedSlides.length > 0 ? parsedSlides : DEFAULT_PROMO_SLIDES,
      } as ShopSettings;
    }
  } catch {
    // Fallback if columns not migrated yet
  }

  const { data: fallbackData } = await supabase
    .from("shop_settings")
    .select("shop_name, menu_title, meta_title, meta_description, currency_symbol")
    .eq("id", "main")
    .single();

  if (fallbackData) {
    return {
      ...fallbackData,
      currency_symbol: fallbackData.currency_symbol || "$",
      shop_id: null,
      whatsapp_session_id: null,
      whatsapp_api_key: null,
      opening_time: "11:00",
      closing_time: "01:00",
      theme_color: "#ea580c",
      slider_enabled: true,
      slider_height_mobile: 180,
      slider_images: DEFAULT_PROMO_SLIDES,
    } as ShopSettings;
  }

  return DEFAULT_SETTINGS;
}

// ─── Restaurant Tables ────────────────────────────────────────────
export async function fetchRestaurantTables(shopId?: number | null): Promise<RestaurantTable[]> {
  try {
    const supabase = await getSupabase();
    let query = supabase
      .from("restaurant_tables")
      .select("*")
      .order("created_at", { ascending: true });

    if (shopId !== undefined) {
      if (shopId !== null) {
        query = query.eq("shop_id", shopId);
      } else {
        query = query.is("shop_id", null);
      }
    } else {
      const cookieStore = await cookies();
      const branchShopId = cookieStore.get("pizza_admin_shop_id")?.value;
      if (branchShopId) {
        query = query.eq("shop_id", parseInt(branchShopId, 10));
      }
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data as RestaurantTable[];
  } catch {
    return [];
  }
}

// ─── Table Scan Verification (Anti-Fake Order Protection) ────────
export async function verifyTableScan(
  tableNumber: string,
  tokenParam?: string,
  shopId?: number | null
): Promise<{
  isValid: boolean;
  table?: RestaurantTable;
  reason?: "MISSING_TOKEN" | "TABLE_NOT_FOUND" | "INVALID_TOKEN";
}> {
  if (!tokenParam?.trim()) {
    return {
      isValid: false,
      reason: "MISSING_TOKEN",
    };
  }

  const tables = await fetchRestaurantTables(shopId);
  const matched = tables.find(
    (t) => t.table_number.toLowerCase() === tableNumber.toLowerCase()
  );

  if (!matched) {
    return {
      isValid: false,
      reason: "TABLE_NOT_FOUND",
    };
  }

  const cleanToken = tokenParam.trim().toUpperCase();
  const expectedToken = (matched.token_code || `PH-${matched.table_number}`).toUpperCase();

  if (cleanToken === expectedToken) {
    return {
      isValid: true,
      table: matched,
    };
  }

  return {
    isValid: false,
    reason: "INVALID_TOKEN",
    table: matched,
  };
}

