"use client";

/**
 * ProductDetailSheet — square bottom sheet.
 * Slides up from the bottom of the screen when any product is clicked.
 * Clean architectural styling, Red/Yellow/Orange accents, and live pricing.
 */
import { useEffect, useRef, useState } from "react";
import type { Product, ProductVariation, ExtraTopping } from "@/types/menu";
import { useCart } from "./CartContext";
import ImagePlaceholder from "./ImagePlaceholder";

interface ProductDetailSheetProps {
  product: Product | null;
  onClose: () => void;
}

function SheetContent({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem, formatPrice } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const variations = product.variations || [];
  const extraToppings = product.extra_toppings || [];

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(
    variations.length > 0 ? variations[0] : null
  );
  const [selectedToppings, setSelectedToppings] = useState<ExtraTopping[]>([]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isOutOfStock = product.track_inventory && (product.stock_quantity ?? 0) <= 0;
  const isLowStock = product.track_inventory && (product.stock_quantity ?? 0) > 0 && (product.stock_quantity ?? 0) <= (product.low_stock_threshold ?? 5);

  const available =
    product.is_available !== false && product.is_active !== false && !isOutOfStock;

  const unitPrice =
    (selectedVariation ? selectedVariation.price : (product.price ?? 0)) +
    selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);

  const totalPrice = unitPrice * qty;

  const toggleTopping = (topping: ExtraTopping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.name === topping.name);
      if (exists) {
        return prev.filter((t) => t.name !== topping.name);
      }
      return [...prev, topping];
    });
  };

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem(product, undefined, selectedVariation, selectedToppings);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 700);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="overlay-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Container (Docked to the bottom of the screen) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          className="animate-slide-in-up"
          style={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: 600,
            background: "#ffffff",
            borderRadius: "6px 6px 0 0",
            border: "1px solid #fed7aa",
            borderBottom: "none",
            boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.25)",
            maxHeight: "86dvh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top Grab Bar Indicator */}
          <div
            style={{
              paddingTop: 10,
              paddingBottom: 6,
              display: "flex",
              justifyContent: "center",
              background: "#ffffff",
              cursor: "pointer",
            }}
            onClick={onClose}
            aria-hidden="true"
          >
            <div
              style={{
                width: 44,
                height: 4,
                borderRadius: 2,
                background: "#fed7aa",
              }}
            />
          </div>

          {/* Close button (top right) */}
          <button
            id="close-product-sheet-btn"
            onClick={onClose}
            aria-label="Close product detail"
            style={{
              position: "absolute",
              top: 12,
              right: 14,
              width: 30,
              height: 30,
              borderRadius: 4,
              border: "1px solid #fed7aa",
              background: "#fff7ed",
              color: "#c2410c",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff7ed";
              e.currentTarget.style.color = "#c2410c";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Scrollable Sheet Content */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {/* Square Product Image Container */}
            <div
              style={{
                width: "100%",
                height: 200,
                maxHeight: "28vh",
                background: "#fff7ed",
                position: "relative",
                borderBottom: "1px solid #ffedd5",
                overflow: "hidden",
              }}
            >
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <ImagePlaceholder />
              )}

              {product.category?.name && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: 14,
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #fed7aa",
                    color: "#c2410c",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 3,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {product.category.name}
                </div>
              )}
            </div>

            {/* Product Meta & Description */}
            <div style={{ padding: "16px 20px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 19,
                    color: "#0f172a",
                    margin: 0,
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {product.name}
                </h2>
                {product.price != null && (
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      fontSize: 20,
                      color: "#dc2626",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatPrice(unitPrice)}
                  </span>
                )}
              </div>

              {/* Inventory Stock Warning */}
              {isOutOfStock && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 3,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  <span>⚠️ Currently Out of Stock</span>
                </div>
              )}

              {isLowStock && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 3,
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    color: "#b45309",
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  <span>🔥 Only {product.stock_quantity} left in stock!</span>
                </div>
              )}

              {product.description && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#475569",
                    lineHeight: 1.55,
                    margin: "0 0 16px",
                  }}
                >
                  {product.description}
                </p>
              )}

              {/* ─── SIZE / VARIATION SELECTOR ──────────────────────── */}
              {variations.length > 0 && available && (
                <div style={{ marginBottom: 18, paddingTop: 12, borderTop: "1px solid #ffedd5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Choose Size / Crust
                    </p>
                    <span style={{ fontSize: 11, color: "#ea580c", fontWeight: 700 }}>Required</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                    {variations.map((v) => {
                      const isSelected = selectedVariation?.name === v.name;
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => setSelectedVariation(v)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: 4,
                            border: isSelected ? "2px solid #dc2626" : "1px solid #fed7aa",
                            background: isSelected ? "#fff7ed" : "#ffffff",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#b91c1c" : "#1e293b" }}>
                              {v.name}
                            </span>
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                border: isSelected ? "4px solid #dc2626" : "1.5px solid #cbd5e1",
                                background: "#ffffff",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#dc2626" }}>
                            {formatPrice(v.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── EXTRA TOPPINGS SELECTOR ───────────────────────── */}
              {extraToppings.length > 0 && available && (
                <div style={{ marginBottom: 18, paddingTop: 12, borderTop: "1px solid #ffedd5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Extra Toppings &amp; Add-ons
                    </p>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Optional</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                    {extraToppings.map((top) => {
                      const isSelected = selectedToppings.some((t) => t.name === top.name);
                      return (
                        <button
                          key={top.name}
                          type="button"
                          onClick={() => toggleTopping(top)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 4,
                            border: isSelected ? "1.5px solid #ea580c" : "1px solid #fed7aa",
                            background: isSelected ? "#fff7ed" : "#ffffff",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 6,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "#c2410c" : "#334155" }}>
                              {top.name}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#ea580c" }}>
                              +{formatPrice(top.price)}
                            </div>
                          </div>
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 3,
                              border: isSelected ? "none" : "1px solid #cbd5e1",
                              background: isSelected ? "#ea580c" : "#ffffff",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 900,
                            }}
                          >
                            {isSelected ? "✓" : ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector Section */}
              {available && (
                <div
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid #ffedd5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#7c2d12", margin: "0 0 2px" }}>
                      Select Quantity
                    </p>
                    <p style={{ fontSize: 11, color: "#9a3412", margin: 0 }}>
                      Adjust number of servings
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span
                      aria-live="polite"
                      style={{
                        minWidth: 28,
                        textAlign: "center",
                        fontWeight: 800,
                        fontSize: 16,
                        color: "#0f172a",
                      }}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer Bar */}
          <div
            style={{
              padding: "14px 20px",
              background: "#fff7ed",
              borderTop: "1px solid #fed7aa",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {available ? (
              <button
                type="button"
                id="add-to-cart-sheet-btn"
                className="btn-primary"
                onClick={handleAdd}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 4,
                  background: added ? "#16a34a" : "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                  borderColor: added ? "#16a34a" : "#b91c1c",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                }}
              >
                {added ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span>
                      Add {qty > 1 ? `${qty} items` : "to Cart"} {totalPrice != null ? `— ${formatPrice(totalPrice)}` : ""}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  background: "#f1f5f9",
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "not-allowed",
                }}
              >
                Currently Unavailable
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 16px",
                borderRadius: 4,
                border: "1px solid #fed7aa",
                background: "#ffffff",
                color: "#7c2d12",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductDetailSheet({
  product,
  onClose,
}: ProductDetailSheetProps) {
  if (!product) return null;
  return <SheetContent key={product.id} product={product} onClose={onClose} />;
}
