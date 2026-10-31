import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";
import {
  fetchCategories,
  fetchProducts,
  fetchShopBySlugOrId,
  DEFAULT_SETTINGS,
  DEFAULT_PROMO_SLIDES,
  type ShopSettings,
} from "@/lib/menu-data";
import MenuClient from "@/components/menu/MenuClient";
import Menu2Client from "@/components/menu/Menu2Client";
import MenuSkeleton from "@/components/menu/MenuSkeleton";
import Link from "next/link";

// 30-second ISR edge cache: enables sub-100ms instant page loads
export const revalidate = 30;

const getCachedShop = cache(async (slug: string) => {
  return fetchShopBySlugOrId(slug);
});

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
  "menu2",
  "delivery",
  "todos",
  "riders",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

interface DynamicShopPageProps {
  params: Promise<{ shopSlug: string }>;
  searchParams?: Promise<{ table?: string; type?: "dine_in" | "takeaway" | "delivery" }>;
}

export async function generateMetadata({
  params,
}: DynamicShopPageProps): Promise<Metadata> {
  const { shopSlug } = await params;
  const shop = await getCachedShop(shopSlug);

  if (!shop) {
    if (RESERVED_SLUGS.has(shopSlug.toLowerCase())) {
      return { title: "Not Found" };
    }
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
  const sp = searchParams ? await searchParams : undefined;
  const table = sp?.table;
  const type = sp?.type;

  // 1. Fetch shop by slug (deduplicated with generateMetadata via React cache)
  const shop = await getCachedShop(shopSlug);

  // If slug matches a known reserved system route and no shop exists, defer to notFound()
  if (!shop && RESERVED_SLUGS.has(shopSlug.toLowerCase())) {
    notFound();
  }

  // 2. If shop does not exist in DB
  if (!shop) {
    return (
      <div
        style={{
          minHeight: "100vh",
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
          minHeight: "100vh",
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

  // 4. Shop is active — fetch categories & products concurrently isolated to this shop
  const [categoriesResult, productsResult] = await Promise.all([
    fetchCategories(shop.id),
    fetchProducts(null, shop.id),
  ]);

  let parsedSlides = (shop as any).slider_images;
  if (typeof parsedSlides === "string") {
    try {
      parsedSlides = JSON.parse(parsedSlides);
    } catch {
      parsedSlides = DEFAULT_PROMO_SLIDES;
    }
  }

  const ff =
    (shop as any).feature_flags && typeof (shop as any).feature_flags === "object"
      ? (shop as any).feature_flags
      : {};

  // Build shop settings tailored to this specific shop directly from cached shop row (0 redundant queries!)
  const shopSettings: ShopSettings = {
    ...DEFAULT_SETTINGS,
    shop_name: shop.name,
    menu_title: `${shop.name} Menu`,
    meta_title: `${shop.name} — Fresh Pizzas Online`,
    meta_description: `Order fresh from ${shop.name}${shop.branch_address ? ` (${shop.branch_address})` : ""}.`,
    currency_symbol: shop.currency_symbol || DEFAULT_SETTINGS.currency_symbol || "Rs.",
    shop_id: shop.id,
    owner_phone: (shop as any).owner_phone || null,
    whatsapp_session_id: (shop as any).whatsapp_session_id || null,
    whatsapp_api_key: (shop as any).whatsapp_api_key || null,
    opening_time: (shop as any).opening_time || "11:00",
    closing_time: (shop as any).closing_time || "01:00",
    theme_color: (shop as any).theme_color || DEFAULT_SETTINGS.theme_color || "#ea580c",
    slider_enabled: (shop as any).slider_enabled !== undefined ? (shop as any).slider_enabled : (DEFAULT_SETTINGS.slider_enabled ?? true),
    slider_height_mobile: (shop as any).slider_height_mobile || DEFAULT_SETTINGS.slider_height_mobile || 180,
    slider_images: Array.isArray(parsedSlides) && parsedSlides.length > 0 ? parsedSlides : DEFAULT_PROMO_SLIDES,
    hero_badge_text: (shop as any).hero_badge_text ?? DEFAULT_SETTINGS.hero_badge_text,
    hero_title: (shop as any).hero_title ?? DEFAULT_SETTINGS.hero_title,
    hero_title_highlight: (shop as any).hero_title_highlight ?? DEFAULT_SETTINGS.hero_title_highlight,
    hero_subtitle: (shop as any).hero_subtitle ?? DEFAULT_SETTINGS.hero_subtitle,
    hero_btn_primary_text: (shop as any).hero_btn_primary_text ?? DEFAULT_SETTINGS.hero_btn_primary_text,
    hero_btn_primary_link: (shop as any).hero_btn_primary_link || DEFAULT_SETTINGS.hero_btn_primary_link,
    hero_btn_secondary_text: (shop as any).hero_btn_secondary_text ?? DEFAULT_SETTINGS.hero_btn_secondary_text,
    hero_btn_secondary_link: (shop as any).hero_btn_secondary_link || DEFAULT_SETTINGS.hero_btn_secondary_link,
    hero_chip1_text: (shop as any).hero_chip1_text ?? DEFAULT_SETTINGS.hero_chip1_text,
    hero_chip2_text: (shop as any).hero_chip2_text ?? DEFAULT_SETTINGS.hero_chip2_text,
    hero_chip3_text: (shop as any).hero_chip3_text ?? DEFAULT_SETTINGS.hero_chip3_text,
    hero_show_chips: (shop as any).hero_show_chips !== undefined ? (shop as any).hero_show_chips : DEFAULT_SETTINGS.hero_show_chips,
    hero_bg_type: (shop as any).hero_bg_type || DEFAULT_SETTINGS.hero_bg_type,
    hero_bg_color: (shop as any).hero_bg_color || DEFAULT_SETTINGS.hero_bg_color,
    hero_bg_gradient: (shop as any).hero_bg_gradient || DEFAULT_SETTINGS.hero_bg_gradient,
    hero_bg_image: (shop as any).hero_bg_image || DEFAULT_SETTINGS.hero_bg_image,
    hero_show_pattern: (shop as any).hero_show_pattern !== undefined ? (shop as any).hero_show_pattern : DEFAULT_SETTINGS.hero_show_pattern,
    google_review_url: (shop as any).google_review_url || "",
    logo_url: (shop as any).logo_url || null,
    menu_layout: (shop as any).menu_layout || "default",
    menu2_status: ff.menu2_status || "locked",
    active_menu_template:
      ff.menu2_status === "approved" && ff.active_menu_template === "menu2"
        ? "menu2"
        : "menu1",
    menu2_theme: ff.menu2_theme || "ruby_gold",
  };

  const useMenu2 =
    shopSettings.menu2_status === "approved" && shopSettings.active_menu_template === "menu2";

  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px" }}>
          <MenuSkeleton />
        </div>
      }
    >
      {useMenu2 ? (
        <Menu2Client
          categories={categoriesResult.data ?? []}
          products={productsResult.data ?? []}
          settings={shopSettings}
          activeShopSlug={shop.slug}
          initialTableNumber={table}
          initialOrderType={type}
        />
      ) : (
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
      )}
    </Suspense>
  );
}
