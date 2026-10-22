"use client";

import React from "react";
import type { Category, Product } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";
import HeroSection from "../HeroSection";
import MenuPromoSlider from "../MenuPromoSlider";
import CategoryTabs from "../CategoryTabs";
import ProductCard from "../ProductCard";
import MenuEmptyState from "../MenuEmptyState";
import MenuErrorState from "../MenuErrorState";

interface ClassicLayoutProps {
  categories: Category[];
  products: Product[];
  filteredProducts: Product[];
  categoriesError: string | null;
  productsError: string | null;
  tableMissing: boolean;
  hasError: boolean;
  settings: ShopSettings;
  activeCategoryId: string | number | null;
  setActiveCategoryId: (id: string | number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  currentVerifiedTable?: string;
}

export default function ClassicLayout({
  categories,
  products,
  filteredProducts,
  categoriesError,
  productsError,
  tableMissing,
  hasError,
  settings,
  activeCategoryId,
  setActiveCategoryId,
  searchQuery,
  setSearchQuery,
  setSelectedProduct,
  currentVerifiedTable,
}: ClassicLayoutProps) {
  return (
    <div className="menu-layout-classic">
      <HeroSection
        verifiedTable={currentVerifiedTable}
        themeColor={settings?.theme_color || "#991b1b"}
        settings={settings}
      />

      {/* Featured Deals & Promo Banner Slider */}
      {settings?.slider_enabled !== false && (
        <div style={{ marginTop: "12px", marginBottom: "4px" }}>
          <MenuPromoSlider
            slides={
              Array.isArray(settings?.slider_images)
                ? (settings.slider_images as any)
                : typeof settings?.slider_images === "string"
                ? JSON.parse(settings.slider_images)
                : undefined
            }
            mobileHeight={settings?.slider_height_mobile || 180}
            themeColor={settings?.theme_color || "#ea580c"}
          />
        </div>
      )}

      {/* Menu section */}
      <section
        id="menu"
        aria-label="Menu"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(16px, 2.5vw, 32px) clamp(12px, 2vw, 20px) 60px",
        }}
      >
        {/* Section Heading & Category Filter Header */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
            borderBottom: "1px solid #fed7aa",
            paddingBottom: 14,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "clamp(20px, 3.5vw, 28px)",
                  color: "#0f172a",
                  margin: 0,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                {settings?.menu_title || "Our Menu"}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 3,
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fde68a",
                }}
              >
                {products.length} Items
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#9a3412", margin: 0, fontWeight: 500 }}>
              Select an item to view details or add directly to your order.
            </p>
          </div>
        </div>

        {/* Error state */}
        {hasError && (
          <MenuErrorState
            tableMissing={tableMissing}
            message={productsError ?? categoriesError ?? undefined}
          />
        )}

        {/* Normal state */}
        {!hasError && (
          <>
            {/* Category tabs + Search bar */}
            <div style={{ marginBottom: 24 }}>
              <CategoryTabs
                categories={categories}
                activeId={activeCategoryId}
                onSelect={setActiveCategoryId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalCount={products.length}
              />
            </div>

            {/* Product grid — 2 Products Per Row */}
            {filteredProducts.length === 0 ? (
              <MenuEmptyState
                message={
                  searchQuery
                    ? `No items matching "${searchQuery}".`
                    : activeCategoryId !== null
                    ? "No items available in this category."
                    : "No menu items available right now."
                }
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "clamp(12px, 2vw, 24px)",
                }}
                className="stagger-children"
              >
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={idx}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Powered by Sole-What Brand Footer */}
      <footer
        style={{
          marginTop: "40px",
          padding: "24px 16px 40px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          borderTop: "1px dashed rgba(148, 163, 184, 0.3)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: "0.02em",
          }}
        >
          <span>Powered by</span>
          <span
            style={{
              color: settings?.theme_color || "#10b981",
              fontWeight: 900,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Sole-What
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
          Smart Restaurant POS &amp; Cloud Digital Menu
        </div>
      </footer>
    </div>
  );
}
