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

// Always render dynamic so admin toggles & real-time updates reflect immediately
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    membership_card_enabled:
      (shop as any)?.feature_flags?.membership_card_enabled !== undefined
        ? Boolean((shop as any)?.feature_flags?.membership_card_enabled)
        : Boolean(baseSettings.membership_card_enabled),
    membership_card_name:
      (shop as any)?.feature_flags?.membership_card_name || baseSettings.membership_card_name || "Family Card",
    membership_card_price:
      (shop as any)?.feature_flags?.membership_card_price !== undefined
        ? Number((shop as any)?.feature_flags?.membership_card_price)
        : Number(baseSettings.membership_card_price) || 499,
    membership_card_validity:
      (shop as any)?.feature_flags?.membership_card_validity || baseSettings.membership_card_validity || "1 Year",
    membership_card_perks:
      (shop as any)?.feature_flags?.membership_card_perks || baseSettings.membership_card_perks || "Buy 1 Get 1 Free on all Pizzas",
    membership_card_bg_image:
      (shop as any)?.feature_flags?.membership_card_bg_image ||
      baseSettings.membership_card_bg_image ||
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    min_delivery_order:
      (shop as any)?.feature_flags?.min_delivery_order !== undefined
        ? Number((shop as any)?.feature_flags?.min_delivery_order)
        : Number(baseSettings.min_delivery_order) || 0,
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

