import { createAdminClient } from "@/utils/supabase/admin";
import { getActiveShopContext } from "@/lib/admin-actions";
import CategoryManager from "@/components/admin/CategoryManager";
import type { Category } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let catQuery = db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  let prodQuery = db
    .from("products")
    .select("category_id");

  if (activeShop.shopId) {
    catQuery = catQuery.eq("shop_id", activeShop.shopId);
    prodQuery = prodQuery.eq("shop_id", activeShop.shopId);
  } else {
    catQuery = catQuery.is("shop_id", null);
    prodQuery = prodQuery.is("shop_id", null);
  }

  // Fetch categories and product counts
  const [{ data: categories }, { data: products }] = await Promise.all([
    catQuery,
    prodQuery,
  ]);

  const productCounts: Record<string | number, number> = {};
  if (products) {
    for (const p of products) {
      if (p.category_id != null) {
        productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
      }
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            margin: "0 0 4px",
          }}
        >
          Menu Categories
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Create, edit, sort, and manage categories for your pizza shop menu.
        </p>
      </div>

      <CategoryManager
        initialCategories={(categories as Category[]) || []}
        productCounts={productCounts}
      />
    </div>
  );
}
