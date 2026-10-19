"use client";

import { useState, useTransition } from "react";
import type { ShopStaffMember } from "@/lib/admin-actions";
import {
  createShopStaffMember,
  updateShopStaffMember,
  deleteShopStaffMember,
  toggleShopStaffStatus,
  switchAdminStaffRole,
} from "@/lib/admin-actions";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
  Store,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface StaffManagerProps {
  initialStaff: ShopStaffMember[];
  shopName: string;
  shopId: number | null;
  currentRole: "admin" | "sub_admin" | "staff";
  currentStaffName: string;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; badgeBg: string; badgeColor: string; border: string; desc: string }
> = {
  admin: {
    label: "Shop Admin",
    badgeBg: "#fef3c7",
    badgeColor: "#b45309",
    border: "#fde68a",
    desc: "Full administrative control, order cancellation, and staff management.",
  },
  sub_admin: {
    label: "Sub-Admin / Manager",
    badgeBg: "#eff6ff",
    badgeColor: "#1d4ed8",
    border: "#bfdbfe",
    desc: "Store operations, orders, and daily closing. Order cancellation is restricted.",
  },
  manager: {
    label: "Store Supervisor",
    badgeBg: "#e0f2fe",
    badgeColor: "#0369a1",
    border: "#bae6fd",
    desc: "Supervises POS and shifts. Order cancellation is restricted to Admin.",
  },
  cashier: {
    label: "POS Cashier",
    badgeBg: "#f3e8ff",
    badgeColor: "#7e22ce",
    border: "#e9d5ff",
    desc: "Takes orders at the counter and tables. Cannot cancel orders.",
  },
  chef: {
    label: "Kitchen Chef / Cook",
    badgeBg: "#fff7ed",
    badgeColor: "#c2410c",
    border: "#fed7aa",
    desc: "Kitchen Display System (KDS) order prep. Cannot cancel orders.",
  },
  waiter: {
    label: "Floor Waiter",
    badgeBg: "#f0fdf4",
    badgeColor: "#15803d",
    border: "#bbf7d0",
    desc: "Table service, order delivery, and token serving.",
  },
  staff: {
    label: "General Staff",
    badgeBg: "#f1f5f9",
    badgeColor: "#475569",
    border: "#cbd5e1",
    desc: "General restaurant team member with POS terminal access.",
  },
};

