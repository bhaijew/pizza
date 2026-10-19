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

  let productsQuery = db
    .from("products")
    .select("id, name, price, is_available, category:categories(name)")
    .eq("is_available", true)
    .order("name", { ascending: true });

  if (activeShop.shopId) {
    productsQuery = productsQuery.eq("shop_id", activeShop.shopId);
  } else {
    productsQuery = productsQuery.is("shop_id", null);
  }

  const [{ data: orders }, settings, { data: products }] = await Promise.all([
    ordersQuery,
    fetchSettings(),
    productsQuery,
  ]);

  const formattedProducts = (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price) || 0,
    category_name: p.category?.name || "General",
    is_available: p.is_available,
  }));

  return (
    <div>
      <OrdersLiveBoard
        initialOrders={(orders as Order[]) || []}
        currencySymbol={settings.currency_symbol || "$"}
        shopId={activeShop.shopId ? Number(activeShop.shopId) : null}
        availableProducts={formattedProducts}
        userRole={activeShop.role}
        canCancelOrders={activeShop.canCancelOrders}
        openingTime={settings.opening_time || "11:00"}
        closingTime={settings.closing_time || "01:00"}
      />
    </div>
  );
}
