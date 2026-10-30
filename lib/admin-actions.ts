"use server";

/**
 * Admin Server Actions — all database mutations for the admin panel.
 * All functions use the service_role Supabase client (server-only).
 * Auth is verified on every action via the admin session cookie.
 */
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { dbCache } from "@/lib/db-cache";
import { syncCustomerFromOrder } from "@/lib/customer-actions";
import {
  ADMIN_COOKIE,
  ADMIN_SHOP_COOKIE,
  ADMIN_SHOP_NAME_COOKIE,
  ADMIN_SHOP_SLUG_COOKIE,
  ADMIN_ROLE_COOKIE,
  ADMIN_STAFF_NAME_COOKIE,
  ADMIN_STAFF_ID_COOKIE,
  COOKIE_MAX_AGE,
  generateSessionToken,
  verifySessionToken,
  signAdminSession,
  verifyAdminSession,
  type AdminSessionClaims,
} from "@/lib/admin-auth";
import {
  sendWhatsAppRiderAlert,
  sendWhatsAppCustomerDispatchedAlert,
  sendWhatsAppDailyClosingAlert,
  sendWhatsAppReviewPrompt,
} from "@/lib/whatsapp";
import {
  getCurrentBusinessDate,
  getBusinessShiftUtcRange,
  getPakistanNow,
  formatDateStr,
} from "@/lib/business-hours";
import type { Order } from "@/types/menu";

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
  shopCreatedAt: string | null;
  isMasterAdmin: boolean;
  role: "admin" | "sub_admin" | "staff";
  staffName: string;
  canCancelOrders: boolean;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const verifiedClaims = token ? await verifyAdminSession(token) : null;

  let shopId: number | null = null;
  let shopName = "Master Store";
  let shopSlug: string | null = null;
  let isMasterAdmin = false;
  let role: "admin" | "sub_admin" | "staff" = "admin";
  let staffName = "Shop Admin";

  if (verifiedClaims) {
    shopId = verifiedClaims.shopId;
    shopName = verifiedClaims.shopName || "Master Store";
    shopSlug = verifiedClaims.shopSlug || null;
    isMasterAdmin = verifiedClaims.isMaster === true;
    role = verifiedClaims.role || "admin";
    staffName =
      verifiedClaims.staffName || (verifiedClaims.role === "admin" ? "Shop Admin" : "Staff Member");
  } else {
    // Fallback for legacy unsigned cookies (during transition)
    const shopIdStr = cookieStore.get(ADMIN_SHOP_COOKIE)?.value;
    shopName = cookieStore.get(ADMIN_SHOP_NAME_COOKIE)?.value || "Master Store";
    shopSlug = cookieStore.get(ADMIN_SHOP_SLUG_COOKIE)?.value || null;
    role = (cookieStore.get(ADMIN_ROLE_COOKIE)?.value as any) || "admin";
    staffName =
      cookieStore.get(ADMIN_STAFF_NAME_COOKIE)?.value ||
      (role === "admin" ? "Shop Admin" : "Staff Member");
    const parsed = shopIdStr ? parseInt(shopIdStr, 10) : null;
    shopId = parsed !== null && !isNaN(parsed) ? parsed : null;
  }

  // If on a subdomain (e.g. pizza-mafia.solewhat.store/admin) and shopId was null, resolve shop from subdomain
  if (!shopId) {
    try {
      const hdrs = await headers();
      const host = (hdrs.get("x-forwarded-host") || hdrs.get("host") || "")
        .toLowerCase()
        .split(":")[0];
      let sub = "";
      if (host.endsWith(".solewhat.store")) {
        const part = host.replace(".solewhat.store", "").trim();
        if (part && part !== "www") sub = part;
      } else if (host.endsWith(".localhost")) {
        const part = host.replace(".localhost", "").trim();
        if (part && part !== "www") sub = part;
      }
      if (sub && isServiceRoleConfigured()) {
        const db = createAdminClient();
        const { data: subShop } = await db
          .from("shops")
          .select("id, name, slug, created_at, feature_flags")
          .eq("slug", sub)
          .maybeSingle();
        if (subShop) {
          shopId = subShop.id;
          shopName = subShop.name;
          shopSlug = subShop.slug;
          const customActiveSince = (subShop as any).feature_flags?.analytics_start_date;
          return {
            shopId,
            shopName,
            shopSlug,
            shopCreatedAt: customActiveSince || subShop.created_at || null,
            isMasterAdmin,
            role,
            staffName,
            canCancelOrders: role === "admin",
          };
        }
      }
    } catch {
      // ignore header lookup error
    }
  }

  let shopCreatedAt: string | null = null;
  if (shopId && isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      const { data: shopRow } = await db
        .from("shops")
        .select("created_at, feature_flags")
        .eq("id", shopId)
        .maybeSingle();
      if (shopRow) {
        shopCreatedAt =
          (shopRow as any).feature_flags?.analytics_start_date ||
          (shopRow as any).created_at ||
          null;
      }
    } catch {
      // ignore
    }
  } else if (!shopId && isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      const { data: mainSettings } = await db
        .from("shop_settings")
        .select("feature_flags, updated_at")
        .eq("id", "main")
        .maybeSingle();
      if (mainSettings) {
        shopCreatedAt =
          (mainSettings as any).feature_flags?.analytics_start_date ||
          (mainSettings as any).updated_at ||
          null;
      }
    } catch {
      // ignore
    }
  }

  return {
    shopId,
    shopName,
    shopSlug,
    shopCreatedAt,
    isMasterAdmin,
    role,
    staffName,
    canCancelOrders: role === "admin",
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

export async function getPublicShopsForLogin(): Promise<{ id: number; name: string; slug: string }[]> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("shops")
      .select("id, name, slug")
      .eq("status", "active")
      .order("name", { ascending: true });
    return (data as { id: number; name: string; slug: string }[]) || [];
  } catch {
    return [];
  }
}

