"use client";

/**
 * CategoryTabs — crisp square category tabs with icons & search input.
 * Responsive desktop layout with sticky navigation, desktop scroll arrows & live search.
 */
import { useRef, useState, useEffect } from "react";
import type { Category } from "@/types/menu";

interface CategoryTabsProps {
  categories: Category[];
  activeId: string | number | null;
  onSelect: (id: string | number | null) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  totalCount?: number;
}

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("deal") || n.includes("combo")) return "🎁";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger")) return "🍔";
  if (n.includes("fries") || n.includes("side")) return "🍟";
  if (n.includes("shawarma")) return "🌯";
  if (n.includes("paratha") || n.includes("roll")) return "🫓";
  if (n.includes("pasta")) return "🍝";
  if (n.includes("sauce") || n.includes("dip")) return "🥫";
  if (n.includes("drink") || n.includes("bottle") || n.includes("water") || n.includes("beverage")) return "🥤";
  if (n.includes("dessert") || n.includes("sweet") || n.includes("cake")) return "🍰";
  return "🍽️";
}

export default function CategoryTabs({
  categories,
  activeId,
  onSelect,
  searchQuery = "",
  onSearchChange,
  totalCount,
}: CategoryTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scrollTabs = (direction: "left" | "right") => {
    if (!tabsRef.current) return;
    tabsRef.current.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 250);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      {/* Category Tabs Wrapper with Desktop Scroll Chevrons */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          flex: "1 1 auto",
          minWidth: 260,
          overflow: "hidden",
        }}
      >
        {/* Left Scroll Button (Desktop Only) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs("left")}
            aria-label="Scroll categories left"
            className="hidden md:flex items-center justify-center"
            style={{
              position: "absolute",
              left: 0,
              zIndex: 10,
              width: 30,
              height: 34,
              borderRadius: 6,
              background: "linear-gradient(90deg, rgba(255,255,255,1) 70%, rgba(255,255,255,0) 100%)",
              border: "none",
              color: "#c2410c",
              cursor: "pointer",
              boxShadow: "2px 0 6px rgba(0,0,0,0.06)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Tabs List */}
        <div
          ref={tabsRef}
          onScroll={checkScroll}
          role="tablist"
          aria-label="Menu categories"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            padding: "4px 2px",
            width: "100%",
            scrollBehavior: "smooth",
          }}
          className="scrollbar-hide"
        >
          {/* "All Items" Tab */}
          <button
            id="category-tab-all"
            role="tab"
            aria-selected={activeId === null}
            onClick={() => onSelect(null)}
            className={`category-tab${activeId === null ? " category-tab--active" : ""}`}
            style={{ flexShrink: 0 }}
          >
            <span style={{ fontSize: 16 }}>🍽️</span>
            <span>All Items</span>
            {totalCount != null && (
              <span
                style={{
                  fontSize: 11,
                  opacity: activeId === null ? 0.95 : 0.7,
                  fontWeight: 800,
                  background: activeId === null ? "rgba(255,255,255,0.25)" : "#ffedd5",
                  color: activeId === null ? "#ffffff" : "#c2410c",
                  padding: "1px 7px",
                  borderRadius: 10,
                  marginLeft: 2,
                }}
              >
                {totalCount}
              </span>
            )}
          </button>

          {/* Category Tabs from database */}
          {categories.map((cat) => {
            const isSelected = activeId === cat.id;
            const icon = getCategoryIcon(cat.name);
            return (
              <button
                key={cat.id}
                id={`category-tab-${cat.id}`}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelect(cat.id)}
                className={`category-tab${isSelected ? " category-tab--active" : ""}`}
                style={{ flexShrink: 0 }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button (Desktop Only) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs("right")}
            aria-label="Scroll categories right"
            className="hidden md:flex items-center justify-center"
            style={{
              position: "absolute",
              right: 0,
              zIndex: 10,
              width: 30,
              height: 34,
              borderRadius: 6,
              background: "linear-gradient(270deg, rgba(255,255,255,1) 70%, rgba(255,255,255,0) 100%)",
              border: "none",
              color: "#c2410c",
              cursor: "pointer",
              boxShadow: "-2px 0 6px rgba(0,0,0,0.06)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Realtime Search Input Bar */}
      {onSearchChange && (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 320,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="square"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search dishes, pizzas, deals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              height: 38,
              paddingLeft: 36,
              paddingRight: 32,
              borderRadius: 6,
              border: "1px solid #fed7aa",
              background: "#ffffff",
              fontSize: 13,
              color: "#0f172a",
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#ea580c";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(234, 88, 12, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#fed7aa";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 2,
                display: "flex",
              }}
              title="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
