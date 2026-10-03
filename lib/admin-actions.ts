"use server";

/**
 * Admin Server Actions — all database mutations for the admin panel.
 * All functions use the service_role Supabase client (server-only).
 * Auth is verified on every action via the admin session cookie.
 */
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import {
  ADMIN_COOKIE,
  ADMIN_SHOP_COOKIE,
  ADMIN_SHOP_NAME_COOKIE,
  ADMIN_SHOP_SLUG_COOKIE,
  COOKIE_MAX_AGE,
  generateSessionToken,
  verifySessionToken,
} from "@/lib/admin-auth";

// ─── Auth helper ─────────────────────────────────────────────────
async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !(await verifySessionToken(token))) {
    redirect("/admin/login");
  }
}

export async function getActiveShopContext(): Promise<{
  shopId: number | null;
  shopName: string;
  shopSlug: string | null;
  isMasterAdmin: boolean;
}> {
  const cookieStore = await cookies();
  const shopIdStr = cookieStore.get(ADMIN_SHOP_COOKIE)?.value;
  const shopName = cookieStore.get(ADMIN_SHOP_NAME_COOKIE)?.value || "Master Store";
  const shopSlug = cookieStore.get(ADMIN_SHOP_SLUG_COOKIE)?.value || null;
  const shopId = shopIdStr ? parseInt(shopIdStr, 10) : null;
  return {
    shopId: isNaN(shopId as number) ? null : shopId,
    shopName,
    shopSlug,
    isMasterAdmin: !shopId,
  };
}

const SERVICE_ROLE_ERROR =
  "Database write permission denied: SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local. Please add your service_role secret from Supabase Dashboard → Settings → API.";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── AUTH ACTIONS ─────────────────────────────────────────────────

