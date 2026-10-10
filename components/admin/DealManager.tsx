"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Deal } from "@/types/menu";
import { deleteDeal, toggleDealAvailability } from "@/lib/deal-actions";
import {
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  Search,
  Flame,
  Tag,
  Layers,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

interface DealManagerProps {
  initialDeals: Deal[];
  currentShopId?: number | null;
  currentShopName?: string;
  isMasterAdmin?: boolean;
  availableShops?: { id: number; name: string; slug: string }[];
  currencySymbol?: string;
}

export default function DealManager({
  initialDeals,
  currentShopId,
  currentShopName = "Pizza Admin",
  isMasterAdmin = false,
  availableShops = [],
  currencySymbol = "Rs.",
}: DealManagerProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "inactive">("all");

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deal.description && deal.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (deal.badge && deal.badge.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterTab === "active") return deal.is_available === true;
    if (filterTab === "inactive") return deal.is_available === false;
    return true;
  });

  const activeCount = deals.filter((d) => d.is_available).length;
  const hiddenCount = deals.filter((d) => !d.is_available).length;

  const handleToggle = (deal: Deal) => {
    const newStatus = !deal.is_available;
    setDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, is_available: newStatus } : d))
    );

    startTransition(async () => {
      const res = await toggleDealAvailability(deal.id, newStatus);
      if (res.error) {
        setErrorMessage(res.error);
        // revert
        setDeals((prev) =>
          prev.map((d) => (d.id === deal.id ? { ...d, is_available: !newStatus } : d))
        );
      }
    });
  };

  const handleDelete = (id: number | string, title: string) => {
    if (!confirm(`Are you sure you want to delete the deal "${title}"?\n\nThis will also remove it from customer menus.`)) {
      return;
    }

    setDeals((prev) => prev.filter((d) => d.id !== id));

    startTransition(async () => {
      const res = await deleteDeal(id);
      if (res.error) {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {/* KPI Pills */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Tag size={16} color="#ea580c" />
            <span style={{ fontSize: "12px", color: "#64748b" }}>Total Deals:</span>
            <strong style={{ fontSize: "14px", color: "#0f172a" }}>{deals.length}</strong>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
            <span style={{ fontSize: "12px", color: "#64748b" }}>Active on Menu:</span>
            <strong style={{ fontSize: "14px", color: "#16a34a" }}>{activeCount}</strong>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94a3b8" }} />
            <span style={{ fontSize: "12px", color: "#64748b" }}>Sold Out / Hidden:</span>
            <strong style={{ fontSize: "14px", color: "#64748b" }}>{hiddenCount}</strong>
          </div>
        </div>

        {/* Dedicated Full-Page Link: + Create New Deal */}
        <Link
          href="/admin/deals/new"
          style={{
            background: "#ea580c",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <Plus size={16} />
          <span>+ Create New Deal (Full Page)</span>
        </Link>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          style={{
            marginBottom: "16px",
            padding: "10px 14px",
            borderRadius: "5px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Search & Tabs */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px" }}>
          <Search
            size={16}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            type="text"
            placeholder="Search deals by title, items, badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              border: "1px solid #cbd5e1",
              borderRadius: "5px",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setFilterTab("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              background: filterTab === "all" ? "#0f172a" : "#f8fafc",
              color: filterTab === "all" ? "#ffffff" : "#475569",
              borderColor: filterTab === "all" ? "#0f172a" : "#cbd5e1",
            }}
          >
            All Deals ({deals.length})
          </button>
          <button
            onClick={() => setFilterTab("active")}
            style={{
              padding: "6px 14px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              background: filterTab === "active" ? "#16a34a" : "#f8fafc",
              color: filterTab === "active" ? "#ffffff" : "#475569",
              borderColor: filterTab === "active" ? "#16a34a" : "#cbd5e1",
            }}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterTab("inactive")}
            style={{
              padding: "6px 14px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              background: filterTab === "inactive" ? "#64748b" : "#f8fafc",
              color: filterTab === "inactive" ? "#ffffff" : "#475569",
              borderColor: filterTab === "inactive" ? "#64748b" : "#cbd5e1",
            }}
          >
            Sold Out ({hiddenCount})
          </button>
        </div>
      </div>

      {/* Deals Grid */}
      {filteredDeals.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "2px dashed #cbd5e1",
            borderRadius: "6px",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#ffedd5",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Sparkles size={28} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
            {searchQuery ? "No matching deals found" : "No special deals configured yet"}
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#64748b", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
            Create combo deals, family feasts, or midnight specials by grouping your menu products together with promotional pricing.
          </p>
          <Link
            href="/admin/deals/new"
            style={{
              background: "#ea580c",
              color: "#ffffff",
              border: "none",
              borderRadius: "5px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <Plus size={16} />
            <span>Create First Deal on Full Page</span>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredDeals.map((deal) => {
            const hasOriginalPrice = deal.original_price && deal.original_price > deal.deal_price;
            const savings = hasOriginalPrice ? Number(deal.original_price) - Number(deal.deal_price) : 0;
            const savingsPercent = hasOriginalPrice && deal.original_price
              ? Math.round((savings / Number(deal.original_price)) * 100)
              : 0;

            const items: string[] = Array.isArray(deal.items_included)
              ? deal.items_included
              : typeof deal.items_included === "string"
              ? (deal.items_included as string).split(",").map((s) => s.trim())
              : [];

            return (
              <div
                key={deal.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  opacity: deal.is_available ? 1 : 0.65,
                }}
              >
                <div>
                  {/* Image banner */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "170px",
                      background: "#f1f5f9",
                      overflow: "hidden",
                    }}
                  >
                    {deal.image_url ? (
                      <img
                        src={deal.image_url}
                        alt={deal.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                          background: "linear-gradient(135deg, #fed7aa 0%, #fde047 100%)",
                        }}
                      >
                        <ShoppingBag size={48} color="#ea580c" />
                      </div>
                    )}

                    {/* Badge */}
                    {deal.badge && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          background: "rgba(15, 23, 42, 0.85)",
                          backdropFilter: "blur(4px)",
                          color: "#ffffff",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {deal.badge}
                      </div>
                    )}

                    {/* Savings Pill */}
                    {savingsPercent > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "#16a34a",
                          color: "#ffffff",
                          padding: "3px 8px",
                          borderRadius: "20px",
                          fontSize: "10px",
                          fontWeight: 800,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        SAVE {savingsPercent}%
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {deal.title}
                      </h4>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "#ea580c" }}>
                          {currencySymbol} {Number(deal.deal_price).toLocaleString()}
                        </div>
                        {hasOriginalPrice && (
                          <div style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "line-through" }}>
                            {currencySymbol} {Number(deal.original_price).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {deal.description && (
                      <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                        {deal.description}
                      </p>
                    )}

                    {/* Included items tags */}
                    {items.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                        {items.map((it, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              color: "#334155",
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            ✓ {it}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Availability toggle */}
                  <button
                    onClick={() => handleToggle(deal)}
                    style={{
                      background: deal.is_available ? "#dcfce7" : "#fee2e2",
                      color: deal.is_available ? "#15803d" : "#b91c1c",
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {deal.is_available ? "● Available on Menu" : "○ Sold Out / Hidden"}
                  </button>

                  <div style={{ display: "flex", gap: "6px" }}>
                    {/* Link to Full Page Edit */}
                    <Link
                      href={`/admin/deals/${deal.id}/edit`}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "5px",
                        padding: "5px 8px",
                        cursor: "pointer",
                        color: "#475569",
                        display: "flex",
                        alignItems: "center",
                        textDecoration: "none",
                      }}
                      title="Edit Deal on Full Page"
                    >
                      <Edit2 size={13} />
                    </Link>
                    <button
                      onClick={() => handleDelete(deal.id, deal.title)}
                      style={{
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        borderRadius: "5px",
                        padding: "5px 8px",
                        cursor: "pointer",
                        color: "#e11d48",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Delete Deal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
