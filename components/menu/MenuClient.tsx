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
import ProductDetailSheet from "./ProductDetailSheet";
import CartSheet from "./CartSheet";
import CheeziousLayout from "./layouts/CheeziousLayout";
import KfcLayout from "./layouts/KfcLayout";
import McDonaldsLayout from "./layouts/McDonaldsLayout";

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

  // Fast-food layouts (KFC, Cheezious, McDonald's) provide their own dedicated app header
  const isDedicatedAppLayout =
    settings.menu_layout === "kfc" ||
    settings.menu_layout === "cheezious" ||
    settings.menu_layout === "mcdonalds";

  return (
    <>
      {!isDedicatedAppLayout && (
        <MenuHeader
          onCartOpen={() => setCartOpen(true)}
          shopName={settings.shop_name}
          verifiedTable={currentVerifiedTable}
          logoUrl={settings.logo_url}
        />
      )}

      {settings.menu_layout === "kfc" ? (
        <KfcLayout
          categories={categories}
          products={products}
          filteredProducts={filteredProducts}
          categoriesError={categoriesError}
          productsError={productsError}
          tableMissing={tableMissing}
          hasError={hasError}
          settings={settings}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          currentVerifiedTable={currentVerifiedTable}
          onCartOpen={() => setCartOpen(true)}
        />
      ) : settings.menu_layout === "mcdonalds" ? (
        <McDonaldsLayout
          categories={categories}
          products={products}
          filteredProducts={filteredProducts}
          categoriesError={categoriesError}
          productsError={productsError}
          tableMissing={tableMissing}
          hasError={hasError}
          settings={settings}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          currentVerifiedTable={currentVerifiedTable}
          onCartOpen={() => setCartOpen(true)}
        />
      ) : (
        <CheeziousLayout
          categories={categories}
          products={products}
          filteredProducts={filteredProducts}
          categoriesError={categoriesError}
          productsError={productsError}
          tableMissing={tableMissing}
          hasError={hasError}
          settings={settings}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          currentVerifiedTable={currentVerifiedTable}
          onCartOpen={() => setCartOpen(true)}
        />
      )}

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
