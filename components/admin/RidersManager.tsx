"use client";

import { useState, useTransition, useMemo } from "react";
import type { DeliveryRider } from "@/lib/admin-actions";
import {
  createDeliveryRider,
  updateDeliveryRider,
  deleteDeliveryRider,
  toggleDeliveryRiderStatus,
} from "@/lib/admin-actions";
import {
  Bike,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";

interface RidersManagerProps {
  initialRiders: DeliveryRider[];
  shopName: string;
  shopId: number | null;
}

export default function RidersManager({
  initialRiders,
  shopName,
  shopId,
}: RidersManagerProps) {
  const [riders, setRiders] = useState<DeliveryRider[]>(initialRiders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<DeliveryRider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicle: "Bike (Honda 125)",
    is_active: true,
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Filtered riders
  const filteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      const matchesSearch =
        rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.phone.replace(/\D/g, "").includes(searchQuery.replace(/\D/g, "")) ||
        (rider.vehicle && rider.vehicle.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "active") return rider.is_active;
      if (statusFilter === "inactive") return !rider.is_active;
      return true;
    });
  }, [riders, searchQuery, statusFilter]);

  const activeCount = riders.filter((r) => r.is_active).length;
  const inactiveCount = riders.length - activeCount;

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingRider(null);
    setFormData({
      name: "",
      phone: "",
      vehicle: "Bike (Honda 125)",
      is_active: true,
      notes: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rider: DeliveryRider) => {
    setEditingRider(rider);
    setFormData({
      name: rider.name,
      phone: rider.phone,
      vehicle: rider.vehicle || "Bike (Honda 125)",
      is_active: rider.is_active,
      notes: rider.notes || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Please enter rider full name.");
      return;
    }
    if (!formData.phone.trim()) {
      setFormError("Please enter rider WhatsApp phone number.");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      if (editingRider) {
        const res = await updateDeliveryRider(editingRider.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          vehicle: formData.vehicle.trim(),
          is_active: formData.is_active,
          notes: formData.notes.trim() || null,
        });

        if (res.success && res.data) {
          setRiders((prev) =>
            prev.map((r) => (r.id === editingRider.id ? (res.data as DeliveryRider) : r))
          );
          setIsModalOpen(false);
        } else {
          setFormError(res.error || "Failed to update rider.");
        }
      } else {
        const res = await createDeliveryRider({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          vehicle: formData.vehicle.trim(),
          is_active: formData.is_active,
          notes: formData.notes.trim() || undefined,
        });

        if (res.success && res.data) {
          setRiders((prev) => [res.data as DeliveryRider, ...prev]);
          setIsModalOpen(false);
        } else {
          setFormError(res.error || "Failed to create rider.");
        }
      }
    });
  };

  // Toggle active status
  const handleToggleStatus = (rider: DeliveryRider) => {
    const newStatus = !rider.is_active;
    // Optimistic UI update
    setRiders((prev) =>
      prev.map((r) => (r.id === rider.id ? { ...r, is_active: newStatus } : r))
    );

    startTransition(async () => {
      const res = await toggleDeliveryRiderStatus(rider.id, newStatus);
      if (!res.success) {
        // revert on failure
        setRiders((prev) =>
          prev.map((r) => (r.id === rider.id ? { ...r, is_active: rider.is_active } : r))
        );
      }
    });
  };

  // Delete rider
  const handleDelete = (rider: DeliveryRider) => {
    if (!confirm(`Are you sure you want to remove rider "${rider.name}" (${rider.phone})?`)) {
      return;
    }

    // Optimistic UI update
    setRiders((prev) => prev.filter((r) => r.id !== rider.id));

    startTransition(async () => {
      const res = await deleteDeliveryRider(rider.id);
      if (!res.success) {
        // revert
        setRiders((prev) => [rider, ...prev]);
        alert(res.error || "Failed to delete rider.");
      }
    });
  };

  const sqlMigrationCode = `-- Run in: Supabase Dashboard → SQL Editor → Run
CREATE TABLE IF NOT EXISTS public.delivery_riders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT DEFAULT 'Bike',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to delivery_riders" ON public.delivery_riders FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON public.delivery_riders TO anon, authenticated, service_role;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 16px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Bike size={22} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.3px",
                }}
              >
                Delivery Riders Directory
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                Save & manage delivery riders, WhatsApp contact numbers, and instant order dispatch for {shopName}.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            style={{
              height: "36px",
              padding: "0 12px",
              borderRadius: "6px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#475569",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="View database migration SQL for cloud synchronization"
          >
            <span>🗄️ SQL Sync</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              height: "36px",
              padding: "0 16px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "#ffffff",
              fontSize: "12.5px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
            }}
            className="hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            <span>Add New Rider</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bike size={22} />
          </div>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Total Riders
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{riders.length}</div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>
              On Duty (Active)
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#047857" }}>{activeCount}</div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fed7aa",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              background: "#fff7ed",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <XCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#9a3412", textTransform: "uppercase" }}>
              Off Duty
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#c2410c" }}>{inactiveCount}</div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#1d4ed8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>
              WhatsApp Bot
            </span>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#1d4ed8" }}>Sole-What Ready ✓</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "12px 14px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: "380px" }}>
          <Search
            size={15}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            type="text"
            placeholder="Search rider by name, phone or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              height: "34px",
              paddingLeft: "32px",
              paddingRight: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              color: "#0f172a",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              border: "1px solid " + (statusFilter === "all" ? "#0f172a" : "#cbd5e1"),
              background: statusFilter === "all" ? "#0f172a" : "#ffffff",
              color: statusFilter === "all" ? "#ffffff" : "#475569",
            }}
          >
            All ({riders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              border: "1px solid " + (statusFilter === "active" ? "#059669" : "#cbd5e1"),
              background: statusFilter === "active" ? "#ecfdf5" : "#ffffff",
              color: statusFilter === "active" ? "#065f46" : "#475569",
            }}
          >
            On Duty ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              border: "1px solid " + (statusFilter === "inactive" ? "#ea580c" : "#cbd5e1"),
              background: statusFilter === "inactive" ? "#fff7ed" : "#ffffff",
              color: statusFilter === "inactive" ? "#9a3412" : "#475569",
            }}
          >
            Off Duty ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Riders Grid */}
      {filteredRiders.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "8px",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "#94a3b8" }}>
            <Bike size={44} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
            No Delivery Riders Found
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
            {searchQuery
              ? "No riders match your search query."
              : "You haven't added any riders yet. Add your first delivery rider to enable 1-click dispatch on Live Orders!"}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              padding: "8px 18px",
              background: "#059669",
              color: "#ffffff",
              borderRadius: "6px",
              border: "none",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            + Add First Rider
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
            gap: "12px",
          }}
        >
          {filteredRiders.map((rider) => {
            const cleanPhone = rider.phone.replace(/[^0-9]/g, "");
            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Salam ${rider.name}! Testing WhatsApp connection from ${shopName} Dispatch System.`
            )}`;

            return (
              <div
                key={rider.id}
                style={{
                  background: "#ffffff",
                  border: rider.is_active ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  {/* Top Bar: Rider Name + Status Pill */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: rider.is_active ? "#ecfdf5" : "#f1f5f9",
                          color: rider.is_active ? "#059669" : "#64748b",
                          border: rider.is_active ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "14px",
                        }}
                      >
                        {rider.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                          {rider.name}
                        </h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: "#f1f5f9",
                              color: "#475569",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            🛵 {rider.vehicle || "Bike"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(rider)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: 800,
                        cursor: "pointer",
                        border: rider.is_active ? "1px solid #a7f3d0" : "1px solid #fed7aa",
                        background: rider.is_active ? "#ecfdf5" : "#fff7ed",
                        color: rider.is_active ? "#065f46" : "#9a3412",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Click to toggle On-Duty vs Off-Duty"
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: rider.is_active ? "#10b981" : "#f97316",
                        }}
                      />
                      <span>{rider.is_active ? "On Duty" : "Off Duty"}</span>
                    </button>
                  </div>

                  {/* Contact Info Card */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      marginBottom: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Phone size={12} style={{ color: "#64748b" }} />
                        <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                          {rider.phone}
                        </span>
                      </div>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          color: "#166534",
                          background: "#dcfce7",
                          border: "1px solid #bbf7d0",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                        title="Open WhatsApp chat directly"
                      >
                        <MessageSquare size={10} />
                        <span>Chat ↗</span>
                      </a>
                    </div>

                    {rider.notes && (
                      <p style={{ margin: "5px 0 0", fontSize: "10.5px", color: "#64748b", fontStyle: "italic" }}>
                        {rider.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rider)}
                    style={{
                      height: "30px",
                      borderRadius: "5px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                    className="hover:bg-slate-50 transition-all"
                  >
                    <Edit2 size={12} />
                    <span>Edit Rider</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(rider)}
                    style={{
                      height: "30px",
                      borderRadius: "5px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                    className="hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Rider Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
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
              borderRadius: "10px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bike size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                  {editingRider ? "Edit Delivery Rider" : "Add New Delivery Rider"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} style={{ padding: "16px" }}>
              {formError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    fontSize: "12px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Rider Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Mehmood"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 03001234567 or +923001234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: "10.5px", color: "#64748b", marginTop: "3px", display: "block" }}>
                  Orders will be automatically dispatched to this WhatsApp number via Sole-What.
                </span>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Vehicle / Transport
                </label>
                <input
                  type="text"
                  placeholder="e.g. Honda 125, CD 70, Car, Scooter"
                  value={formData.vehicle}
                  onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Notes / Area (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Night shift rider, covers North zone"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#059669" }}
                  />
                  <span>Mark as On-Duty (Available for delivery assignment)</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
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
                    padding: "8px 18px",
                    borderRadius: "6px",
                    background: "#059669",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    cursor: isPending ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isPending && <RefreshCw size={13} className="animate-spin" />}
                  <span>{editingRider ? "Save Changes" : "Save Rider"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SQL Migration Modal */}
      {showSqlModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
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
              borderRadius: "10px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>🗄️</span>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                  Supabase Cloud SQL Migration (023)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Riders are automatically stored locally and will sync across devices once you execute this SQL in your{" "}
              <strong>Supabase Dashboard → SQL Editor</strong>:
            </p>

            <pre
              style={{
                background: "#0f172a",
                color: "#38bdf8",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontFamily: "monospace",
                overflowX: "auto",
                maxHeight: "200px",
                margin: "0 0 14px",
              }}
            >
              {sqlMigrationCode}
            </pre>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={copySqlToClipboard}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: copiedSql ? "#16a34a" : "#0f172a",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? "Copied SQL ✓" : "Copy SQL Code"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
