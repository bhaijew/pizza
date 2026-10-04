import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import ProductForm from "@/components/admin/ProductForm";
import type { Product, Category } from "@/types/menu";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let catQuery = db.from("categories").select("*").order("sort_order", { ascending: true });
  if (activeShop.shopId) {
    catQuery = catQuery.eq("shop_id", activeShop.shopId);
  } else {
    catQuery = catQuery.is("shop_id", null);
  }

  const [{ data: product }, { data: categories }, settings] = await Promise.all([
    db.from("products").select("*").eq("id", id).single(),
    catQuery,
    fetchSettings(activeShop.shopId),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <ProductForm
        initialProduct={product as Product}
        categories={(categories as Category[]) || []}
        currencySymbol={settings.currency_symbol || "$"}
      />
    </div>
  );
}
