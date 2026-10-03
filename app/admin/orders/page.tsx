import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import OrdersLiveBoard from "@/components/admin/OrdersLiveBoard";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let ordersQuery = db.from("orders").select("*").order("created_at", { ascending: false });

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
    <div>
      <OrdersLiveBoard
        initialOrders={(orders as Order[]) || []}
        currencySymbol={settings.currency_symbol || "$"}
      />
    </div>
  );
}
