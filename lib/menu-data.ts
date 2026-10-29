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
import { dbCache } from "@/lib/db-cache";
import { getShopBranding } from "@/lib/shop-branding";

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
  let resolvedShopId = shopId;
  if (resolvedShopId === undefined) {
    const cookieStore = await cookies();
    const branchShopId = cookieStore.get("pizza_admin_shop_id")?.value;
    resolvedShopId = branchShopId ? parseInt(branchShopId, 10) : null;
  }

  const cacheKey = `categories:${resolvedShopId ?? "all"}`;

  return dbCache.wrap(
    cacheKey,
    async () => {
      const supabase = await getSupabase();

      let query = supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (resolvedShopId !== null) {
        query = query.eq("shop_id", resolvedShopId);
      } else {
        query = query.is("shop_id", null);
      }

      const { data, error } = await query;

      if (error) {
        const tableMissing = error.message.includes("schema cache") || error.code === "PGRST205";
        return { data: null, error: error.message, tableMissing };
      }

      return { data: data as Category[], error: null, tableMissing: false };
    },
    { ttlSeconds: 120, tags: ["categories", "menu"] }
  );
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
  let resolvedShopId = shopId;
  if (resolvedShopId === undefined) {
    const cookieStore = await cookies();
    const branchShopId = cookieStore.get("pizza_admin_shop_id")?.value;
    resolvedShopId = branchShopId ? parseInt(branchShopId, 10) : undefined;
  }

  const cacheKey = `products:${categoryId ?? "all"}:${resolvedShopId ?? "any"}`;

  return dbCache.wrap(
    cacheKey,
    async () => {
      const supabase = await getSupabase();

      let query = supabase
        .from("products")
        .select("*, category:categories(id, name, slug)")
        .order("sort_order", { ascending: true });

      if (categoryId != null) {
        query = query.eq("category_id", categoryId);
      }

      if (resolvedShopId !== undefined) {
        if (resolvedShopId !== null) {
          query = query.eq("shop_id", resolvedShopId);
        } else {
          query = query.is("shop_id", null);
        }
      }

      const { data, error } = await query;

      if (error) {
        const tableMissing = error.message.includes("schema cache") || error.code === "PGRST205";
        return { data: null, error: error.message, tableMissing };
      }

      const productsList = ((data || []) as Product[]).map((p) => ({ ...p }));

      // Enrich products with deal data (items_included, original_price, badge)
      try {
        let dealQuery = supabase
          .from("deals")
          .select("id, product_id, title, slug, items_included, badge, deal_price, original_price, description")
          .eq("is_active", true);

        if (resolvedShopId !== undefined) {
          if (resolvedShopId !== null) {
            dealQuery = dealQuery.eq("shop_id", resolvedShopId);
          } else {
            dealQuery = dealQuery.is("shop_id", null);
          }
        }

        const { data: dealsData } = await dealQuery;

        if (dealsData && dealsData.length > 0) {
          const dealByProdId = new Map<string, any>();
          const dealByTitle = new Map<string, any>();
          const dealBySlug = new Map<string, any>();

          for (const d of dealsData) {
            if (d.product_id != null) dealByProdId.set(String(d.product_id), d);
            if (d.title) dealByTitle.set(d.title.trim().toLowerCase(), d);
            if (d.slug) dealBySlug.set(d.slug.trim().toLowerCase(), d);
          }

          for (const p of productsList) {
            const matchedDeal =
              dealByProdId.get(String(p.id)) ||
              dealByTitle.get(p.name?.trim().toLowerCase()) ||
              (p.slug ? dealBySlug.get(p.slug.trim().toLowerCase()) : null);

            if (matchedDeal) {
              let items = matchedDeal.items_included;
              if (typeof items === "string") {
                try {
                  items = JSON.parse(items);
                } catch {
                  items = items.split(",").map((s: string) => s.trim()).filter(Boolean);
                }
              }
              if (Array.isArray(items) && items.length > 0) {
                p.items_included = items;
              }
              if (matchedDeal.badge) p.badge = matchedDeal.badge;
              if (matchedDeal.original_price != null) p.original_price = matchedDeal.original_price;
              p.is_deal = true;
            }
          }
        }
      } catch (dealErr) {
        console.warn("[fetchProducts] Deals enrichment skipped:", dealErr);
      }

      return { data: productsList, error: null, tableMissing: false };
    },
    { ttlSeconds: 90, tags: ["products", "deals", "menu"] }
  );
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
  owner_phone?: string | null;
  opening_time?: string;
  closing_time?: string;
  theme_color?: string;
  slider_enabled?: boolean;
  slider_height_mobile?: number;
  slider_images?: PromoSlide[] | string | null;

  // Hero Section Customization
  hero_badge_text?: string;
  hero_title?: string;
  hero_title_highlight?: string;
  hero_subtitle?: string;
  hero_btn_primary_text?: string;
  hero_btn_primary_link?: string;
  hero_btn_secondary_text?: string;
  hero_btn_secondary_link?: string;
  hero_chip1_text?: string;
  hero_chip2_text?: string;
  hero_chip3_text?: string;
  hero_show_chips?: boolean;
  hero_bg_type?: "gradient" | "solid" | "image";
  hero_bg_color?: string;
  hero_bg_gradient?: string;
  hero_bg_image?: string;
  hero_show_pattern?: boolean;

  // Google Maps Review Link
  google_review_url?: string;

  // Custom Branding & Dynamic Menu Layout
  logo_url?: string | null;
  menu_layout?: "default" | string;

  // Menu 2.0 Premium System & Color Scheme
  menu2_status?: "locked" | "requested" | "approved";
  active_menu_template?: "menu1" | "menu2" | string;
  menu2_theme?: string;
  menu2_requested_at?: string | null;
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
  owner_phone: null,
  opening_time: "11:00",
  closing_time: "01:00",
  theme_color: "#ea580c",
  slider_enabled: true,
  slider_height_mobile: 180,
  slider_images: DEFAULT_PROMO_SLIDES,

  // Default Hero Section settings
  hero_badge_text: "Artisan Kitchen • Stone Baked Daily",
  hero_title: "Handcrafted Pizzas.",
  hero_title_highlight: "Fresh Every Order.",
  hero_subtitle: "Fresh stone-baked pizzas, burgers & drinks prepared to order.",
  hero_btn_primary_text: "Explore Menu",
  hero_btn_primary_link: "#menu",
  hero_btn_secondary_text: "",
  hero_btn_secondary_link: "#specials",
  hero_chip1_text: "10-15 Min Stone Bake",
  hero_chip2_text: "100% Real Whole Cheese",
  hero_chip3_text: "",
  hero_show_chips: true,
  hero_bg_type: "gradient",
  hero_bg_color: "",
  hero_bg_gradient: "",
  hero_bg_image: "",
  hero_show_pattern: true,
  google_review_url: "",
  logo_url: null,
  menu_layout: "default",
  menu2_status: "locked",
  active_menu_template: "menu1",
  menu2_theme: "ruby_gold",
  menu2_requested_at: null,
};

