import type { Metadata } from "next";
import { Suspense } from "react";
import {
  fetchCategories,
  fetchProducts,
  fetchSettings,
  fetchShopBySlugOrId,
} from "@/lib/menu-data";
import { getShopBranding } from "@/lib/shop-branding";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import Menu2Client from "@/components/menu/Menu2Client";
import MenuSkeleton from "@/components/menu/MenuSkeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu 2.0 — Modern Online Ordering",
  description: "Next-generation interactive food ordering menu.",
};

interface Menu2PageProps {
  searchParams: Promise<{
    shop?: string;
    table?: string;
    type?: "dine_in" | "takeaway" | "delivery";
  }>;
}

export default async function Menu2Page({ searchParams }: Menu2PageProps) {
  const params = await searchParams;
  const requestedSlug = params.shop || "pizza-mafia";

  // Fetch available active shops so user can switch branches on localhost easily
  let availableShops: { id: number; name: string; slug: string }[] = [];
  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      const { data: shops } = await db
        .from("shops")
        .select("id, name, slug")
        .eq("status", "active")
        .order("id", { ascending: true });
      if (Array.isArray(shops)) {
        availableShops = shops;
      }
    } catch {
      // ignore
    }
  }

  let shop = await fetchShopBySlugOrId(requestedSlug);
  if (!shop && availableShops.length > 0) {
    shop = await fetchShopBySlugOrId(availableShops[0].slug);
  }

  const targetShopId = shop?.id ?? undefined;

  const [categoriesResult, productsResult, baseSettings, branding] = await Promise.all([
    fetchCategories(targetShopId),
    fetchProducts(null, targetShopId),
    fetchSettings(targetShopId),
    getShopBranding(targetShopId),
  ]);

  const shopSettings = {
    ...baseSettings,
    shop_name: shop?.name || baseSettings.shop_name || "Pizza Mafia",
    menu_title: `${shop?.name || "Pizza Mafia"} Menu`,
    currency_symbol: shop?.currency_symbol || baseSettings.currency_symbol || "Rs.",
    logo_url: branding.logo_url || (shop as any)?.logo_url || baseSettings.logo_url,
    shop_id: shop?.id ?? baseSettings.shop_id,
    menu2_theme:
      (shop as any)?.feature_flags?.menu2_theme || baseSettings.menu2_theme || "ruby_gold",
    menu2_status:
      (shop as any)?.feature_flags?.menu2_status || baseSettings.menu2_status || "locked",
  };

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-10">
          <MenuSkeleton />
        </div>
      }
    >
      <Menu2Client
        categories={categoriesResult.data ?? []}
        products={productsResult.data ?? []}
        settings={shopSettings}
        availableShops={availableShops}
        activeShopSlug={shop?.slug || requestedSlug}
        initialTableNumber={params.table}
        initialOrderType={params.type}
      />
    </Suspense>
  );
}