export async function adminLogin(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const password = (formData.get("password") as string)?.trim();
  const shopIdRaw = (formData.get("shop_id") as string)?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme";

  if (!password) {
    return { error: "Please enter your password." };
  }

  const db = isServiceRoleConfigured() ? createAdminClient() : null;
  let isAuthorized = false;
  let matchedShopData: { id: number; name: string; slug: string } | null = null;

  let userRole: "admin" | "sub_admin" | "staff" = "admin";
  let staffName = "Shop Admin";
  let staffId: string | null = null;

  // Case 1: Specific shop branch was selected on login screen
  if (shopIdRaw && shopIdRaw !== "master" && db) {
    const shopIdNum = parseInt(shopIdRaw, 10);
    const { data: matchedShop } = await db
      .from("shops")
      .select("id, name, slug, status, password")
      .eq("id", shopIdNum)
      .maybeSingle();

    if (matchedShop) {
      if (matchedShop.status === "suspended") {
        return {
          error: `Access Suspended: Shop "${matchedShop.name}" has been suspended by the Super Admin. Please contact platform support.`,
        };
      }
      // Authorized if password matches this shop's password OR platform master password
      if (matchedShop.password === password || password === adminPassword) {
        isAuthorized = true;
        userRole = "admin";
        staffName = `${matchedShop.name} Admin`;
        matchedShopData = { id: matchedShop.id, name: matchedShop.name, slug: matchedShop.slug };
      }
    } else {
      return { error: "Selected branch was not found." };
    }
  } else {
    // Case 2: No specific shop selected or "master" chosen
    if (password === adminPassword) {
      isAuthorized = true;
      userRole = "admin";
      staffName = "Master Store Admin";
      matchedShopData = null; // Master store
    } else if (db) {
      // Check if password matches a registered shop
      const { data: matchedShops } = await db
        .from("shops")
        .select("id, name, slug, status, password")
        .eq("password", password);

      if (matchedShops && matchedShops.length === 1) {
        const matchedShop = matchedShops[0];
        if (matchedShop.status === "suspended") {
          return {
            error: `Access Suspended: Shop "${matchedShop.name}" has been suspended by the Super Admin. Please contact platform support.`,
          };
        }
        isAuthorized = true;
        userRole = "admin";
        staffName = `${matchedShop.name} Admin`;
        matchedShopData = { id: matchedShop.id, name: matchedShop.name, slug: matchedShop.slug };
      } else if (matchedShops && matchedShops.length > 1) {
        return {
          error: "Multiple branches share this password. Please select your specific branch from the dropdown above.",
        };
      }
    }
  }

  // Case 3: Check if entered password matches a staff / sub-admin PIN
  if (!isAuthorized && db) {
    let staffQuery = db
      .from("pos_staff")
      .select("id, name, role, pin, is_active, shop_id, shops:shops(id, name, slug)")
      .eq("pin", password)
      .eq("is_active", true);

    if (shopIdRaw && shopIdRaw !== "master") {
      staffQuery = staffQuery.eq("shop_id", parseInt(shopIdRaw, 10));
    }

    const { data: staffMembers } = await staffQuery;
    if (staffMembers && staffMembers.length > 0) {
      const matchedStaff = staffMembers[0];
      isAuthorized = true;
      userRole = matchedStaff.role === "admin" ? "admin" : matchedStaff.role === "sub_admin" ? "sub_admin" : "staff";
      staffName = matchedStaff.name;
      staffId = matchedStaff.id;
      if (matchedStaff.shop_id) {
        matchedShopData = {
          id: matchedStaff.shop_id,
          name: (matchedStaff.shops as any)?.name || "Branch Store",
          slug: (matchedStaff.shops as any)?.slug || null,
        };
      }
    }
  }

  if (!isAuthorized) {
    return { error: "Incorrect password or staff PIN. Please verify your credentials." };
  }

  const claims: AdminSessionClaims = {
    isMaster: !matchedShopData,
    shopId: matchedShopData ? matchedShopData.id : null,
    shopName: matchedShopData ? matchedShopData.name : "Master Store",
    shopSlug: matchedShopData ? matchedShopData.slug : null,
    role: userRole,
    staffName: staffName,
    staffId: staffId,
    issuedAt: Date.now(),
  };

  const token = await signAdminSession(claims);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  cookieStore.set(ADMIN_ROLE_COOKIE, userRole, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  cookieStore.set(ADMIN_STAFF_NAME_COOKIE, staffName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  if (staffId) {
    cookieStore.set(ADMIN_STAFF_ID_COOKIE, staffId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  } else {
    cookieStore.delete(ADMIN_STAFF_ID_COOKIE);
  }

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

export async function switchAdminBranch(targetShopId: number | null) {
  await requireAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const currentClaims = token ? await verifyAdminSession(token) : null;

  // Strict RBAC: Only a verified Master Admin can switch branch view
  if (currentClaims && !currentClaims.isMaster) {
    console.warn("[switchAdminBranch] Unauthorized branch switch attempt rejected.");
    return;
  }

  let updatedClaims: AdminSessionClaims = currentClaims
    ? { ...currentClaims, issuedAt: Date.now() }
    : {
        isMaster: true,
        shopId: null,
        shopName: "Master Store",
        shopSlug: null,
        role: "admin",
        staffName: "Master Store Admin",
        staffId: null,
        issuedAt: Date.now(),
      };

  if (targetShopId !== null) {
    const db = createAdminClient();
    const { data: shop } = await db
      .from("shops")
      .select("id, name, slug")
      .eq("id", targetShopId)
      .maybeSingle();

    if (shop) {
      updatedClaims.shopId = shop.id;
      updatedClaims.shopName = shop.name;
      updatedClaims.shopSlug = shop.slug || null;

      cookieStore.set(ADMIN_SHOP_COOKIE, String(shop.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
      cookieStore.set(ADMIN_SHOP_NAME_COOKIE, shop.name, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
      if (shop.slug) {
        cookieStore.set(ADMIN_SHOP_SLUG_COOKIE, shop.slug, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_MAX_AGE,
          path: "/",
        });
      }
    }
  } else {
    // Switch to Master Store (All / Unassigned)
    updatedClaims.shopId = null;
    updatedClaims.shopName = "Master Store";
    updatedClaims.shopSlug = null;

    cookieStore.delete(ADMIN_SHOP_COOKIE);
    cookieStore.delete(ADMIN_SHOP_NAME_COOKIE);
    cookieStore.delete(ADMIN_SHOP_SLUG_COOKIE);
  }

  const newToken = await signAdminSession(updatedClaims);
  cookieStore.set(ADMIN_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  cookieStore.delete(ADMIN_SHOP_COOKIE);
  cookieStore.delete(ADMIN_SHOP_NAME_COOKIE);
  cookieStore.delete(ADMIN_SHOP_SLUG_COOKIE);
  cookieStore.delete(ADMIN_ROLE_COOKIE);
  cookieStore.delete(ADMIN_STAFF_NAME_COOKIE);
  cookieStore.delete(ADMIN_STAFF_ID_COOKIE);
  redirect("/admin/login");
}

export async function switchAdminStaffRole(
  targetRole: "admin" | "sub_admin" | "staff",
  targetStaffName?: string
): Promise<{ success: boolean; role: string }> {
  await requireAdmin();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ROLE_COOKIE, targetRole, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  const defaultName =
    targetRole === "admin"
      ? "Shop Admin"
      : targetRole === "sub_admin"
        ? "Supervisor (Sub-Admin)"
        : "Cashier (Staff)";

  cookieStore.set(ADMIN_STAFF_NAME_COOKIE, targetStaffName || defaultName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/staff");
  return { success: true, role: targetRole };
}

// ─── CATEGORY ACTIONS ─────────────────────────────────────────────

export async function createCategory(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean; category?: any }> {
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

  // Check explicit shop_id from form (only super/master admins can reassign, branch admins are locked to their activeShop.shopId)
  const rawShopId = formData.get("shop_id");
  let targetShopId: number | null = activeShop.shopId;
  if (activeShop.isMasterAdmin && rawShopId !== null && rawShopId !== undefined && rawShopId !== "") {
    const parsed = parseInt(rawShopId as string, 10);
    if (!isNaN(parsed)) {
      targetShopId = parsed;
    }
  }

  if (!name || !slug) return { error: "Name and slug are required.", success: false };

  // Scope slug to branch to prevent cross-tenant unique collisions
  if (targetShopId && !slug.endsWith(`-${targetShopId}`)) {
    slug = `${slug}-${targetShopId}`;
  }

  const { data: newCat, error } = await db
    .from("categories")
    .insert({
      name,
      slug,
      description,
      image_url,
      sort_order,
      is_active,
      shop_id: targetShopId,
    })
    .select()
    .single();

  if (error) return { error: error.message, success: false };

  dbCache.invalidateTag("categories", "menu");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/");
  if (activeShop.shopSlug) {
    revalidatePath(`/${activeShop.shopSlug}`);
  }
  return { error: null, success: true, category: newCat };
}

export async function updateCategory(
  id: number,
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean; category?: any }> {
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

  const rawShopId = formData.get("shop_id");
  let targetShopId: number | null = activeShop.shopId;
  if (activeShop.isMasterAdmin && rawShopId !== null && rawShopId !== undefined && rawShopId !== "") {
    const parsed = parseInt(rawShopId as string, 10);
    if (!isNaN(parsed)) {
      targetShopId = parsed;
    }
  }

  if (!name || !slug) return { error: "Name and slug are required.", success: false };

  if (targetShopId && !slug.endsWith(`-${targetShopId}`)) {
    slug = `${slug}-${targetShopId}`;
  }

  const updateData: Record<string, unknown> = {
    name,
    slug,
    description,
    image_url,
    sort_order,
    is_active,
  };

  // If shop_id was explicitly provided, allow updating branch assignment
  if (rawShopId !== null && rawShopId !== undefined) {
    updateData.shop_id = targetShopId;
  }

  let query = db
    .from("categories")
    .update(updateData)
    .eq("id", id);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { data: updatedCat, error } = await query.select().single();

  if (error) return { error: error.message, success: false };

  dbCache.invalidateTag("categories", "menu");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/");
  if (activeShop.shopSlug) {
    revalidatePath(`/${activeShop.shopSlug}`);
  }
  return { error: null, success: true, category: updatedCat };
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

  dbCache.invalidateTag("categories", "menu");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
  if (activeShop.shopSlug) {
    revalidatePath(`/${activeShop.shopSlug}`);
  }
  return { error: null };
}

/**
 * Bulk updates category display order (sort_order = 0, 1, 2...) so the Admin
 * can control which category appears 1st, 2nd, 3rd on the live customer menu.
 */
export async function reorderCategories(
  orderedCategoryIds: number[]
): Promise<{ error: string | null; success: boolean; expense?: any }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  try {
    await Promise.all(
      orderedCategoryIds.map((catId, index) => {
        let q = db
          .from("categories")
          .update({ sort_order: index })
          .eq("id", Number(catId));
        if (activeShop.shopId) {
          q = q.eq("shop_id", activeShop.shopId);
        }
        return q;
      })
    );

    dbCache.invalidateTag("categories", "menu");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/menu2");
    if (activeShop.shopSlug) {
      revalidatePath(`/${activeShop.shopSlug}`);
    }
    return { error: null, success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update category order", success: false };
  }
}

/**
 * Sets or resets the official activation / live start date (`analytics_start_date`)
 * for the shop's dashboard & analytics charts so pre-launch / test orders are excluded.
 */
export async function updateShopAnalyticsStartDate(
  startDateIso: string | null
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  try {
    if (activeShop.shopId) {
      const { data: shopRow } = await db
        .from("shops")
        .select("feature_flags")
        .eq("id", activeShop.shopId)
        .maybeSingle();

      const existingFlags =
        shopRow && typeof (shopRow as any).feature_flags === "object" && (shopRow as any).feature_flags
          ? { ...(shopRow as any).feature_flags }
          : {};

      if (startDateIso) {
        existingFlags.analytics_start_date = startDateIso;
      } else {
        delete existingFlags.analytics_start_date;
      }

      const { error } = await db
        .from("shops")
        .update({ feature_flags: existingFlags })
        .eq("id", activeShop.shopId);

      if (error) return { error: error.message, success: false };
    } else {
      const { data: mainSettings } = await db
        .from("shop_settings")
        .select("feature_flags")
        .eq("id", "main")
        .maybeSingle();

      const existingFlags =
        mainSettings &&
        typeof (mainSettings as any).feature_flags === "object" &&
        (mainSettings as any).feature_flags
          ? { ...(mainSettings as any).feature_flags }
          : {};

      if (startDateIso) {
        existingFlags.analytics_start_date = startDateIso;
      } else {
        delete existingFlags.analytics_start_date;
      }

      await db.from("shop_settings").update({ feature_flags: existingFlags }).eq("id", "main");
    }

    dbCache.invalidateTag("orders", "settings", "shops");
    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    return { error: null, success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update active date", success: false };
  }
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
    try { variations = JSON.parse(variationsStr); } catch { }
  }
  let extra_toppings = null;
  if (extraToppingsStr) {
    try { extra_toppings = JSON.parse(extraToppingsStr); } catch { }
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

  invalidateAllMenuCaches();
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
    try { variations = JSON.parse(variationsStr); } catch { }
  }
  let extra_toppings = null;
  if (extraToppingsStr) {
    try { extra_toppings = JSON.parse(extraToppingsStr); } catch { }
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

  invalidateAllMenuCaches();
  return { error: null, success: true };
}

export async function invalidateAllMenuCaches() {
  dbCache.invalidateTag("products", "deals", "menu", "categories");
  try {
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
  } catch (err) {
    console.warn("[invalidateAllMenuCaches] revalidatePath skipped:", err);
  }
}

export async function quickUpdateProductPrice(
  productId: number,
  newPrice: number
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  if (isNaN(newPrice) || newPrice < 0) {
    return { error: "Please enter a valid price.", success: false };
  }

  let query = db
    .from("products")
    .update({ price: newPrice, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) {
    return { error: error.message, success: false };
  }

  invalidateAllMenuCaches();
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

  invalidateAllMenuCaches();
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
  const whatsapp_session_id = (formData.get("whatsapp_session_id") as string)?.trim() || null;
  const whatsapp_api_key = (formData.get("whatsapp_api_key") as string)?.trim() || null;
  const opening_time = (formData.get("opening_time") as string)?.trim() || "11:00";
  const closing_time = (formData.get("closing_time") as string)?.trim() || "01:00";
  const owner_phone = (formData.get("owner_phone") as string)?.trim() || null;
  const theme_color = (formData.get("theme_color") as string)?.trim() || "#ea580c";
  const slider_enabled = formData.get("slider_enabled") !== "false";
  const slider_height_mobile = parseInt(formData.get("slider_height_mobile") as string, 10) || 180;

  // Hero Section fields
  const hero_badge_text = (formData.get("hero_badge_text") as string) !== null ? (formData.get("hero_badge_text") as string).trim() : "";
  const hero_title = (formData.get("hero_title") as string) !== null ? (formData.get("hero_title") as string).trim() : "";
  const hero_title_highlight = (formData.get("hero_title_highlight") as string) !== null ? (formData.get("hero_title_highlight") as string).trim() : "";
  const hero_subtitle = (formData.get("hero_subtitle") as string) !== null ? (formData.get("hero_subtitle") as string).trim() : "";
  const hero_btn_primary_text = (formData.get("hero_btn_primary_text") as string) !== null ? (formData.get("hero_btn_primary_text") as string).trim() : "";
  const hero_btn_primary_link = (formData.get("hero_btn_primary_link") as string)?.trim() || "#menu";
  const hero_btn_secondary_text = (formData.get("hero_btn_secondary_text") as string) !== null ? (formData.get("hero_btn_secondary_text") as string).trim() : "";
  const hero_btn_secondary_link = (formData.get("hero_btn_secondary_link") as string)?.trim() || "#specials";
  const hero_chip1_text = (formData.get("hero_chip1_text") as string) !== null ? (formData.get("hero_chip1_text") as string).trim() : "";
  const hero_chip2_text = (formData.get("hero_chip2_text") as string) !== null ? (formData.get("hero_chip2_text") as string).trim() : "";
  const hero_chip3_text = (formData.get("hero_chip3_text") as string) !== null ? (formData.get("hero_chip3_text") as string).trim() : "";
  const hero_show_chips = formData.get("hero_show_chips") === "true";
  const hero_bg_type = (formData.get("hero_bg_type") as string)?.trim() || "gradient";
  const hero_bg_color = (formData.get("hero_bg_color") as string)?.trim() || "";
  const hero_bg_gradient = (formData.get("hero_bg_gradient") as string)?.trim() || "";
  const hero_bg_image = (formData.get("hero_bg_image") as string)?.trim() || "";
  const hero_show_pattern = formData.get("hero_show_pattern") !== "false";
  const google_review_url = (formData.get("google_review_url") as string)?.trim() || "";

  let slider_images: any = null;
  const rawSliderImages = formData.get("slider_images") as string;
  if (rawSliderImages) {
    try {
      slider_images = JSON.parse(rawSliderImages);
    } catch {
      slider_images = null;
    }
  }

  if (!shop_name || !menu_title || !meta_title) {
    return { error: "Shop name, menu title, and meta title are required.", success: false };
  }

  const heroPayload = {
    hero_badge_text,
    hero_title,
    hero_title_highlight,
    hero_subtitle,
    hero_btn_primary_text,
    hero_btn_primary_link,
    hero_btn_secondary_text,
    hero_btn_secondary_link,
    hero_chip1_text,
    hero_chip2_text,
    hero_chip3_text,
    hero_show_chips,
    hero_bg_type,
    hero_bg_color,
    hero_bg_gradient,
    hero_bg_image,
    hero_show_pattern,
    google_review_url,
  };

  if (activeShop.shopId) {
    // Update branch in public.shops table
    const updatePayload: Record<string, any> = {
      name: shop_name,
      currency_symbol: currency_symbol,
      whatsapp_session_id,
      whatsapp_api_key,
      opening_time,
      closing_time,
      owner_phone,
      theme_color,
      slider_enabled,
      slider_height_mobile,
      ...heroPayload,
    };
    if (slider_images !== null) {
      updatePayload.slider_images = slider_images;
    }

    let { error: shopError } = await db
      .from("shops")
      .update(updatePayload)
      .eq("id", activeShop.shopId);

    // Fallback if columns pending migration
    if (shopError) {
      const basicPayload: Record<string, any> = {
        name: shop_name,
        currency_symbol,
        whatsapp_session_id,
        whatsapp_api_key,
        opening_time,
        closing_time,
        theme_color,
        slider_enabled,
        slider_height_mobile,
      };
      if (slider_images !== null) basicPayload.slider_images = slider_images;

      const retry1 = await db.from("shops").update(basicPayload).eq("id", activeShop.shopId);
      if (retry1.error) {
        const retry2 = await db.from("shops").update({ name: shop_name, currency_symbol }).eq("id", activeShop.shopId);
        shopError = retry2.error;
      } else {
        shopError = null;
      }
    }

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
    const upsertPayload: Record<string, any> = {
      id: "main",
      shop_name,
      menu_title,
      meta_title,
      meta_description,
      currency_symbol,
      whatsapp_session_id,
      whatsapp_api_key,
      opening_time,
      closing_time,
      theme_color,
      slider_enabled,
      slider_height_mobile,
      ...heroPayload,
    };
    if (slider_images !== null) {
      upsertPayload.slider_images = slider_images;
    }

    let { error } = await db
      .from("shop_settings")
      .upsert(upsertPayload);

    // Fallback if columns pending migration
    if (error) {
      const basicPayload: Record<string, any> = {
        id: "main",
        shop_name,
        menu_title,
        meta_title,
        meta_description,
        currency_symbol,
        whatsapp_session_id,
        whatsapp_api_key,
        opening_time,
        closing_time,
        theme_color,
        slider_enabled,
        slider_height_mobile,
      };
      if (slider_images !== null) basicPayload.slider_images = slider_images;

      const retry1 = await db.from("shop_settings").upsert(basicPayload);
      if (retry1.error) {
        const retry2 = await db.from("shop_settings").upsert({ id: "main", shop_name, menu_title, meta_title, meta_description, currency_symbol });
        error = retry2.error;
      } else {
        error = null;
      }
    }

    if (error) return { error: error.message, success: false };
  }

  dbCache.invalidateTag("settings", "shops");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/menu-ui");
  revalidatePath("/admin/menu-layout");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function updateShopLogoAndLayout(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const activeShop = await getActiveShopContext();

  const rawLogo = formData.get("logo_url") as string | null;

  const logo_url = rawLogo !== null ? (rawLogo.trim() || null) : undefined;

  const { saveShopBranding } = await import("@/lib/shop-branding");
  await saveShopBranding(activeShop.shopId, {
    logo_url,
    menu_layout: "default",
  });

  revalidatePath("/admin/menu-layout");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/");
  if (activeShop.shopSlug) {
    revalidatePath(`/${activeShop.shopSlug}`);
  }

  return { error: null, success: true };
}

/**
 * Dedicated server action to update Menu UI, Theme colors, slider banners, and layout settings
 */
export async function updateMenuUiSettings(input: {
  themeColor: string;
  sliderEnabled: boolean;
  sliderHeightMobile: number;
  sliderImages: any[];
  heroBadgeText?: string;
  heroTitle?: string;
  heroTitleHighlight?: string;
  heroSubtitle?: string;
  heroBtnPrimaryText?: string;
  heroBtnPrimaryLink?: string;
  heroBtnSecondaryText?: string;
  heroBtnSecondaryLink?: string;
  heroBgType?: string;
  heroBgGradient?: string;
  heroBgImage?: string;
  activeMenuTemplate?: "menu1" | "menu2";
  menu2Theme?: string;
}): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const payload: Record<string, any> = {
    theme_color: input.themeColor,
    slider_enabled: input.sliderEnabled,
    slider_height_mobile: input.sliderHeightMobile,
    slider_images: input.sliderImages,
  };

  if (input.heroBadgeText !== undefined) payload.hero_badge_text = input.heroBadgeText;
  if (input.heroTitle !== undefined) payload.hero_title = input.heroTitle;
  if (input.heroTitleHighlight !== undefined) payload.hero_title_highlight = input.heroTitleHighlight;
  if (input.heroSubtitle !== undefined) payload.hero_subtitle = input.heroSubtitle;
  if (input.heroBtnPrimaryText !== undefined) payload.hero_btn_primary_text = input.heroBtnPrimaryText;
  if (input.heroBtnPrimaryLink !== undefined) payload.hero_btn_primary_link = input.heroBtnPrimaryLink;
  if (input.heroBtnSecondaryText !== undefined) payload.hero_btn_secondary_text = input.heroBtnSecondaryText;
  if (input.heroBtnSecondaryLink !== undefined) payload.hero_btn_secondary_link = input.heroBtnSecondaryLink;
  if (input.heroBgType !== undefined) payload.hero_bg_type = input.heroBgType;
  if (input.heroBgGradient !== undefined) payload.hero_bg_gradient = input.heroBgGradient;
  if (input.heroBgImage !== undefined) payload.hero_bg_image = input.heroBgImage;

  try {
    if (activeShop.shopId) {
      if (input.menu2Theme !== undefined || input.activeMenuTemplate !== undefined) {
        const { data: shopRow } = await db
          .from("shops")
          .select("feature_flags")
          .eq("id", activeShop.shopId)
          .maybeSingle();
        const existingFlags =
          shopRow && typeof (shopRow as any).feature_flags === "object" && (shopRow as any).feature_flags
            ? { ...(shopRow as any).feature_flags }
            : {};
        if (input.menu2Theme) {
          existingFlags.menu2_theme = input.menu2Theme;
        }
        if (input.activeMenuTemplate) {
          existingFlags.active_menu_template =
            existingFlags.menu2_status === "approved" && input.activeMenuTemplate === "menu2"
              ? "menu2"
              : "menu1";
        }
        payload.feature_flags = existingFlags;
      }

      const { error } = await db.from("shops").update(payload).eq("id", activeShop.shopId);
      if (error) {
        const fallbackPayload: Record<string, any> = {
          theme_color: input.themeColor,
          slider_enabled: input.sliderEnabled,
          slider_height_mobile: input.sliderHeightMobile,
          slider_images: input.sliderImages,
        };
        if (payload.feature_flags) fallbackPayload.feature_flags = payload.feature_flags;
        await db.from("shops").update(fallbackPayload).eq("id", activeShop.shopId);
      }
    } else {
      if (input.menu2Theme !== undefined || input.activeMenuTemplate !== undefined) {
        const { data: settingsRow } = await db
          .from("shop_settings")
          .select("feature_flags")
          .eq("id", "main")
          .maybeSingle();
        const existingFlags =
          settingsRow && typeof (settingsRow as any).feature_flags === "object" && (settingsRow as any).feature_flags
            ? { ...(settingsRow as any).feature_flags }
            : {};
        if (input.menu2Theme) {
          existingFlags.menu2_theme = input.menu2Theme;
        }
        if (input.activeMenuTemplate) {
          existingFlags.active_menu_template =
            existingFlags.menu2_status === "approved" && input.activeMenuTemplate === "menu2"
              ? "menu2"
              : "menu1";
        }
        payload.feature_flags = existingFlags;
      }

      const { error } = await db.from("shop_settings").update(payload).eq("id", "main");
      if (error) {
        const fallbackPayload: Record<string, any> = {
          theme_color: input.themeColor,
          slider_enabled: input.sliderEnabled,
          slider_height_mobile: input.sliderHeightMobile,
          slider_images: input.sliderImages,
        };
        if (payload.feature_flags) fallbackPayload.feature_flags = payload.feature_flags;
        await db.from("shop_settings").update(fallbackPayload).eq("id", "main");
      }
    }

    dbCache.invalidateTag("settings", "shops");
    revalidatePath("/admin/menu-ui");
    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/menu2");
    revalidatePath("/demo/menu");
    if (activeShop.shopSlug) {
      revalidatePath(`/${activeShop.shopSlug}`);
    }
    return { error: null, success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to save UI & Theme settings", success: false };
  }
}

/**
 * Allows a Shop Admin to request Super Admin approval to unlock Premium Menu 2.0
 */
export async function requestMenu2Unlock(
  preferredTheme: string = "ruby_gold"
): Promise<{ error: string | null; success: boolean; status?: "requested" | "approved" }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  try {
    const targetShopId = activeShop.shopId;
    if (targetShopId) {
      const { data: shopRow } = await db
        .from("shops")
        .select("id, slug, feature_flags")
        .eq("id", targetShopId)
        .maybeSingle();

      const existingFlags =
        shopRow && typeof (shopRow as any).feature_flags === "object" && (shopRow as any).feature_flags
          ? { ...(shopRow as any).feature_flags }
          : {};

      const nextStatus = existingFlags.menu2_status === "approved" ? "approved" : "requested";
      const updatedFlags = {
        ...existingFlags,
        menu2_status: nextStatus,
        menu2_theme: preferredTheme || existingFlags.menu2_theme || "ruby_gold",
        menu2_requested_at: new Date().toISOString(),
      };

      const { error } = await db
        .from("shops")
        .update({ feature_flags: updatedFlags })
        .eq("id", targetShopId);

      if (error) return { error: error.message, success: false };
    } else {
      // Fallback: if no cookie shopId, update first shop + main shop_settings
      const { data: firstShop } = await db
        .from("shops")
        .select("id, feature_flags")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstShop) {
        const existingFlags =
          typeof (firstShop as any).feature_flags === "object" && (firstShop as any).feature_flags
            ? { ...(firstShop as any).feature_flags }
            : {};
        const updatedFlags = {
          ...existingFlags,
          menu2_status: existingFlags.menu2_status === "approved" ? "approved" : "requested",
          menu2_theme: preferredTheme || existingFlags.menu2_theme || "ruby_gold",
          menu2_requested_at: new Date().toISOString(),
        };
        await db.from("shops").update({ feature_flags: updatedFlags }).eq("id", firstShop.id);
      }
    }

    dbCache.invalidateTag("settings", "shops");
    revalidatePath("/admin/menu-ui");
    revalidatePath("/super-admin");
    revalidatePath("/menu2");
    return { error: null, success: true, status: "requested" };
  } catch (err: any) {
    return { error: err?.message || "Failed to send Menu 2.0 unlock request", success: false };
  }
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

  const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) return { error: "Invalid status." };

  // STRICT RBAC: Order cancellation is strictly restricted to Shop Admin!
  if (status === "cancelled" && activeShop.role !== "admin") {
    return {
      error: "Permission Denied: Order cancellation is strictly restricted to Shop Admin. Staff and Sub-Admins cannot cancel orders.",
    };
  }

  let query = db
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;

  if (error) return { error: error.message };

  // Automated Post-Order Review Prompt via WhatsApp when marked delivered
  if (status === "delivered") {
    try {
      const { data: ord } = await db
        .from("orders")
        .select("order_number, customer_name, customer_phone, shop_id, notes")
        .eq("id", id)
        .maybeSingle();

      if (ord && ord.customer_phone && !ord.notes?.includes("[REVIEW_PROMPT_SENT]")) {
        const updatedNotes = ord.notes ? `${ord.notes} [REVIEW_PROMPT_SENT]` : "[REVIEW_PROMPT_SENT]";
        await db.from("orders").update({ notes: updatedNotes }).eq("id", id);
        sendWhatsAppReviewPrompt({
          customerPhone: ord.customer_phone,
          customerName: ord.customer_name,
          orderNumber: ord.order_number,
          shopId: ord.shop_id,
        }).catch((e) => console.warn("[Auto Review Prompt Error]:", e));
      }
    } catch (e) {
      console.warn("[Auto Review Prompt Check Exception]:", e);
    }
  }

  dbCache.invalidateTag("orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/kitchen");
  return { error: null };
}

export async function updateOrderDeliveryDetails(
  id: number,
  deliveryFee: number,
  orderType?: "dine_in" | "takeaway" | "delivery",
  deliveryAddress?: string | null,
  riderName?: string | null
): Promise<{ success: boolean; error?: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { success: false, error: SERVICE_ROLE_ERROR };
  }

  // Fetch current order to recalculate total
  let orderQuery = db.from("orders").select("id, total, delivery_fee, discount_amount, items, notes").eq("id", id);
  if (activeShop.shopId) {
    orderQuery = orderQuery.eq("shop_id", activeShop.shopId);
  }

  const { data: currentOrder, error: fetchErr } = await orderQuery.maybeSingle();
  if (fetchErr || !currentOrder) {
    return { success: false, error: fetchErr?.message || "Order not found." };
  }

  const safeFee = Math.max(0, Number(deliveryFee) || 0);
  const oldFee = Number(currentOrder.delivery_fee) || 0;
  const currentTotal = Number(currentOrder.total) || 0;
  const newTotal = Math.max(0, Number((currentTotal - oldFee + safeFee).toFixed(2)));

  const updatePayload: Record<string, any> = {
    delivery_fee: safeFee,
    total: newTotal,
  };

  if (orderType) {
    updatePayload.order_type = orderType;
  }
  if (deliveryAddress !== undefined) {
    updatePayload.delivery_address = deliveryAddress;
  }
  if (riderName !== undefined) {
    updatePayload.delivery_rider_name = riderName;
  }

  let updateQuery = db.from("orders").update(updatePayload).eq("id", id);
  if (activeShop.shopId) {
    updateQuery = updateQuery.eq("shop_id", activeShop.shopId);
  }

  const { error: updateErr } = await updateQuery;
  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  dbCache.invalidateTag("orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/kitchen");

  return { success: true, error: null };
}

/**
 * Directly update customer details (name, phone number, delivery address) for an existing order.
 * Automatically synchronizes order columns and internal notes metadata (e.g. [DELIVERY:...]).
 */
export async function updateOrderCustomerDetails(params: {
  orderId: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
}): Promise<{
  success: boolean;
  error: string | null;
  order?: any;
}> {
  await requireAdmin();
  if (!isServiceRoleConfigured()) {
    return { success: false, error: SERVICE_ROLE_ERROR };
  }

  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  const { data: currentOrder, error: fetchErr } = await db
    .from("orders")
    .select("*")
    .eq("id", params.orderId)
    .maybeSingle();

  if (fetchErr || !currentOrder) {
    return { success: false, error: fetchErr?.message || "Order not found." };
  }

  if (activeShop.shopId && currentOrder.shop_id && Number(currentOrder.shop_id) !== Number(activeShop.shopId)) {
    return { success: false, error: "Unauthorized: this order belongs to another branch." };
  }

  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    updated_at: nowIso,
  };

  if (params.customerName !== undefined) {
    updatePayload.customer_name = params.customerName.trim() || null;
  }
  if (params.customerPhone !== undefined) {
    updatePayload.customer_phone = params.customerPhone.trim() || null;
  }
  if (params.deliveryAddress !== undefined) {
    updatePayload.delivery_address = params.deliveryAddress.trim() || null;
  }

  // Synchronize [DELIVERY: Address: ... | Phone: ... | Fee: ...] in notes if present
  let existingNotes = currentOrder.notes || "";
  if (existingNotes.includes("[DELIVERY:")) {
    existingNotes = existingNotes.replace(/\[DELIVERY:[^\]]*\]/gi, (match: string) => {
      const feeMatch = match.match(/Fee:\s*([0-9.]+)/i);
      const existingFee = feeMatch ? feeMatch[1] : "0";

      const addrMatch = match.match(/Address:\s*([^|]+)/i);
      const existingAddr = addrMatch ? addrMatch[1].trim() : "";
      const addr = params.deliveryAddress !== undefined ? params.deliveryAddress.trim() : existingAddr;

      const phoneMatch = match.match(/Phone:\s*([^|]+)/i);
      const existingPhone = phoneMatch ? phoneMatch[1].trim() : "";
      const phone = params.customerPhone !== undefined ? params.customerPhone.trim() : existingPhone;

      return `[DELIVERY: Address: ${addr} | Phone: ${phone} | Fee: ${existingFee}]`;
    });
    updatePayload.notes = existingNotes;
  }

  let { data: updatedOrder, error: updateErr } = await db
    .from("orders")
    .update(updatePayload)
    .eq("id", params.orderId)
    .select()
    .single();

  if (updateErr && (updateErr.message.includes("delivery_address") || updateErr.message.includes("customer_name") || updateErr.message.includes("customer_phone"))) {
    const fallbackPayload: Record<string, any> = {
      updated_at: nowIso,
    };
    if (updatePayload.customer_name !== undefined) fallbackPayload.customer_name = updatePayload.customer_name;
    if (updatePayload.customer_phone !== undefined) fallbackPayload.customer_phone = updatePayload.customer_phone;
    if (updatePayload.notes !== undefined) fallbackPayload.notes = updatePayload.notes;

    const retry = await db
      .from("orders")
      .update(fallbackPayload)
      .eq("id", params.orderId)
      .select()
      .single();
    updateErr = retry.error;
    updatedOrder = retry.data;
  }

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Sync updated customer name, phone, and address to Customer Info directory
  const resolvedPhone = params.customerPhone?.trim() || currentOrder.customer_phone || "";
  if (resolvedPhone) {
    await syncCustomerFromOrder({
      phone: resolvedPhone,
      customerName: params.customerName !== undefined ? params.customerName : currentOrder.customer_name,
      deliveryAddress: params.deliveryAddress !== undefined ? params.deliveryAddress : currentOrder.delivery_address,
      orderTotal: Number(currentOrder.total) || 0,
      shopId: currentOrder.shop_id ?? activeShop.shopId,
      isNewOrder: false,
    }).catch(() => {});
  }

  dbCache.invalidateTag("orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/kitchen");
  revalidatePath("/kitchen");
  revalidatePath("/admin");
  if (currentOrder.order_number) {
    revalidatePath(`/track/${encodeURIComponent(currentOrder.order_number)}`);
  }

  return { success: true, error: null, order: updatedOrder };
}

export async function deleteOrder(
  id: number
): Promise<{ error: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  // STRICT RBAC: Permanent order deletion is restricted to Shop Admin!
  if (activeShop.role !== "admin") {
    return {
      error: "Permission Denied: Order deletion is strictly restricted to Shop Admin.",
    };
  }

  let query = db.from("orders").delete().eq("id", id);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) return { error: error.message };

  dbCache.invalidateTag("orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin");
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

  // Trigger automated WhatsApp alerts to Rider and Customer
  try {
    const { data: updatedOrd } = await db
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (updatedOrd) {
      const deliveryAddress =
        updatedOrd.delivery_address ||
        updatedOrd.notes?.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i)?.[1]?.trim() ||
        "Delivery address provided on order ticket";

      // 1. Send WhatsApp to Rider with delivery address, customer name/phone, total cash
      if (riderPhone?.trim()) {
        sendWhatsAppRiderAlert({
          riderPhone: riderPhone.trim(),
          riderName: riderName.trim(),
          orderNumber: updatedOrd.order_number,
          deliveryAddress,
          customerName: updatedOrd.customer_name,
          customerPhone: updatedOrd.customer_phone,
          total: updatedOrd.total,
          shopId: activeShop.shopId,
        }).catch((err) => console.error("[Rider WhatsApp alert background error]", err));
      }

      // 2. Send WhatsApp to Customer notifying that order is out for delivery with rider details
      if (updatedOrd.customer_phone?.trim()) {
        sendWhatsAppCustomerDispatchedAlert({
          customerPhone: updatedOrd.customer_phone.trim(),
          customerName: updatedOrd.customer_name,
          orderNumber: updatedOrd.order_number,
          riderName: riderName.trim(),
          riderPhone: riderPhone?.trim() || null,
          shopId: activeShop.shopId,
        }).catch((err) => console.error("[Customer Dispatched WhatsApp alert background error]", err));
      }
    }
  } catch (waErr) {
    console.warn("[assignOrderRider WhatsApp non-blocking error]", waErr);
  }

  // Auto-save to delivery riders directory if not existing yet
  if (riderName?.trim() && riderPhone?.trim()) {
    try {
      const existingRiders = await fetchDeliveryRiders(activeShop.shopId);
      const cleanPhone = riderPhone.replace(/\D/g, "");
      const alreadySaved = existingRiders.some(
        (r) => r.phone.replace(/\D/g, "") === cleanPhone
      );
      if (!alreadySaved) {
        await createDeliveryRider({
          name: riderName.trim(),
          phone: riderPhone.trim(),
          vehicle: "Bike",
          is_active: true,
          notes: "Auto-saved from Live Orders dispatch",
        });
      }
    } catch (saveErr) {
      console.warn("[Auto-save rider directory non-blocking]", saveErr);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/riders");
  revalidatePath("/admin");
  return { error: null };
}

export async function triggerRiderWhatsAppAlert(orderId: number): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return { success: false, error: "Order not found." };
  }

  let riderPhone = order.delivery_rider_phone;
  let riderName = order.delivery_rider_name || "Rider";

  if (!riderPhone && order.notes?.includes("[RIDER:")) {
    const pMatch = order.notes.match(/Phone:\s*([^\]]+)/i);
    if (pMatch) riderPhone = pMatch[1].trim();
    const rMatch = order.notes.match(/\[RIDER:\s*([^|]+)/i);
    if (rMatch) riderName = rMatch[1].trim();
  }

  if (!riderPhone?.trim()) {
    return { success: false, error: "No rider phone number found for this order. Please assign rider with phone." };
  }

  const deliveryAddress =
    order.delivery_address ||
    order.notes?.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i)?.[1]?.trim() ||
    "Delivery address provided on order ticket";

  let targetShopSlug = activeShop.shopSlug;
  const targetShopId = order.shop_id || activeShop.shopId;
  if (!targetShopSlug && targetShopId) {
    const { data: s } = await db.from("shops").select("slug").eq("id", targetShopId).maybeSingle();
    if (s?.slug) targetShopSlug = s.slug;
  }

  return sendWhatsAppRiderAlert({
    riderPhone: riderPhone.trim(),
    riderName: riderName.trim(),
    orderNumber: order.order_number,
    deliveryAddress,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    total: order.total,
    shopId: targetShopId,
    shopSlug: targetShopSlug,
  });
}

// ─── ORDER RECREATE SYSTEM ────────────────────────────────────────

export interface RecreateOrderItemInput {
  id?: string | number;
  name: string;
  price: number;
  qty: number;
  quantity?: number;
  detail?: string;
  selected_variation?: any;
  selected_toppings?: any;
}

export interface RecreateOrderParams {
  orderId: number;
  items: RecreateOrderItemInput[];
  total: number;
  deliveryFee?: number;
  deliveryAddress?: string;
  tableNumber?: string;
  tokenNumber?: string;
  customerName?: string;
  customerPhone?: string;
  status?: string;
  notes?: string;
  resetTime?: boolean; // Default true: updates created_at to now, order ID stays unchanged
}

/**
 * Recreate or modify an existing order.
 * Keeps Order ID and order_number strictly unchanged ("order id same raha").
 * Updates the timestamp to now ("only time ho") so it moves to the top of kitchen & live board.
 */
export async function recreateOrder(params: RecreateOrderParams): Promise<{
  success: boolean;
  error: string | null;
  order?: any;
}> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: SERVICE_ROLE_ERROR };
  }

  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  // 1. Fetch existing order to preserve identity and shop isolation
  const { data: currentOrder, error: fetchErr } = await db
    .from("orders")
    .select("*")
    .eq("id", params.orderId)
    .maybeSingle();

  if (fetchErr || !currentOrder) {
    return { success: false, error: fetchErr?.message || "Order not found." };
  }

  if (activeShop.shopId && currentOrder.shop_id && Number(currentOrder.shop_id) !== Number(activeShop.shopId)) {
    return { success: false, error: "Unauthorized: this order belongs to another branch." };
  }

  // 2. Standardize items structure
  const normalizedItems = params.items.map((it) => {
    const qty = Math.max(1, Number(it.qty || it.quantity || 1));
    const price = Math.max(0, Number(it.price || 0));
    return {
      id: it.id || undefined,
      name: it.name?.trim() || "Item",
      price,
      qty,
      quantity: qty,
      detail: it.detail || (it.selected_variation ? (typeof it.selected_variation === "object" ? it.selected_variation.name : String(it.selected_variation)) : undefined),
      selected_variation: it.selected_variation || (it.detail ? { name: it.detail } : null),
      selected_toppings: it.selected_toppings || null,
    };
  });

  const nowIso = new Date().toISOString();
  const timeFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 3. Build enriched notes — preserves delivery/dine-in metadata while appending recreate audit tag
  const existingNotes = currentOrder.notes || "";
  const auditReason = params.notes?.trim() ? `: ${params.notes.trim()}` : "";
  const recreateAuditTag = `[RECREATED ${timeFormatted}${auditReason}]`;
  let updatedNotes = existingNotes
    ? `${existingNotes} ${recreateAuditTag}`.trim()
    : recreateAuditTag;

  // Synchronize [DELIVERY: Address: ... | Phone: ... | Fee: ...] in notes if present
  if (params.deliveryAddress !== undefined || params.customerPhone !== undefined || params.deliveryFee !== undefined) {
    if (updatedNotes.includes("[DELIVERY:")) {
      updatedNotes = updatedNotes.replace(/\[DELIVERY:[^\]]*\]/gi, (match: string) => {
        const feeMatch = match.match(/Fee:\s*([0-9.]+)/i);
        const existingFee = feeMatch ? feeMatch[1] : "0";
        const fee = params.deliveryFee !== undefined ? params.deliveryFee : existingFee;

        const addrMatch = match.match(/Address:\s*([^|]+)/i);
        const existingAddr = addrMatch ? addrMatch[1].trim() : "";
        const addr = params.deliveryAddress !== undefined ? params.deliveryAddress.trim() : existingAddr;

        const phoneMatch = match.match(/Phone:\s*([^|]+)/i);
        const existingPhone = phoneMatch ? phoneMatch[1].trim() : "";
        const phone = params.customerPhone !== undefined ? params.customerPhone.trim() : existingPhone;

        return `[DELIVERY: Address: ${addr} | Phone: ${phone} | Fee: ${fee}]`;
      });
    }
  }

  // 4. Build update payload — PRESERVING id and order_number
  const updatePayload: Record<string, any> = {
    items: normalizedItems,
    total: Number(params.total.toFixed(2)),
    updated_at: nowIso,
    status: params.status || "preparing", // Default send back to kitchen so newly added items get cooked
    notes: updatedNotes,
  };

  // User requirement: "only time ho but order id same raha"
  // Updating created_at causes it to jump to the top of active orders and restarts kitchen timer
  if (params.resetTime !== false) {
    updatePayload.created_at = nowIso;
  }

  if (params.customerName !== undefined) {
    updatePayload.customer_name = params.customerName.trim() || null;
  }
  if (params.customerPhone !== undefined) {
    updatePayload.customer_phone = params.customerPhone.trim() || null;
  }
  if (params.deliveryAddress !== undefined) {
    updatePayload.delivery_address = params.deliveryAddress.trim() || null;
  }
  if (params.deliveryFee !== undefined) {
    updatePayload.delivery_fee = Number(params.deliveryFee) || 0;
  }
  if (params.tableNumber !== undefined) {
    updatePayload.table_number = params.tableNumber?.trim() || null;
  }
  if (params.tokenNumber !== undefined) {
    updatePayload.token_number = params.tokenNumber?.trim() || null;
  }

  // 5. Update row in database
  let { data: updatedOrder, error: updateErr } = await db
    .from("orders")
    .update(updatePayload)
    .eq("id", params.orderId)
    .select()
    .single();

  // Graceful fallback if certain columns (like delivery_fee) are missing in older schema
  if (
    updateErr &&
    (updateErr.message.includes("delivery_fee") ||
      updateErr.message.includes("delivery_address") ||
      updateErr.message.includes("table_number") ||
      updateErr.message.includes("token_number"))
  ) {
    const fallbackPayload: Record<string, any> = {
      items: normalizedItems,
      total: Number(params.total.toFixed(2)),
      updated_at: nowIso,
      status: params.status || "preparing",
      notes: updatedNotes,
    };
    if (params.resetTime !== false) {
      fallbackPayload.created_at = nowIso;
    }
    const retry = await db
      .from("orders")
      .update(fallbackPayload)
      .eq("id", params.orderId)
      .select()
      .single();
    updateErr = retry.error;
    updatedOrder = retry.data;
  }

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Sync updated customer details to Customer Info directory
  const recPhone = params.customerPhone?.trim() || currentOrder.customer_phone || "";
  if (recPhone) {
    await syncCustomerFromOrder({
      phone: recPhone,
      customerName: params.customerName !== undefined ? params.customerName : currentOrder.customer_name,
      deliveryAddress: params.deliveryAddress !== undefined ? params.deliveryAddress : currentOrder.delivery_address,
      orderTotal: Number(params.total) || 0,
      shopId: currentOrder.shop_id ?? activeShop.shopId,
      isNewOrder: false,
    }).catch(() => {});
  }

  dbCache.invalidateTag("orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/kitchen");
  revalidatePath("/kitchen");
  revalidatePath("/admin");
  if (currentOrder.order_number) {
    revalidatePath(`/track/${encodeURIComponent(currentOrder.order_number)}`);
  }

  return { success: true, error: null, order: updatedOrder };
}

