"use client";

/**
 * ProductCard — displays a single real product from Supabase.
 * Professional square UI layout, crisp borders, and SVG icons.
 */
import type { Product } from "@/types/menu";
import ImagePlaceholder from "./ImagePlaceholder";
import { useCart } from "./CartContext";

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
  const variations = product.variations || [];
  const hasVariations = variations.length > 0;

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
    if (hasVariations || (product.extra_toppings && product.extra_toppings.length > 0)) {
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
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
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

        {/* Category Tag (Overlayed cleanly on top-left of image) */}
        {product.category?.name && (
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

        {/* Description */}
        {product.description && (
          <p
            style={{
              fontSize: "clamp(11px, 1.1vw, 13px)",
              color: "#64748b",
              margin: "0 0 12px",
              lineHeight: 1.45,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.description}
          </p>
        )}

        {/* Card Footer: Price & Square Action Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            marginTop: "auto",
            paddingTop: 10,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <div>
            <span style={{ fontSize: 9, color: "#9a3412", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
              {hasVariations ? "Starting from" : "Price"}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(13px, 1.5vw, 18px)",
                color: "#dc2626",
                lineHeight: 1.1,
              }}
            >
              {formatPrice(displayPrice)}
            </span>
          </div>

          {available ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={handleQuickAdd}
                aria-label={`Add ${product.name} to cart`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px clamp(8px, 1.2vw, 12px)",
                  borderRadius: 4,
                  background: hasVariations ? "#fff7ed" : "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                  color: hasVariations ? "#c2410c" : "#ffffff",
                  border: hasVariations ? "1px solid #fed7aa" : "1px solid #b91c1c",
                  fontSize: 12,
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
        </div>
      </div>
    </article>
  );
}
