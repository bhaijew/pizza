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
import { createClient } from "@/utils/supabase/client";

import { CartProvider, useCart } from "./CartContext";
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

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("deal")) return "🎁";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger")) return "🍔";
  if (n.includes("fries")) return "🍟";
  if (n.includes("shawarma")) return "🌯";
  if (n.includes("paratha")) return "🫓";
  if (n.includes("pasta")) return "🍝";
  if (n.includes("sauce")) return "🥫";
  if (n.includes("drink") || n.includes("bottle") || n.includes("water")) return "🥤";
  return "🍽️";
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
  const { totalItems, totalPrice, formatPrice } = useCart();

  // ─── Realtime Live Products (Instant Price Updates from Any System) ─
  const [liveProducts, setLiveProducts] = useState<Product[]>(products);

  useEffect(() => {
    setLiveProducts(products);
  }, [products]);

  // Keep selectedProduct in sync if its price or details change while detail sheet is open
  useEffect(() => {
    if (selectedProduct) {
      const fresh = liveProducts.find((p) => p.id === selectedProduct.id);
      if (fresh && (fresh.price !== selectedProduct.price || fresh.is_available !== selectedProduct.is_available)) {
        setSelectedProduct(fresh);
      }
    }
  }, [liveProducts, selectedProduct]);

  useEffect(() => {
    const supabase = createClient();
    const shopId = settings?.shop_id;
    const targetShopId = shopId != null ? Number(shopId) : null;
    const channelName = `customer-menu-realtime-${targetShopId ?? "all"}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as any;
            const prodShopId = updated.shop_id != null ? Number(updated.shop_id) : null;
            const isRelevant = targetShopId === null || prodShopId === null || prodShopId === targetShopId;

            if (isRelevant) {
              setLiveProducts((prev) =>
                prev.map((item) =>
                  Number(item.id) === Number(updated.id)
                    ? {
                        ...item,
                        ...updated,
                        price: updated.price != null ? Number(updated.price) : item.price,
                        category: item.category || updated.category,
                      }
                    : item
                )
              );
            }
          } else if (payload.eventType === "INSERT") {
            const inserted = payload.new as any;
            const prodShopId = inserted.shop_id != null ? Number(inserted.shop_id) : null;
            const isRelevant = targetShopId === null || prodShopId === null || prodShopId === targetShopId;

            if (isRelevant) {
              setLiveProducts((prev) => {
                if (prev.some((p) => Number(p.id) === Number(inserted.id))) return prev;
                return [
                  ...prev,
                  {
                    ...inserted,
                    price: inserted.price != null ? Number(inserted.price) : 0,
                  },
                ];
              });
            }
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id?: number };
            if (deleted?.id) {
              setLiveProducts((prev) => prev.filter((p) => Number(p.id) !== Number(deleted.id)));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deals",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const deal = payload.new as any;
            setLiveProducts((prev) =>
              prev.map((item) => {
                const isMatch =
                  (deal.product_id != null && Number(item.id) === Number(deal.product_id)) ||
                  (deal.title && item.name?.toLowerCase() === deal.title.toLowerCase());

                if (isMatch) {
                  return {
                    ...item,
                    price: deal.deal_price != null ? Number(deal.deal_price) : item.price,
                    original_price: deal.original_price != null ? Number(deal.original_price) : item.original_price,
                    badge: deal.badge || item.badge,
                    is_available: deal.is_available !== false,
                  };
                }
                return item;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings?.shop_id]);

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

  // Top Featured Zinger Burgers (highlighted right at the top of All Items)
  const topZingerPicks = useMemo(() => {
    const list = liveProducts.filter((p) => {
      const lower = p.name.toLowerCase();
      return (
        lower === "zinger burger" ||
        lower.includes("zinger burger") ||
        (lower.includes("zinger") &&
          !lower.includes("deal") &&
          !lower.includes("shawarma") &&
          !lower.includes("paratha"))
      );
    });

    // If only 1 zinger found, also add Pizza Burger or Tower Burger so we have 2 top burger picks ("ak do")
    if (list.length < 2) {
      const secondPick = liveProducts.find((p) => {
        const lower = p.name.toLowerCase();
        return (
          (lower.includes("pizza burger") ||
            lower.includes("tower burger") ||
            lower.includes("burger")) &&
          !list.some((item) => item.id === p.id)
        );
      });
      if (secondPick) list.push(secondPick);
    }

    return list.slice(0, 2);
  }, [liveProducts]);

  // When activeCategoryId is null and no search, group products by category
  const categoriesWithProducts = useMemo(() => {
    if (activeCategoryId !== null || searchQuery.trim()) return [];

    return categories
      .map((cat) => {
        const catProducts = liveProducts.filter((p) => p.category_id === cat.id);
        return {
          category: cat,
          products: catProducts,
        };
      })
      .filter((group) => group.products.length > 0);
  }, [categories, liveProducts, activeCategoryId, searchQuery]);

  const activeCategoryObj = useMemo(() => {
    if (activeCategoryId === null) return null;
    return categories.find((c) => c.id === activeCategoryId) || null;
  }, [categories, activeCategoryId]);

  // Filter products by selected category AND search query
  const filteredProducts = useMemo(() => {
    return liveProducts.filter((p) => {
      const matchesCategory =
        activeCategoryId === null || p.category_id === activeCategoryId;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [liveProducts, activeCategoryId, searchQuery]);

  const tableMissing = categoriesTableMissing || productsTableMissing;
  const hasError = !!categoriesError || !!productsError;
  const currentVerifiedTable = verifiedTable || (isDedicatedTableRoute && tableNumber ? tableNumber : undefined);

  if (settings?.menu_layout === "pizzger") {
    return (
      <>
        <PizzgerMenuTheme
          categories={categories}
          products={liveProducts}
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
          shopName={settings.shop_name}
          googleReviewUrl={settings.google_review_url || ""}
          menuProducts={liveProducts}
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

        {/* Full-Width Sticky Category Bar on Desktop & Mobile */}
        <nav
          aria-label="Category Navigation"
          className="sticky top-[64px] z-30 w-full"
          style={{
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid #fed7aa",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              maxWidth: 1380,
              margin: "0 auto",
              padding: "10px clamp(14px, 2.5vw, 32px)",
            }}
          >
            <CategoryTabs
              categories={categories}
              activeId={activeCategoryId}
              onSelect={(id) => {
                setActiveCategoryId(id);
                if (window.scrollY > 380) {
                  const menuEl = document.getElementById("menu");
                  menuEl?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalCount={liveProducts.length}
            />
          </div>
        </nav>

        {/* Menu section */}
        <section
          id="menu"
          aria-label="Menu"
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "clamp(16px, 2.5vw, 32px) clamp(14px, 2.5vw, 32px) 60px",
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
                  {liveProducts.length} Items
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

              {/* Case 1: Search Query is Active */}
              {searchQuery.trim() ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                      padding: "10px 14px",
                      background: "#fffbeb",
                      borderRadius: 8,
                      border: "1px solid #fde68a",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
                      Search results for &ldquo;{searchQuery}&rdquo; ({filteredProducts.length} items)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#b45309",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Clear Search ✕
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <MenuEmptyState message={`No items matching "${searchQuery}".`} />
                  ) : (
                    <div className="menu-products-grid stagger-children">
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
                </div>
              ) : activeCategoryId !== null ? (
                /* Case 2: Specific Category Filtered View */
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 20,
                      paddingBottom: 12,
                      borderBottom: "2px solid #fed7aa",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>
                        {activeCategoryObj ? getCategoryIcon(activeCategoryObj.name) : "🍽️"}
                      </span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "clamp(18px, 3vw, 22px)",
                              fontWeight: 800,
                              color: "#0f172a",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {activeCategoryObj?.name || "Category Items"}
                          </h3>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: "#ffedd5",
                              color: "#c2410c",
                              border: "1px solid #fed7aa",
                            }}
                          >
                            {filteredProducts.length} items
                          </span>
                        </div>
                        {activeCategoryObj?.description && (
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                            {activeCategoryObj.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveCategoryId(null)}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#c2410c",
                        background: "#ffedd5",
                        border: "1px solid #fdba74",
                        padding: "6px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      ← Show All Categories
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <MenuEmptyState message="No items available in this category." />
                  ) : (
                    <div className="menu-products-grid stagger-children">
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
                </div>
              ) : (
                /* Case 3: "All Items" Tab (Category-Wise Grouped + Top Zinger Spotlight) */
                <div>
                  {/* TOP SPOTLIGHT: 1-2 Featured Zinger Burgers */}
                  {topZingerPicks.length > 0 && (
                    <div
                      style={{
                        marginBottom: 36,
                        background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 50%, #fef2f2 100%)",
                        borderRadius: 14,
                        padding: "clamp(14px, 2vw, 20px)",
                        border: "2px solid #fed7aa",
                        boxShadow: "0 10px 25px -5px rgba(234, 88, 12, 0.12)",
                      }}
                    >
                      {/* Spotlight Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 8,
                          marginBottom: 16,
                          paddingBottom: 10,
                          borderBottom: "1px dashed #fdba74",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              fontSize: 22,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#ea580c",
                              color: "#fff",
                              boxShadow: "0 4px 10px rgba(234, 88, 12, 0.35)",
                            }}
                          >
                            🍔
                          </span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: "clamp(17px, 2.5vw, 21px)",
                                  fontWeight: 900,
                                  color: "#7c2d12",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                Top Recommended Zingers
                              </h3>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                  padding: "2px 7px",
                                  borderRadius: 4,
                                  background: "#ea580c",
                                  color: "#fff",
                                }}
                              >
                                Hot Sellers 🔥
                              </span>
                            </div>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9a3412", fontWeight: 500 }}>
                              Freshly prepared, ultra-crispy fillets with signature house sauce!
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const burgerCat = categories.find((c) =>
                              c.name.toLowerCase().includes("burger")
                            );
                            if (burgerCat) setActiveCategoryId(burgerCat.id);
                          }}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#c2410c",
                            background: "#ffffff",
                            border: "1px solid #fed7aa",
                            padding: "5px 12px",
                            borderRadius: 6,
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          View All Burgers →
                        </button>
                      </div>

                      {/* Top Zinger Cards Grid */}
                      <div className="menu-spotlight-grid">
                        {topZingerPicks.map((product, idx) => (
                          <ProductCard
                            key={`top-zinger-${product.id}`}
                            product={product}
                            index={idx}
                            onSelect={setSelectedProduct}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category-Wise Sections */}
                  {categoriesWithProducts.map(({ category, products: catProducts }) => (
                    <section
                      key={category.id}
                      id={`category-section-${category.id}`}
                      style={{
                        marginBottom: 40,
                        scrollMarginTop: 100,
                      }}
                    >
                      {/* Category Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 16,
                          paddingBottom: 10,
                          borderBottom: "2px solid #fed7aa",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{getCategoryIcon(category.name)}</span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: "clamp(18px, 2.5vw, 22px)",
                                  fontWeight: 800,
                                  color: "#0f172a",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {category.name}
                              </h3>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                  background: "#ffedd5",
                                  color: "#c2410c",
                                  border: "1px solid #fed7aa",
                                }}
                              >
                                {catProducts.length} items
                              </span>
                            </div>
                            {category.description && (
                              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quick Filter button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCategoryId(category.id);
                            window.scrollTo({ top: 380, behavior: "smooth" });
                          }}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: settings?.theme_color || "#c2410c",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: 4,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          Only {category.name} &rarr;
                        </button>
                      </div>

                      {/* Responsive Products Grid */}
                      <div className="menu-products-grid stagger-children">
                        {catProducts.map((product, idx) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            index={idx}
                            onSelect={setSelectedProduct}
                          />
                        ))}
                      </div>
                    </section>
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

      {/* Floating Cart Action Button on Desktop & Mobile */}
      {totalItems > 0 && !cartOpen && (
        <aside
          aria-label="Floating cart action"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 45,
            animation: "slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <button
            type="button"
            id="floating-cart-pill-btn"
            onClick={() => setCartOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 22px",
              borderRadius: 9999,
              background: "linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f59e0b 100%)",
              color: "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              boxShadow: "0 12px 32px -4px rgba(220, 38, 38, 0.45), 0 4px 12px rgba(0, 0, 0, 0.12)",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              fontFamily: "var(--font-display)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 18px 36px -4px rgba(220, 38, 38, 0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 12px 32px -4px rgba(220, 38, 38, 0.45), 0 4px 12px rgba(0, 0, 0, 0.12)";
            }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -10,
                  background: "#ffffff",
                  color: "#dc2626",
                  fontSize: 11,
                  fontWeight: 900,
                  width: 19,
                  height: 19,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
                }}
              >
                {totalItems}
              </span>
            </div>

            <div style={{ textAlign: "left", lineHeight: 1.15 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.92, fontWeight: 700 }}>
                {totalItems} {totalItems === 1 ? "Item" : "Items"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>
                {formatPrice(totalPrice)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                paddingLeft: 10,
                borderLeft: "1px solid rgba(255, 255, 255, 0.35)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              <span>View Cart</span>
              <span>&rarr;</span>
            </div>
          </button>
        </aside>
      )}

      {/* Product Detail Modal (Opens in Center on Desktop, Bottom Sheet on Mobile) */}
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
        shopName={settings.shop_name}
        googleReviewUrl={settings.google_review_url || ""}
        menuProducts={liveProducts}
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
