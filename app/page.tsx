/**
 * Menu Page — Server Component
 * Fetches real data from Supabase (categories, products, settings).
 * Isolated per shop branch — no shared/fake content.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchCategories, fetchProducts, fetchSettings, fetchShopBySlugOrId } from "@/lib/menu-data";
import MenuClient from "@/components/menu/MenuClient";
import MenuSkeleton from "@/components/menu/MenuSkeleton";

export const dynamic = "force-dynamic";

interface MenuPageProps {
  searchParams: Promise<{ shop?: string; branch?: string }>;
}

export async function generateMetadata({ searchParams }: MenuPageProps): Promise<Metadata> {
  const { shop, branch } = await searchParams;
  const shopQuery = shop || branch;
  let targetShopId: number | null | undefined = undefined;

  if (shopQuery) {
    const shopRecord = await fetchShopBySlugOrId(shopQuery);
    if (shopRecord) {
      targetShopId = shopRecord.id;
    }
  }

  const settings = await fetchSettings(targetShopId);
  return {
    title: settings.meta_title,
    description: settings.meta_description,
  };
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const { shop, branch } = await searchParams;
  const shopQuery = shop || branch;
  let targetShopId: number | null | undefined = undefined;

  if (shopQuery) {
    const shopRecord = await fetchShopBySlugOrId(shopQuery);
    if (shopRecord) {
      targetShopId = shopRecord.id;
    }
  }

  const [categoriesResult, productsResult, settings] = await Promise.all([
    fetchCategories(targetShopId),
    fetchProducts(null, targetShopId),
    fetchSettings(targetShopId),
  ]);

  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px" }}>
          <MenuSkeleton />
        </div>
      }
    >
      <MenuClient
        categories={categoriesResult.data ?? []}
        products={productsResult.data ?? []}
        categoriesError={categoriesResult.error}
        productsError={productsResult.error}
        categoriesTableMissing={categoriesResult.tableMissing}
        productsTableMissing={productsResult.tableMissing}
        settings={settings}
      />
    </Suspense>
  );
}
