"use client";

import { useState } from "react";
import type { Shop } from "@/types/menu";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData, editingId?: number | string) => Promise<{ error: string | null }>;
  editingShop?: Shop | null;
}

export default function ShopModal({
  isOpen,
  onClose,
  onSubmit,
  editingShop,
}: ShopModalProps) {
  const isEditing = !!editingShop;

  const [name, setName] = useState(editingShop?.name || "");
  const [ownerName, setOwnerName] = useState(editingShop?.owner_name || "");
  const [ownerPhone, setOwnerPhone] = useState(editingShop?.owner_phone || "");
  const [ownerEmail, setOwnerEmail] = useState(editingShop?.owner_email || "");
  const [branchAddress, setBranchAddress] = useState(editingShop?.branch_address || "");
  const [password, setPassword] = useState(editingShop?.password || "shop123");
  const [currencySymbol, setCurrencySymbol] = useState(editingShop?.currency_symbol || "Rs.");
  const [plan, setPlan] = useState<"starter" | "pro" | "enterprise">(editingShop?.plan || "pro");
  const [status, setStatus] = useState<"active" | "suspended" | "pending">(editingShop?.status || "active");
  const [notes, setNotes] = useState(editingShop?.notes || "");
  const [whatsappSessionId, setWhatsappSessionId] = useState(editingShop?.whatsapp_session_id || "");
  const [whatsappApiKey, setWhatsappApiKey] = useState(editingShop?.whatsapp_api_key || "");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let generated = "";
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !ownerName.trim()) {
      setError("Shop Name and Owner Name are required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("owner_name", ownerName.trim());
    formData.append("owner_phone", ownerPhone.trim());
    formData.append("owner_email", ownerEmail.trim());
    formData.append("branch_address", branchAddress.trim());
    formData.append("password", password.trim());
    formData.append("currency_symbol", currencySymbol.trim());
    formData.append("plan", plan);
    formData.append("status", status);
    formData.append("notes", notes.trim());
    formData.append("whatsapp_session_id", whatsappSessionId.trim());
    formData.append("whatsapp_api_key", whatsappApiKey.trim());

    setIsSubmitting(true);
    try {
      const res = await onSubmit(formData, editingShop?.id);
      if (res.error) {
        setError(res.error);
      } else {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "28px",
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.18)",
          color: "#0f172a",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #fecaca",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 2px", color: "#0f172a" }}>
                {isEditing ? `Edit Shop: ${editingShop.name}` : "Register New Shop Branch"}
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Define branch info and generate owner login password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
              color: "#64748b",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Close dialog"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "12px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Shop Name & Owner Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
                Shop / Branch Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pizza Crust - Gulberg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
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
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
                Owner Full Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tariq Mehmood"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Owner Phone & Email */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
                Owner Phone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="e.g. 0300-1234567"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
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
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
                Owner Email
              </label>
              <input
                type="email"
                placeholder="e.g. owner@pizzashop.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Shop Admin Login Password */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                Shop Owner Login Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ea580c",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                <span>Generate Random PIN</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Password for /admin/login"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#c2410c",
                fontSize: "14px",
                fontFamily: "monospace",
                fontWeight: 800,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
              Shop owner will enter this password at <code>/admin/login</code> to access their store manager.
            </span>
          </div>

          {/* Branch Address */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
              Branch Location / Address
            </label>
            <input
              type="text"
              placeholder="e.g. Shop #12, Commercial Market, Gulberg III, Lahore"
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Plan, Currency & Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
                Currency Symbol
              </label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="Rs.">Rs. (PKR)</option>
                <option value="$">$ (USD)</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="£">£ (GBP)</option>
                <option value="€">€ (EUR)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
                Subscription Plan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as "starter" | "pro" | "enterprise")}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="starter">Starter (Basic)</option>
                <option value="pro">Pro (Recommended)</option>
                <option value="enterprise">Enterprise (Unlimited)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
                Access Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "suspended" | "pending")}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: status === "active" ? "#f0fdf4" : "#fef2f2",
                  color: status === "active" ? "#16a34a" : "#dc2626",
                  fontWeight: 800,
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="active">Active (Online)</option>
                <option value="suspended">Suspended (Blocked)</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>

          {/* WhatsApp Gateway Settings */}
          <div style={{ marginBottom: "18px", padding: "14px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "14px" }}>📱</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                WhatsApp Order Alerts (Railway Gateway)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Session ID (e.g. rhs5o)
                </label>
                <input
                  type="text"
                  placeholder="e.g. rhs5o"
                  value={whatsappSessionId}
                  onChange={(e) => setWhatsappSessionId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#64748b" }}>
                  Unique session code for this shop&apos;s WhatsApp
                </p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Custom API Key (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to use default"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#64748b" }}>
                  Overrides x-api-key if shop has own account
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: "5px" }}>
              Super Admin Internal Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Paid monthly advance, renews on 1st of each month"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "5px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 16px",
                borderRadius: "5px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                color: "#475569",
                fontSize: "13px",
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
                borderRadius: "5px",
                background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
              }}
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create & Activate Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
