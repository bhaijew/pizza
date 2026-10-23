"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Category } from "@/types/menu";
import { createCategory, updateCategory, deleteCategory } from "@/lib/admin-actions";
import {
  Plus,
  Tags,
  Edit2,
  Trash2,
  Image as ImageIcon,
  X,
  Layers,
  Lock,
} from "lucide-react";

interface CategoryManagerProps {
  initialCategories: Category[];
  productCounts: Record<string | number, number>;
  currentShopId?: number | null;
  currentShopName?: string;
  isMasterAdmin?: boolean;
  availableShops?: { id: number; name: string; slug: string }[];
}

export default function CategoryManager({
  initialCategories,
  productCounts,
  currentShopId,
  currentShopName = "Pizza Admin",
  isMasterAdmin = false,
  availableShops = [],
}: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll and support Escape key when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [isModalOpen]);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formShopId, setFormShopId] = useState<string>(currentShopId ? String(currentShopId) : "");

  const openAddModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormImageUrl("");
    setFormSortOrder(categories.length);
    setFormIsActive(true);
    setFormShopId(currentShopId ? String(currentShopId) : "");
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug || "");
    setFormDesc(cat.description || "");
    setFormImageUrl(cat.image_url || "");
    setFormSortOrder(cat.sort_order || 0);
    setFormIsActive(cat.is_active ?? true);
    setFormShopId(currentShopId ? String(currentShopId) : (cat.shop_id != null ? String(cat.shop_id) : ""));
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      setFormSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("name", formName);
    formData.set("slug", formSlug);
    formData.set("description", formDesc);
    formData.set("image_url", formImageUrl);
    formData.set("sort_order", formSortOrder.toString());
    formData.set("is_active", formIsActive ? "true" : "false");
    formData.set("shop_id", currentShopId ? String(currentShopId) : formShopId);

    startTransition(async () => {
      let res;
      if (editingCategory) {
        res = await updateCategory(Number(editingCategory.id), { error: null, success: false }, formData);
      } else {
        res = await createCategory({ error: null, success: false }, formData);
      }

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setIsModalOpen(false);
        if (res.category) {
          const cat = res.category as Category;
          if (editingCategory) {
            setCategories((prev) =>
              prev
                .map((c) => (String(c.id) === String(cat.id) ? cat : c))
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            );
          } else {
            setCategories((prev) =>
              [...prev, cat].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            );
          }
        }
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string | number, name: string) => {
    const count = productCounts[id] || 0;
    if (count > 0) {
      alert(`Cannot delete "${name}" because it still has ${count} product(s) assigned to it. Reassign or remove them first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteCategory(Number(id));
      if (res.error) {
        alert(res.error);
      } else {
        setCategories((prev) => prev.filter((c) => String(c.id) !== String(id)));
        router.refresh();
      }
    });
  };

  return (
    <div>
      {/* Action Bar */}
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
        <div style={{ color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span>Organize your pizzas, drinks, sides, and desserts into menu categories.</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              background: currentShopId ? "#eff6ff" : "#f1f5f9",
              color: currentShopId ? "#1d4ed8" : "#475569",
              border: currentShopId ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            Branch: {currentShopName} {currentShopId ? `(#${currentShopId})` : "(All/Global)"}
          </span>
        </div>

        <button
          onClick={openAddModal}
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
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
            transition: "transform 0.15s ease",
          }}
          className="hover:scale-105"
        >
          <Plus size={16} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Category List */}
      {categories.length === 0 ? (
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
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Tags size={28} />
            </div>
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
            No categories created yet
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px", maxWidth: 360, marginInline: "auto" }}>
            Create your first category (like "Classic Pizzas", "Beverages", or "Desserts") to get started.
          </p>
          <button
            onClick={openAddModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 20px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
            }}
          >
            <Plus size={16} />
            <span>Create Category</span>
          </button>
        </div>
      ) : (
        <div
          className="overflow-x-auto w-full"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Category</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Slug</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Order</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Products</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Status</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const count = productCounts[cat.id] || 0;
                return (
                  <tr
                    key={cat.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{cat.name}</div>
                      {cat.description && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontFamily: "monospace", fontSize: "12px" }}>
                      {cat.slug}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>
                      #{cat.sort_order ?? 0}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "5px",
                          background: count > 0 ? "#f0f9ff" : "#f1f5f9",
                          color: count > 0 ? "#0284c7" : "#64748b",
                          fontSize: "12px",
                          fontWeight: 600,
                          border: count > 0 ? "1px solid #bae6fd" : "1px solid #e2e8f0",
                        }}
                      >
                        {count} item{count !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {cat.is_active ? (
                        <span style={{ color: "#16a34a", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "5px", background: "#16a34a" }}></span> Active
                        </span>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "5px", background: "#94a3b8" }}></span> Hidden
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => openEditModal(cat)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#334155",
                            cursor: "pointer",
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
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
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

      {/* ─── ADD / EDIT CATEGORY MODAL (PORTAL) ───────────────── */}
      {mounted && isModalOpen && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 99999,
            overflowY: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "min(92vh, 680px)",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
              margin: "auto",
            }}
          >
            {/* Modal Header (Fixed at top) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                background: "#ffffff",
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 3px", color: "#0f172a" }}>
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  Organize your pizzas, drinks, sides, and desserts into menu categories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  transition: "all 0.15s ease",
                }}
                className="hover:bg-slate-200 hover:text-slate-900"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSave}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 auto",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* Scrollable Form Body */}
              <div
                style={{
                  padding: "20px 24px",
                  overflowY: "auto",
                  flex: "1 1 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {errorMessage && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                      fontSize: "13px",
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Gourmet Pizzas, Appetizers, Beverages"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. gourmet-pizzas"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                    }}
                  />
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
                    Unique URL identifier for category filters and navigation.
                  </p>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Short summary shown under category header..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Optional Category Image */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Category Image URL (Optional)
                  </label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://... or /images/category.jpg"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0f172a",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {formImageUrl && (
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid #cbd5e1",
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Sort Order (Display sequence)
                    </label>
                    <input
                      type="number"
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0f172a",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ paddingTop: "18px" }}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#0f172a",
                        fontWeight: 700,
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        style={{ width: "18px", height: "18px", accentColor: "#ef4444", cursor: "pointer" }}
                      />
                      <span>Active on Menu</span>
                    </label>
                  </div>
                </div>

                {/* Branch Assignment Selector */}
                {currentShopId ? (
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                        Assigned Branch / Store
                      </label>
                      <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Lock size={12} /> Branch Locked
                      </span>
                    </div>
                    <select
                      value={String(currentShopId)}
                      disabled
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0f172a",
                        fontSize: "13px",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                        cursor: "not-allowed",
                      }}
                    >
                      <option value={String(currentShopId)}>
                        🏪 {currentShopName} (#{currentShopId})
                      </option>
                    </select>
                    <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#64748b" }}>
                      This category strictly appears on {currentShopName}&apos;s menu.
                    </p>
                  </div>
                ) : availableShops && availableShops.length > 0 ? (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Assigned Branch / Store
                    </label>
                    <select
                      value={formShopId}
                      onChange={(e) => setFormShopId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0f172a",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">🌐 Master Store (Global / Unassigned)</option>
                      {availableShops.map((s) => (
                        <option key={s.id} value={s.id}>
                          🏪 {s.name} (#{s.id})
                        </option>
                      ))}
                    </select>
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
                      Assign which store menu displays this food category.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "9px 14px",
                      borderRadius: "6px",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      fontSize: "12px",
                      color: "#1e40af",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🏪</span>
                    <span>
                      Saving to branch: <strong>{currentShopName}</strong> {currentShopId ? `(#${currentShopId})` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer (Fixed at bottom) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 24px",
                  borderTop: "1px solid #f1f5f9",
                  background: "#f8fafc",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "6px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "13px",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                    color: "#ffffff",
                    border: "none",
                    cursor: isPending ? "not-allowed" : "pointer",
                    fontWeight: 800,
                    fontSize: "13px",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                    opacity: isPending ? 0.7 : 1,
                    transition: "all 0.15s ease",
                  }}
                  className="hover:opacity-95"
                >
                  {isPending ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