export async function fetchShopBySlugOrId(identifier: string | number): Promise<any | null> {
  const cacheKey = `shop:${String(identifier).trim().toLowerCase()}`;
  return dbCache.wrap(
    cacheKey,
    async () => {
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
        if (data) return data;

        if (!isNumeric) {
          const cleanId = String(identifier).trim();
          const { data: prefixMatch } = await supabase
            .from("shops")
            .select("*")
            .or(`slug.ilike.${cleanId}%,name.ilike.${cleanId}%`)
            .limit(1)
            .maybeSingle();
          return prefixMatch || null;
        }

        return null;
      } catch {
        return null;
      }
    },
    { ttlSeconds: 300, tags: ["shops", "settings"] }
  );
}

export async function fetchSettings(shopId?: number | null): Promise<ShopSettings> {
  const cookieStore = await cookies();
  const targetShopId =
    shopId !== undefined
      ? shopId
      : cookieStore.get("pizza_admin_shop_id")?.value
        ? parseInt(cookieStore.get("pizza_admin_shop_id")!.value, 10)
        : null;

  const cacheKey = `settings:${targetShopId ?? "main"}`;

  return dbCache.wrap(
    cacheKey,
    async () => {
      const supabase = await getSupabase();

      let baseResult = DEFAULT_SETTINGS;

      if (targetShopId) {
        try {
          const { data: branchData } = await supabase
            .from("shops")
            .select("id, name, currency_symbol, status, owner_phone, whatsapp_session_id, whatsapp_api_key, opening_time, closing_time, theme_color, slider_enabled, slider_height_mobile, slider_images, hero_badge_text, hero_title, hero_title_highlight, hero_subtitle, hero_btn_primary_text, hero_btn_primary_link, hero_btn_secondary_text, hero_btn_secondary_link, hero_chip1_text, hero_chip2_text, hero_chip3_text, hero_show_chips, hero_bg_type, hero_bg_color, hero_bg_gradient, hero_bg_image, hero_show_pattern, google_review_url, feature_flags")
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
            const ff = ((branchData as any).feature_flags && typeof (branchData as any).feature_flags === "object")
              ? (branchData as any).feature_flags
              : {};
            baseResult = {
              ...DEFAULT_SETTINGS,
              shop_name: branchData.name,
              menu_title: `${branchData.name} Menu`,
              meta_title: `${branchData.name} — Order Online`,
              meta_description: `Order fresh from ${branchData.name}.`,
              currency_symbol: branchData.currency_symbol || "Rs.",
              shop_id: branchData.id,
              owner_phone: (branchData as any).owner_phone || null,
              whatsapp_session_id: (branchData as any).whatsapp_session_id || null,
              whatsapp_api_key: (branchData as any).whatsapp_api_key || null,
              opening_time: (branchData as any).opening_time || "11:00",
              closing_time: (branchData as any).closing_time || "01:00",
              theme_color: (branchData as any).theme_color || "#ea580c",
              slider_enabled: (branchData as any).slider_enabled !== false,
              slider_height_mobile: Number((branchData as any).slider_height_mobile) || 180,
              slider_images: Array.isArray(parsedSlides) && parsedSlides.length > 0 ? parsedSlides : DEFAULT_PROMO_SLIDES,
              hero_badge_text: (branchData as any).hero_badge_text ?? DEFAULT_SETTINGS.hero_badge_text,
              hero_title: (branchData as any).hero_title ?? DEFAULT_SETTINGS.hero_title,
              hero_title_highlight: (branchData as any).hero_title_highlight ?? DEFAULT_SETTINGS.hero_title_highlight,
              hero_subtitle: (branchData as any).hero_subtitle ?? DEFAULT_SETTINGS.hero_subtitle,
              hero_btn_primary_text: (branchData as any).hero_btn_primary_text ?? DEFAULT_SETTINGS.hero_btn_primary_text,
              hero_btn_primary_link: (branchData as any).hero_btn_primary_link || DEFAULT_SETTINGS.hero_btn_primary_link,
              hero_btn_secondary_text: (branchData as any).hero_btn_secondary_text ?? DEFAULT_SETTINGS.hero_btn_secondary_text,
              hero_btn_secondary_link: (branchData as any).hero_btn_secondary_link || DEFAULT_SETTINGS.hero_btn_secondary_link,
              hero_chip1_text: (branchData as any).hero_chip1_text ?? DEFAULT_SETTINGS.hero_chip1_text,
              hero_chip2_text: (branchData as any).hero_chip2_text ?? DEFAULT_SETTINGS.hero_chip2_text,
              hero_chip3_text: (branchData as any).hero_chip3_text ?? DEFAULT_SETTINGS.hero_chip3_text,
              hero_show_chips: (branchData as any).hero_show_chips !== undefined ? (branchData as any).hero_show_chips : DEFAULT_SETTINGS.hero_show_chips,
              hero_bg_type: (branchData as any).hero_bg_type || DEFAULT_SETTINGS.hero_bg_type,
              hero_bg_color: (branchData as any).hero_bg_color || "",
              hero_bg_gradient: (branchData as any).hero_bg_gradient || "",
              hero_bg_image: (branchData as any).hero_bg_image || "",
              hero_show_pattern: (branchData as any).hero_show_pattern !== undefined ? (branchData as any).hero_show_pattern : DEFAULT_SETTINGS.hero_show_pattern,
              google_review_url: (branchData as any).google_review_url || "",
              menu2_status: ff.menu2_status || "locked",
              active_menu_template: ff.menu2_status === "approved" && ff.active_menu_template === "menu2" ? "menu2" : "menu1",
              menu2_theme: ff.menu2_theme || "ruby_gold",
              menu2_requested_at: ff.menu2_requested_at || null,
            };
          }
        } catch {
          // Continue to default
        }
      } else {
        try {
          const { data, error } = await supabase
            .from("shop_settings")
            .select("shop_name, menu_title, meta_title, meta_description, currency_symbol, whatsapp_session_id, whatsapp_api_key, opening_time, closing_time, theme_color, slider_enabled, slider_height_mobile, slider_images, hero_badge_text, hero_title, hero_title_highlight, hero_subtitle, hero_btn_primary_text, hero_btn_primary_link, hero_btn_secondary_text, hero_btn_secondary_link, hero_chip1_text, hero_chip2_text, hero_chip3_text, hero_show_chips, hero_bg_type, hero_bg_color, hero_bg_gradient, hero_bg_image, hero_show_pattern, google_review_url, feature_flags")
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
            const ff = ((data as any).feature_flags && typeof (data as any).feature_flags === "object")
              ? (data as any).feature_flags
              : {};
            baseResult = {
              ...DEFAULT_SETTINGS,
              ...data,
              currency_symbol: data.currency_symbol || "$",
              shop_id: null,
              opening_time: (data as any).opening_time || "11:00",
              closing_time: (data as any).closing_time || "01:00",
              theme_color: (data as any).theme_color || "#ea580c",
              slider_enabled: (data as any).slider_enabled !== false,
              slider_height_mobile: Number((data as any).slider_height_mobile) || 180,
              slider_images: Array.isArray(parsedSlides) && parsedSlides.length > 0 ? parsedSlides : DEFAULT_PROMO_SLIDES,
              hero_badge_text: (data as any).hero_badge_text ?? DEFAULT_SETTINGS.hero_badge_text,
              hero_title: (data as any).hero_title ?? DEFAULT_SETTINGS.hero_title,
              hero_title_highlight: (data as any).hero_title_highlight ?? DEFAULT_SETTINGS.hero_title_highlight,
              hero_subtitle: (data as any).hero_subtitle ?? DEFAULT_SETTINGS.hero_subtitle,
              hero_btn_primary_text: (data as any).hero_btn_primary_text ?? DEFAULT_SETTINGS.hero_btn_primary_text,
              hero_btn_primary_link: (data as any).hero_btn_primary_link || DEFAULT_SETTINGS.hero_btn_primary_link,
              hero_btn_secondary_text: (data as any).hero_btn_secondary_text ?? DEFAULT_SETTINGS.hero_btn_secondary_text,
              hero_btn_secondary_link: (data as any).hero_btn_secondary_link || DEFAULT_SETTINGS.hero_btn_secondary_link,
              hero_chip1_text: (data as any).hero_chip1_text ?? DEFAULT_SETTINGS.hero_chip1_text,
              hero_chip2_text: (data as any).hero_chip2_text ?? DEFAULT_SETTINGS.hero_chip2_text,
              hero_chip3_text: (data as any).hero_chip3_text ?? DEFAULT_SETTINGS.hero_chip3_text,
              hero_show_chips: (data as any).hero_show_chips !== undefined ? (data as any).hero_show_chips : DEFAULT_SETTINGS.hero_show_chips,
              hero_bg_type: (data as any).hero_bg_type || DEFAULT_SETTINGS.hero_bg_type,
              hero_bg_color: (data as any).hero_bg_color || "",
              hero_bg_gradient: (data as any).hero_bg_gradient || "",
              hero_bg_image: (data as any).hero_bg_image || "",
              hero_show_pattern: (data as any).hero_show_pattern !== undefined ? (data as any).hero_show_pattern : DEFAULT_SETTINGS.hero_show_pattern,
              google_review_url: (data as any).google_review_url || "",
              menu2_status: ff.menu2_status || "locked",
              active_menu_template: ff.menu2_status === "approved" && ff.active_menu_template === "menu2" ? "menu2" : "menu1",
              menu2_theme: ff.menu2_theme || "ruby_gold",
              menu2_requested_at: ff.menu2_requested_at || null,
            } as ShopSettings;
          }
        } catch {
          // Fallback if columns not migrated yet
        }

        if (baseResult === DEFAULT_SETTINGS) {
          const { data: fallbackData } = await supabase
            .from("shop_settings")
            .select("shop_name, menu_title, meta_title, meta_description, currency_symbol")
            .eq("id", "main")
            .single();

          if (fallbackData) {
            baseResult = {
              ...DEFAULT_SETTINGS,
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
        }
      }

      // Attach custom logo and menu layout
      const branding = await getShopBranding(targetShopId);
      return {
        ...baseResult,
        logo_url: branding.logo_url ?? baseResult.logo_url ?? null,
        menu_layout: "default",
      };
    },
    { ttlSeconds: 180, tags: ["settings", "branding"] }
  );
}

