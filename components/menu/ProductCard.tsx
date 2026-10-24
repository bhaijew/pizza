"use client";

/**
 * ProductCard — displays a single real product from Supabase.
 * Professional square UI layout, crisp borders, and SVG icons.
 */
import { useState } from "react";
import type { Product } from "@/types/menu";
import ImagePlaceholder from "./ImagePlaceholder";
import { useCart } from "./CartContext";
import { getDealItems } from "@/lib/deal-helper";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  index?: number;
}

export default function ProductCard({
  product,
  onSelect,
  index = 0,
}: ProductCardProps) {
  const { formatPrice, addItem } = useCart();
  const [showItems, setShowItems] = useState(false);
  const [imageError, setImageError] = useState(false);
  const variations = product.variations || [];
  const hasVariations = variations.length > 0;

  const dealItems = getDealItems(product);
  const isDeal =
    dealItems.length > 0 ||
    product.is_deal === true ||
    product.category?.name?.toLowerCase().includes("deal") ||
    product.name?.toLowerCase().includes("deal") ||
    product.name?.toLowerCase().includes("combo");

  const isOutOfStock = product.track_inventory && (product.stock_quantity ?? 0) <= 0;
  const isLowStock = product.track_inventory && (product.stock_quantity ?? 0) > 0 && (product.stock_quantity ?? 0) <= (product.low_stock_threshold ?? 5);

  const available =
    product.is_available !== false && product.is_active !== false && !isOutOfStock;

  const displayPrice = hasVariations
    ? Math.min(...variations.map((v) => v.price))
    : (product.price ?? 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!available) return;
    if (hasVariations) {
      onSelect(product);
      return;
    }
    addItem(product);
  };

  return (
    <article
      className="card animate-fade-in-up"
      style={{
        animationDelay: `${Math.min(index * 40, 240)}ms`,
        cursor: available ? "pointer" : "default",
        opacity: available ? 1 : 0.65,
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 5,
        overflow: "hidden",
        position: "relative",
      }}
      onClick={() => available && onSelect(product)}
      role="button"
      tabIndex={available ? 0 : -1}
      aria-label={`View ${product.name}${!available ? " (unavailable)" : ""}`}
      onKeyDown={(e) => {
        if (available && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(product);
        }
      }}
    >
      {/* Square Image Box */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/10",
          overflow: "hidden",
          background: "#f1f5f9",
          flexShrink: 0,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {product.image_url && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            onError={() => setImageError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.35s ease",
            }}
            loading="lazy"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")
            }
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Category Tag (Overlayed cleanly on top-left of image - only for non-deals) */}
        {product.category?.name && !isDeal && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "#ffffff",
              color: "#c2410c",
              border: "1px solid #fed7aa",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 3,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            {product.category.name}
          </div>
        )}

        {/* Deal Tag (Overlayed cleanly on top-right of image) */}
        {isDeal && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
              color: "#ffffff",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 4,
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.35)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              maxWidth: "90%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span>🔥</span>
            <span>{product.badge || (dealItems.length > 0 ? `${dealItems.length} Items Deal` : "Deal")}</span>
          </div>
        )}

        {/* Unavailable overlay */}
        {!available && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255, 255, 255, 0.82)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(2px)",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 3,
                background: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #cbd5e1",
              }}
            >
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div style={{ padding: "clamp(10px, 1.6vw, 16px)", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Name */}
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.4vw, 16px)",
            color: "#0f172a",
            margin: "0 0 5px",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {product.name}
        </h3>

        {/* Description - omitted if already verbatim included in product title */}
        {product.description &&
          !product.name.toLowerCase().includes(product.description.toLowerCase().trim()) && (
          <p
            style={{
              fontSize: "clamp(11px, 1.1vw, 13px)",
              color: "#64748b",
              margin: "0 0 8px",
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.description}
          </p>
        )}

        {/* Deal Items Preview Toggle */}
        {dealItems.length > 0 && (
          <div style={{ marginTop: 2, marginBottom: 8 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowItems((prev) => !prev);
              }}
              aria-label="Toggle deal items"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: showItems ? "#ffedd5" : "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: "clamp(10px, 1.1vw, 11px)",
                color: "#c2410c",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>🎁 Deal Items ({dealItems.length})</span>
              <span style={{ fontSize: 9 }}>{showItems ? "▲" : "▼"}</span>
            </button>

            {showItems && (
              <div
                style={{
                  marginTop: 6,
                  padding: "6px 8px",
                  background: "#fefce8",
                  border: "1px solid #fef08a",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {dealItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: "clamp(10px, 1.05vw, 11px)",
                      color: "#713f12",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={{ color: "#16a34a", fontWeight: 900, fontSize: 11 }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Card Footer: Action Button on LEFT & Price on RIGHT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: "auto",
            paddingTop: 10,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {/* Action Button on LEFT */}
          {available ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleQuickAdd}
                aria-label={`Add ${product.name} to cart`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px clamp(9px, 1.3vw, 14px)",
                  borderRadius: 4,
                  background: hasVariations ? "#fff7ed" : "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                  color: hasVariations ? "#c2410c" : "#ffffff",
                  border: hasVariations ? "1px solid #fed7aa" : "1px solid #b91c1c",
                  fontSize: "clamp(12px, 1.1vw, 13px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  boxShadow: hasVariations ? "none" : "0 2px 4px rgba(220, 38, 38, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "brightness(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "none";
                }}
              >
                {hasVariations ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m10 8 4 4-4 4" />
                    </svg>
                    <span>Choose</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Unavailable
            </span>
          )}

          {/* Price on RIGHT (Larger size in both mobile & desktop) */}
          <div style={{ textAlign: "right", minWidth: 0, flexShrink: 1 }}>
            <span
              style={{
                fontSize: "clamp(9px, 1vw, 10px)",
                color: "#9a3412",
                display: "block",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textAlign: "right",
              }}
            >
              {isDeal ? "Deal Price" : hasVariations ? "Starting from" : "Price"}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 5, flexWrap: "wrap" }}>
              {product.original_price && product.original_price > displayPrice && (
                <span
                  style={{
                    fontSize: "clamp(10px, 1.1vw, 13px)",
                    color: "#94a3b8",
                    textDecoration: "line-through",
                    fontWeight: 600,
                  }}
                >
                  {formatPrice(product.original_price)}
                </span>
              )}
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "clamp(16px, 2.2vw, 22px)",
                  color: "#dc2626",
                  lineHeight: 1.1,
                  display: "inline-block",
                  textAlign: "right",
                }}
              >
                {formatPrice(displayPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
