import { Suspense } from "react";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import ProductManager from "@/components/admin/ProductManager";
import type { Product, Category } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let prodQuery = db
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .order("sort_order", { ascending: true });

  let catQuery = db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (activeShop.shopId) {
    prodQuery = prodQuery.eq("shop_id", activeShop.shopId);
    catQuery = catQuery.eq("shop_id", activeShop.shopId);
  } else {
    prodQuery = prodQuery.is("shop_id", null);
    catQuery = catQuery.is("shop_id", null);
  }

  // Fetch all products, categories, and settings
  const [{ data: products }, { data: categories }, settings] = await Promise.all([
    prodQuery,
    catQuery,
    fetchSettings(),
  ]);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            margin: "0 0 4px",
          }}
        >
          Menu Products
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Add, edit, adjust prices, change ingredients, and toggle out-of-stock items in real time.
        </p>
      </div>

      <Suspense fallback={<div style={{ color: "#64748b" }}>Loading product catalog...</div>}>
        <ProductManager
          initialProducts={(products as Product[]) || []}
          categories={(categories as Category[]) || []}
          currencySymbol={settings.currency_symbol || "$"}
        />
      </Suspense>
    </div>
  );
}
