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

// ─── Shop Settings ────────────────────────────────────────────────
export interface ShopSettings {
  shop_name: string;
  menu_title: string;
  meta_title: string;
  meta_description: string;
  currency_symbol: string;
  shop_id?: number | null;
}

const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: "Pizza Shop",
  menu_title: "Our Menu",
  meta_title: "Pizza Shop — Order Online",
  meta_description: "Fresh, made-to-order pizzas.",
  currency_symbol: "$",
  shop_id: null,
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
        .select("id, name, currency_symbol, status")
        .eq("id", targetShopId)
        .maybeSingle();

      if (branchData) {
        return {
          shop_name: branchData.name,
          menu_title: `${branchData.name} Menu`,
          meta_title: `${branchData.name} — Order Online`,
          meta_description: `Order fresh from ${branchData.name}.`,
          currency_symbol: branchData.currency_symbol || "Rs.",
          shop_id: branchData.id,
        };
      }
    } catch {
      // Continue to default
    }
  }

  const { data, error } = await supabase
    .from("shop_settings")
    .select("shop_name, menu_title, meta_title, meta_description, currency_symbol")
    .eq("id", "main")
    .single();

  if (error || !data) {
    const fallbackRes = await supabase
      .from("shop_settings")
      .select("shop_name, menu_title, meta_title, meta_description")
      .eq("id", "main")
      .single();

    if (fallbackRes.data) {
      return {
        ...(fallbackRes.data as any),
        currency_symbol: "$",
        shop_id: null,
      };
    }
    return DEFAULT_SETTINGS;
  }

  return {
    ...data,
    currency_symbol: data.currency_symbol || "$",
    shop_id: null,
  } as ShopSettings;
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

