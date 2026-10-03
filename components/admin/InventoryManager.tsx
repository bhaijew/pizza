"use client";

import { useState, useTransition } from "react";
import { Product, Category } from "@/types/menu";
import { updateProductInventory, quickRestockProduct } from "@/lib/admin-actions";

interface InventoryManagerProps {
  products: Product[];
  categories: Category[];
  currencySymbol?: string;
  shopName?: string;
}

type StockFilter = "all" | "low" | "out" | "tracked";

export default function InventoryManager({
  products: initialProducts = [],
  categories = [],
  currencySymbol = "Rs.",
  shopName = "Store",
}: InventoryManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(5);
  const [editTrack, setEditTrack] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const getStockStatus = (p: Product) => {
    if (!p.track_inventory) return { label: "Untracked", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" };
    const stock = p.stock_quantity ?? 0;
    const threshold = p.low_stock_threshold ?? 5;
    if (stock <= 0) return { label: "Out of Stock", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    if (stock <= threshold) return { label: `Low Stock (${stock})`, color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" };
    return { label: `In Stock (${stock})`, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory === "all" || String(p.category_id) === selectedCategory;

    let matchesFilter = true;
    const stock = p.stock_quantity ?? 0;
    const threshold = p.low_stock_threshold ?? 5;

    if (filter === "low") {
      matchesFilter = !!p.track_inventory && stock > 0 && stock <= threshold;
    } else if (filter === "out") {
      matchesFilter = !!p.track_inventory && stock <= 0;
    } else if (filter === "tracked") {
      matchesFilter = !!p.track_inventory;
    }

    return matchesSearch && matchesCat && matchesFilter;
  });

  const lowStockCount = products.filter(
    (p) => !!p.track_inventory && (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5)
  ).length;

  const outOfStockCount = products.filter(
    (p) => !!p.track_inventory && (p.stock_quantity ?? 0) <= 0
  ).length;

  const handleQuickAdd = (productId: number | string, qty: number) => {
    startTransition(async () => {
      const res = await quickRestockProduct(Number(productId), qty);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stock_quantity: (p.stock_quantity ?? 0) + qty,
                  track_inventory: true,
                  is_available: true,
                }
              : p
          )
        );
        setMessage({ text: `Added +${qty} units successfully!`, type: "success" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: res.error || "Failed to update stock", type: "error" });
      }
    });
  };

  const handleStartEdit = (p: Product) => {
    setEditingId(p.id);
    setEditStock(p.stock_quantity ?? 0);
    setEditThreshold(p.low_stock_threshold ?? 5);
    setEditTrack(p.track_inventory ?? false);
  };

  const handleSaveEdit = (productId: number | string) => {
    startTransition(async () => {
      const res = await updateProductInventory(
        Number(productId),
        editStock,
        editTrack,
        editThreshold
      );
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stock_quantity: editStock,
                  track_inventory: editTrack,
                  low_stock_threshold: editThreshold,
                  is_available: editTrack && editStock <= 0 ? false : p.is_available,
                }
              : p
          )
        );
        setEditingId(null);
        setMessage({ text: "Inventory settings updated successfully!", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: res.error || "Failed to update inventory", type: "error" });
      }
    });
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", color: "#0f172a" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, margin: "0 0 4px", color: "#0f172a" }}>
            Inventory &amp; Stock Control
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Real-time stock tracking with automatic deduction on customer orders ({shopName})
          </p>
        </div>

        {/* Quick summary badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lowStockCount > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 4,
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#ea580c",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <span>⚠️</span>
              <span>{lowStockCount} Low Stock</span>
            </div>
          )}
          {outOfStockCount > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 4,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <span>❌</span>
              <span>{outOfStockCount} Out of Stock</span>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 700,
            background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            color: message.type === "success" ? "#065f46" : "#b91c1c",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
          {/* Search Input */}
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Search product by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: 38,
                padding: "0 12px 0 34px",
                borderRadius: 4,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                outline: "none",
              }}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              style={{ position: "absolute", left: 11, top: 12 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 4,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              background: "#ffffff",
              color: "#334155",
              outline: "none",
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 6, border: "1px solid #e2e8f0" }}>
          {(["all", "low", "out", "tracked"] as StockFilter[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border: "none",
                background: filter === st ? "#ffffff" : "transparent",
                color: filter === st ? "#0f172a" : "#64748b",
                fontWeight: filter === st ? 800 : 600,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: filter === st ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {st === "all"
                ? `All (${products.length})`
                : st === "low"
                ? `Low Stock (${lowStockCount})`
                : st === "out"
                ? `Out of Stock (${outOfStockCount})`
                : "Tracked Only"}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Product</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Price</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>In Stock</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Threshold</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Quick Restock / Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  No products matched the filter criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isEditing = editingId === p.id;
                const statusStyle = getStockStatus(p);

                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {/* Name & Image */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt={p.name}
                            style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", border: "1px solid #e2e8f0" }}
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 4, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c", fontSize: 16 }}>
                            🍕
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>{p.name}</p>
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            {categories.find((c) => c.id === p.category_id)?.name || "General"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#334155" }}>
                      {currencySymbol} {Number(p.price || 0).toLocaleString()}
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 8px",
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 800,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* In Stock Quantity */}
                    <td style={{ padding: "12px 16px" }}>
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editStock}
                          onChange={(e) => setEditStock(parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: 70,
                            height: 32,
                            padding: "0 8px",
                            borderRadius: 4,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        />
                      ) : (
                        <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                          {p.track_inventory ? p.stock_quantity ?? 0 : "—"}
                        </span>
                      )}
                    </td>

                    {/* Low Stock Threshold */}
                    <td style={{ padding: "12px 16px" }}>
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: 60,
                            height: 32,
                            padding: "0 8px",
                            borderRadius: 4,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                          }}
                        />
                      ) : (
                        <span style={{ color: "#64748b", fontSize: 12 }}>
                          {p.track_inventory ? `Alert at ≤ ${p.low_stock_threshold ?? 5}` : "—"}
                        </span>
                      )}
                    </td>

                    {/* Actions / Restock */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {isEditing ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", marginRight: 6 }}>
                            <input
                              type="checkbox"
                              checked={editTrack}
                              onChange={(e) => setEditTrack(e.target.checked)}
                            />
                            Track
                          </label>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveEdit(p.id)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 4,
                              background: "#059669",
                              color: "#ffffff",
                              border: "none",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              color: "#64748b",
                              border: "1px solid #cbd5e1",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {/* Quick Restock Buttons */}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleQuickAdd(p.id, 10)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 3,
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#059669",
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleQuickAdd(p.id, 25)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 3,
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#059669",
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            +25
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(p)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 3,
                              background: "#f8fafc",
                              border: "1px solid #cbd5e1",
                              color: "#334155",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              marginLeft: 4,
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