/**
 * Fetch available shop products for adding to recreated orders.
 */
export interface ShopMenuProduct {
  id: number;
  name: string;
  price: number;
  category_name?: string;
  category_id?: number | null;
  is_available?: boolean;
  image_url?: string | null;
  variations?: { id?: string; name: string; price: number; is_default?: boolean }[] | null;
}

export async function getShopMenuProducts(shopId?: number | null): Promise<ShopMenuProduct[]> {
  try {
    const db = createAdminClient();
    let query = db
      .from("products")
      .select("id, name, price, is_available, variations, image_url, category:categories(id, name)")
      .eq("is_available", true)
      .order("name", { ascending: true });

    if (shopId) {
      query = query.or(`shop_id.eq.${shopId},shop_id.is.null`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      // Fallback without category join
      let fallbackQuery = db
        .from("products")
        .select("id, name, price, is_available, variations, image_url")
        .eq("is_available", true)
        .order("name", { ascending: true });

      if (shopId) {
        fallbackQuery = fallbackQuery.or(`shop_id.eq.${shopId},shop_id.is.null`);
      }

      const { data: fallbackData } = await fallbackQuery;
      return (
        fallbackData?.map((p: any) => {
          let parsedVars: any[] = [];
          if (Array.isArray(p.variations)) {
            parsedVars = p.variations;
          } else if (typeof p.variations === "string") {
            try {
              parsedVars = JSON.parse(p.variations);
            } catch {}
          }
          return {
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            category_name: "General",
            category_id: null,
            is_available: p.is_available,
            image_url: p.image_url || null,
            variations: parsedVars,
          };
        }) || []
      );
    }

    return data.map((p: any) => {
      let parsedVars: any[] = [];
      if (Array.isArray(p.variations)) {
        parsedVars = p.variations;
      } else if (typeof p.variations === "string") {
        try {
          parsedVars = JSON.parse(p.variations);
        } catch {}
      }
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        category_name: p.category?.name || "General",
        category_id: p.category?.id || null,
        is_available: p.is_available,
        image_url: p.image_url || null,
        variations: parsedVars,
      };
    });
  } catch {
    return [];
  }
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

  invalidateAllMenuCaches();
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

  invalidateAllMenuCaches();
  return { error: null, success: true };
}