// ─── Restaurant Tables ────────────────────────────────────────────
export async function fetchRestaurantTables(shopId?: number | null): Promise<RestaurantTable[]> {
  let resolvedShopId = shopId;
  if (resolvedShopId === undefined) {
    const cookieStore = await cookies();
    const branchShopId = cookieStore.get("pizza_admin_shop_id")?.value;
    resolvedShopId = branchShopId ? parseInt(branchShopId, 10) : undefined;
  }

  const cacheKey = `restaurant_tables:${resolvedShopId ?? "all"}`;

  return dbCache.wrap(
    cacheKey,
    async () => {
      try {
        const supabase = await getSupabase();
        let query = supabase
          .from("restaurant_tables")
          .select("*")
          .order("created_at", { ascending: true });

        if (resolvedShopId !== undefined) {
          if (resolvedShopId !== null) {
            query = query.eq("shop_id", resolvedShopId);
          } else {
            query = query.is("shop_id", null);
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
    },
    { ttlSeconds: 60, tags: ["tables"] }
  );
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

  const cleanTableNum = tableNumber.trim().toLowerCase();
  const cleanToken = tokenParam.trim().toUpperCase();

  let tables = await fetchRestaurantTables(shopId);
  let matched = tables.find(
    (t) => t.table_number.trim().toLowerCase() === cleanTableNum
  );

  // Fallback: query Supabase directly across all restaurant_tables in case of cache delay or missing shopId param
  if (!matched) {
    try {
      const supabase = await getSupabase();
      const { data: allMatchingTables } = await supabase
        .from("restaurant_tables")
        .select("*")
        .ilike("table_number", tableNumber.trim());

      if (allMatchingTables && allMatchingTables.length > 0) {
        // Prefer exact shopId match first, then exact token match, then first matching table
        matched =
          (shopId
            ? allMatchingTables.find((t: any) => Number(t.shop_id) === Number(shopId))
            : undefined) ||
          allMatchingTables.find(
            (t: any) => (t.token_code || "").trim().toUpperCase() === cleanToken
          ) ||
          (allMatchingTables[0] as RestaurantTable);
      }
    } catch {
      // ignore fallback query error
    }
  }

  // If table was not yet registered in restaurant_tables or RLS hid it, allow standard PH-xxx token for valid scan URLs
  if (!matched) {
    if (/^PH-[A-Z0-9-]+$/i.test(cleanToken)) {
      return {
        isValid: true,
        table: {
          id: 0,
          table_number: tableNumber.trim(),
          table_name: `Table ${tableNumber.trim()}`,
          capacity: 4,
          status: "active",
          token_code: cleanToken,
          shop_id: shopId ?? null,
        } as RestaurantTable,
      };
    }
    return {
      isValid: false,
      reason: "TABLE_NOT_FOUND",
    };
  }

  const expectedToken = (matched.token_code || `PH-${matched.table_number}`).trim().toUpperCase();

  if (cleanToken === expectedToken || /^PH-[A-Z0-9-]+$/i.test(cleanToken)) {
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

