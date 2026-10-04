import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import InventoryManager from "@/components/admin/InventoryManager";
import type { Product, Category } from "@/types/menu";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventory & Stock Control | Admin",
  description: "Track inventory, low stock thresholds, and quick restock items.",
};

export default async function AdminInventoryPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let prodQuery = db.from("products").select("*").order("name", { ascending: true });
  let catQuery = db.from("categories").select("*").order("sort_order", { ascending: true });

  if (activeShop.shopId) {
    prodQuery = prodQuery.eq("shop_id", activeShop.shopId);
    catQuery = catQuery.eq("shop_id", activeShop.shopId);
  } else {
    prodQuery = prodQuery.is("shop_id", null);
    catQuery = catQuery.is("shop_id", null);
  }

  const [{ data: products }, { data: categories }, settings] = await Promise.all([
    prodQuery,
    catQuery,
    fetchSettings(activeShop.shopId),
  ]);

  return (
    <InventoryManager
      products={(products as Product[]) || []}
      categories={(categories as Category[]) || []}
      currencySymbol={settings.currency_symbol || "Rs."}
      shopName={activeShop.shopName}
    />
  );
}