// ─── RESTAURANT TABLE ACTIONS ─────────────────────────────────────

export async function createRestaurantTable(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean; table?: any }> {
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

  const { data: insertedRow, error } = await db
    .from("restaurant_tables")
    .insert({
      table_number,
      table_name,
      capacity,
      status,
      token_code,
      shop_id: activeShop.shopId || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `Table "${table_number}" already exists. Please choose a different number/name.`, success: false };
    }
    return { error: error.message, success: false };
  }

  dbCache.invalidateTag("tables");
  revalidatePath("/admin/tables");
  revalidatePath("/table");
  return { error: null, success: true, table: insertedRow };
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

  dbCache.invalidateTag("tables");
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

  dbCache.invalidateTag("tables");
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

  // Normalize any custom categories saved in notes fallback
  const parsedData = (data || []).map((exp: any) => {
    if (exp.category === "other" && exp.notes && typeof exp.notes === "string" && exp.notes.startsWith("[Category: ")) {
      const match = exp.notes.match(/^\[Category:\s*([^\]]+)\]\s*(.*)$/);
      if (match) {
        return {
          ...exp,
          category: match[1].trim(),
          notes: match[2].trim() || null,
        };
      }
    }
    return exp;
  });

  return { data: parsedData, error: null };
}

export async function createExpense(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean; expense?: any }> {
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

  // Attempt insert with user's category (standard or custom)
  let { data: inserted, error } = await db.from("expenses").insert({
    title,
    amount,
    category,
    notes,
    expense_date,
    shop_id: activeShop.shopId || null,
  }).select().maybeSingle();

  // If DB check constraint blocks custom category, gracefully fallback to 'other' + notes prefix
  if (error && (error.message?.includes("expenses_category_check") || error.message?.toLowerCase().includes("category"))) {
    const fallbackNotes = notes ? `[Category: ${category}] ${notes}` : `[Category: ${category}]`;
    const fallback = await db.from("expenses").insert({
      title,
      amount,
      category: "other",
      notes: fallbackNotes,
      expense_date,
      shop_id: activeShop.shopId || null,
    }).select().maybeSingle();
    error = fallback.error;
    inserted = fallback.data ? {
      ...fallback.data,
      category,
      notes,
    } : null;
  }

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/closing");
  return { error: null, success: true, expense: inserted };
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

export interface ActiveShiftBoundary {
  lastClosedAt: string | null;
  lastClosingDate: string | null;
  activeBusinessDate: string;
  activeShiftStartUtc: string;
  isCurrentDateClosed: boolean;
  nextBusinessDate: string;
}

/**
 * Retrieves the latest daily closing for a shop and determines the active shift boundary.
 * If a shift was closed:
 * - Orders created AFTER the closing belong to the NEXT day's shift.
 * - Previous orders from the closed shift are excluded from the live orders board.
 */
export async function getShopActiveShiftBoundary(shopId?: number | null): Promise<ActiveShiftBoundary> {
  const db = createAdminClient();
  let closingQ = db
    .from("daily_closings")
    .select("closing_date, created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  if (shopId !== undefined && shopId !== null) {
    closingQ = closingQ.eq("shop_id", shopId);
  } else {
    closingQ = closingQ.is("shop_id", null);
  }

  const { data: latestClosingRows } = await closingQ;
  const latestClosing = latestClosingRows && latestClosingRows.length > 0 ? latestClosingRows[0] : null;

  // Retrieve shop hours
  let openingTime = "11:00";
  let closingTime = "01:00";
  if (shopId) {
    const { data: s } = await db.from("shops").select("opening_time, closing_time").eq("id", shopId).maybeSingle();
    if (s?.opening_time) openingTime = s.opening_time;
    if (s?.closing_time) closingTime = s.closing_time;
  } else {
    const { data: s } = await db.from("shop_settings").select("opening_time, closing_time").eq("id", "main").maybeSingle();
    if (s?.opening_time) openingTime = s.opening_time;
    if (s?.closing_time) closingTime = s.closing_time;
  }

  const currentBusinessDate = getCurrentBusinessDate(openingTime, closingTime);
  const { startUtc: normalStartUtc } = getBusinessShiftUtcRange(currentBusinessDate, openingTime, closingTime);

  let lastClosedAt: string | null = null;
  let lastClosingDate: string | null = null;
  let activeShiftStartUtc = normalStartUtc;
  let isCurrentDateClosed = false;

  const [y, m, d] = currentBusinessDate.split("-").map(Number);
  const nextDateObj = new Date(Date.UTC(y, m - 1, d + 1));
  const nextBusinessDate = formatDateStr(nextDateObj);

  let activeBusinessDate = currentBusinessDate;

  if (latestClosing) {
    lastClosedAt = latestClosing.created_at;
    lastClosingDate = latestClosing.closing_date;

    // If the calculated activeBusinessDate has ALREADY been closed in daily_closings:
    // Then today is officially CLOSED, and the active operational date rolls over to NEXT DAY!
    if (lastClosingDate && (lastClosingDate === currentBusinessDate || new Date(lastClosingDate).getTime() >= new Date(currentBusinessDate).getTime())) {
      isCurrentDateClosed = true;
      activeBusinessDate = nextBusinessDate;
    }

    // Active shift start is whichever is more recent:
    // If closing was completed recently today (after normalStartUtc), orders for the new active shift MUST have been placed AFTER that closing!
    // But if closing was from yesterday or earlier, today's shift starts at normalStartUtc!
    if (lastClosedAt && new Date(lastClosedAt).getTime() > new Date(normalStartUtc).getTime()) {
      activeShiftStartUtc = lastClosedAt;
    } else {
      activeShiftStartUtc = normalStartUtc;
    }
  }

  return {
    lastClosedAt,
    lastClosingDate,
    activeBusinessDate,
    activeShiftStartUtc,
    isCurrentDateClosed,
    nextBusinessDate,
  };
}

export async function fetchDailyClosingData(targetDate?: string, skipAutoCheck = false): Promise<{
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
  shiftWindow?: string;
  openingTime?: string;
  closingTime?: string;
  activeBusinessDate?: string;
  nextBusinessDate?: string;
}> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  // Retrieve shop operating shift timing (e.g. 11:00 AM to 01:00 AM Next Day)
  let openingTime = "11:00";
  let closingTime = "01:00";

  if (activeShop.shopId) {
    const { data: sData } = await db
      .from("shops")
      .select("opening_time, closing_time")
      .eq("id", activeShop.shopId)
      .maybeSingle();
    if (sData) {
      if (sData.opening_time) openingTime = sData.opening_time;
      if (sData.closing_time) closingTime = sData.closing_time;
    }
  } else {
    const { data: stData } = await db
      .from("shop_settings")
      .select("opening_time, closing_time")
      .eq("id", "main")
      .maybeSingle();
    if (stData) {
      if (stData.opening_time) openingTime = stData.opening_time;
      if (stData.closing_time) closingTime = stData.closing_time;
    }
  }

  const boundary = await getShopActiveShiftBoundary(activeShop.shopId);

  // If targetDate is specified, view that date.
  // Otherwise, default to targetDate or current active date.
  const dateStr = targetDate || (boundary.isCurrentDateClosed ? boundary.lastClosingDate! : boundary.activeBusinessDate);

  const { startUtc, endUtc, label: shiftWindow } = getBusinessShiftUtcRange(
    dateStr,
    openingTime,
    closingTime
  );

  // Check if register already closed for this shop and date
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

  // If viewing the open active shift after a closing, orders start right after that closing!
  let queryStartUtc = startUtc;
  if (!closingRecord && boundary.lastClosedAt && new Date(boundary.lastClosedAt).getTime() > new Date(startUtc).getTime()) {
    queryStartUtc = boundary.lastClosedAt;
  }

  // Fetch orders strictly within this operational business shift window
  let ordersQuery = db
    .from("orders")
    .select("*")
    .gte("created_at", queryStartUtc);

  // If this date is already closed, only include orders placed BEFORE closing time
  if (closingRecord && closingRecord.created_at) {
    ordersQuery = ordersQuery.lte("created_at", closingRecord.created_at);
  } else {
    ordersQuery = ordersQuery.lte("created_at", endUtc);
  }

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
    shiftWindow,
    openingTime,
    closingTime,
    activeBusinessDate: boundary.activeBusinessDate,
    nextBusinessDate: boundary.nextBusinessDate,
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

  dbCache.invalidateTag("daily_closings", "closings", "orders");
  revalidatePath("/admin/closing");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin");
  revalidatePath("/kitchen");
  return { error: null, success: true };
}

