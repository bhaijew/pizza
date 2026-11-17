import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import SalesReportManager from "@/components/admin/SalesReportManager";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "15 & 30 Days Sales Report | Admin",
  description: "Detailed 15-day and 30-day sales audit, channel distribution, and day-by-day revenue.",
};

export default async function SalesReportPage() {
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

  if (activeShop.shopCreatedAt) {
    ordersQuery = ordersQuery.gte("created_at", activeShop.shopCreatedAt);
  }

  const [{ data: orders }, settings] = await Promise.all([
    ordersQuery,
    fetchSettings(activeShop.shopId ?? null),
  ]);

  return (
    <SalesReportManager
      orders={(orders as Order[]) || []}
      currencySymbol={settings?.currency_symbol || "Rs."}
      shopName={activeShop.shopName}
    />
  );
}
