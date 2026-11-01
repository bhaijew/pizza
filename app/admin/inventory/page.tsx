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

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; product?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let prodQuery = db.from("products").select("*, category:categories(*)").order("name", { ascending: true });
  let catQuery = db.from("categories").select("*").order("sort_order", { ascending: true });

  if (activeShop.shopId) {
    prodQuery = prodQuery.or(`shop_id.eq.${activeShop.shopId},shop_id.is.null`);
    catQuery = catQuery.or(`shop_id.eq.${activeShop.shopId},shop_id.is.null`);
  }

  const [
    { data: products },
    { data: categories },
    settings,
    rawIngRes,
    wastageRes,
    auditsRes,
    { data: existingRecipes },
  ] = await Promise.all([
    prodQuery,
    catQuery,
    fetchSettings(activeShop.shopId),
    getRawIngredients(),
    getWastageLogs(),
    getStockAudits(),
    db.from("product_recipes").select("product_id"),
  ]);

  const configuredRecipeProductIds = Array.from(
    new Set((existingRecipes || []).map((r: any) => Number(r.product_id)).filter(Boolean))
  );

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
      initialTab={(resolvedParams?.tab as any) || "recipes"}
      initialSelectedProductId={resolvedParams?.product ? Number(resolvedParams.product) : undefined}
      configuredRecipeProductIds={configuredRecipeProductIds}
    />
  );
}