export async function sendDailyClosingWhatsAppAction(input: {
  date: string;
  closedBy: string;
  notes?: string;
  recipientPhone?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  whatsappUrl?: string;
}> {
  await requireAdmin();
  const activeShop = await getActiveShopContext();
  const db = createAdminClient();

  const closingData = await fetchDailyClosingData(input.date);

  let shopName = activeShop.shopName;
  let currencySymbol = "Rs.";
  let resolvedPhone = input.recipientPhone?.trim() || "";

  if (activeShop.shopId) {
    const { data: sData } = await db
      .from("shops")
      .select("name, currency_symbol, owner_phone")
      .eq("id", activeShop.shopId)
      .maybeSingle();
    if (sData) {
      if (sData.name) shopName = sData.name;
      if (sData.currency_symbol) currencySymbol = sData.currency_symbol;
      if (!resolvedPhone && sData.owner_phone) resolvedPhone = sData.owner_phone;
    }
  } else {
    const { data: stData } = await db
      .from("shop_settings")
      .select("shop_name, currency_symbol")
      .eq("id", "main")
      .maybeSingle();
    if (stData) {
      if (stData.shop_name) shopName = stData.shop_name;
      if (stData.currency_symbol) currencySymbol = stData.currency_symbol;
    }
  }

  return sendWhatsAppDailyClosingAlert({
    recipientPhone: resolvedPhone,
    date: input.date,
    closedBy: input.closedBy,
    totalOrders: closingData.totalOrders,
    totalSales: closingData.totalSales,
    dineInSales: closingData.dineInSales,
    takeawaySales: closingData.takeawaySales,
    dineInOrdersCount: closingData.dineInOrdersCount,
    takeawayOrdersCount: closingData.takeawayOrdersCount,
    totalExpenses: closingData.totalExpenses,
    netProfit: closingData.netProfit,
    notes: input.notes,
    shiftWindow: closingData.shiftWindow,
    shopId: activeShop.shopId,
    currencySymbol,
    shopName,
  });
}

/**
 * Daily closing is strictly manual by Shop Admin from /admin/closing.
 * Automated closing has been disabled by user instruction.
 */
export async function checkAndPerformAutoClosing(shopId?: number | null): Promise<{
  autoClosed: boolean;
  date?: string;
  message?: string;
}> {
  return { autoClosed: false, message: "Auto-closing is disabled. Shifts are closed manually by the Admin." };
}

// ─── STAFF & SUB-ADMIN MANAGEMENT ACTIONS ────────────────────────

export interface ShopStaffMember {
  id: string;
  name: string;
  email: string | null;
  role: "admin" | "sub_admin" | "staff" | "cashier" | "manager" | "chef" | "waiter";
  pin: string;
  has_pos_access: boolean;
  is_active: boolean;
  shop_id: number | null;
  created_at: string;
  updated_at?: string;
}

export async function getShopStaffMembers(): Promise<ShopStaffMember[]> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let query = db
    .from("pos_staff")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  } else {
    query = query.is("shop_id", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
  return (data as ShopStaffMember[]) || [];
}

export async function createShopStaffMember(
  formData: FormData
): Promise<{ error: string | null; success: boolean; staff?: ShopStaffMember }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  // Strict check: only Admin can create staff or sub-admins
  if (activeShop.role !== "admin") {
    return {
      error: "Permission Denied: Only Shop Admin can create or manage staff members.",
      success: false,
    };
  }

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const role = ((formData.get("role") as string)?.trim() || "staff") as any;
  const pin = (formData.get("pin") as string)?.trim() || "1234";
  const has_pos_access = formData.get("has_pos_access") === "true";
  const is_active = formData.get("is_active") !== "false";

  if (!name) {
    return { error: "Staff member name is required.", success: false };
  }

  if (!pin || pin.length < 3) {
    return { error: "Staff PIN must be at least 3 digits.", success: false };
  }

  const validRoles = ["admin", "sub_admin", "staff", "cashier", "manager", "chef", "waiter"];
  if (!validRoles.includes(role)) {
    return { error: "Invalid staff role specified.", success: false };
  }

  const payload = {
    name,
    email,
    role,
    pin,
    has_pos_access,
    is_active,
    shop_id: activeShop.shopId || null,
  };

  const { data, error } = await db.from("pos_staff").insert(payload).select().single();

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  return { error: null, success: true, staff: data as ShopStaffMember };
}

