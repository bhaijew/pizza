import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import AdminShell from "@/components/admin/AdminShell";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { ADMIN_COOKIE, ADMIN_SHOP_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { adminLogout, getActiveShopContext } from "@/lib/admin-actions";
import { ShieldAlert, Store } from "@/components/admin/AdminIcons";
import { dbCache } from "@/lib/db-cache";
import { getShopBranding } from "@/lib/shop-branding";
import { getShopBusinessProfile, BusinessType } from "@/lib/business-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store Admin Backoffice | SoleWhat",
  description: "Store, menu, deals and POS administration portal",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const verifiedSession = token ? await verifyAdminSession(token) : null;

  // If user is not authenticated, render login page directly without AdminShell
  if (!verifiedSession) {
    return <>{children}</>;
  }

  // Tenant Boundary Guard: If visiting a specific shop subdomain, check if session matches
  const hdrs = await headers();
  const host = (hdrs.get("x-forwarded-host") || hdrs.get("host") || "").toLowerCase().split(":")[0];
  let currentSub = "";
  if (host.endsWith(".solewhat.store")) {
    const part = host.replace(".solewhat.store", "").trim();
    if (part && part !== "www") currentSub = part;
  } else if (host.endsWith(".localhost")) {
    const part = host.replace(".localhost", "").trim();
    if (part && part !== "www") currentSub = part;
  }

  if (
    currentSub &&
    !verifiedSession.isMaster &&
    verifiedSession.shopSlug &&
    verifiedSession.shopSlug.toLowerCase() !== currentSub.toLowerCase() &&
    verifiedSession.shopSlug.toLowerCase().replace(/[-_]/g, "") !== currentSub.toLowerCase().replace(/[-_]/g, "")
  ) {
    return <>{children}</>;
  }

  const shopIdStr = cookieStore.get(ADMIN_SHOP_COOKIE)?.value;
  const shopIdNum = verifiedSession.shopId ?? (shopIdStr ? parseInt(shopIdStr, 10) : null);

  let shopName = verifiedSession.shopName || "Store Admin";
  let shopStatus: "active" | "suspended" | "master" = "master";
  let ownerName = "";
  let shopSlug: string | undefined = verifiedSession.shopSlug || undefined;

  if (shopIdStr && isServiceRoleConfigured()) {
    try {
      const shop = await dbCache.wrap(
        `shop:layout:${shopIdStr}`,
        async () => {
          const db = createAdminClient();
          const { data } = await db
            .from("shops")
            .select("id, name, slug, status, owner_name, currency_symbol")
            .eq("id", parseInt(shopIdStr, 10))
            .maybeSingle();
          return data;
        },
        { ttlSeconds: 120, tags: ["shops"] }
      );

      if (shop) {
        shopName = shop.name;
        shopSlug = shop.slug;
        shopStatus = shop.status as "active" | "suspended";
        ownerName = shop.owner_name;

        // ─── LIVE SUSPENSION ENFORCEMENT ──────────────────────────
        // If the Super Admin suspends this shop, immediately lock the screen!
        if (shop.status === "suspended") {
          return (
            <div
              style={{
                minHeight: "100vh",
                background: "#090d16",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                fontFamily: "var(--font-sans, system-ui, sans-serif)",
                color: "#f8fafc",
              }}
            >
              <div
                style={{
                  maxWidth: "500px",
                  width: "100%",
                  background: "#0f172a",
                  border: "2px solid #ef4444",
                  borderRadius: "8px",
                  padding: "38px 30px",
                  textAlign: "center",
                  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(239, 68, 68, 0.25)",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "2px solid #ef4444",
                    color: "#f87171",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}
                  className="admin-pulse-red"
                >
                  <ShieldAlert size={36} />
                </div>

                <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
                  Branch Access Suspended
                </h1>

                <div
                  style={{
                    background: "#1e293b",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#fde047",
                    marginBottom: "16px",
                  }}
                >
                  <Store size={15} />
                  <span>{shop.name}</span>
                </div>

                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, margin: "0 0 24px" }}>
                  Your store management access has been temporarily suspended by the platform Super Admin.
                  Orders, kitchen display, and table QR operations are currently paused.
                  <br />
                  Please contact platform administration to reactivate your store.
                </p>

                <form action={adminLogout}>
                  <button
                    type="submit"
                    style={{
                      padding: "11px 28px",
                      borderRadius: "5px",
                      background: "#ef4444",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 10px rgba(239, 68, 68, 0.35)",
                    }}
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          );
        }
      }
    } catch {
      // Fallback
    }
  }

  let availableShops: { id: number; name: string; slug: string }[] = [];
  if (isServiceRoleConfigured()) {
    try {
      availableShops = await dbCache.wrap(
        "shops:active-list",
        async () => {
          const db = createAdminClient();
          const { data: shopsData } = await db
            .from("shops")
            .select("id, name, slug")
            .eq("status", "active")
            .order("name", { ascending: true });
          return (shopsData as { id: number; name: string; slug: string }[]) || [];
        },
        { ttlSeconds: 180, tags: ["shops"] }
      );
    } catch {}
  }

  const [activeContext, branding, businessProfile] = await Promise.all([
    getActiveShopContext(),
    getShopBranding(shopIdNum),
    getShopBusinessProfile(shopIdNum),
  ]);

  return (
    <AdminShell
      shopName={shopName}
      shopStatus={shopStatus}
      ownerName={ownerName}
      shopSlug={shopSlug}
      shopId={shopIdNum}
      availableShops={availableShops}
      userRole={activeContext.role}
      staffName={activeContext.staffName}
      canCancelOrders={activeContext.canCancelOrders}
      logoUrl={branding.logo_url}
      businessType={businessProfile.business_type}
    >
      {children}
    </AdminShell>
  );
}
