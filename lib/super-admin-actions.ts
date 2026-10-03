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
import type { Shop } from "@/types/menu";

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
