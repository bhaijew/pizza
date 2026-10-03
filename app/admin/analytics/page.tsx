import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sales Analytics & Reports | Admin",
  description: "Visual sales analytics, revenue trend charts, and CSV report export.",
};

export default async function AdminAnalyticsPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let ordersQuery = db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

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
    <AnalyticsDashboard
      orders={(orders as Order[]) || []}
      currencySymbol={settings.currency_symbol || "Rs."}
      shopName={activeShop.shopName}
    />
  );
}
