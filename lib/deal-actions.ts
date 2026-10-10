"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { getActiveShopContext } from "@/lib/admin-actions";
import type { Deal } from "@/types/menu";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !(await verifySessionToken(token))) {
    redirect("/admin/login");
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function fetchDeals(shopId?: number | null): Promise<{ data: Deal[]; error: string | null }> {
  try {
    const db = createAdminClient();
    let query = db.from("deals").select("*").order("sort_order", { ascending: true });

    if (shopId) {
      query = query.eq("shop_id", shopId);
    } else {
      query = query.is("shop_id", null);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[Deals] Fetch warning:", error.message);
      return { data: [], error: null };
    }
    return { data: (data as Deal[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

export async function createDeal(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: "Database write permission denied: Service role not configured", success: false };
  }

  const title = (formData.get("title") as string)?.trim();
  let slug = (formData.get("slug") as string)?.trim() || slugify(title || "deal");
  const description = (formData.get("description") as string)?.trim() || null;
  const deal_price = parseFloat(formData.get("deal_price") as string);
  const original_price = formData.get("original_price") ? parseFloat(formData.get("original_price") as string) : null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const badge = (formData.get("badge") as string)?.trim() || "Hot Deal";
  const itemsIncludedRaw = (formData.get("items_included") as string)?.trim();
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_active = formData.get("is_active") === "true";
  const is_available = formData.get("is_available") === "true";

  if (!title || isNaN(deal_price) || deal_price < 0) {
    return { error: "Please enter a valid deal title and price.", success: false };
  }

  // Strict branch isolation
  let targetShopId = activeShop.shopId;
  const rawShopId = formData.get("shop_id");
  if (activeShop.isMasterAdmin && rawShopId !== null && rawShopId !== undefined && rawShopId !== "") {
    const parsed = parseInt(rawShopId as string, 10);
    if (!isNaN(parsed)) targetShopId = parsed;
  }

  if (targetShopId && !slug.endsWith(`-${targetShopId}`)) {
    slug = `${slug}-${targetShopId}`;
  }

  let itemsIncluded: string[] = [];
  if (itemsIncludedRaw) {
    try {
      itemsIncluded = JSON.parse(itemsIncludedRaw);
    } catch {
      itemsIncluded = itemsIncludedRaw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  try {
    // 1. Ensure "Deals" category exists for this shop
    let dealsCatId: number | string | null = null;
    let catQuery = db.from("categories").select("id").eq("name", "Deals");
    if (targetShopId) catQuery = catQuery.eq("shop_id", targetShopId);
    else catQuery = catQuery.is("shop_id", null);

    const { data: existingCat } = await catQuery.maybeSingle();
    if (existingCat?.id) {
      dealsCatId = existingCat.id;
    } else {
      const { data: newCat } = await db
        .from("categories")
        .insert({
          name: "Deals",
          slug: `deals-${targetShopId || "global"}`,
          description: "Exclusive bundle offers and special discount deals",
          sort_order: 0,
          is_active: true,
          shop_id: targetShopId,
        })
        .select("id")
        .maybeSingle();
      if (newCat) dealsCatId = newCat.id;
    }

    // 2. Also register in products table so customers can add deal to cart & checkout
    let linkedProductId: number | null = null;
    const { data: prodData } = await db
      .from("products")
      .insert({
        name: title,
        slug: slug,
        price: deal_price,
        description: description || itemsIncluded.join(" • "),
        image_url: image_url,
        category_id: dealsCatId,
        is_available: is_available,
        is_active: is_active,
        sort_order: sort_order,
        shop_id: targetShopId,
      })
      .select("id")
      .maybeSingle();

    if (prodData?.id) linkedProductId = prodData.id;

    // 3. Insert into deals table
    const { error } = await db.from("deals").insert({
      title,
      slug,
      description,
      deal_price,
      original_price,
      image_url,
      badge,
      items_included: itemsIncluded,
      is_available,
      is_active,
      sort_order,
      shop_id: targetShopId,
      product_id: linkedProductId,
    });

    if (error) {
      console.warn("[Deals] Saved product, deals table note:", error.message);
    }

    revalidatePath("/admin/deals");
    revalidatePath("/admin/products");
    revalidatePath("/");
    if (activeShop.shopSlug) revalidatePath(`/${activeShop.shopSlug}`);

    return { error: null, success: true };
  } catch (err: any) {
    return { error: err.message, success: false };
  }
}

export async function updateDeal(
  id: number | string,
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: "Service role not configured", success: false };
  }

  const title = (formData.get("title") as string)?.trim();
  let slug = (formData.get("slug") as string)?.trim() || slugify(title || "deal");
  const description = (formData.get("description") as string)?.trim() || null;
  const deal_price = parseFloat(formData.get("deal_price") as string);
  const original_price = formData.get("original_price") ? parseFloat(formData.get("original_price") as string) : null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const badge = (formData.get("badge") as string)?.trim() || "Hot Deal";
  const itemsIncludedRaw = (formData.get("items_included") as string)?.trim();
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_active = formData.get("is_active") === "true";
  const is_available = formData.get("is_available") === "true";

  if (!title || isNaN(deal_price) || deal_price < 0) {
    return { error: "Please enter a valid deal title and price.", success: false };
  }

  let itemsIncluded: string[] = [];
  if (itemsIncludedRaw) {
    try {
      itemsIncluded = JSON.parse(itemsIncludedRaw);
    } catch {
      itemsIncluded = itemsIncludedRaw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  try {
    const { data: existingDeal } = await db.from("deals").select("product_id, shop_id").eq("id", id).maybeSingle();

    let query = db
      .from("deals")
      .update({
        title,
        slug,
        description,
        deal_price,
        original_price,
        image_url,
        badge,
        items_included: itemsIncluded,
        is_available,
        is_active,
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }

    const { error } = await query;
    if (error) return { error: error.message, success: false };

    // Also update linked product if exists
    if (existingDeal?.product_id) {
      await db
        .from("products")
        .update({
          name: title,
          price: deal_price,
          description: description || itemsIncluded.join(" • "),
          image_url: image_url,
          is_available: is_available,
          is_active: is_active,
          sort_order: sort_order,
        })
        .eq("id", existingDeal.product_id);
    }

    revalidatePath("/admin/deals");
    revalidatePath("/admin/products");
    revalidatePath("/");
    if (activeShop.shopSlug) revalidatePath(`/${activeShop.shopSlug}`);

    return { error: null, success: true };
  } catch (err: any) {
    return { error: err.message, success: false };
  }
}

export async function deleteDeal(id: number | string): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  try {
    const { data: existing } = await db.from("deals").select("product_id, shop_id").eq("id", id).maybeSingle();

    let query = db.from("deals").delete().eq("id", id);
    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }
    const { error } = await query;
    if (error) return { error: error.message };

    if (existing?.product_id) {
      await db.from("products").delete().eq("id", existing.product_id);
    }

    revalidatePath("/admin/deals");
    revalidatePath("/admin/products");
    revalidatePath("/");
    if (activeShop.shopSlug) revalidatePath(`/${activeShop.shopSlug}`);

    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function toggleDealAvailability(id: number | string, isAvailable: boolean): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  try {
    const { data: existing } = await db.from("deals").select("product_id").eq("id", id).maybeSingle();

    let query = db.from("deals").update({ is_available: isAvailable }).eq("id", id);
    if (activeShop.shopId) query = query.eq("shop_id", activeShop.shopId);

    const { error } = await query;
    if (error) return { error: error.message };

    if (existing?.product_id) {
      await db.from("products").update({ is_available: isAvailable }).eq("id", existing.product_id);
    }

    revalidatePath("/admin/deals");
    revalidatePath("/admin/products");
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}


export async function fetchDealById(
  id: number | string,
  shopId?: number | null
): Promise<{ data: Deal | null; error: string | null }> {
  try {
    const db = createAdminClient();
    let query = db.from("deals").select("*").eq("id", id);
    if (shopId) {
      query = query.eq("shop_id", shopId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) {
      console.warn("[Deals] fetchDealById warning:", error.message);
      return { data: null, error: error.message };
    }
    return { data: (data as Deal) || null, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
