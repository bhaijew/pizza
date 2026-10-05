import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  fetchCategories,
  fetchProducts,
  fetchSettings,
  fetchShopBySlugOrId,
} from "@/lib/menu-data";
import MenuClient from "@/components/menu/MenuClient";
import MenuSkeleton from "@/components/menu/MenuSkeleton";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Reserved routes that should not be handled by the dynamic shop slug
const RESERVED_SLUGS = new Set([
  "admin",
  "super-admin",
  "kitchen",
  "scan",
  "table",
  "track",
  "api",
  "shop",
  "menu",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

interface DynamicShopPageProps {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<{ table?: string; type?: "dine_in" | "takeaway" | "delivery" }>;
}

export async function generateMetadata({
  params,
}: DynamicShopPageProps): Promise<Metadata> {
  const { shopSlug } = await params;
  if (RESERVED_SLUGS.has(shopSlug.toLowerCase())) {
    return { title: "Not Found" };
  }

  const shop = await fetchShopBySlugOrId(shopSlug);
  if (!shop) {
    return { title: "Shop Not Found" };
  }

  return {
    title: `${shop.name} — Order Online Menu`,
    description: `Browse fresh pizza menu and order directly from ${shop.name}${shop.branch_address ? ` (${shop.branch_address})` : ""}.`,
  };
}

export default async function DynamicShopMenuPage({
  params,
  searchParams,
}: DynamicShopPageProps) {
  const { shopSlug } = await params;
  const { table, type } = await searchParams;

  // If slug matches a known reserved system route, defer to notFound()
  if (RESERVED_SLUGS.has(shopSlug.toLowerCase())) {
    notFound();
  }

  // 1. Fetch shop by slug
  const shop = await fetchShopBySlugOrId(shopSlug);

  // 2. If shop does not exist in DB
  if (!shop) {
    return (
      <div
        style={{
          minHeight: "125vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "24px",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fef2f2",
              color: "#ef4444",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
            Shop Not Found
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px", lineHeight: 1.5 }}>
            We couldn&apos;t find a pizza branch with the link: <br />
            <code style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: "4px", color: "#ef4444", fontWeight: 700 }}>
              /{shopSlug}
            </code>
          </p>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 24px" }}>
            Please check the shop address link with the restaurant or contact support.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#ef4444",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← Back to Main Menu
          </Link>
        </div>
      </div>
    );
  }

  // 3. If shop is suspended by Super Admin
  if (shop.status === "suspended") {
    return (
      <div
        style={{
          minHeight: "125vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff7ed",
          padding: "24px",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: "#ffffff",
            border: "1px solid #fed7aa",
            borderRadius: "8px",
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(234, 88, 12, 0.08)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fff7ed",
              color: "#ea580c",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
            {shop.name} is Temporarily Closed
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 16px", lineHeight: 1.5 }}>
            This branch is currently offline or undergoing scheduled maintenance. Online orders are temporarily paused.
          </p>
          {shop.branch_address && (
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 24px" }}>
              Branch Location: {shop.branch_address}
            </p>
          )}

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#0f172a",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            View Available Branches
          </Link>
        </div>
      </div>
    );
  }

  // 4. Shop is active — fetch categories & products isolated to this shop
  const [categoriesResult, productsResult, baseSettings] = await Promise.all([
    fetchCategories(shop.id),
    fetchProducts(null, shop.id),
    fetchSettings(shop.id),
  ]);

  // Build shop settings tailored to this specific shop
  const shopSettings = {
    ...baseSettings,
    shop_name: shop.name,
    menu_title: `${shop.name} Menu`,
    meta_title: `${shop.name} — Fresh Pizzas Online`,
    meta_description: `Order fresh from ${shop.name}${shop.branch_address ? ` (${shop.branch_address})` : ""}.`,
    currency_symbol: shop.currency_symbol || baseSettings.currency_symbol || "Rs.",
    shop_id: shop.id,
  };

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
        settings={shopSettings}
        initialTableNumber={table}
        initialOrderType={type}
        verifiedTable={table}
      />
    </Suspense>
  );
}
