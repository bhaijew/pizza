"use client";

import { useState, useEffect } from "react";
import type { PosStaff, Shop } from "@/types/menu";
import {
  User,
  Mail,
  KeyRound,
  ShieldCheck,
  X,
  Check,
  RefreshCw,
  AlertTriangle,
  Laptop,
  Store,
} from "lucide-react";

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData, editingId?: string) => Promise<{ error: string | null }>;
  editingStaff?: PosStaff | null;
  shops?: Shop[];
}

export default function StaffModal({
  isOpen,
  onClose,
  onSubmit,
  editingStaff,
  shops = [],
}: StaffModalProps) {
  const isEditing = !!editingStaff;

  const [name, setName] = useState(editingStaff?.name || "");
  const [email, setEmail] = useState(editingStaff?.email || "");
  const [role, setRole] = useState<"manager" | "cashier" | "waiter" | "chef" | "owner">(
    editingStaff?.role || "cashier"
  );
  const [shopId, setShopId] = useState<string>(
    editingStaff?.shop_id ? String(editingStaff.shop_id) : "all"
  );
  const [pin, setPin] = useState(editingStaff?.pin || "1234");
  const [hasPosAccess, setHasPosAccess] = useState(
    editingStaff ? editingStaff.has_pos_access : true
  );
  const [isActive, setIsActive] = useState(
    editingStaff ? editingStaff.is_active : true
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingStaff) {
      setName(editingStaff.name || "");
      setEmail(editingStaff.email || "");
      setRole(editingStaff.role || "cashier");
      setPin(editingStaff.pin || "1234");
      setShopId(editingStaff.shop_id ? String(editingStaff.shop_id) : "all");
      setHasPosAccess(editingStaff.has_pos_access !== false);
      setIsActive(editingStaff.is_active !== false);
    } else {
      setName("");
      setEmail("");
      setRole("cashier");
      setPin("1234");
      setShopId("all");
      setHasPosAccess(true);
      setIsActive(true);
    }
    setError(null);
  }, [editingStaff, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(randomPin);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Staff member name is required.");
      return;
    }

    if (!pin.trim() || pin.trim().length < 4) {
      setError("POS PIN must be at least 4 digits.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("role", role);
    formData.append("shop_id", shopId === "all" ? "" : shopId);
    formData.append("pin", pin.trim());
    formData.append("has_pos_access", hasPosAccess ? "true" : "false");
    formData.append("is_active", isActive ? "true" : "false");

    setIsSubmitting(true);
    try {
      const res = await onSubmit(formData, editingStaff?.id);
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
          maxWidth: "520px",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "26px 24px",
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
            marginBottom: "18px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
              }}
            >
              <User size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 2px", color: "#0f172a" }}>
                {isEditing ? `Edit Staff: ${editingStaff.name}` : "Create POS Staff Member"}
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Grant POS terminal login credentials and role authorizations.
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
            }}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Member Details */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Staff Full Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kashif Mehmood / Cashier 1"
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Staff Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
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
                  <option value="cashier">Cashier (POS Checkout)</option>
                  <option value="waiter">Waiter (Order Taker)</option>
                  <option value="chef">Chef / Kitchen Staff</option>
                  <option value="manager">Store Manager</option>
                  <option value="owner">Branch Owner</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. kashif@pizza.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            {/* Assigned Branch / Shop */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <Store size={13} className="text-emerald-600" />
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                  Assigned Branch / Location
                </label>
              </div>
              <select
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
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
                <option value="all">🌐 Universal / All Branches (POS Access Across All Terminals)</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={String(shop.id)}>
                    🏢 Branch #{shop.id}: {shop.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                This staff profile automatically synchronizes in real time to FloDesktop terminals.
              </span>
            </div>

            {/* POS 4-Digit Access PIN */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                  POS Terminal Login PIN (4 Digits) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePin}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#10b981",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <RefreshCw size={11} />
                  <span>Generate Random PIN</span>
                </button>
              </div>

              <input
                type="text"
                required
                maxLength={6}
                placeholder="4-digit numeric PIN e.g. 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "16px",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  letterSpacing: "0.25em",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Staff member will enter this PIN on the FloDesktop POS terminal numpad to unlock.
              </span>
            </div>
          </div>

          {/* Access Toggles */}
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Laptop size={16} className="text-emerald-600" />
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534", display: "block" }}>
                    FloDesktop POS Access Authorization
                  </span>
                  <span style={{ fontSize: "11px", color: "#15803d" }}>
                    Permit this user to operate the desktop POS billing terminal
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasPosAccess}
                onChange={(e) => setHasPosAccess(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#10b981" }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                paddingTop: "6px",
                borderTop: "1px solid #dcfce7",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} className="text-emerald-600" />
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534", display: "block" }}>
                    Active Status
                  </span>
                  <span style={{ fontSize: "11px", color: "#15803d" }}>
                    Enable or disable this staff member immediately
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#10b981" }}
              />
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Check size={16} />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Save Staff Changes" : "Authorize & Create Staff"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
