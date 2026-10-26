"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/types/menu";
import {
  WEEK_DAYS,
  getTodayDay,
  isDealAvailableOnDay,
  parseDealDays,
  formatDealDaysBadge,
  type WeekDay,
} from "@/lib/deal-days-helper";
import ProductCard from "./ProductCard";

interface DailyDealsSpotlightProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  currencySymbol?: string;
  themeColor?: string;
}

export default function DailyDealsSpotlight({
  products,
  onSelectProduct,
  currencySymbol = "Rs.",
  themeColor = "#ea580c",
}: DailyDealsSpotlightProps) {
  const todayKey = useMemo(() => getTodayDay(), []);
  const [selectedDay, setSelectedDay] = useState<WeekDay | "all">(todayKey);

  // Extract all deals from products catalog
  const allDeals = useMemo(() => {
    return products.filter((p) => {
      const lowerCat = p.category?.name?.toLowerCase() || "";
      const lowerName = p.name.toLowerCase();
      const lowerDesc = (p.description || "").toLowerCase();
      const lowerBadge = (p.badge || "").toLowerCase();

      return (
        p.is_deal === true ||
        lowerCat.includes("deal") ||
        lowerName.includes("deal") ||
        lowerName.includes("combo") ||
        lowerDesc.includes("[days:") ||
        lowerBadge.includes("deal") ||
        (Array.isArray(p.items_included) && p.items_included.length > 0)
      );
    });
  }, [products]);

  // Filter deals available for the currently selected day
  const displayedDeals = useMemo(() => {
    if (selectedDay === "all") return allDeals;

    // First try finding deals specifically targeted for this day
    const daySpecific = allDeals.filter((d) => {
      const days = parseDealDays(d);
      return Array.isArray(days) && days.includes(selectedDay);
    });

    // Also get everyday deals (valid all days)
    const everydayDeals = allDeals.filter((d) => {
      const days = parseDealDays(d);
      return days === "all";
    });

    if (daySpecific.length > 0) {
      // Prioritize day-specific deals first, then append everyday deals
      return [...daySpecific, ...everydayDeals];
    }

    return everydayDeals;
  }, [allDeals, selectedDay]);

  if (allDeals.length === 0) {
    return null;
  }

  const currentDayInfo = WEEK_DAYS.find((w) => w.key === selectedDay);
  const isViewingToday = selectedDay === todayKey;

  return (
    <section
      aria-label="Daily Deals from Monday to Sunday"
      style={{
        marginBottom: 36,
        background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 40%, #fef2f2 100%)",
        borderRadius: 14,
        padding: "clamp(16px, 2.4vw, 24px)",
        border: "2px solid #fed7aa",
        boxShadow: "0 10px 30px -5px rgba(234, 88, 12, 0.12)",
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: "1.5px dashed #fdba74",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 26,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
              color: "#fff",
              boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
              flexShrink: 0,
            }}
          >
            🎁
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(18px, 2.5vw, 22px)",
                  fontWeight: 900,
                  color: "#7c2d12",
                  letterSpacing: "-0.01em",
                }}
              >
                {selectedDay === "all"
                  ? "All Week Deals (Mon – Sun)"
                  : isViewingToday
                  ? `Today's ${currentDayInfo?.label} Deals 🔥`
                  : `${currentDayInfo?.label} Special Deals ${currentDayInfo?.emoji || ""}`}
              </h2>
              {isViewingToday && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "#16a34a",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#86efac",
                      display: "inline-block",
                    }}
                  />
                  Live Today
                </span>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#9a3412", fontWeight: 500 }}>
              {selectedDay === "all"
                ? "Browse all discounted combo bundles, pizzas & family feasts!"
                : currentDayInfo?.tagline || "Freshly baked handcrafted deals prepared to order!"}
            </p>
          </div>
        </div>

        {/* Quick count indicator */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#c2410c",
            background: "#ffffff",
            border: "1px solid #fed7aa",
            padding: "5px 12px",
            borderRadius: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {displayedDeals.length} {displayedDeals.length === 1 ? "Deal" : "Deals"} Available
        </div>
      </div>

      {/* Monday to Sunday Day Switcher Bar */}
      <div
        role="tablist"
        aria-label="Select day for daily deals"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 10,
          marginBottom: 16,
        }}
        className="scrollbar-hide"
      >
        {/* Today Quick Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={isViewingToday}
          onClick={() => setSelectedDay(todayKey)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all 0.18s ease",
            background: isViewingToday
              ? "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)"
              : "#ffffff",
            color: isViewingToday ? "#ffffff" : "#7c2d12",
            border: isViewingToday ? "1px solid #b91c1c" : "1px solid #fed7aa",
            boxShadow: isViewingToday ? "0 4px 10px rgba(220, 38, 38, 0.28)" : "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <span>🌟</span>
          <span>Today ({WEEK_DAYS.find((w) => w.key === todayKey)?.short})</span>
        </button>

        {/* Mon - Sun Tabs */}
        {WEEK_DAYS.map((day) => {
          const isSelected = selectedDay === day.key;
          const isToday = day.key === todayKey;

          return (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedDay(day.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 13px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.18s ease",
                background: isSelected
                  ? "linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)"
                  : isToday
                  ? "#fff7ed"
                  : "#ffffff",
                color: isSelected ? "#ffffff" : isToday ? "#c2410c" : "#475569",
                border: isSelected
                  ? "1px solid #ea580c"
                  : isToday
                  ? "1.5px solid #fdba74"
                  : "1px solid #e2e8f0",
                boxShadow: isSelected
                  ? "0 3px 8px rgba(234, 88, 12, 0.25)"
                  : "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <span>{day.emoji}</span>
              <span>{day.short}</span>
              {isToday && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    padding: "1px 4px",
                    borderRadius: 3,
                    background: isSelected ? "rgba(255,255,255,0.3)" : "#fef08a",
                    color: isSelected ? "#ffffff" : "#854d0e",
                  }}
                >
                  Today
                </span>
              )}
            </button>
          );
        })}

        {/* All Deals Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={selectedDay === "all"}
          onClick={() => setSelectedDay("all")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 13px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all 0.18s ease",
            background: selectedDay === "all" ? "#0f172a" : "#ffffff",
            color: selectedDay === "all" ? "#ffffff" : "#475569",
            border: selectedDay === "all" ? "1px solid #0f172a" : "1px solid #e2e8f0",
            boxShadow: selectedDay === "all" ? "0 3px 8px rgba(15, 23, 42, 0.2)" : "none",
          }}
        >
          <span>✨</span>
          <span>All Deals ({allDeals.length})</span>
        </button>
      </div>

      {/* Deals Cards Grid */}
      {displayedDeals.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px 16px",
            background: "#ffffff",
            borderRadius: 8,
            border: "1px dashed #fed7aa",
          }}
        >
          <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>🎁</span>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#7c2d12" }}>
            No deals specifically configured for {currentDayInfo?.label} yet.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#9a3412" }}>
            Check out our other day specials above or view all active deals!
          </p>
        </div>
      ) : (
        <div className="menu-products-grid stagger-children">
          {displayedDeals.map((product, idx) => (
            <ProductCard
              key={`daily-deal-${product.id}`}
              product={product}
              index={idx}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </section>
  );
}
