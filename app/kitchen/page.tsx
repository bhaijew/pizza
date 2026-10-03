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

export default async function FullscreenKitchenPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let ordersQuery = db
    .from("orders")
    .select("*")
    .in("status", ["received", "preparing"])
    .order("created_at", { ascending: true });

  if (activeShop.shopId) {
    ordersQuery = ordersQuery.eq("shop_id", activeShop.shopId);
  } else {
    ordersQuery = ordersQuery.is("shop_id", null);
  }

  const [{ data: orders }, settings] = await Promise.all([
    ordersQuery,
    fetchSettings(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 md:p-5">
      <KitchenDisplay
        initialOrders={(orders as Order[]) || []}
        shopName={settings.shop_name || "Pizza Kitchen"}
      />
    </div>
  );
}
