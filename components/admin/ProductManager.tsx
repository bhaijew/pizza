"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import type { Product, Category } from "@/types/menu";
import { updateProduct, deleteProduct } from "@/lib/admin-actions";
import {
  Plus,
  Search,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Pizza,
  Tag,
} from "lucide-react";

interface ProductManagerProps {
  initialProducts: Product[];
  categories: Category[];
  currencySymbol?: string;
}

export default function ProductManager({
  initialProducts,
  categories,
  currencySymbol = "$",
}: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  const handleDelete = (id: string | number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteProduct(Number(id));
      if (res?.error) {
        alert(res.error);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    });
  };

  // Quick toggle availability directly from table
  const handleToggleAvailability = (p: Product) => {
    const newStatus = !p.is_available;
    const formData = new FormData();
    formData.set("name", p.name);
    formData.set("slug", p.name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"));
    formData.set("category_id", String(p.category_id || categories[0]?.id || 1));
    formData.set("price", String(p.price || 0));
    formData.set("image_url", p.image_url || "");
    formData.set("description", p.description || "");
    formData.set("sort_order", String(p.sort_order ?? 0));
    formData.set("is_available", newStatus ? "true" : "false");
    formData.set("is_active", p.is_active ? "true" : "false");

    // Optimistic update
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, is_available: newStatus } : item))
    );

    startTransition(async () => {
      const res = await updateProduct(Number(p.id), { error: null, success: false }, formData);
      if (res?.error) {
        alert(res.error);
        window.location.reload();
      }
    });
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === "all" ||
        String(p.category_id) === selectedCategoryFilter;

      const matchesAvail =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && p.is_available !== false) ||
        (availabilityFilter === "soldout" && p.is_available === false);

      return matchesSearch && matchesCat && matchesAvail;
    });
  }, [products, searchQuery, selectedCategoryFilter, availabilityFilter]);

  return (
    <div>
      {/* ─── ACTION BAR ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
            Product Catalog ({filteredProducts.length} of {products.length})
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Manage menu items, prices, ingredients, and stock availability.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            borderRadius: "6px",
            background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "13px",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
            transition: "transform 0.15s ease",
          }}
          className="hover:scale-105"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ──────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "20px",
          background: "#ffffff",
          padding: "12px 16px",
          borderRadius: "5px",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Search Input */}
        <div style={{ flex: "1 1 240px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search products by name or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px 9px 34px",
              borderRadius: "5px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <Search
            size={15}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: "13px",
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

        {/* Availability Filter */}
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: "13px",
            outline: "none",
          }}
        >
          <option value="all">All Stock Status</option>
          <option value="available">In Stock Only</option>
          <option value="soldout">Out of Stock Only</option>
        </select>
      </div>

      {/* ─── PRODUCT LIST ──────────────────────────────────── */}
      {filteredProducts.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "10px",
            padding: "54px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "#fff7ed",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pizza size={28} />
            </div>
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
            {products.length === 0 ? "No products in database yet" : "No products matched your filters"}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px", maxWidth: 360, marginInline: "auto" }}>
            {products.length === 0
              ? "Start building your menu by adding your first real food product."
              : "Try clearing your search query or choosing another category."}
          </p>
          <Link
            href="/admin/products/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 20px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "13px",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
            }}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Item</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Category</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Price</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Stock</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Visibility</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.category_id);
                const isAvailable = p.is_available !== false;
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {/* Item Thumbnail & Info */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "5px",
                            background: "#f1f5f9",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            flexShrink: 0,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <ImageIcon size={18} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                          {p.description && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                maxWidth: "280px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "5px",
                          background: "#f1f5f9",
                          color: "#475569",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                          fontWeight: 500,
                        }}
                      >
                        {cat?.name || "Uncategorized"}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#dc2626" }}>
                      {currencySymbol}{p.price != null ? Number(p.price).toFixed(2) : "0.00"}
                    </td>

                    {/* Availability toggle */}
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 8px",
                          borderRadius: "5px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: isAvailable ? "1px solid #bbf7d0" : "1px solid #fecaca",
                          background: isAvailable ? "#f0fdf4" : "#fef2f2",
                          color: isAvailable ? "#16a34a" : "#dc2626",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "5px",
                            background: isAvailable ? "#16a34a" : "#dc2626",
                          }}
                        ></span>
                        {isAvailable ? "In Stock" : "Sold Out"}
                      </button>
                    </td>

                    {/* Active/Draft */}
                    <td style={{ padding: "12px 16px" }}>
                      {p.is_active ? (
                        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>Visible</span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Hidden</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#334155",
                            textDecoration: "none",
                            fontSize: "12px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease",
                          }}
                          className="hover:border-slate-400"
                        >
                          <Edit2 size={13} className="text-slate-600" />
                          <span>Edit</span>
                        </Link>

                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease",
                          }}
                          className="hover:bg-red-100"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
