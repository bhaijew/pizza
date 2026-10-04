import { createAdminClient } from "@/utils/supabase/admin";
import { getActiveShopContext } from "@/lib/admin-actions";
import CategoryManager from "@/components/admin/CategoryManager";
import type { Category } from "@/types/menu";

export const dynamic = "force-dynamic";

interface AdminCategoriesPageProps {
  searchParams?: Promise<{ shop_id?: string }>;
}

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();
  const sParams = searchParams ? await searchParams : {};

  // If query parameter shop_id is explicitly provided and valid, use it; otherwise use activeShop context
  let effectiveShopId = activeShop.shopId;
  if (sParams?.shop_id) {
    const parsed = parseInt(sParams.shop_id, 10);
    if (!isNaN(parsed)) {
      effectiveShopId = parsed;
    }
  }

  let catQuery = db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  let prodQuery = db
    .from("products")
    .select("category_id");

  if (effectiveShopId) {
    catQuery = catQuery.eq("shop_id", effectiveShopId);
    prodQuery = prodQuery.eq("shop_id", effectiveShopId);
  } else {
    catQuery = catQuery.is("shop_id", null);
    prodQuery = prodQuery.is("shop_id", null);
  }

  // Fetch categories, products, and available shops for branch selector/reassignment
  const [{ data: categories }, { data: products }, { data: allShops }] = await Promise.all([
    catQuery,
    prodQuery,
    db.from("shops").select("id, name, slug").eq("status", "active").order("name"),
  ]);

  const productCounts: Record<string | number, number> = {};
  if (products) {
    for (const p of products) {
      if (p.category_id != null) {
        productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
      }
    }
  }

  // Derive current effective shop name
  let effectiveShopName = activeShop.shopName;
  if (effectiveShopId && allShops) {
    const matched = allShops.find((s) => s.id === effectiveShopId);
    if (matched) effectiveShopName = matched.name;
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Menu Categories
          </h1>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "4px",
              background: effectiveShopId ? "#eff6ff" : "#f1f5f9",
              color: effectiveShopId ? "#1d4ed8" : "#475569",
              border: effectiveShopId ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span>{effectiveShopId ? "🏪 Branch:" : "🌐 Platform:"}</span>
            <strong>{effectiveShopName}</strong>
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Create, edit, sort, and manage categories strictly isolated to{" "}
          <strong>{effectiveShopName}</strong>. Categories added here will not show in other branches.
        </p>
      </div>

      <CategoryManager
        initialCategories={(categories as Category[]) || []}
        productCounts={productCounts}
        currentShopId={effectiveShopId}
        currentShopName={effectiveShopName}
        isMasterAdmin={activeShop.isMasterAdmin}
        availableShops={(allShops as { id: number; name: string; slug: string }[]) || []}
      />
    </div>
  );
}
