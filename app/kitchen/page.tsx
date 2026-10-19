import type { Metadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import KitchenDisplay from "@/components/admin/KitchenDisplay";
import type { Order } from "@/types/menu";

export const metadata: Metadata = {
  title: "Kitchen Display Screen | KDS",
  description: "Live real-time kitchen preparation queue for table and takeaway orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface KitchenPageProps {
  searchParams?: Promise<{ shop?: string }>;
}

export default async function FullscreenKitchenPage({ searchParams }: KitchenPageProps) {
  const sp = searchParams ? await searchParams : {};
  const shopQuery = sp.shop?.trim();

  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let targetShopId: number | null = activeShop.shopId;
  let targetShopName = activeShop.shopName || "Pizza Kitchen";
  let targetShopSlug: string | null = activeShop.shopSlug || null;
  let shopAddress: string | null = null;
  let shopPhone: string | null = null;
  let currencySymbol = "Rs.";

  // If a shop query param is provided (e.g. ?shop=12 or ?shop=peshawar-branch), prioritize it!
  if (shopQuery) {
    const isNum = !isNaN(Number(shopQuery));
    const shopLookup = db.from("shops").select("id, name, slug, branch_address, owner_phone, currency_symbol");
    const { data: matchedShop } = isNum
      ? await shopLookup.eq("id", Number(shopQuery)).maybeSingle()
      : await shopLookup.eq("slug", shopQuery).maybeSingle();

    if (matchedShop) {
      targetShopId = matchedShop.id;
      targetShopName = matchedShop.name;
      targetShopSlug = matchedShop.slug;
      shopAddress = matchedShop.branch_address || null;
      shopPhone = matchedShop.owner_phone || null;
      currencySymbol = matchedShop.currency_symbol || "Rs.";
    } else if (isNum) {
      targetShopId = Number(shopQuery);
    }
  }

  let ordersQuery = db
    .from("orders")
    .select("*")
    .in("status", ["pending", "confirmed", "preparing"])
    .order("created_at", { ascending: true });

  if (targetShopId) {
    ordersQuery = ordersQuery.eq("shop_id", targetShopId);
  } else {
    ordersQuery = ordersQuery.is("shop_id", null);
  }

  const [{ data: orders }, settings] = await Promise.all([
    ordersQuery,
    fetchSettings(),
  ]);

  const resolvedShopName = targetShopName || settings.shop_name || "Pizza Kitchen";
  const resolvedAddress = shopAddress || (settings as any).shop_address || "Food Street";
  const resolvedPhone = shopPhone || (settings as any).shop_phone || "0300-1234567";
  const resolvedCurrency = currencySymbol || settings.currency_symbol || "Rs.";


  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-2 sm:p-4">
      <KitchenDisplay
        initialOrders={(orders as Order[]) || []}
        shopName={resolvedShopName}
        shopId={targetShopId ? Number(targetShopId) : null}
        shopSlug={targetShopSlug}
        shopInfo={{
          name: resolvedShopName,
          address: resolvedAddress,
          phone: resolvedPhone,
          currencySymbol: resolvedCurrency,
          slug: targetShopSlug,
        }}
        isStandalone={true}
      />
    </div>
  );
}

