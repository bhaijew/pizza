"use client";

/**
 * CategoryTabs — crisp square category tabs with optional search input.
 * Responsive desktop layout with sticky navigation and search bar.
 */
import type { Category } from "@/types/menu";

interface CategoryTabsProps {
  categories: Category[];
  activeId: string | number | null;
  onSelect: (id: string | number | null) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  totalCount?: number;
}

export default function CategoryTabs({
  categories,
  activeId,
  onSelect,
  searchQuery = "",
  onSearchChange,
  totalCount,
}: CategoryTabsProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 64,
        zIndex: 25,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #fed7aa",
        paddingTop: 10,
        paddingBottom: 10,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Tabs list (Scrollable horizontally) */}
        <div
          role="tablist"
          aria-label="Menu categories"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 2,
            flex: "1 1 auto",
            minWidth: 260,
          }}
          className="scrollbar-hide"
        >
          {/* "All Items" tab */}
          <button
            id="category-tab-all"
            role="tab"
            aria-selected={activeId === null}
            onClick={() => onSelect(null)}
            className={`category-tab${activeId === null ? " category-tab--active" : ""}`}
            style={{ flexShrink: 0 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="square"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>All Items</span>
            {totalCount != null && (
              <span
                style={{
                  fontSize: 11,
                  opacity: activeId === null ? 0.9 : 0.6,
                  fontWeight: 700,
                }}
              >
                ({totalCount})
              </span>
            )}
          </button>

          {/* Dynamic categories from database */}
          {categories.map((cat) => {
            const isSelected = activeId === cat.id;
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
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar (Aligned on right on desktop) */}
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
                paddingRight: 30,
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
    </div>
  );
}