export default function StaffManager({
  initialStaff,
  shopName,
  shopId,
  currentRole,
  currentStaffName,
}: StaffManagerProps) {
  const [staffList, setStaffList] = useState<ShopStaffMember[]>(initialStaff);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<ShopStaffMember | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("staff");
  const [pin, setPin] = useState("1234");
  const [hasPosAccess, setHasPosAccess] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setName("");
    setEmail("");
    setRole("staff");
    // Generate a random 4-digit PIN default
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(randomPin);
    setHasPosAccess(true);
    setIsActive(true);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (staff: ShopStaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email || "");
    setRole(staff.role);
    setPin(staff.pin);
    setHasPosAccess(staff.has_pos_access);
    setIsActive(staff.is_active);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("role", role);
    formData.append("pin", pin.trim());
    formData.append("has_pos_access", String(hasPosAccess));
    formData.append("is_active", String(isActive));

    startTransition(async () => {
      if (editingStaff) {
        const res = await updateShopStaffMember(editingStaff.id, formData);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setStaffList((prev) =>
            prev.map((s) =>
              s.id === editingStaff.id
                ? {
                    ...s,
                    name: name.trim(),
                    email: email.trim() || null,
                    role: role as any,
                    pin: pin.trim(),
                    has_pos_access: hasPosAccess,
                    is_active: isActive,
                  }
                : s
            )
          );
          setSuccessMsg(`Staff member "${name}" updated successfully!`);
          setTimeout(() => setSuccessMsg(null), 3500);
          setModalOpen(false);
        }
      } else {
        const res = await createShopStaffMember(formData);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.staff) {
          setStaffList((prev) => [res.staff!, ...prev]);
          setSuccessMsg(`New staff member "${name}" created successfully!`);
          setTimeout(() => setSuccessMsg(null), 3500);
          setModalOpen(false);
        }
      }
    });
  };

  const handleDeleteStaff = (staff: ShopStaffMember) => {
    if (!confirm(`Are you sure you want to delete ${staff.name}? They will lose all terminal access.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteShopStaffMember(staff.id);
      if (res.error) {
        alert(res.error);
      } else {
        setStaffList((prev) => prev.filter((s) => s.id !== staff.id));
        setSuccessMsg(`Staff member "${staff.name}" removed.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleToggleActive = (staff: ShopStaffMember) => {
    const nextState = !staff.is_active;
    startTransition(async () => {
      const res = await toggleShopStaffStatus(staff.id, nextState);
      if (res.error) {
        alert(res.error);
      } else {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staff.id ? { ...s, is_active: nextState } : s))
        );
      }
    });
  };

  const handleSimulateRole = (targetRole: "admin" | "sub_admin" | "staff", name?: string) => {
    startTransition(async () => {
      await switchAdminStaffRole(targetRole, name);
      window.location.reload();
    });
  };

  const totalStaff = staffList.length;
  const subAdminCount = staffList.filter((s) => s.role === "sub_admin" || s.role === "manager").length;
  const activeCount = staffList.filter((s) => s.is_active).length;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* ─── ROLE BANNER & CANCELLATION RESTRICTION POLICY ────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          borderRadius: "14px",
          padding: "24px 28px",
          color: "#ffffff",
          marginBottom: "24px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.4)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div style={{ maxWidth: "700px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                background: "rgba(234, 179, 8, 0.2)",
                color: "#fde047",
                border: "1px solid rgba(250, 204, 21, 0.3)",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Store size={13} />
              <span>{shopName} Branch Security</span>
            </span>

            <span
              style={{
                background: currentRole === "admin" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                color: currentRole === "admin" ? "#fca5a5" : "#6ee7b7",
                border: `1px solid ${currentRole === "admin" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              Current Active View: {currentRole === "admin" ? "👑 Master Admin" : "👤 Staff / Sub-Admin"}
            </span>
          </div>

          <h1 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Staff & Sub-Admin Control Center
          </h1>
          <p style={{ fontSize: "14px", color: "#cbd5e1", margin: 0, lineHeight: "1.6" }}>
            Create sub-admins and staff members specifically for <strong>{shopName}</strong>.
            <br />
            <strong style={{ color: "#f87171" }}>🔒 Strict Rule:</strong> Order cancellation is strictly reserved
            for the <strong>Shop Admin only</strong>. Sub-Admins and Staff can process, verify, and complete orders,
            but cancellation actions are locked.
          </p>
        </div>

        {/* Quick Role Switcher for instant preview */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "10px",
            padding: "14px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "8px" }}>
            ROLE TEST PREVIEW
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSimulateRole("admin", `${shopName} Admin`)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                background: currentRole === "admin" ? "#ef4444" : "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              👑 Admin View
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSimulateRole("staff", "Counter Staff")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                background: currentRole !== "admin" ? "#10b981" : "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              👤 Staff View
            </button>
          </div>
        </div>
      </div>

      {/* Success & Error alerts */}
      {successMsg && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "18px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "18px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── STATS & ACTIONS HEADER ───────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>TOTAL STAFF MEMBERS</div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>
            {totalStaff}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Assigned to this shop</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 700 }}>SUB-ADMINS & MANAGERS</div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#1e40af", marginTop: "4px" }}>
            {subAdminCount}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Supervisor tier</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#166534", fontWeight: 700 }}>ACTIVE STAFF</div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#15803d", marginTop: "4px" }}>
            {activeCount}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>PIN login enabled</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "18px 20px",
            border: "1px solid #fed7aa",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#c2410c", fontWeight: 700 }}>ORDER CANCEL POLICY</div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#9a3412", marginTop: "6px" }}>
              🔒 Master Admin Only
            </div>
            <div style={{ fontSize: "11px", color: "#78350f", marginTop: "2px" }}>
              Staff & Sub-Admins are blocked
            </div>
          </div>
        </div>
      </div>

      {/* ─── TOOLBAR: CREATE BUTTON & FILTERS ─────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
          Registered Team ({staffList.length})
        </div>

        {currentRole === "admin" && (
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} />
            <span>+ Create Sub-Admin / Staff</span>
          </button>
        )}
      </div>

      {/* ─── STAFF LIST ───────────────────────────────────────── */}
      {staffList.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center",
            border: "1px dashed #cbd5e1",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#f1f5f9",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              marginBottom: "16px",
            }}
          >
            <Users size={32} />
          </div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
            No Staff Members Yet
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px", maxWidth: "420px", marginInline: "auto" }}>
            Create Sub-Admins, Cashiers, or Kitchen Staff for this shop so team members can login with a PIN.
          </p>
          {currentRole === "admin" && (
            <button
              type="button"
              onClick={openCreateModal}
              style={{
                padding: "9px 18px",
                borderRadius: "7px",
                background: "#ef4444",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
              }}
            >
              + Create First Staff Member
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {staffList.map((staff) => {
            const roleCfg = ROLE_CONFIG[staff.role] || ROLE_CONFIG.staff;
            const isPinRevealed = revealedPins[staff.id];
            const isAdminMember = staff.role === "admin";

            return (
              <div
                key={staff.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  border: `1px solid ${staff.is_active ? "#e2e8f0" : "#fecaca"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
                  opacity: staff.is_active ? 1 : 0.65,
                }}
              >
                {/* Staff Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "240px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: isAdminMember ? "#fef3c7" : "#eff6ff",
                      color: isAdminMember ? "#b45309" : "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "16px",
                      border: `1px solid ${isAdminMember ? "#fde68a" : "#bfdbfe"}`,
                    }}
                  >
                    {staff.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                        {staff.name}
                      </span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 800,
                          background: roleCfg.badgeBg,
                          color: roleCfg.badgeColor,
                          border: `1px solid ${roleCfg.border}`,
                        }}
                      >
                        {roleCfg.label}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {staff.email ? staff.email : "No email linked"}
                    </div>
                  </div>
                </div>

                {/* Permissions & Security Summary */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {isAdminMember ? (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>👑 Full Admin</span>
                      <span>(Can Cancel Orders)</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="This staff role cannot cancel orders. Order cancel is strictly restricted to Shop Admin."
                    >
                      <Lock size={11} />
                      <span>Order Cancel: Blocked</span>
                    </span>
                  )}

                  {staff.has_pos_access && (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "#f0fdf4",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      ✓ POS Terminal Active
                    </span>
                  )}
                </div>

                {/* PIN Code Box */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>PIN:</span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "13px",
                      color: "#0f172a",
                      minWidth: "45px",
                      letterSpacing: isPinRevealed ? "1px" : "2px",
                    }}
                  >
                    {isPinRevealed ? staff.pin : "••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePinReveal(staff.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title={isPinRevealed ? "Hide PIN" : "Reveal PIN"}
                  >
                    {isPinRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(staff)}
                    disabled={isPending}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `1px solid ${staff.is_active ? "#bbf7d0" : "#cbd5e1"}`,
                      background: staff.is_active ? "#f0fdf4" : "#f1f5f9",
                      color: staff.is_active ? "#166534" : "#64748b",
                    }}
                  >
                    {staff.is_active ? "Active" : "Disabled"}
                  </button>

                  {currentRole === "admin" && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(staff)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff)}
                        disabled={isPending}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "6px",
                          background: "#ffffff",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                        title="Delete staff member"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ──────────────────────────────── */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(3px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                  {editingStaff ? "Edit Staff Member" : "Create New Sub-Admin or Staff"}
                </h3>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Shop: <strong>{shopName}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveStaff} style={{ padding: "20px 24px" }}>
              {errorMsg && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "14px",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Name */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. bilal@pizzashop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Role Selection */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                  Role & Permissions *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="sub_admin">Sub-Admin (Supervisor - CANNOT cancel orders)</option>
                  <option value="staff">Staff (Standard POS operator - CANNOT cancel orders)</option>
                  <option value="cashier">Cashier (Front desk counter - CANNOT cancel orders)</option>
                  <option value="chef">Chef / Cook (KDS Kitchen Display - CANNOT cancel orders)</option>
                  <option value="manager">Manager (Shift supervisor - CANNOT cancel orders)</option>
                  <option value="waiter">Waiter (Dine-in service - CANNOT cancel orders)</option>
                  <option value="admin">Shop Admin (👑 Master Authority - CAN cancel orders)</option>
                </select>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    padding: "6px 10px",
                    borderRadius: "5px",
                    background: role === "admin" ? "#fef3c7" : "#eff6ff",
                    color: role === "admin" ? "#92400e" : "#1e40af",
                    border: `1px solid ${role === "admin" ? "#fde68a" : "#bfdbfe"}`,
                  }}
                >
                  {role === "admin"
                    ? "👑 Full Admin: Has all permissions, including order cancellation and staff controls."
                    : "🔒 Sub-Admin / Staff: Allowed to take and fulfill orders, but CANNOT cancel orders (reserved for Admin)."}
                </div>
              </div>

              {/* Terminal Access PIN */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                  POS Login PIN (Numeric) *
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{3,8}"
                  maxLength={8}
                  placeholder="e.g. 5432"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    letterSpacing: "2px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                  Used to login directly at the POS terminal or quick staff authentication.
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={hasPosAccess}
                    onChange={(e) => setHasPosAccess(e.target.checked)}
                  />
                  <span>Allow POS Access</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Active Status</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
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
                  disabled={isPending}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "7px",
                    border: "none",
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  {isPending ? "Saving..." : editingStaff ? "Update Staff" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
