"use client";

import { useState } from "react";
import type { Shop } from "@/types/menu";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  Coins,
  Layers,
  Activity,
  MessageSquare,
  FileText,
  X,
  Check,
  Sparkles,
  RefreshCw,
  Store,
  AlertTriangle,
} from "lucide-react";

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
        background: "rgba(10, 15, 29, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "28px 24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          color: "#0f172a",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: "0 0 2px", color: "#0f172a" }}>
                {isEditing ? `Edit Branch: ${editingShop.name}` : "Register New Shop Branch"}
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Configure multi-tenant branch parameters and terminal access credentials.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              color: "#64748b",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-slate-200"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Branch Details */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <Building2 size={15} className="text-red-500" />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Branch Information
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
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
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
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
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
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
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Physical Branch Location / Address
              </label>
              <input
                type="text"
                placeholder="e.g. Shop #12, Commercial Market, Gulberg III, Lahore"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
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
          </div>

          {/* Section 2: Terminal Access & Plan */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <KeyRound size={15} className="text-amber-500" />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Manager Credentials &amp; Plan
              </span>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                  Store Manager Password (/admin/login) <span style={{ color: "#ef4444" }}>*</span>
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
                  <RefreshCw size={11} />
                  <span>Generate New PIN</span>
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
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#ea580c",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Branch manager logs into <code>/admin/login</code> with this access PIN.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Currency
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 600,
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
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Plan
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as "starter" | "pro" | "enterprise")}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 600,
                    outline: "none",
                  }}
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro (Standard)</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "suspended" | "pending")}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: status === "active" ? "#f0fdf4" : "#fef2f2",
                    color: status === "active" ? "#16a34a" : "#dc2626",
                    fontWeight: 800,
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="active">Active (Online)</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: WhatsApp Gateway */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <MessageSquare size={15} className="text-emerald-500" />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                WhatsApp Gateway &amp; Alerts
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
                    padding: "9px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Custom API Key (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for platform default"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Internal Super Admin Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly subscription paid via Bank Transfer, renewal 1st"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
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

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: "8px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 22px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
              }}
            >
              <Check size={16} />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Save Branch Changes" : "Create & Activate Branch"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
