"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import {
  SUPER_ADMIN_COOKIE,
  SUPER_ADMIN_COOKIE_MAX_AGE,
  generateSuperAdminSessionToken,
  verifySuperAdminSessionToken,
} from "@/lib/super-admin-auth";
import {
  ADMIN_COOKIE,
  ADMIN_SHOP_COOKIE,
  ADMIN_SHOP_NAME_COOKIE,
  ADMIN_SHOP_SLUG_COOKIE,
  COOKIE_MAX_AGE,
  generateSessionToken,
} from "@/lib/admin-auth";
import type { Shop, PosStaff } from "@/types/menu";

// ─── Super Admin Guard ───────────────────────────────────────────
export async function requireSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPER_ADMIN_COOKIE)?.value;
  if (!token || !(await verifySuperAdminSessionToken(token))) {
    redirect("/super-admin/login");
  }
}

const SERVICE_ROLE_ERROR =
  "Database write permission denied: SUPABASE_SERVICE_ROLE_KEY is missing or invalid. Check .env.local.";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── AUTH ACTIONS ────────────────────────────────────────────────
export async function superAdminLogin(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const password = (formData.get("password") as string)?.trim();
  const expectedPassword = process.env.SUPER_ADMIN_PASSWORD ?? "superadmin123";

  if (!password || password !== expectedPassword) {
    return { error: "Incorrect Super Admin password. Please check your credentials." };
  }

  const token = await generateSuperAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SUPER_ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/super-admin");
}

export async function superAdminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(SUPER_ADMIN_COOKIE);
  redirect("/super-admin/login");
}

// ─── SHOP MANAGEMENT ACTIONS ─────────────────────────────────────
export async function createShop(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean; shop?: Shop }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const name = (formData.get("name") as string)?.trim();
  const owner_name = (formData.get("owner_name") as string)?.trim();
  const owner_email = (formData.get("owner_email") as string)?.trim() || null;
  const owner_phone = (formData.get("owner_phone") as string)?.trim() || null;
  const branch_address = (formData.get("branch_address") as string)?.trim() || null;
  const password = (formData.get("password") as string)?.trim() || "shop123";
  const currency_symbol = (formData.get("currency_symbol") as string)?.trim() || "Rs.";
  const plan = (formData.get("plan") as "starter" | "pro" | "enterprise") || "pro";
  const status = (formData.get("status") as "active" | "suspended" | "pending") || "active";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const whatsapp_session_id = (formData.get("whatsapp_session_id") as string)?.trim() || null;
  const whatsapp_api_key = (formData.get("whatsapp_api_key") as string)?.trim() || null;

  if (!name || !owner_name) {
    return { error: "Shop Name and Owner Name are required.", success: false };
  }

  const baseSlug = slugify(name);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const slug = `${baseSlug}-${randomSuffix}`;

  const insertPayload: Record<string, any> = {
    name,
    slug,
    owner_name,
    owner_email,
    owner_phone,
    branch_address,
    password,
    currency_symbol,
    plan,
    status,
    notes,
    whatsapp_session_id,
    whatsapp_api_key,
  };

  let { data, error } = await db
    .from("shops")
    .insert(insertPayload)
    .select()
    .single();

  if (error && (error.message.includes("whatsapp_session_id") || error.message.includes("whatsapp_api_key"))) {
    delete insertPayload.whatsapp_session_id;
    delete insertPayload.whatsapp_api_key;
    const retry = await db.from("shops").insert(insertPayload).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    if (error.code === "PGRST205") {
      return {
        error:
          "The 'shops' table does not exist in Supabase yet. Please run migration 'supabase/migrations/007_super_admin_shops.sql' in your Supabase SQL editor.",
        success: false,
      };
    }
    return { error: error.message, success: false };
  }

  const pos_pin = (formData.get("pos_pin") as string)?.trim() || "1234";

  // Auto-provision branch Owner in pos_staff with POS access and the specified PIN
  if (data && (data as any).id) {
    try {
      const staffPayload: Record<string, any> = {
        name: `${owner_name} (Owner)`,
        email: owner_email || `shop_${(data as any).id}_owner@pos.local`,
        role: "owner",
        pin: pos_pin,
        has_pos_access: true,
        is_active: status === "active",
      };
      const tryWithShop = await db.from("pos_staff").insert({ ...staffPayload, shop_id: (data as any).id });
      if (tryWithShop.error && tryWithShop.error.message.includes("shop_id")) {
        await db.from("pos_staff").insert(staffPayload);
      }
    } catch (e) {
      console.warn("[SuperAdmin] Auto-provision owner pos_staff note:", e);
    }
  }

  revalidatePath("/super-admin");
  return { error: null, success: true, shop: data as Shop };
}