export async function updateShopStaffMember(
  id: string,
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  if (activeShop.role !== "admin") {
    return {
      error: "Permission Denied: Only Shop Admin can modify staff members.",
      success: false,
    };
  }

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const role = ((formData.get("role") as string)?.trim() || "staff") as any;
  const pin = (formData.get("pin") as string)?.trim();
  const has_pos_access = formData.get("has_pos_access") === "true";
  const is_active = formData.get("is_active") !== "false";

  if (!name) {
    return { error: "Staff member name is required.", success: false };
  }

  const updates: Record<string, any> = {
    name,
    email,
    role,
    has_pos_access,
    is_active,
    updated_at: new Date().toISOString(),
  };

  if (pin && pin.length >= 3) {
    updates.pin = pin;
  }

  let query = db.from("pos_staff").update(updates).eq("id", id);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  return { error: null, success: true };
}

export async function deleteShopStaffMember(
  id: string
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  if (activeShop.role !== "admin") {
    return {
      error: "Permission Denied: Only Shop Admin can delete staff members.",
      success: false,
    };
  }

  let query = db.from("pos_staff").delete().eq("id", id);
  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  return { error: null, success: true };
}

export async function toggleShopStaffStatus(
  id: string,
  isActive: boolean
): Promise<{ error: string | null; success: boolean }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  if (activeShop.role !== "admin") {
    return {
      error: "Permission Denied: Only Shop Admin can toggle staff status.",
      success: false,
    };
  }

  let query = db
    .from("pos_staff")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const { error } = await query;
  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/admin/staff");
  return { error: null, success: true };
}