export async function adminLogin(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const password = (formData.get("password") as string)?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme";

  if (!password) {
    return { error: "Please enter your password." };
  }

  // 1. Check if it matches Master Store Password
  let isAuthorized = password === adminPassword;
  let matchedShopData: { id: number; name: string; slug: string } | null = null;

  // 2. If not master password, check against registered shops in Supabase
  if (!isAuthorized && isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      const { data: matchedShop } = await db
        .from("shops")
        .select("id, name, slug, status, password")
        .eq("password", password)
        .maybeSingle();

      if (matchedShop) {
        if (matchedShop.status === "suspended") {
          return {
            error: `Access Suspended: Shop "${matchedShop.name}" has been suspended by the Super Admin. Please contact platform support.`,
          };
        }
        isAuthorized = true;
        matchedShopData = { id: matchedShop.id, name: matchedShop.name, slug: matchedShop.slug };
      }
    } catch {
      // Ignore if shops table not yet created
    }
  }

  if (!isAuthorized) {
    return { error: "Incorrect password. Please verify your shop credentials." };
  }

  const token = await generateSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  if (matchedShopData) {
    cookieStore.set(ADMIN_SHOP_COOKIE, String(matchedShopData.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    cookieStore.set(ADMIN_SHOP_NAME_COOKIE, matchedShopData.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    if (matchedShopData.slug) {
      cookieStore.set(ADMIN_SHOP_SLUG_COOKIE, matchedShopData.slug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }
  } else {
    cookieStore.delete(ADMIN_SHOP_COOKIE);
    cookieStore.delete(ADMIN_SHOP_NAME_COOKIE);
    cookieStore.delete(ADMIN_SHOP_SLUG_COOKIE);
  }

  redirect("/admin");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  cookieStore.delete(ADMIN_SHOP_COOKIE);
  cookieStore.delete(ADMIN_SHOP_NAME_COOKIE);
  cookieStore.delete(ADMIN_SHOP_SLUG_COOKIE);
  redirect("/admin/login");
}

// ─── CATEGORY ACTIONS ─────────────────────────────────────────────

export async function createCategory(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const name = (formData.get("name") as string)?.trim();
  let slug =
    ((formData.get("slug") as string) || slugify(name))?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_active = formData.get("is_active") === "true";

  if (!name || !slug) return { error: "Name and slug are required.", success: false };

  // Scope slug to branch to prevent cross-tenant unique collisions
  if (activeShop.shopId && !slug.endsWith(`-${activeShop.shopId}`)) {
    slug = `${slug}-${activeShop.shopId}`;
  }

  const { error } = await db
    .from("categories")
    .insert({
      name,
      slug,
      description,
      image_url,
      sort_order,
      is_active,
      shop_id: activeShop.shopId || null,
    });

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function updateCategory(
  id: number,
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const name = (formData.get("name") as string)?.trim();
  let slug = (formData.get("slug") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_active = formData.get("is_active") === "true";

  if (!name || !slug) return { error: "Name and slug are required.", success: false };

  if (activeShop.shopId && !slug.endsWith(`-${activeShop.shopId}`)) {
    slug = `${slug}-${activeShop.shopId}`;
  }

  let query = db
    .from("categories")
    .update({ name, slug, description, image_url, sort_order, is_active })
    .eq("id", id);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function deleteCategory(id: number): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  let query = db.from("categories").delete().eq("id", id);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { error: null };
}

// ─── PRODUCT ACTIONS ──────────────────────────────────────────────

export async function createProduct(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const name = (formData.get("name") as string)?.trim();
  let slug =
    ((formData.get("slug") as string) || slugify(name))?.trim();
  const category_id = parseInt(formData.get("category_id") as string);
  const description = (formData.get("description") as string)?.trim() || null;
  const price = parseFloat(formData.get("price") as string);
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_available = formData.get("is_available") === "true";
  const is_active = formData.get("is_active") === "true";

  if (!name || !slug || isNaN(category_id) || isNaN(price)) {
    return { error: "Name, category, and price are required.", success: false };
  }
  if (price < 0) return { error: "Price must be 0 or greater.", success: false };

  if (activeShop.shopId && !slug.endsWith(`-${activeShop.shopId}`)) {
    slug = `${slug}-${activeShop.shopId}`;
  }
  const variationsStr = formData.get("variations") as string;
  const extraToppingsStr = formData.get("extra_toppings") as string;
  const track_inventory = formData.get("track_inventory") === "true";
  const stock_quantity = formData.has("stock_quantity") ? parseInt(formData.get("stock_quantity") as string, 10) : null;
  const low_stock_threshold = formData.has("low_stock_threshold") ? parseInt(formData.get("low_stock_threshold") as string, 10) : 5;

  let variations = null;
  if (variationsStr) {
    try { variations = JSON.parse(variationsStr); } catch {}
  }
  let extra_toppings = null;
  if (extraToppingsStr) {
    try { extra_toppings = JSON.parse(extraToppingsStr); } catch {}
  }

  const payload: Record<string, any> = {
    name,
    slug,
    category_id,
    description,
    price,
    image_url,
    sort_order,
    is_available,
    is_active,
    shop_id: activeShop.shopId || null,
    variations,
    extra_toppings,
    track_inventory,
    stock_quantity: isNaN(stock_quantity as number) ? null : stock_quantity,
    low_stock_threshold: isNaN(low_stock_threshold as number) ? 5 : low_stock_threshold,
  };

  let { error } = await db.from("products").insert(payload);

  if (error && (error.message.includes("variations") || error.message.includes("extra_toppings") || error.message.includes("track_inventory"))) {
    // Fallback if schema migration pending
    const fallbackPayload = {
      name,
      slug,
      category_id,
      description,
      price,
      image_url,
      sort_order,
      is_available,
      is_active,
      shop_id: activeShop.shopId || null,
    };
    const retry = await db.from("products").insert(fallbackPayload);
    error = retry.error;
  }

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function updateProduct(
  id: number,
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const name = (formData.get("name") as string)?.trim();
  let slug = (formData.get("slug") as string)?.trim();
  const category_id = parseInt(formData.get("category_id") as string);
  const description = (formData.get("description") as string)?.trim() || null;
  const price = parseFloat(formData.get("price") as string);
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_available = formData.get("is_available") === "true";
  const is_active = formData.get("is_active") === "true";

  const variationsStr = formData.get("variations") as string;
  const extraToppingsStr = formData.get("extra_toppings") as string;
  const track_inventory = formData.get("track_inventory") === "true";
  const stock_quantity = formData.has("stock_quantity") ? parseInt(formData.get("stock_quantity") as string, 10) : null;
  const low_stock_threshold = formData.has("low_stock_threshold") ? parseInt(formData.get("low_stock_threshold") as string, 10) : 5;

  let variations = null;
  if (variationsStr) {
    try { variations = JSON.parse(variationsStr); } catch {}
  }
  let extra_toppings = null;
  if (extraToppingsStr) {
    try { extra_toppings = JSON.parse(extraToppingsStr); } catch {}
  }

  if (!name || !slug || isNaN(category_id) || isNaN(price)) {
    return { error: "Name, category, and price are required.", success: false };
  }

  if (activeShop.shopId && !slug.endsWith(`-${activeShop.shopId}`)) {
    slug = `${slug}-${activeShop.shopId}`;
  }

  const updates: Record<string, any> = {
    name,
    slug,
    category_id,
    description,
    price,
    image_url,
    sort_order,
    is_available,
    is_active,
    variations,
    extra_toppings,
    track_inventory,
    stock_quantity: isNaN(stock_quantity as number) ? null : stock_quantity,
    low_stock_threshold: isNaN(low_stock_threshold as number) ? 5 : low_stock_threshold,
  };

  let query = db.from("products").update(updates).eq("id", id);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  let { error } = await query;

  if (error && (error.message.includes("variations") || error.message.includes("extra_toppings") || error.message.includes("track_inventory"))) {
    const fallbackUpdates = { name, slug, category_id, description, price, image_url, sort_order, is_available, is_active };
    let fallbackQuery = db.from("products").update(fallbackUpdates).eq("id", id);
    if (activeShop.shopId) {
      fallbackQuery = fallbackQuery.eq("shop_id", activeShop.shopId);
    }
    const retry = await fallbackQuery;
    error = retry.error;
  }

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function deleteProduct(id: number): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  let query = db.from("products").delete().eq("id", id);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { error: null };
}

// ─── SETTINGS ACTIONS ─────────────────────────────────────────────

export async function updateSettings(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const shop_name = (formData.get("shop_name") as string)?.trim();
  const menu_title = (formData.get("menu_title") as string)?.trim();
  const meta_title = (formData.get("meta_title") as string)?.trim();
  const meta_description = (formData.get("meta_description") as string)?.trim();
  const currency_symbol = (formData.get("currency_symbol") as string)?.trim() || "$";

  if (!shop_name || !menu_title || !meta_title) {
    return { error: "Shop name, menu title, and meta title are required.", success: false };
  }

  if (activeShop.shopId) {
    // Update branch in public.shops table
    const { error: shopError } = await db
      .from("shops")
      .update({
        name: shop_name,
        currency_symbol: currency_symbol,
      })
      .eq("id", activeShop.shopId);

    if (shopError) return { error: shopError.message, success: false };

    // Update session cookie for brand display
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SHOP_NAME_COOKIE, shop_name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  } else {
    // Update master shop settings
    const { error } = await db
      .from("shop_settings")
      .upsert({ id: "main", shop_name, menu_title, meta_title, meta_description, currency_symbol });

    if (error) return { error: error.message, success: false };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { error: null, success: true };
}

// ─── ORDER ACTIONS ────────────────────────────────────────────────

export async function updateOrderStatus(
  id: number,
  status: string
): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  const validStatuses = ["pending","confirmed","preparing","ready","delivered","cancelled"];
  if (!validStatuses.includes(status)) return { error: "Invalid status." };

  let query = db
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/kitchen");
  return { error: null };
}

export async function assignOrderRider(
  id: number,
  riderName: string,
  riderPhone?: string
): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  let query = db
    .from("orders")
    .update({
      delivery_rider_name: riderName.trim(),
      delivery_rider_phone: riderPhone?.trim() || null,
      status: "ready", // Automatically mark as ready / out for delivery
    })
    .eq("id", id);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  let { error } = await query;
  if (error && (error.message.includes("delivery_rider_name") || error.message.includes("delivery_rider_phone"))) {
    // If column migration pending, store in notes
    const { data: currentOrd } = await db.from("orders").select("notes").eq("id", id).maybeSingle();
    const existingNotes = currentOrd?.notes || "";
    const riderNote = `[RIDER: ${riderName.trim()} | Phone: ${riderPhone?.trim() || "N/A"}]`;
    const updatedNotes = existingNotes ? `${existingNotes} ${riderNote}` : riderNote;
    const retry = await db.from("orders").update({ notes: updatedNotes, status: "ready" }).eq("id", id);
    error = retry.error;
  }

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { error: null };
}

// ─── INVENTORY ACTIONS (FEATURE 7) ────────────────────────────────

export async function updateProductInventory(
  productId: number,
  stockQuantity: number,
  trackInventory: boolean,
  lowStockThreshold: number = 5
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const updates: Record<string, any> = {
    stock_quantity: Math.max(0, stockQuantity),
    track_inventory: trackInventory,
    low_stock_threshold: Math.max(0, lowStockThreshold),
  };

  if (trackInventory && stockQuantity <= 0) {
    updates.is_available = false;
  } else if (trackInventory && stockQuantity > 0) {
    updates.is_available = true;
  }

  let query = db.from("products").update(updates).eq("id", productId);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function quickRestockProduct(
  productId: number,
  addQuantity: number
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const { data: prod } = await db
    .from("products")
    .select("stock_quantity, track_inventory")
    .eq("id", productId)
    .maybeSingle();

  if (!prod) return { error: "Product not found.", success: false };

  const currentStock = Number(prod.stock_quantity) || 0;
  const newStock = currentStock + addQuantity;

  let query = db
    .from("products")
    .update({
      stock_quantity: newStock,
      track_inventory: true,
      is_available: true,
    })
    .eq("id", productId);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { error: null, success: true };
}

// ─── RESTAURANT TABLE ACTIONS ─────────────────────────────────────

export async function createRestaurantTable(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const table_number = (formData.get("table_number") as string)?.trim();
  const table_name = (formData.get("table_name") as string)?.trim() || null;
  const capacity = parseInt(formData.get("capacity") as string) || 4;
  const status = ((formData.get("status") as string)?.trim() || "active") as "active" | "inactive" | "reserved";

  if (!table_number) {
    return { error: "Table number is required.", success: false };
  }

  const token_code = `PH-${Math.floor(100 + Math.random() * 900)}`;

  const { error } = await db.from("restaurant_tables").insert({
    table_number,
    table_name,
    capacity,
    status,
    token_code,
    shop_id: activeShop.shopId || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `Table "${table_number}" already exists. Please choose a different number/name.`, success: false };
    }
    return { error: error.message, success: false };
  }

  revalidatePath("/admin/tables");
  revalidatePath("/table");
  return { error: null, success: true };
}

export async function deleteRestaurantTable(id: string | number): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  let query = db.from("restaurant_tables").delete().eq("id", id);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/admin/tables");
  revalidatePath("/table");
  return { error: null };
}

export async function updateRestaurantTableStatus(
  id: string | number,
  status: "active" | "inactive" | "reserved"
): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  let query = db.from("restaurant_tables").update({ status }).eq("id", id);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/admin/tables");
  revalidatePath("/table");
  return { error: null };
}

// ─── EXPENSE ACTIONS ──────────────────────────────────────────────

export async function fetchExpenses(): Promise<{
  data: any[];
  error: string | null;
}> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { data: [], error: SERVICE_ROLE_ERROR };
  }

  let query = db
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false });

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  } else {
    query = query.is("shop_id", null);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: null };
  }

  return { data: data || [], error: null };
}

