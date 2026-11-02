"use client";

import { useState } from "react";
import { createPromoCode, deletePromoCode, togglePromoCodeActive } from "@/lib/promo-actions";

interface PromoCodeItem {
  id: number;
  code: string;
  description?: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface AdminPromosClientProps {
  initialPromos: any[];
  shopId?: number | null;
}

export default function AdminPromosClient({
  initialPromos,
  shopId,
}: AdminPromosClientProps) {
  const [promos, setPromos] = useState<PromoCodeItem[]>(initialPromos || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick feedback timer
  const notify = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Delete handler
  const handleDelete = async (promo: PromoCodeItem) => {
    const confirmed = window.confirm(`Are you sure you want to delete coupon code "${promo.code}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(promo.id);
    try {
      const res = await deletePromoCode(promo.id);
      if (res.success) {
        setPromos((prev) => prev.filter((p) => p.id !== promo.id));
        notify("success", `Coupon "${promo.code}" deleted successfully.`);
      } else {
        notify("error", res.error || "Failed to delete coupon.");
      }
    } catch {
      notify("error", "An unexpected error occurred while deleting coupon.");
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle active handler
  const handleToggleActive = async (promo: PromoCodeItem) => {
    const nextActive = !promo.is_active;
    // Optimistic update
    setPromos((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, is_active: nextActive } : p))
    );

    try {
      const res = await togglePromoCodeActive(promo.id, nextActive);
      if (res.success) {
        notify("success", `Coupon "${promo.code}" is now ${nextActive ? "Active" : "Disabled"}.`);
      } else {
        // Revert on failure
        setPromos((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, is_active: promo.is_active } : p))
        );
        notify("error", res.error || "Failed to update coupon status.");
      }
    } catch {
      setPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, is_active: promo.is_active } : p))
      );
      notify("error", "Error updating coupon status.");
    }
  };

  // Create coupon handler
  const handleCreateCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await createPromoCode(formData);

      if (res.success) {
        setShowAddModal(false);
        form.reset();
        if (res.promo) {
          setPromos((prev) => [res.promo, ...prev]);
        } else {
          window.location.reload();
        }
        notify("success", "New coupon code created successfully!");
      } else {
        setFormError(res.error || "Failed to create promo code.");
      }
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Toast Notification Banner */}
      {actionMessage && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 99999,
            padding: "12px 18px",
            borderRadius: 6,
            background: actionMessage.type === "success" ? "#065f46" : "#991b1b",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <span>{actionMessage.type === "success" ? "✓" : "⚠"}</span>
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 14,
          background: "#ffffff",
          padding: "20px 24px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Discount Coupons &amp; Promo Codes
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: "#f1f5f9",
                color: "#475569",
                padding: "2px 7px",
                borderRadius: 4,
                letterSpacing: "0.5px",
                border: "1px solid #e2e8f0",
              }}
            >
              COUPON ENGINE
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Create, manage, and delete promotional discount coupons that customers can apply during online checkout.
          </p>
        </div>

        {/* Header Add Coupon Button */}
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setShowAddModal(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 6,
            background: "#ea580c",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Main Full-Width Coupon List Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Card Header Strip */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            background: "#fafafa",
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Active Coupon Codes ({promos.length})
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
              Valid discount vouchers available for customers at checkout.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "4px 10px",
                borderRadius: 5,
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
              }}
            >
              {promos.length} Total Coupons
            </span>

            {/* Quick Add Button inside Card Header */}
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowAddModal(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 5,
                background: "#0f172a",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Coupon</span>
            </button>
          </div>
        </div>

        {/* Table of Coupon Codes */}
        {promos.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", width: "26%" }}>Coupon Code</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", width: "18%" }}>Discount Value</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", width: "15%" }}>Min Order</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", width: "15%" }}>Usage Limit</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", width: "12%" }}>Status</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", width: "14%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: p.is_active ? "#ffffff" : "#fbfbfb",
                      opacity: p.is_active ? 1 : 0.65,
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Code Column */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: 13.5,
                            color: "#ea580c",
                            background: "#fff7ed",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid #fed7aa",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {p.code}
                        </span>
                      </div>
                      {p.description && (
                        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#64748b", lineHeight: "1.4" }}>
                          {p.description}
                        </p>
                      )}
                    </td>

                    {/* Discount Value */}
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                        {p.discount_type === "percentage" ? `${p.discount_value}% OFF` : `Rs. ${p.discount_value} OFF`}
                      </span>
                      {p.max_discount_amount && (
                        <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>
                          Max Cap: Rs. {p.max_discount_amount}
                        </span>
                      )}
                    </td>

                    {/* Min Order Required */}
                    <td style={{ padding: "14px 18px", color: "#334155", fontWeight: 600 }}>
                      Rs. {p.min_order_amount || 0}
                    </td>

                    {/* Usage Count / Limit */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#0f172a", fontWeight: 700 }}>
                          {p.used_count || 0}
                        </span>
                        <span style={{ color: "#94a3b8" }}>/</span>
                        <span style={{ color: "#64748b" }}>
                          {p.usage_limit || "Unlimited"}
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle / Badge */}
                    <td style={{ padding: "14px 18px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: p.is_active ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
                          background: p.is_active ? "#ecfdf5" : "#f1f5f9",
                          color: p.is_active ? "#065f46" : "#64748b",
                        }}
                        title={p.is_active ? "Click to disable coupon" : "Click to activate coupon"}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: p.is_active ? "#10b981" : "#94a3b8",
                          }}
                        />
                        <span>{p.is_active ? "Active" : "Disabled"}</span>
                      </button>
                    </td>

                    {/* Actions Column: Delete Button */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 11px",
                          borderRadius: 5,
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: deletingId === p.id ? "not-allowed" : "pointer",
                          transition: "all 0.15s ease",
                        }}
                        title={`Delete coupon "${p.code}"`}
                      >
                        {deletingId === p.id ? (
                          <span>Deleting...</span>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#fff7ed",
                color: "#ea580c",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
              No Custom Coupons Found
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
              You haven't created any promotional discount coupons yet. Click below to add your first coupon code.
            </p>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowAddModal(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                borderRadius: 6,
                background: "#ea580c",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>＋ Add Your First Coupon</span>
            </button>
          </div>
        )}
      </div>

      {/* CREATE NEW COUPON MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              maxWidth: 500,
              width: "100%",
              padding: 24,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid #cbd5e1",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Create New Promo Coupon
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  Configure discount rule and usage conditions for customer checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#64748b",
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Hidden Shop ID */}
              <input type="hidden" name="shop_id" value={shopId || ""} />

              {/* Coupon Code */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Coupon Code (e.g. FLASH30, PIZZA500) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  name="code"
                  type="text"
                  required
                  placeholder="e.g. SPECIAL50"
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 5,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Description / Subtitle
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="e.g. 20% discount on orders above Rs. 500"
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 5,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              {/* Discount Type & Value */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Discount Type
                  </label>
                  <select
                    name="discount_type"
                    defaultValue="fixed"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 5,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
                      outline: "none",
                    }}
                  >
                    <option value="fixed">Fixed Amount (Rs.)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Discount Value <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    name="discount_value"
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 100 or 20"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 5,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Min Order Required (Rs.)
                  </label>
                  <input
                    name="min_order_amount"
                    type="number"
                    defaultValue={0}
                    placeholder="0"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 5,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Max Discount Cap (Rs.)
                  </label>
                  <input
                    name="max_discount_amount"
                    type="number"
                    placeholder="Optional (for %)"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 5,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Maximum Total Uses
                </label>
                <input
                  name="usage_limit"
                  type="number"
                  defaultValue={500}
                  placeholder="500"
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 5,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 5,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 5,
                    border: "none",
                    background: "#ea580c",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save Coupon Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
