"use client";

/**
 * TableQRManager — Pizza Hut Style Restaurant Table Management & QR Code Generator.
 * Admin can create tables dynamically (Table 1, 2, VIP-1, Booth 4, etc.),
 * generate high-resolution table QR codes, and print ready-to-fold tent cards!
 */
import { useState, useEffect, useTransition } from "react";
import type { RestaurantTable } from "@/types/menu";
import { createRestaurantTable, deleteRestaurantTable } from "@/lib/admin-actions";

interface TableQRManagerProps {
  shopName?: string;
  initialTables?: RestaurantTable[];
}

export default function TableQRManager({
  shopName = "Pizza Shop",
  initialTables = [],
}: TableQRManagerProps) {
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [baseUrl, setBaseUrl] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"cards" | "list">("cards");

  // Form state
  const [tableNumber, setTableNumber] = useState("");
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCreateTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!tableNumber.trim()) {
      setFormError("Please enter a table number or label (e.g. 1, 4, VIP-1).");
      return;
    }

    const formData = new FormData();
    formData.append("table_number", tableNumber.trim());
    formData.append("table_name", tableName.trim());
    formData.append("capacity", capacity.toString());
    formData.append("status", "active");

    startTransition(async () => {
      const res = await createRestaurantTable({ error: null, success: false }, formData);
      if (res.error) {
        if (res.error.includes("restaurant_tables") || res.error.includes("schema cache")) {
          setFormError("The 'restaurant_tables' table is missing in Supabase. Please execute migration 'supabase/migrations/005_restaurant_tables.sql' in your Supabase SQL Editor.");
        } else {
          setFormError(res.error);
        }
      } else {
        // Optimistically add to state
        const newTable: RestaurantTable = {
          id: Date.now(),
          table_number: tableNumber.trim(),
          table_name: tableName.trim() || null,
          capacity,
          status: "active",
          token_code: `PH-${Math.floor(100 + Math.random() * 900)}`,
          created_at: new Date().toISOString(),
        };
        setTables((prev) => [...prev, newTable]);
        setTableNumber("");
        setTableName("");
        setCapacity(4);
        setShowAddModal(false);
      }
    });
  };

  const handleDelete = async (id: string | number, num: string) => {
    if (!confirm(`Are you sure you want to delete Table "${num}"? Scanned QR codes for this table will no longer work.`)) {
      return;
    }

    startTransition(async () => {
      setTables((prev) => prev.filter((t) => t.id !== id));
      await deleteRestaurantTable(id);
    });
  };

  return (
    <div>
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .qr-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 24px !important;
          }
          .table-tent-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>

      {/* ─── CONTROLS HEADER (Hidden in print) ────────────────────── */}
      <div
        className="no-print"
        style={{
          background: "#ffffff",
          border: "1px solid #fed7aa",
          borderRadius: "6px",
          padding: "20px 24px",
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(234, 88, 12, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                  color: "#fde047",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                }}
              >
                🍕
              </span>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Restaurant Tables &amp; QR Generator
              </h1>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Create dine-in tables, manage seating, and generate Pizza Hut style printable QR tent cards.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                border: "1px solid #b91c1c",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
              }}
            >
              <span>+</span>
              <span>Add New Table</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "5px",
                background: "#0f172a",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid #0f172a",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ea580c";
                e.currentTarget.style.borderColor = "#ea580c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0f172a";
                e.currentTarget.style.borderColor = "#0f172a";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print All Tent Cards</span>
            </button>
          </div>
        </div>

        {/* Tab switcher & Table stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            borderTop: "1px solid #f1f5f9",
            paddingTop: 14,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveTab("cards")}
              style={{
                padding: "6px 14px",
                borderRadius: 4,
                border: activeTab === "cards" ? "1.5px solid #dc2626" : "1px solid #fed7aa",
                background: activeTab === "cards" ? "#fef2f2" : "#ffffff",
                color: activeTab === "cards" ? "#dc2626" : "#7c2d12",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              🖨️ Printable Tent Cards ({tables.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("list")}
              style={{
                padding: "6px 14px",
                borderRadius: 4,
                border: activeTab === "list" ? "1.5px solid #dc2626" : "1px solid #fed7aa",
                background: activeTab === "list" ? "#fef2f2" : "#ffffff",
                color: activeTab === "list" ? "#dc2626" : "#7c2d12",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              📋 Tables Table View ({tables.length})
            </button>
          </div>

          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
            {tables.length} Total Registered Dine-In Tables
          </div>
        </div>
      </div>

      {/* ─── ADD TABLE MODAL ───────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              background: "#ffffff",
              borderRadius: 6,
              border: "2px solid #fed7aa",
              boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
              padding: "24px 20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🍽️</span>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Create New Restaurant Table
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "8px 12px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTable}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#7c2d12", textTransform: "uppercase", marginBottom: 5 }}>
                  Table Number / ID <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7, 12, VIP-1, Booth 3"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#7c2d12", textTransform: "uppercase", marginBottom: 5 }}>
                  Location / Section Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Window Corner, Terrace, Family Hall"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#7c2d12", textTransform: "uppercase", marginBottom: 5 }}>
                  Seating Capacity
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[2, 4, 6, 8, 10].map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setCapacity(cap)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 4,
                        border: capacity === cap ? "2px solid #dc2626" : "1px solid #cbd5e1",
                        background: capacity === cap ? "#fef2f2" : "#ffffff",
                        color: capacity === cap ? "#dc2626" : "#0f172a",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {cap}P
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
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
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                    border: "1px solid #b91c1c",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {isPending ? "Generating..." : "Generate Table QR Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TABLE LIST VIEW ───────────────────────────────── */}
      {activeTab === "list" && (
        <div
          className="no-print"
          style={{
            background: "#ffffff",
            borderRadius: 6,
            border: "1px solid #fed7aa",
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fff7ed", borderBottom: "1px solid #fed7aa" }}>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#7c2d12" }}>Table</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#7c2d12" }}>Location / Section</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#7c2d12" }}>Capacity</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#7c2d12" }}>Token ID</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#7c2d12" }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#7c2d12", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🍽️</div>
                    <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>No restaurant tables registered</div>
                    <div>Click &ldquo;+ Add New Table&rdquo; to create your first dine-in table QR.</div>
                  </td>
                </tr>
              ) : (
                tables.map((t) => {
                  const linkUrl = `${baseUrl || "http://localhost:3000"}/scan/${t.table_number}?token=${t.token_code || `PH-${t.table_number}`}${t.shop_id ? `&shop=${t.shop_id}` : ""}`;
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0f172a" }}>
                        <span style={{ fontSize: 14, color: "#dc2626" }}>Table #{t.table_number}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>
                        {t.table_name || "General Dining"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>
                        {t.capacity || 4} Seats
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, padding: "2px 6px", background: "#fef3c7", color: "#854d0e", borderRadius: 3 }}>
                          {t.token_code || "PH-001"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                          Active
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "4px 8px",
                              borderRadius: 3,
                              border: "1px solid #cbd5e1",
                              background: "#f8fafc",
                              color: "#2563eb",
                              fontSize: 11,
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            View Menu ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id, t.table_number)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 3,
                              border: "1px solid #fecaca",
                              background: "#ffffff",
                              color: "#dc2626",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 1: PIZZA HUT STYLE PRINTABLE QR TENT CARDS ─────────── */}
      {activeTab === "cards" && (
        tables.length === 0 ? (
          <div
            className="no-print"
            style={{
              padding: "54px 24px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "6px",
              border: "2px dashed #fed7aa",
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>🍽️</div>
            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              No Tables Found
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
              All fake / demo tables have been removed. Click below to create your real restaurant tables and generate genuine QR tent cards.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                border: "1px solid #b91c1c",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
              }}
            >
              <span>+</span>
              <span>Add New Table</span>
            </button>
          </div>
        ) : (
        <div
          className="qr-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "22px",
          }}
        >
          {tables.map((table) => {
            const targetUrl = `${baseUrl || "http://localhost:3000"}/scan/${table.table_number}?token=${table.token_code || `PH-${table.table_number}`}${table.shop_id ? `&shop=${table.shop_id}` : ""}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(targetUrl)}`;

            return (
              <div
                key={table.id}
                className="table-tent-card"
                style={{
                  background: "#ffffff",
                  border: "2px solid #0f172a",
                  borderRadius: "6px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                  position: "relative",
                }}
              >
                {/* Authentic Pizza Brand Banner Header */}
                <div
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                    padding: "12px 16px",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: 16 }}>🍕</span>
                    <span style={{ fontWeight: 900, fontSize: "13px", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                      {shopName}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      background: "#fde047",
                      color: "#78350f",
                      padding: "2px 6px",
                      borderRadius: 3,
                      textTransform: "uppercase",
                    }}
                  >
                    Dine-In
                  </span>
                </div>

                <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  {/* Table Number Title */}
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "24px",
                      fontWeight: 900,
                      color: "#0f172a",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      margin: "0 0 2px",
                    }}
                  >
                    TABLE {table.table_number}
                  </div>

                  {table.table_name && (
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#ea580c", textTransform: "uppercase", marginBottom: 12 }}>
                      {table.table_name} &bull; {table.capacity || 4} Seats
                    </div>
                  )}

                  {/* QR Code Container */}
                  <div
                    style={{
                      width: "180px",
                      height: "180px",
                      background: "#ffffff",
                      border: "2px solid #0f172a",
                      borderRadius: "5px",
                      padding: "6px",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrImageUrl}
                      alt={`QR Code for Table ${table.table_number}`}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      loading="lazy"
                    />
                  </div>

                  {/* Scan Instructions */}
                  <p style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a", margin: "0 0 2px" }}>
                    Scan with Camera to Order
                  </p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 10px", maxWidth: "230px" }}>
                    Point phone camera at QR code to open fresh menu &amp; order directly.
                  </p>

                  {/* Token Verification Info */}
                  <div
                    style={{
                      width: "100%",
                      background: "#fff7ed",
                      border: "1px dashed #f97316",
                      borderRadius: "4px",
                      padding: "6px 8px",
                      marginBottom: "14px",
                      fontSize: "10px",
                      color: "#9a3412",
                      fontWeight: 700,
                    }}
                  >
                    Table Token: <span style={{ fontFamily: "monospace", color: "#c2410c" }}>{table.token_code || "PH-001"}</span> &bull; Fresh pizza served right here!
                  </div>

                  {/* Actions (Hidden in print) */}
                  <div
                    className="no-print"
                    style={{
                      width: "100%",
                      paddingTop: "10px",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#dc2626",
                        textDecoration: "none",
                      }}
                    >
                      Test Link →
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(table.id, table.table_number)}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#94a3b8",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Table Tent Fold Indicator for print */}
                <div
                  style={{
                    width: "100%",
                    borderTop: "1px dashed #cbd5e1",
                    padding: "4px 8px",
                    background: "#f8fafc",
                    fontSize: "9px",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  ✂ Fold Line &bull; Table Stand Tent Card
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
