import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import { fetchDealById } from "@/lib/deal-actions";
import DealForm from "@/components/admin/DealForm";
import type { Deal, Product, Category } from "@/types/menu";

export const dynamic = "force-dynamic";

interface EditDealPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDealPage({ params }: EditDealPageProps) {
  const { id } = await params;
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  // Fetch deal
  const { data: deal } = await fetchDealById(id, activeShop.isMasterAdmin ? undefined : activeShop.shopId);
  if (!deal) {
    notFound();
  }

  // Categories query
  let catQuery = db.from("categories").select("*").order("sort_order", { ascending: true });
  if (activeShop.shopId) {
    catQuery = catQuery.eq("shop_id", activeShop.shopId);
  } else {
    catQuery = catQuery.is("shop_id", null);
  }

  // Products query
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
        initialDeal={deal as Deal}
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
