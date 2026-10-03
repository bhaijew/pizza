"use client";

import { useState } from "react";
import { createPromoCode, lookupCustomerLoyalty, CustomerLoyaltyInfo } from "@/lib/promo-actions";

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

  // Loyalty lookup state
  const [searchPhone, setSearchPhone] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedCustomer, setSearchedCustomer] = useState<CustomerLoyaltyInfo | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleCreateCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createPromoCode(formData);

    setIsSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      window.location.reload();
    } else {
      setFormError(res.error || "Failed to create promo code.");
    }
  };

  const handleLookupLoyalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchedCustomer(null);

    try {
      const info = await lookupCustomerLoyalty(searchPhone, shopId);
      if (info) {
        setSearchedCustomer(info);
      } else {
        setSearchError("No loyalty profile found for this phone number yet.");
      }
    } catch {
      setSearchError("Error searching customer loyalty records.");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              margin: "0 0 4px",
            }}
          >
            Promos &amp; Loyalty Rewards
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Drive repeat orders with discount coupons and customer loyalty cash-back points.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 5,
            background: "#ea580c",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(234, 88, 12, 0.2)",
          }}
        >
          <span>＋</span>
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Grid: Promos Table + Loyalty Lookup */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
        {/* LEFT COLUMN: Active Promo Codes */}
        <div>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Active Coupon Codes
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                  Codes that customers can enter at online checkout.
                </p>
              </div>
              <span
                style={{
                  background: "#f1f5f9",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
                {promos.length > 0 ? `${promos.length} DB Codes` : "3 Default Codes Active"}
              </span>
            </div>

            {/* List or Table */}
            {promos.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "10px 16px", fontWeight: 700, color: "#475569" }}>Code</th>
                      <th style={{ padding: "10px 16px", fontWeight: 700, color: "#475569" }}>Discount</th>
                      <th style={{ padding: "10px 16px", fontWeight: 700, color: "#475569" }}>Min Order</th>
                      <th style={{ padding: "10px 16px", fontWeight: 700, color: "#475569" }}>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promos.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              color: "#ea580c",
                              background: "#fff7ed",
                              padding: "2px 6px",
                              borderRadius: 3,
                              border: "1px solid #fed7aa",
                            }}
                          >
                            {p.code}
                          </span>
                          {p.description && (
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{p.description}</p>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>
                          {p.discount_type === "percentage" ? `${p.discount_value}% OFF` : `Rs. ${p.discount_value} OFF`}
                          {p.max_discount_amount && (
                            <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                              Max Rs. {p.max_discount_amount}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#334155" }}>
                          Rs. {p.min_order_amount || 0}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>
                          {p.used_count || 0} / {p.usage_limit || "∞"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: "20px" }}>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#475569" }}>
                  Using system standard promo coupons:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { code: "WELCOME20", desc: "20% OFF on orders above Rs. 500 (Max Rs. 400)" },
                    { code: "FLAT100", desc: "Flat Rs. 100 OFF on orders above Rs. 800" },
                    { code: "PIZZA500", desc: "Flat Rs. 500 OFF on party orders above Rs. 2,500" },
                  ].map((c) => (
                    <div
                      key={c.code}
                      style={{
                        padding: "10px 12px",
                        background: "#fffbeb",
                        border: "1px solid #fef3c7",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 800,
                          color: "#b45309",
                          fontSize: 13,
                        }}
                      >
                        {c.code}
                      </span>
                      <span style={{ fontSize: 12, color: "#78350f", fontWeight: 600 }}>{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Loyalty Program & Customer Lookup */}
        <div>
          {/* Loyalty Program Info Box */}
          <div
            style={{
              background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              border: "1.5px solid #fde68a",
              borderRadius: 6,
              padding: "20px",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🪙</span>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#78350f", margin: 0 }}>
                  Automated Customer Loyalty Engine
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#92400e" }}>
                  Points are tracked automatically by customer WhatsApp phone number.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div style={{ background: "#ffffff", padding: "10px", borderRadius: 4, border: "1px solid #fde68a" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#b45309", textTransform: "uppercase" }}>
                  Earning Rule
                </span>
                <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                  1 Pt / Rs. 50
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b" }}>2% cashback return</p>
              </div>

              <div style={{ background: "#ffffff", padding: "10px", borderRadius: 4, border: "1px solid #fde68a" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#b45309", textTransform: "uppercase" }}>
                  Redemption Value
                </span>
                <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 900, color: "#16a34a" }}>
                  1 Pt = Rs. 1
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b" }}>Instant cart deduction</p>
              </div>
            </div>
          </div>

          {/* Customer Loyalty Search Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "20px",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
              Customer Loyalty Points Lookup
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>
              Search any customer's phone number to check their balance or order count.
            </p>

            <form onSubmit={handleLookupLoyalty} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                placeholder="e.g. 0300 1234567"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                style={{
                  flex: 1,
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={searchLoading || !searchPhone.trim()}
                style={{
                  padding: "0 16px",
                  height: 38,
                  borderRadius: 4,
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {searchLoading ? "Checking..." : "Search"}
              </button>
            </form>

            {searchError && (
              <div
                style={{
                  padding: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                {searchError}
              </div>
            )}

            {searchedCustomer && (
              <div
                style={{
                  padding: "14px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#065f46" }}>
                    👤 {searchedCustomer.customerName || "Customer"}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#047857" }}>
                    {searchedCustomer.phone}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                  <div style={{ background: "#ffffff", padding: "8px", borderRadius: 4, textAlign: "center" }}>
                    <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>Points</span>
                    <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 900, color: "#059669" }}>
                      {searchedCustomer.pointsBalance}
                    </p>
                  </div>

                  <div style={{ background: "#ffffff", padding: "8px", borderRadius: 4, textAlign: "center" }}>
                    <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>Orders</span>
                    <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                      {searchedCustomer.totalOrders}
                    </p>
                  </div>

                  <div style={{ background: "#ffffff", padding: "8px", borderRadius: 4, textAlign: "center" }}>
                    <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>Total Spent</span>
                    <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                      Rs. {searchedCustomer.totalSpent}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE COUPON MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              maxWidth: 480,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Create New Promo Coupon
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: 4,
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Coupon Code (e.g. FLASH30) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  name="code"
                  type="text"
                  required
                  placeholder="e.g. SUMMER50"
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Description
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="e.g. Special Weekend 20% Discount"
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Type
                  </label>
                  <select
                    name="discount_type"
                    defaultValue="fixed"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
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
                    placeholder="e.g. 150 or 20"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Min Order (Rs.)
                  </label>
                  <input
                    name="min_order_amount"
                    type="number"
                    defaultValue={0}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Max Discount (Rs.)
                  </label>
                  <input
                    name="max_discount_amount"
                    type="number"
                    placeholder="Optional for %"
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 13,
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
                    borderRadius: 4,
                    border: "none",
                    background: "#ea580c",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
