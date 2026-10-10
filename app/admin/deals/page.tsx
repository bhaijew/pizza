import { createAdminClient } from "@/utils/supabase/admin";
import { getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import { fetchDeals } from "@/lib/deal-actions";
import DealManager from "@/components/admin/DealManager";

export const dynamic = "force-dynamic";

interface AdminDealsPageProps {
  searchParams?: Promise<{ shop_id?: string }>;
}

export default async function AdminDealsPage({ searchParams }: AdminDealsPageProps) {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();
  const sParams = searchParams ? await searchParams : {};

  // If query parameter shop_id is explicitly provided and valid, use it; otherwise use activeShop context
  let effectiveShopId = activeShop.shopId;
  if (activeShop.isMasterAdmin && sParams?.shop_id) {
    const parsed = parseInt(sParams.shop_id, 10);
    if (!isNaN(parsed)) {
      effectiveShopId = parsed;
    }
  }

  // Fetch deals, available shops, and currency settings
  const [{ data: deals }, { data: allShops }, settings] = await Promise.all([
    fetchDeals(effectiveShopId),
    db.from("shops").select("id, name, slug").eq("status", "active").order("name"),
    fetchSettings(effectiveShopId),
  ]);

  // Derive effective shop name
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
            Special Deals & Combos
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
          Manage bundle deals, pizza combos, and discounted offers for{" "}
          <strong>{effectiveShopName}</strong>. Deals automatically sync to your menu and online ordering.
        </p>
      </div>

      <DealManager
        initialDeals={deals || []}
        currentShopId={effectiveShopId}
        currentShopName={effectiveShopName}
        isMasterAdmin={activeShop.isMasterAdmin}
        availableShops={(allShops as { id: number; name: string; slug: string }[]) || []}
        currencySymbol={settings?.currency_symbol || "Rs."}
      />
    </div>
  );
}
