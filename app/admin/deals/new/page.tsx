import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import DealForm from "@/components/admin/DealForm";
import type { Product, Category } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function NewDealPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  // Strict RBAC: Only Admin can access deal creation page
  if (activeShop.role !== "admin") {
    return (
      <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, textAlign: "center" }}>
        <div
          style={{
            background: "#fff1f2",
            border: "1.5px solid #fecdd3",
            borderRadius: 5,
            padding: 32,
            boxShadow: "0 4px 16px rgba(225, 29, 72, 0.08)",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#9f1239", margin: "0 0 8px" }}>
            Admin Access Required
          </h2>
          <p style={{ fontSize: 14, color: "#be123c", lineHeight: 1.6, margin: "0 0 20px" }}>
            Special Deals and promotional bundles can only be created by <strong>Store Admin</strong>.
            Your current logged-in role is <strong>Staff ({activeShop.staffName})</strong>.
          </p>
          <a
            href="/admin/deals"
            style={{
              display: "inline-block",
              background: "#e11d48",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: 5,
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            ← Back to Deals Catalog
          </a>
        </div>
      </div>
    );
  }

  // Categories query
  let catQuery = db.from("categories").select("*").order("sort_order", { ascending: true });
  if (activeShop.shopId) {
    catQuery = catQuery.eq("shop_id", activeShop.shopId);
  } else {
    catQuery = catQuery.is("shop_id", null);
  }

  // Products query (for the shop's catalog)
  let prodQuery = db
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (activeShop.shopId) {
    prodQuery = prodQuery.eq("shop_id", activeShop.shopId);
  } else {
    prodQuery = prodQuery.is("shop_id", null);
  }

  const [{ data: categories }, { data: products }, settings, { data: allShops }] = await Promise.all([
    catQuery,
    prodQuery,
    fetchSettings(activeShop.shopId),
    db.from("shops").select("id, name, slug").eq("status", "active").order("name"),
  ]);

  return (
    <div>
      <DealForm
        products={(products as Product[]) || []}
        categories={(categories as Category[]) || []}
        currencySymbol={settings?.currency_symbol || "Rs."}
        currentShopId={activeShop.shopId}
        currentShopName={activeShop.shopName}
        isMasterAdmin={activeShop.isMasterAdmin}
        availableShops={(allShops as { id: number; name: string; slug: string }[]) || []}
      />
    </div>
  );
}