export async function createExpense(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const title = (formData.get("title") as string)?.trim();
  const amount = parseFloat(formData.get("amount") as string);
  const category = (formData.get("category") as string)?.trim() || "ingredients";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const expense_date = (formData.get("expense_date") as string)?.trim() || new Date().toISOString().split("T")[0];

  if (!title || isNaN(amount) || amount < 0) {
    return { error: "Please enter a valid expense title and amount.", success: false };
  }

  const { error } = await db.from("expenses").insert({
    title,
    amount,
    category,
    notes,
    expense_date,
    shop_id: activeShop.shopId || null,
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/closing");
  return { error: null, success: true };
}

export async function deleteExpense(id: number | string): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  let query = db.from("expenses").delete().eq("id", id);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/closing");
  return { error: null };
}

// ─── DAILY REGISTER CLOSING ACTIONS ───────────────────────────────

export async function fetchDailyClosingData(targetDate?: string): Promise<{
  date: string;
  totalOrders: number;
  totalSales: number;
  dineInSales: number;
  takeawaySales: number;
  dineInOrdersCount: number;
  takeawayOrdersCount: number;
  totalExpenses: number;
  netProfit: number;
  isClosed: boolean;
  closingRecord?: any;
  orders: any[];
  expenses: any[];
}> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  const dateStr = targetDate || new Date().toISOString().split("T")[0];

  // Fetch orders for this date and shop
  let ordersQuery = db
    .from("orders")
    .select("*")
    .gte("created_at", `${dateStr}T00:00:00.000Z`)
    .lte("created_at", `${dateStr}T23:59:59.999Z`);

  if (activeShop.shopId) {
    ordersQuery = ordersQuery.eq("shop_id", activeShop.shopId);
  } else {
    ordersQuery = ordersQuery.is("shop_id", null);
  }

  const { data: allOrders } = await ordersQuery;

  // Fetch expenses for this date and shop
  let expensesQuery = db
    .from("expenses")
    .select("*")
    .eq("expense_date", dateStr);

  if (activeShop.shopId) {
    expensesQuery = expensesQuery.eq("shop_id", activeShop.shopId);
  } else {
    expensesQuery = expensesQuery.is("shop_id", null);
  }

  const { data: dayExpenses } = await expensesQuery;

  // Check if register already closed for this shop
  let closingQuery = db
    .from("daily_closings")
    .select("*")
    .eq("closing_date", dateStr);

  if (activeShop.shopId) {
    closingQuery = closingQuery.eq("shop_id", activeShop.shopId);
  } else {
    closingQuery = closingQuery.is("shop_id", null);
  }

  const { data: closingRecord } = await closingQuery.maybeSingle();

  const orders = allOrders || [];
  const validOrders = orders.filter((o) => o.status !== "cancelled");

  let totalSales = 0;
  let dineInSales = 0;
  let takeawaySales = 0;
  let dineInOrdersCount = 0;
  let takeawayOrdersCount = 0;

  for (const o of validOrders) {
    const val = Number(o.total) || 0;
    totalSales += val;
    const isDineIn = o.order_type === "dine_in" || !!o.table_number || o.notes?.includes("[DINE-IN:");
    if (isDineIn) {
      dineInSales += val;
      dineInOrdersCount++;
    } else {
      takeawaySales += val;
      takeawayOrdersCount++;
    }
  }

  const expenses = dayExpenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalSales - totalExpenses;

  return {
    date: dateStr,
    totalOrders: validOrders.length,
    totalSales: Number(totalSales.toFixed(2)),
    dineInSales: Number(dineInSales.toFixed(2)),
    takeawaySales: Number(takeawaySales.toFixed(2)),
    dineInOrdersCount,
    takeawayOrdersCount,
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    isClosed: !!closingRecord,
    closingRecord: closingRecord || null,
    orders,
    expenses,
  };
}

export async function recordDailyClosing(
  dateStr: string,
  closedBy = "Admin",
  notes = ""
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const summary = await fetchDailyClosingData(dateStr);

  const payload: Record<string, any> = {
    closing_date: dateStr,
    total_orders: summary.totalOrders,
    total_sales: summary.totalSales,
    dine_in_sales: summary.dineInSales,
    takeaway_sales: summary.takeawaySales,
    total_expenses: summary.totalExpenses,
    net_profit: summary.netProfit,
    closed_by: closedBy,
    notes: notes || null,
    shop_id: activeShop.shopId || null,
  };

  const { error } = await db.from("daily_closings").upsert(payload);

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/closing");
  revalidatePath("/admin");
  return { error: null, success: true };
}

