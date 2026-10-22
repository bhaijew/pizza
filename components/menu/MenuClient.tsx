"use client";

/**
 * MenuClient — client-side orchestrator for the menu page.
 * Integrated with Table QR Code auto-detection and Dine-In / Takeaway Token flow.
 * Built with Red, Yellow, White & Orange square UI aesthetics.
 */
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Category, Product } from "@/types/menu";
import type { ShopSettings } from "@/lib/menu-data";

import { CartProvider } from "./CartContext";
import MenuHeader from "./MenuHeader";
import HeroSection from "./HeroSection";
import MenuPromoSlider from "./MenuPromoSlider";
import CategoryTabs from "./CategoryTabs";
import ProductCard from "./ProductCard";
import ProductDetailSheet from "./ProductDetailSheet";
import CartSheet from "./CartSheet";
import MenuEmptyState from "./MenuEmptyState";
import MenuErrorState from "./MenuErrorState";
import PizzgerMenuTheme from "./PizzgerMenuTheme";

interface MenuClientProps {
  categories: Category[];
  products: Product[];
  categoriesError: string | null;
  productsError: string | null;
  categoriesTableMissing: boolean;
  productsTableMissing: boolean;
  settings: ShopSettings;
  initialTableNumber?: string;
  initialOrderType?: "dine_in" | "takeaway" | "delivery";
  isDedicatedTableRoute?: boolean;
  verifiedTable?: string;
}

function MenuInner({
  categories,
  products,
  categoriesError,
  productsError,
  categoriesTableMissing,
  productsTableMissing,
  settings,
  initialTableNumber = "",
  initialOrderType,
  isDedicatedTableRoute = false,
  verifiedTable,
}: MenuClientProps) {
  const searchParams = useSearchParams();
  const urlTableParam = searchParams.get("table");

  const [activeCategoryId, setActiveCategoryId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  // Table & Order Type state
  const effectiveInitialTable = verifiedTable || initialTableNumber || urlTableParam || "";
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">(
    initialOrderType || (effectiveInitialTable ? "dine_in" : "takeaway")
  );
  const [tableNumber, setTableNumber] = useState<string>(effectiveInitialTable);

  // Auto-detect if user opens via legacy QR link e.g. /?table=4
  useEffect(() => {
    if (urlTableParam && !initialTableNumber && !verifiedTable) {
      setTableNumber(urlTableParam);
      setOrderType("dine_in");
    }
  }, [urlTableParam, initialTableNumber, verifiedTable]);

  // Filter products by selected category AND search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategoryId === null || p.category_id === activeCategoryId;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategoryId, searchQuery]);

  const tableMissing = categoriesTableMissing || productsTableMissing;
  const hasError = !!categoriesError || !!productsError;
  const currentVerifiedTable = verifiedTable || (isDedicatedTableRoute && tableNumber ? tableNumber : undefined);

  if (settings?.menu_layout === "pizzger") {
    return (
      <>
        <PizzgerMenuTheme
          categories={categories}
          products={products}
          settings={settings}
          onSelectProduct={setSelectedProduct}
          onOpenCart={() => setCartOpen(true)}
          verifiedTable={currentVerifiedTable}
        />

        {/* Product Detail Modal (Opens at Bottom) */}
        <ProductDetailSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        {/* Cart Drawer with Table & Token checkout */}
        <CartSheet
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          orderType={orderType}
          setOrderType={setOrderType}
          isDedicatedTableRoute={isDedicatedTableRoute}
          shopId={settings.shop_id}
          googleReviewUrl={settings.google_review_url || ""}
        />
      </>
    );
  }

  return (
    <>
      <MenuHeader
        onCartOpen={() => setCartOpen(true)}
        shopName={settings.shop_name}
        verifiedTable={currentVerifiedTable}
        logoUrl={settings.logo_url}
      />

      <main id="main-content" style={{ minHeight: "80vh" }}>
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

              {/* Product grid — Strictly 2 Products Per Row */}
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
      </main>

      {/* Product Detail Modal (Opens at Bottom) */}
      <ProductDetailSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Cart Drawer with Table & Token checkout */}
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        orderType={orderType}
        setOrderType={setOrderType}
        isDedicatedTableRoute={isDedicatedTableRoute}
        shopId={settings.shop_id}
        googleReviewUrl={settings.google_review_url || ""}
      />
    </>
  );
}

export default function MenuClient(props: MenuClientProps) {
  return (
    <CartProvider currencySymbol={props.settings.currency_symbol}>
      <MenuInner {...props} />
    </CartProvider>
  );
}
