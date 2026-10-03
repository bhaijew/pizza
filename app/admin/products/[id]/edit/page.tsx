import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import ProductForm from "@/components/admin/ProductForm";
import type { Product, Category } from "@/types/menu";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const db = createAdminClient();

  const [{ data: product }, { data: categories }, settings] = await Promise.all([
    db.from("products").select("*").eq("id", id).single(),
    db.from("categories").select("*").order("sort_order", { ascending: true }),
    fetchSettings(),
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