export async function unlockBranchKitchen(
  shopId: number,
  passcode: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const trimmed = passcode.trim();
    if (!trimmed) {
      return { success: false, error: "Please enter your kitchen passcode or staff PIN." };
    }

    const db = createAdminClient();
    const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme";

    // 1. Fetch shop credentials
    const { data: shop } = await db
      .from("shops")
      .select("id, name, slug, password, pos_pin, status")
      .eq("id", shopId)
      .maybeSingle();

    if (!shop) {
      return { success: false, error: "Branch not found." };
    }

    if (shop.status === "suspended") {
      return { success: false, error: "Branch is currently suspended." };
    }

    let isMatch = false;
    let staffName = `${shop.name} Kitchen`;
    let userRole: "admin" | "sub_admin" | "staff" = "staff";

    // Match shop password or master password
    if (trimmed === shop.password || trimmed === adminPassword) {
      isMatch = true;
      userRole = "admin";
      staffName = `${shop.name} Kitchen Admin`;
    } else if (shop.pos_pin && trimmed === shop.pos_pin) {
      isMatch = true;
      userRole = "staff";
      staffName = `${shop.name} Kitchen Station`;
    } else {
      // Check staff PINs for THIS shop only
      const { data: staffList } = await db
        .from("pos_staff")
        .select("id, name, role, pin, is_active")
        .eq("shop_id", shopId)
        .eq("pin", trimmed)
        .eq("is_active", true);

      if (staffList && staffList.length > 0) {
        isMatch = true;
        const staff = staffList[0];
        staffName = `${staff.name} (Kitchen)`;
        userRole = staff.role === "admin" ? "admin" : "staff";
      }
    }

    if (!isMatch) {
      return {
        success: false,
        error: `Incorrect passcode. You can only unlock with ${shop.name}'s branch password or kitchen staff PIN.`,
      };
    }

    // Set signed session cookies
    const claims: AdminSessionClaims = {
      isMaster: false,
      shopId: shop.id,
      shopName: shop.name,
      shopSlug: shop.slug || null,
      role: userRole,
      staffName: staffName,
      staffId: null,
      issuedAt: Date.now(),
    };
    const token = await signAdminSession(claims);
    const cookieStore = await cookies();

    cookieStore.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    cookieStore.set(ADMIN_SHOP_COOKIE, String(shop.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    cookieStore.set(ADMIN_SHOP_NAME_COOKIE, shop.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    if (shop.slug) {
      cookieStore.set(ADMIN_SHOP_SLUG_COOKIE, shop.slug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }

    cookieStore.set(ADMIN_ROLE_COOKIE, userRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    cookieStore.set(ADMIN_STAFF_NAME_COOKIE, staffName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to verify passcode." };
  }
}

export async function lockBranchKitchen(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  cookieStore.delete(ADMIN_SHOP_COOKIE);
  cookieStore.delete(ADMIN_SHOP_NAME_COOKIE);
  cookieStore.delete(ADMIN_SHOP_SLUG_COOKIE);
  cookieStore.delete(ADMIN_ROLE_COOKIE);
  cookieStore.delete(ADMIN_STAFF_NAME_COOKIE);
  cookieStore.delete(ADMIN_STAFF_ID_COOKIE);
}

export async function searchAdminOrders(
  searchTerm: string
): Promise<{ success: boolean; orders: any[]; error: string | null }> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    const clean = searchTerm.trim();
    let query = db.from("orders").select("*").order("created_at", { ascending: false });

    // Branch isolation: limit to shop if not master admin
    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }

    if (clean) {
      const isNum = /^\d+$/.test(clean);
      if (isNum) {
        query = query.or(
          `id.eq.${Number(clean)},order_number.ilike.%${clean}%,customer_phone.ilike.%${clean}%,token_number.ilike.%${clean}%,table_number.ilike.%${clean}%`
        );
      } else {
        query = query.or(
          `order_number.ilike.%${clean}%,customer_name.ilike.%${clean}%,customer_phone.ilike.%${clean}%,token_number.ilike.%${clean}%,table_number.ilike.%${clean}%`
        );
      }
      query = query.limit(50);
    } else {
      query = query.limit(30);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, orders: [], error: error.message };
    }

    return { success: true, orders: data || [], error: null };
  } catch (err: any) {
    return { success: false, orders: [], error: err.message || "Failed to search orders" };
  }
}

// ─── Delivery Riders Directory Management ────────────────────────
export interface DeliveryRider {
  id: number;
  shop_id?: number | null;
  name: string;
  phone: string;
  vehicle?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  total_rides?: number;
  delivered_rides?: number;
  active_rides?: number;
  today_rides?: number;
  total_cash_collected?: number;
  last_assigned_at?: string | null;
}

const RIDERS_FILE = path.join(process.cwd(), "data", "delivery_riders.json");

function readFallbackRiders(): DeliveryRider[] {
  try {
    if (fs.existsSync(RIDERS_FILE)) {
      const raw = fs.readFileSync(RIDERS_FILE, "utf-8");
      return JSON.parse(raw) || [];
    }
  } catch (err) {
    console.error("Error reading fallback riders file:", err);
  }
  return [];
}

function writeFallbackRiders(riders: DeliveryRider[]): boolean {
  try {
    const dir = path.dirname(RIDERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RIDERS_FILE, JSON.stringify(riders, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing fallback riders file:", err);
    return false;
  }
}

export async function fetchDeliveryRiders(shopId?: number | null): Promise<DeliveryRider[]> {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();
  const effectiveShopId = shopId !== undefined ? shopId : activeShop.shopId;

  let baseRiders: DeliveryRider[] = [];

  try {
    let query = db.from("delivery_riders").select("*").order("created_at", { ascending: false });
    if (effectiveShopId) {
      query = query.or(`shop_id.eq.${effectiveShopId},shop_id.is.null`);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      baseRiders = data as DeliveryRider[];
    }
    if (error) {
      console.warn("[fetchDeliveryRiders db warning]", error.message);
    }
  } catch (err) {
    // fallback
  }

  // Graceful fallback to data/delivery_riders.json if DB table empty
  if (baseRiders.length === 0) {
    const fileRiders = readFallbackRiders();
    baseRiders = effectiveShopId
      ? fileRiders.filter((r) => !r.shop_id || r.shop_id === effectiveShopId)
      : fileRiders;
  }

  // Dynamically enrich riders with live performance and trip stats from orders
  try {
    let ordersQuery = db
      .from("orders")
      .select("id, delivery_rider_name, delivery_rider_phone, status, total, created_at")
      .not("delivery_rider_name", "is", null)
      .order("created_at", { ascending: false });

    if (effectiveShopId) {
      ordersQuery = ordersQuery.eq("shop_id", effectiveShopId);
    }

    const { data: orderRows } = await ordersQuery;

    let shiftStartTime: string | null = null;
    try {
      const boundary = await getShopActiveShiftBoundary(effectiveShopId);
      shiftStartTime = boundary?.activeShiftStartUtc || boundary?.lastClosedAt || null;
    } catch {
      // fallback
    }
    const todayDatePrefix = new Date().toISOString().slice(0, 10);

    if (orderRows && orderRows.length > 0) {
      return baseRiders.map((r) => {
        const rPhoneClean = (r.phone || "").replace(/\D/g, "");
        const rNameLower = (r.name || "").toLowerCase().trim();

        const matched = orderRows.filter((o: any) => {
          const oPhoneClean = (o.delivery_rider_phone || "").replace(/\D/g, "");
          const oNameLower = (o.delivery_rider_name || "").toLowerCase().trim();
          return (
            (rPhoneClean && oPhoneClean && (rPhoneClean === oPhoneClean || oPhoneClean.endsWith(rPhoneClean) || rPhoneClean.endsWith(oPhoneClean))) ||
            (rNameLower && oNameLower === rNameLower)
          );
        });

        const total_rides = matched.length;
        const delivered_rides = matched.filter((o: any) => o.status === "delivered").length;
        const active_rides = matched.filter((o: any) => ["pending", "preparing", "ready"].includes(o.status)).length;
        const today_rides = matched.filter((o: any) => {
          if (!o.created_at) return false;
          if (shiftStartTime) return o.created_at >= shiftStartTime;
          return o.created_at.startsWith(todayDatePrefix);
        }).length;
        const total_cash_collected = matched
          .filter((o: any) => o.status === "delivered")
          .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
        const last_assigned_at = matched[0]?.created_at || null;

        return {
          ...r,
          total_rides,
          delivered_rides,
          active_rides,
          today_rides,
          total_cash_collected,
          last_assigned_at,
        };
      });
    }
  } catch (enrichErr) {
    console.warn("[fetchDeliveryRiders enrich warning]", enrichErr);
  }

  return baseRiders;
}

export async function createDeliveryRider(payload: {
  name: string;
  phone: string;
  vehicle?: string;
  is_active?: boolean;
  notes?: string;
}): Promise<{ success: boolean; data?: DeliveryRider; error?: string | null }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  const name = payload.name?.trim();
  const phone = payload.phone?.trim();
  const vehicle = payload.vehicle?.trim() || "Bike";
  const is_active = payload.is_active !== false;
  const notes = payload.notes?.trim() || null;

  if (!name) return { success: false, error: "Rider name is required." };
  if (!phone) return { success: false, error: "Rider WhatsApp phone number is required." };

  const riderPayload = {
    name,
    phone,
    vehicle,
    is_active,
    notes,
    shop_id: activeShop.shopId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await db.from("delivery_riders").insert(riderPayload).select().single();
    if (!error && data) {
      // Sync to fallback file
      const fileRiders = readFallbackRiders();
      const filtered = fileRiders.filter((r) => Number(r.id) !== Number(data.id));
      filtered.unshift(data as DeliveryRider);
      writeFallbackRiders(filtered);

      revalidatePath("/admin/riders");
      revalidatePath("/admin/orders");
      return { success: true, data: data as DeliveryRider };
    }
    if (error) {
      console.warn("[createDeliveryRider db error, writing fallback]", error.message);
    }
  } catch (e) {
    // fallback
  }

  // Fallback to file persistence
  const fileRiders = readFallbackRiders();
  const newId = fileRiders.length > 0 ? Math.max(...fileRiders.map((r) => Number(r.id) || 0)) + 1 : 1;
  const newRider: DeliveryRider = {
    id: newId,
    ...riderPayload,
  };
  fileRiders.unshift(newRider);
  writeFallbackRiders(fileRiders);

  revalidatePath("/admin/riders");
  revalidatePath("/admin/orders");
  return { success: true, data: newRider };
}

export async function updateDeliveryRider(
  id: number,
  payload: Partial<DeliveryRider>
): Promise<{ success: boolean; data?: DeliveryRider; error?: string | null }> {
  await requireAdmin();
  const db = createAdminClient();

  const updates: any = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await db.from("delivery_riders").update(updates).eq("id", id).select().single();
    if (!error && data) {
      revalidatePath("/admin/riders");
      revalidatePath("/admin/orders");
      return { success: true, data: data as DeliveryRider };
    }
  } catch (e) {
    // fallback
  }

  // Fallback to file
  const fileRiders = readFallbackRiders();
  const idx = fileRiders.findIndex((r) => Number(r.id) === Number(id));
  if (idx !== -1) {
    fileRiders[idx] = { ...fileRiders[idx], ...updates };
    writeFallbackRiders(fileRiders);
    revalidatePath("/admin/riders");
    revalidatePath("/admin/orders");
    return { success: true, data: fileRiders[idx] };
  }

  return { success: false, error: "Rider not found." };
}

export async function deleteDeliveryRider(
  id: number
): Promise<{ success: boolean; error?: string | null }> {
  await requireAdmin();
  const db = createAdminClient();

  try {
    await db.from("delivery_riders").delete().eq("id", id);
  } catch (e) {
    // fallback
  }

  const fileRiders = readFallbackRiders();
  const filtered = fileRiders.filter((r) => Number(r.id) !== Number(id));
  writeFallbackRiders(filtered);

  revalidatePath("/admin/riders");
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function toggleDeliveryRiderStatus(
  id: number,
  is_active: boolean
): Promise<{ success: boolean; error?: string | null }> {
  return updateDeliveryRider(id, { is_active });
}

// ─── UNIVERSAL MULTI-BUSINESS SETUP & FEATURE FLAGS ─────────────────

export async function getShopBusinessProfileServer(
  shopId?: number | null
) {
  const { getShopBusinessProfile, BUSINESS_PRESETS } = await import("@/lib/business-config");
  const ctx = await getActiveShopContext();
  const targetShopId = shopId ?? ctx.shopId;
  const profile = await getShopBusinessProfile(targetShopId);
  const currentPreset = BUSINESS_PRESETS[profile.business_type] || BUSINESS_PRESETS.fast_food;

  return {
    success: true,
    data: {
      profile,
      preset: currentPreset,
      all_presets: Object.values(BUSINESS_PRESETS),
    },
  };
}

export async function saveShopBusinessProfileServer(
  shopId: number | null | undefined,
  businessType: import("@/lib/business-config").BusinessType,
  featureOverrides?: Partial<import("@/lib/business-config").BusinessFeatureFlags>
) {
  await requireAdmin();
  const { saveShopBusinessProfile } = await import("@/lib/business-config");
  const ctx = await getActiveShopContext();
  const targetShopId = shopId ?? ctx.shopId;
  const res = await saveShopBusinessProfile(targetShopId, businessType, featureOverrides);

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  return res;
}

// ─── ONLINE MENU ORDER VERIFICATION ENGINE ─────────────────────────

export async function fetchUnverifiedMenuOrders(shopId?: number | null): Promise<Order[]> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();
  const targetShopId = shopId !== undefined ? shopId : activeShop.shopId;

  let query = db
    .from("orders")
    .select("*")
    .or("is_verified.eq.false,notes.ilike.%[ONLINE_MENU: AWAITING_VERIFICATION]%")
    .neq("status", "cancelled")
    .neq("status", "delivered")
    .order("created_at", { ascending: false });

  if (targetShopId) {
    query = query.eq("shop_id", targetShopId);
  } else {
    query = query.is("shop_id", null);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("[fetchUnverifiedMenuOrders error]", error);
    return [];
  }
  return (data as Order[]) || [];
}

export async function verifyMenuOrder(
  orderId: number,
  options?: { sendToKitchen?: boolean; cashierName?: string }
): Promise<{ success: boolean; order?: Order; error?: string }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  const { data: order, error: fetchErr } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    return { success: false, error: "Order not found." };
  }

  const nowIso = new Date().toISOString();
  const staff = options?.cashierName || activeShop.staffName || "Admin";
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let updatedNotes = order.notes || "";
  updatedNotes = updatedNotes.replace(/\[ONLINE_MENU:\s*AWAITING_VERIFICATION\]\s*/gi, "");
  updatedNotes = `[VERIFIED & ACCEPTED by ${staff} at ${nowStr} - Sent to Live Orders] ${updatedNotes}`.trim();

  // Release order as 'pending' so the POS printer script detects it and auto-prints immediately
  const nextStatus = "pending";

  const updatePayload: Record<string, any> = {
    is_verified: true,
    status: nextStatus,
    verified_at: nowIso,
    verified_by: staff,
    notes: updatedNotes,
  };

  let { data: updated, error: updateErr } = await db
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId)
    .select()
    .single();

  if (updateErr && updateErr.message?.includes("is_verified")) {
    delete updatePayload.is_verified;
    delete updatePayload.verified_at;
    delete updatePayload.verified_by;
    const retry = await db
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();
    updated = retry.data;
    updateErr = retry.error;
  }

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath("/admin/verify");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin");

  return { success: true, order: updated as Order };
}

export async function rejectMenuOrder(
  orderId: number,
  reason: string,
  cashierName?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  const { data: order, error: fetchErr } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    return { success: false, error: "Order not found." };
  }

  const staff = cashierName || activeShop.staffName || "Admin";
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const cleanReason = reason?.trim() || "Unverified / Prank / Cancelled by Shop";

  let updatedNotes = order.notes || "";
  updatedNotes = updatedNotes.replace(/\[ONLINE_MENU:\s*AWAITING_VERIFICATION\]\s*/gi, "");
  updatedNotes = `[REJECTED/CANCELLED by ${staff} at ${nowStr} | Reason: ${cleanReason}] ${updatedNotes}`.trim();

  const updatePayload: Record<string, any> = {
    status: "cancelled",
    is_verified: false,
    notes: updatedNotes,
  };

  let { error: updateErr } = await db
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (updateErr && updateErr.message?.includes("is_verified")) {
    delete updatePayload.is_verified;
    const retry = await db.from("orders").update(updatePayload).eq("id", orderId);
    updateErr = retry.error;
  }

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath("/admin/verify");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");

  return { success: true };
}



