import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import ProductForm from "@/components/admin/ProductForm";
import type { Category } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let catQuery = db.from("categories").select("*").order("sort_order", { ascending: true });
  if (activeShop.shopId) {
    catQuery = catQuery.eq("shop_id", activeShop.shopId);
  } else {
    catQuery = catQuery.is("shop_id", null);
  }

  const [{ data: categories }, settings] = await Promise.all([
    catQuery,
    fetchSettings(activeShop.shopId),
  ]);

  return (
    <div>
      <ProductForm
        categories={(categories as Category[]) || []}
        currencySymbol={settings.currency_symbol || "$"}
      />
    </div>
  );
}
