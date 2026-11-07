import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { fetchSettings } from "@/lib/menu-data";
import { isServiceRoleConfigured, createAdminClient } from "@/utils/supabase/admin";
import AdminLoginClient from "./AdminLoginClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SoleWhat POS & Cloud Operations | POS Login",
  description: "Secure administrative access to SoleWhat POS & Cloud Operations and store POS operations.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ shop?: string; branch?: string; shopSlug?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const querySlug = (resolvedParams.shop || resolvedParams.branch || resolvedParams.shopSlug || "")
    .toLowerCase()
    .trim();

  // 1. Detect subdomain from request host (e.g. demo.solewhat.store -> demo)
  const hdrs = await headers();
  const host = (hdrs.get("x-forwarded-host") || hdrs.get("host") || "").toLowerCase().split(":")[0];
  let sub = "";
  if (host.endsWith(".solewhat.store")) {
    const part = host.replace(".solewhat.store", "").trim();
    if (part && part !== "www") sub = part;
  } else if (host.endsWith(".localhost")) {
    const part = host.replace(".localhost", "").trim();
    if (part && part !== "www") sub = part;
  }

  const targetSlug = sub || querySlug;

  // 2. Check existing session: if user has a session for another branch, do not auto-redirect
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) {
    const session = await verifyAdminSession(token);
    if (session) {
      if (!targetSlug || session.isMaster || (session.shopSlug && session.shopSlug.toLowerCase() === targetSlug.toLowerCase())) {
        redirect("/admin");
      }
    }
  }

  // 3. Resolve bound shop details if on a dedicated branch link
  let boundShop: { id: number; name: string; slug: string } | null = null;
  if (targetSlug && isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      const { data: shopRow } = await db
        .from("shops")
        .select("id, name, slug, status")
        .eq("slug", targetSlug)
        .maybeSingle();
      if (shopRow) {
        boundShop = { id: shopRow.id, name: shopRow.name, slug: shopRow.slug };
      }
    } catch {
      // ignore db error
    }
  }

  const settings = await fetchSettings(boundShop?.id ?? null).catch(() => null);
  const rawName = boundShop?.name || settings?.shop_name?.trim() || "SoleWhat POS & Cloud Operations";
  const setupName = rawName.replace(/Soule\s*What(\s*Management)?/gi, "SoleWhat POS & Cloud Operations");

  return <AdminLoginClient setupName={setupName} boundShop={boundShop} />;
}