export async function updateShop(
  id: number | string,
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const name = (formData.get("name") as string)?.trim();
  const owner_name = (formData.get("owner_name") as string)?.trim();
  const owner_email = (formData.get("owner_email") as string)?.trim() || null;
  const owner_phone = (formData.get("owner_phone") as string)?.trim() || null;
  const branch_address = (formData.get("branch_address") as string)?.trim() || null;
  const password = (formData.get("password") as string)?.trim();
  const currency_symbol = (formData.get("currency_symbol") as string)?.trim() || "Rs.";
  const plan = (formData.get("plan") as "starter" | "pro" | "enterprise") || "pro";
  const status = (formData.get("status") as "active" | "suspended" | "pending") || "active";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const whatsapp_session_id = (formData.get("whatsapp_session_id") as string)?.trim() || null;
  const whatsapp_api_key = (formData.get("whatsapp_api_key") as string)?.trim() || null;

  if (!name || !owner_name) {
    return { error: "Shop Name and Owner Name are required.", success: false };
  }

  const updatePayload: Record<string, unknown> = {
    name,
    owner_name,
    owner_email,
    owner_phone,
    branch_address,
    currency_symbol,
    plan,
    status,
    notes,
    whatsapp_session_id,
    whatsapp_api_key,
    updated_at: new Date().toISOString(),
  };

  if (password) {
    updatePayload.password = password;
  }

  let { error } = await db.from("shops").update(updatePayload).eq("id", id);

  if (error && (error.message.includes("whatsapp_session_id") || error.message.includes("whatsapp_api_key"))) {
    delete updatePayload.whatsapp_session_id;
    delete updatePayload.whatsapp_api_key;
    const retry = await db.from("shops").update(updatePayload).eq("id", id);
    error = retry.error;
  }

  if (error) return { error: error.message, success: false };

  const pos_pin = (formData.get("pos_pin") as string)?.trim();
  if (pos_pin) {
    try {
      const tryShopId = await db
        .from("pos_staff")
        .update({ pin: pos_pin, is_active: status === "active" })
        .eq("shop_id", id)
        .eq("role", "owner");

      if (tryShopId.error && tryShopId.error.message.includes("shop_id")) {
        if (owner_email) {
          await db
            .from("pos_staff")
            .update({ pin: pos_pin, is_active: status === "active" })
            .eq("email", owner_email);
        }
      }
    } catch (e) {
      console.warn("[SuperAdmin] Update pos_staff pin note:", e);
    }
  }

  revalidatePath("/super-admin");
  return { error: null, success: true };
}

export async function toggleShopStatus(
  id: number | string,
  currentStatus: "active" | "suspended" | "pending"
): Promise<{ error: string | null; newStatus: "active" | "suspended" }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, newStatus: currentStatus === "active" ? "suspended" : "active" };
  }

  const newStatus: "active" | "suspended" = currentStatus === "active" ? "suspended" : "active";

  const { error } = await db
    .from("shops")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message, newStatus: currentStatus as "active" | "suspended" };
  }

  revalidatePath("/super-admin");
  return { error: null, newStatus };
}

export async function deleteShop(id: number | string): Promise<{ error: string | null }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  const { error } = await db.from("shops").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/super-admin");
  return { error: null };
}

/**
 * Super Admin Impersonation:
 * Allows the Super Admin to log directly into the shop's admin panel (/admin)
 * with full store manager privileges.
 */
