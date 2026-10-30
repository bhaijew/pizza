import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext, getShopMenuProducts } from "@/lib/admin-actions";
import OrderRecreateFullPage from "./OrderRecreateFullPage";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecreateOrderPage({ params }: Props) {
  const { id } = await params;
  const orderId = Number(id);
  if (!orderId || isNaN(orderId)) {
    notFound();
  }

  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  const [{ data: order }, settings] = await Promise.all([
    db.from("orders").select("*").eq("id", orderId).maybeSingle(),
    fetchSettings(),
  ]);

  if (!order) {
    notFound();
  }

  // Fetch shop products with categories and size variations
  const products = await getShopMenuProducts(order.shop_id ?? activeShop.shopId);

  return (
    <OrderRecreateFullPage
      order={order as Order}
      initialProducts={products}
      currencySymbol={settings.currency_symbol || "Rs."}
      shopId={order.shop_id ?? activeShop.shopId}
    />
  );
}

