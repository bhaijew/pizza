import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import { getRawIngredients, getWastageLogs, getStockAudits } from "@/lib/recipe-actions";
import InventoryManager from "@/components/admin/InventoryManager";
import type { Product, Category } from "@/types/menu";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recipe, Raw Materials & Inventory | Admin",
  description: "Complete restaurant recipe management, raw materials BOM, and chef wastage tracking.",
};

export default async function AdminInventoryPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let prodQuery = db.from("products").select("*, category:categories(*)").order("name", { ascending: true });
  let catQuery = db.from("categories").select("*").order("sort_order", { ascending: true });

  if (activeShop.shopId) {
    prodQuery = prodQuery.eq("shop_id", activeShop.shopId);
    catQuery = catQuery.eq("shop_id", activeShop.shopId);
  } else {
    prodQuery = prodQuery.is("shop_id", null);
    catQuery = catQuery.is("shop_id", null);
  }

  const [
    { data: products },
    { data: categories },
    settings,
    rawIngRes,
    wastageRes,
    auditsRes,
  ] = await Promise.all([
    prodQuery,
    catQuery,
    fetchSettings(activeShop.shopId),
    getRawIngredients(),
    getWastageLogs(),
    getStockAudits(),
  ]);

  return (
    <InventoryManager
      products={(products as Product[]) || []}
      categories={(categories as Category[]) || []}
      initialIngredients={rawIngRes.data || []}
      isTableMissing={!!rawIngRes.isTableMissing}
      initialWastageLogs={wastageRes.data || []}
      initialAudits={auditsRes.data || []}
      currencySymbol={settings.currency_symbol || "Rs."}
      shopName={activeShop.shopName}
    />
  );
}
