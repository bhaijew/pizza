import type { Metadata } from "next";
import { getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import { createAdminClient } from "@/utils/supabase/admin";
import OrderSearchLookup from "@/components/admin/OrderSearchLookup";
import type { Order } from "@/types/menu";

export const metadata: Metadata = {
  title: "Order Lookup & Finance Search | Admin",
  description: "Search and audit orders by ORD- number, phone, token, and view detailed financial invoices.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrderLookupPage() {
  const activeShop = await getActiveShopContext();
  const db = createAdminClient();

  let query = db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (activeShop.shopId) {
    query = query.eq("shop_id", activeShop.shopId);
  }

  const [{ data: initialOrders }, settings] = await Promise.all([
    query,
    fetchSettings(activeShop.shopId),
  ]);

  return (
    <div style={{ width: "100%" }}>
      <OrderSearchLookup
        initialOrders={(initialOrders as Order[]) || []}
        currencySymbol={settings.currency_symbol || "Rs."}
        shopName={activeShop.shopName || settings.shop_name || "Pizza Store"}
        shopSlug={activeShop.shopSlug}
        shopId={activeShop.shopId}
        shopAddress={(settings as any).shop_address || "Main Boulevard, Food Street"}
        shopPhone={(settings as any).shop_phone || "0300-1234567"}
      />
    </div>
  );
}
