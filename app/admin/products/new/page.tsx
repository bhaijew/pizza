import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import ProductForm from "@/components/admin/ProductForm";
import type { Category } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const db = createAdminClient();

  const [{ data: categories }, settings] = await Promise.all([
    db.from("categories").select("*").order("sort_order", { ascending: true }),
    fetchSettings(),
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