export async function impersonateShop(shopId?: number | string, shopName?: string) {
  await requireSuperAdmin();
  const token = await generateSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  if (shopId != null) {
    cookieStore.set(ADMIN_SHOP_COOKIE, String(shopId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    cookieStore.set(ADMIN_SHOP_NAME_COOKIE, shopName || `Shop #${shopId}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    try {
      const db = createAdminClient();
      const { data: sData } = await db.from("shops").select("slug").eq("id", shopId).maybeSingle();
      if (sData?.slug) {
        cookieStore.set(ADMIN_SHOP_SLUG_COOKIE, sData.slug, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_MAX_AGE,
          path: "/",
        });
      }
    } catch {}
  } else {
    cookieStore.delete(ADMIN_SHOP_COOKIE);
    cookieStore.delete(ADMIN_SHOP_NAME_COOKIE);
    cookieStore.delete(ADMIN_SHOP_SLUG_COOKIE);
  }

  redirect("/admin");
}

// ─── STAFF & POS TERMINAL ACCESS ACTIONS ────────────────────────
export async function createStaff(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean; staff?: PosStaff }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const role = (formData.get("role") as string) || "cashier";
  const pin = (formData.get("pin") as string)?.trim() || "1234";
  const rawShopId = (formData.get("shop_id") as string)?.trim();
  const shop_id = rawShopId && rawShopId !== "all" && !isNaN(Number(rawShopId)) ? Number(rawShopId) : null;
  const has_pos_access = formData.get("has_pos_access") === "true" || formData.get("has_pos_access") === "on";
  const is_active = formData.get("is_active") !== "false";

  if (!name) {
    return { error: "Staff member name is required.", success: false };
  }

  if (!pin || pin.length < 4) {
    return { error: "POS PIN must be at least 4 digits.", success: false };
  }

  const insertPayload = {
    name,
    email,
    role,
    pin,
    shop_id,
    has_pos_access,
    is_active,
  };

  const { data, error } = await db
    .from("pos_staff")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/super-admin");
  return { error: null, success: true, staff: data as PosStaff };
}

export async function updateStaff(
  id: string,
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, success: false };
  }

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const role = (formData.get("role") as string) || "cashier";
  const pin = (formData.get("pin") as string)?.trim();
  const rawShopId = (formData.get("shop_id") as string)?.trim();
  const has_pos_access = formData.get("has_pos_access") === "true" || formData.get("has_pos_access") === "on";
  const is_active = formData.get("is_active") === "true" || formData.get("is_active") === "on";

  if (!name) {
    return { error: "Staff member name is required.", success: false };
  }

  const updatePayload: Record<string, any> = {
    name,
    email,
    role,
    has_pos_access,
    is_active,
    updated_at: new Date().toISOString(),
  };

  if (rawShopId !== undefined) {
    const parsedShopId = rawShopId && rawShopId !== "all" && !isNaN(Number(rawShopId)) ? Number(rawShopId) : null;
    updatePayload.shop_id = parsedShopId;
  }

  if (pin && pin.length >= 4) {
    updatePayload.pin = pin;
  }

  const { error } = await db.from("pos_staff").update(updatePayload).eq("id", id);
  if (error) return { error: error.message, success: false };

  revalidatePath("/super-admin");
  return { error: null, success: true };
}

export async function toggleStaffStatus(
  id: string,
  currentStatus: boolean
): Promise<{ error: string | null; newStatus: boolean }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, newStatus: currentStatus };
  }

  const newStatus = !currentStatus;
  const { error } = await db
    .from("pos_staff")
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message, newStatus: currentStatus };

  revalidatePath("/super-admin");
  return { error: null, newStatus };
}

export async function toggleStaffPosAccess(
  id: string,
  currentAccess: boolean
): Promise<{ error: string | null; newAccess: boolean }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR, newAccess: currentAccess };
  }

  const newAccess = !currentAccess;
  const { error } = await db
    .from("pos_staff")
    .update({ has_pos_access: newAccess, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message, newAccess: currentAccess };

  revalidatePath("/super-admin");
  return { error: null, newAccess };
}

export async function deleteStaff(id: string): Promise<{ error: string | null }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  if (!isServiceRoleConfigured()) {
    return { error: SERVICE_ROLE_ERROR };
  }

  const { error } = await db.from("pos_staff").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/super-admin");
  return { error: null };
}

export async function seedMasterBranch(): Promise<{ error: string | null; shop?: Shop }> {
  await requireSuperAdmin();
  const db = createAdminClient();

  const { data: existing } = await db.from("shops").select("id").limit(1);
  if (existing && existing.length > 0) {
    return { error: "Branches already exist in the database." };
  }

  const payload = {
    name: "Pizza Crust - Master Branch",
    slug: "pizza-crust-main",
    owner_name: "Tariq Mehmood (Super Admin)",
    owner_email: "admin@pizzacrust.com",
    owner_phone: "0300-1234567",
    branch_address: "Main Boulevard, Gulberg III, Lahore",
    password: "admin",
    currency_symbol: "Rs.",
    plan: "enterprise",
    status: "active",
    notes: "Main Headquarters & Flagship POS Store",
  };

  const { data, error } = await db.from("shops").insert(payload).select().single();
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/super-admin");
  return { error: null, shop: data as Shop };
}

export async function verifyCloudSyncHealth(): Promise<{
  success: boolean;
  message: string;
  totalStaff: number;
  totalShops: number;
}> {
  await requireSuperAdmin();
  const db = createAdminClient();

  try {
    const [{ count: staffCount, error: staffErr }, { count: shopCount, error: shopErr }] = await Promise.all([
      db.from("pos_staff").select("*", { count: "exact", head: true }),
      db.from("shops").select("*", { count: "exact", head: true }),
    ]);

    if (staffErr || shopErr) {
      return {
        success: false,
        message: staffErr?.message || shopErr?.message || "Cloud error",
        totalStaff: 0,
        totalShops: 0,
      };
    }

    return {
      success: true,
      message: `Supabase Cloud Live! ${staffCount ?? 0} Staff members & ${shopCount ?? 0} branches verified in cloud.`,
      totalStaff: staffCount ?? 0,
      totalShops: shopCount ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || String(err),
      totalStaff: 0,
      totalShops: 0,
    };
  }
}
