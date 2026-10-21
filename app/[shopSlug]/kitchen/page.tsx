import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings, fetchShopBySlugOrId } from "@/lib/menu-data";
import {
  ADMIN_COOKIE,
  ADMIN_SHOP_COOKIE,
  ADMIN_SHOP_NAME_COOKIE,
  ADMIN_ROLE_COOKIE,
  verifySessionToken,
} from "@/lib/admin-auth";
import KitchenDisplay from "@/components/admin/KitchenDisplay";
import KitchenBranchLockScreen from "@/components/admin/KitchenBranchLockScreen";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

interface BranchKitchenPageProps {
  params: Promise<{ shopSlug: string }>;
}

export async function generateMetadata({
  params,
}: BranchKitchenPageProps): Promise<Metadata> {
  const { shopSlug } = await params;
  const shop = await fetchShopBySlugOrId(shopSlug);

  return {
    title: shop ? `${shop.name} — Kitchen Display (KDS)` : "Kitchen Display System",
    description: "Live real-time kitchen preparation queue for branch orders",
    robots: { index: false, follow: false },
  };
}

export default async function BranchKitchenPage({ params }: BranchKitchenPageProps) {
  const { shopSlug } = await params;
  const shop = await fetchShopBySlugOrId(shopSlug);

  if (!shop) {
    notFound();
  }

  // ─── STRICT BRANCH SECURITY CHECK ─────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const isSessionValid = token ? await verifySessionToken(token) : false;

  const sessionShopIdStr = cookieStore.get(ADMIN_SHOP_COOKIE)?.value;
  const sessionShopName = cookieStore.get(ADMIN_SHOP_NAME_COOKIE)?.value || "Other Branch";
  const sessionRole = cookieStore.get(ADMIN_ROLE_COOKIE)?.value || "staff";

  // Case 1: Not logged in or invalid token
  if (!isSessionValid) {
    return (
      <KitchenBranchLockScreen
        targetShop={{ id: shop.id, name: shop.name, slug: shop.slug }}
      />
    );
  }

  // Case 2: Cross-Branch Mismatch (Logged in to a different branch)
  // If sessionShopId is present and does NOT match this shop's ID, prohibit access!
  if (sessionShopIdStr) {
    const sessionShopId = parseInt(sessionShopIdStr, 10);
    if (!isNaN(sessionShopId) && sessionShopId !== Number(shop.id)) {
      return (
        <KitchenBranchLockScreen
          targetShop={{ id: shop.id, name: shop.name, slug: shop.slug }}
          currentSession={{
            shopId: sessionShopId,
            shopName: sessionShopName,
            role: sessionRole,
          }}
          isCrossBranchMismatch={true}
        />
      );
    }
  }

  // ─── AUTHORIZED FOR THIS BRANCH ────────────────────────────────
  const db = createAdminClient();

  const [{ data: orders }, settings] = await Promise.all([
    db
      .from("orders")
      .select("*")
      .eq("shop_id", shop.id)
      .in("status", ["confirmed", "preparing"])
      .order("created_at", { ascending: true }),
    fetchSettings(shop.id),
  ]);

  const resolvedShopName = shop.name || settings.shop_name || "Pizza Kitchen";
  const resolvedAddress = shop.branch_address || (settings as any).shop_address || "Food Street";
  const resolvedPhone = shop.owner_phone || (settings as any).shop_phone || "0300-1234567";
  const resolvedCurrency = shop.currency_symbol || settings.currency_symbol || "Rs.";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-2 sm:p-4">
      <KitchenDisplay
        initialOrders={(orders as Order[]) || []}
        shopName={resolvedShopName}
        shopId={shop.id}
        shopSlug={shop.slug}
        shopInfo={{
          name: resolvedShopName,
          address: resolvedAddress,
          phone: resolvedPhone,
          currencySymbol: resolvedCurrency,
          slug: shop.slug,
        }}
        isStandalone={true}
      />
    </div>
  );
}
