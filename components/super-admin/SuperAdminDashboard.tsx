"use client";

import { useState, useTransition } from "react";
import type { Shop } from "@/types/menu";
import type { SuperAdminMetrics } from "@/lib/super-admin-data";
import {
  createShop,
  updateShop,
  toggleShopStatus,
  deleteShop,
  impersonateShop,
  superAdminLogout,
} from "@/lib/super-admin-actions";
import ShopModal from "./ShopModal";

interface SuperAdminDashboardProps {
  initialShops: Shop[];
  initialMetrics: SuperAdminMetrics;
}

export default function SuperAdminDashboard({
  initialShops,
  initialMetrics,
}: SuperAdminDashboardProps) {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [metrics, setMetrics] = useState<SuperAdminMetrics>(initialMetrics);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string | number, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopyMenuLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const [isPending, startTransition] = useTransition();

  // Filtered shops
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.owner_phone && shop.owner_phone.includes(searchQuery)) ||
      (shop.branch_address && shop.branch_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      shop.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || shop.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingShop(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shop: Shop) => {
    setEditingShop(shop);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: FormData, editingId?: number | string) => {
    if (editingId) {
      const res = await updateShop(editingId, formData);
      if (!res.error) {
        setShops((prev) =>
          prev.map((s) => {
            if (s.id === editingId) {
              return {
                ...s,
                name: formData.get("name") as string,
                owner_name: formData.get("owner_name") as string,
                owner_phone: (formData.get("owner_phone") as string) || null,
                owner_email: (formData.get("owner_email") as string) || null,
                branch_address: (formData.get("branch_address") as string) || null,
                password: (formData.get("password") as string) || s.password,
                currency_symbol: formData.get("currency_symbol") as string,
                plan: formData.get("plan") as "starter" | "pro" | "enterprise",
                status: formData.get("status") as "active" | "suspended" | "pending",
                notes: (formData.get("notes") as string) || null,
              };
            }
            return s;
          })
        );
      }
      return res;
    } else {
      const res = await createShop({ error: null, success: false }, formData);
      if (res.shop) {
        setShops((prev) => [res.shop!, ...prev]);
        setMetrics((prev) => ({
          ...prev,
          totalShops: prev.totalShops + 1,
          activeShops: res.shop!.status === "active" ? prev.activeShops + 1 : prev.activeShops,
          suspendedShops: res.shop!.status === "suspended" ? prev.suspendedShops + 1 : prev.suspendedShops,
        }));
      }
      return { error: res.error };
    }
  };

  const handleToggleStatus = (id: number | string, currentStatus: "active" | "suspended" | "pending") => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    setShops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
    );
    setMetrics((prev) => ({
      ...prev,
      activeShops: nextStatus === "active" ? prev.activeShops + 1 : Math.max(0, prev.activeShops - 1),
      suspendedShops: nextStatus === "suspended" ? prev.suspendedShops + 1 : Math.max(0, prev.suspendedShops - 1),
    }));

    startTransition(async () => {
      const res = await toggleShopStatus(id, currentStatus);
      if (res.error) {
        alert(`Error updating status: ${res.error}`);
        setShops((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: currentStatus } : s))
        );
      }
    });
  };

  const handleDelete = (id: number | string, name: string) => {
    if (!confirm(`Are you sure you want to delete shop "${name}"? This action cannot be undone.`)) {
      return;
    }

    setShops((prev) => prev.filter((s) => s.id !== id));
    setMetrics((prev) => ({
      ...prev,
      totalShops: Math.max(0, prev.totalShops - 1),
    }));

    startTransition(async () => {
      const res = await deleteShop(id);
      if (res.error) {
        alert(`Error deleting shop: ${res.error}`);
      }
    });
  };

  const handleCopyCredentials = (shop: Shop) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const text = `🍕 *${shop.name}* Login Credentials\n\n🔗 Admin Portal: ${origin}/admin/login\n🔑 Password: ${shop.password || "shop123"}\n\nKeep this password secure.`;
    navigator.clipboard.writeText(text);
    setCopiedId(shop.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const togglePasswordVisibility = (id: string | number) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sqlMigrationCode = `-- Run this in Supabase Dashboard → SQL Editor → Run
CREATE TABLE IF NOT EXISTS public.shops (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_phone TEXT,
  branch_address TEXT,
  password TEXT NOT NULL DEFAULT 'shop123',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
  plan TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  total_orders_count INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops (slug);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops (status);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active shops" ON public.shops;
CREATE POLICY "Allow public read access to active shops"
  ON public.shops FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access to service_role on shops" ON public.shops;
CREATE POLICY "Allow full access to service_role on shops"
  ON public.shops FOR ALL TO service_role USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div style={{ maxWidth: "1380px", margin: "0 auto", padding: "28px 24px", color: "#0f172a" }}>
      {/* ─── TOP EXECUTIVE BAR (WHITE THEME) ───────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "#ffffff",
          padding: "20px 24px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
            }}
          >
            {/* Real SVG Crown Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
              <path d="M4 20h16" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Super Admin Portal
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                Platform Controller
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
              Manage multi-shop pizza branches, generate owner passwords, and regulate live access.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 16px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
              border: "1px solid #b91c1c",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Register New Shop</span>
          </button>

          <button
            type="button"
            onClick={() => startTransition(() => impersonateShop())}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "6px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Open Store Manager (/admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "6px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#c2410c",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span>SQL Schema</span>
          </button>

          <button
            type="button"
            onClick={() => startTransition(() => superAdminLogout())}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "6px",
              background: "#ffffff",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ─── DATABASE MIGRATION WARNING IF NEEDED ───────────────────── */}
      {!metrics.isDatabaseConfigured && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "8px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "#d97706" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#92400e", marginBottom: "2px" }}>
                Database Setup Required: Table &apos;shops&apos; does not exist in Supabase yet
              </div>
              <div style={{ fontSize: "12px", color: "#b45309" }}>
                Run migration <code>007_super_admin_shops.sql</code> in your Supabase SQL Editor to enable multi-shop persistence.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "5px",
              background: "#d97706",
              border: "none",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            View &amp; Copy SQL Script →
          </button>
        </div>
      )}

      {/* ─── PLATFORM METRICS CARDS (WHITE THEME) ───────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Metric 1: Total Shops */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "18px 20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Total Shops
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "#f1f5f9",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a" }}>
            {metrics.totalShops}
          </div>
        </div>

        {/* Metric 2: Active Shops */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "18px 20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Active / Online
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#16a34a" }}>
            {metrics.activeShops}
          </div>
        </div>

        {/* Metric 3: Suspended Shops */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "18px 20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Suspended / Blocked
            </span>
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
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#dc2626" }}>
            {metrics.suspendedShops}
          </div>
        </div>

        {/* Metric 4: Total Orders */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fed7aa",
            borderRadius: "8px",
            padding: "18px 20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Total Network Orders
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "#fff7ed",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#ea580c" }}>
            {metrics.totalOrders}
          </div>
        </div>

        {/* Metric 5: Platform Revenue */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "18px 20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Network Revenue
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "#f0f9ff",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#0284c7" }}>
            Rs. {metrics.totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ──────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "14px 18px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <div style={{ color: "#94a3b8" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search shops by name, owner, branch, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#0f172a",
              fontSize: "13px",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Status filter tabs */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "6px" }}>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "none",
                background: statusFilter === "all" ? "#ffffff" : "transparent",
                color: statusFilter === "all" ? "#0f172a" : "#64748b",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: statusFilter === "all" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              All ({shops.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "none",
                background: statusFilter === "active" ? "#ffffff" : "transparent",
                color: statusFilter === "active" ? "#16a34a" : "#64748b",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: statusFilter === "active" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              Active ({shops.filter((s) => s.status === "active").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("suspended")}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "none",
                background: statusFilter === "suspended" ? "#ffffff" : "transparent",
                color: statusFilter === "suspended" ? "#dc2626" : "#64748b",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: statusFilter === "suspended" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              Suspended ({shops.filter((s) => s.status === "suspended").length})
            </button>
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "6px" }}>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border: "none",
                background: viewMode === "cards" ? "#ffffff" : "transparent",
                color: viewMode === "cards" ? "#0f172a" : "#64748b",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: viewMode === "cards" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border: "none",
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#0f172a" : "#64748b",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: viewMode === "table" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SHOPS LISTING (WHITE THEME) ───────────────────────────── */}
      {filteredShops.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#64748b", marginBottom: "12px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
            No Shops Found
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
            {searchQuery
              ? `No shops matched your search for "${searchQuery}".`
              : "No shops registered in the system yet. Click below to add the first shop."}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Register New Shop
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* GRID CARDS VIEW */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredShops.map((shop) => {
            const isSuspended = shop.status === "suspended";
            const isPasswordVisible = !!revealedPasswords[shop.id];

            return (
              <div
                key={shop.id}
                style={{
                  background: "#ffffff",
                  border: isSuspended ? "1px solid #fecaca" : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Card Top Strip */}
                <div
                  style={{
                    padding: "14px 18px",
                    background: isSuspended ? "#fef2f2" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "6px",
                        background: isSuspended ? "#fee2e2" : "#ffedd5",
                        color: isSuspended ? "#dc2626" : "#ea580c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 22 20 2 20 12 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                        {shop.name}
                      </h3>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        ID #{shop.id} &bull; Slug: <code>{shop.slug}</code>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: isSuspended ? "#fee2e2" : "#dcfce7",
                      color: isSuspended ? "#b91c1c" : "#15803d",
                      border: isSuspended ? "1px solid #fecaca" : "1px solid #bbf7d0",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSuspended ? "#dc2626" : "#16a34a" }} />
                    {isSuspended ? "Suspended" : "Active"}
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Owner & Contact */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 700 }}>
                        Owner Name
                      </span>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{shop.owner_name}</span>
                    </div>

                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 700 }}>
                        Phone / WhatsApp
                      </span>
                      <span style={{ color: "#334155", fontWeight: 600 }}>{shop.owner_phone || "—"}</span>
                    </div>
                  </div>

                  {/* Branch & Plan */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 700 }}>
                        Currency &amp; Plan
                      </span>
                      <span style={{ color: "#ea580c", fontWeight: 700, textTransform: "uppercase" }}>
                        {shop.currency_symbol} &bull; {shop.plan}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 700 }}>
                        Branch Location
                      </span>
                      <span style={{ color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {shop.branch_address || "Main Branch"}
                      </span>
                    </div>
                  </div>

                  {/* Distinct Live Customer Menu Link Box */}
                  <div
                    style={{
                      background: "#f0fdf4",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", display: "block" }}>
                        Customer Menu Link
                      </span>
                      <a
                        href={`/${shop.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#15803d",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                        title="Open this shop's customer menu in a new tab"
                      >
                        <span>/{shop.slug}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyMenuLink(shop.slug)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "4px",
                        border: "1px solid #86efac",
                        background: "#ffffff",
                        color: copiedSlug === shop.slug ? "#16a34a" : "#15803d",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                      title="Copy shop's direct menu link"
                    >
                      {copiedSlug === shop.slug ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Credentials Box (White / Light) */}
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      border: "1px solid #e2e8f0",
                      marginTop: "2px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                        Owner Login Credentials
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(shop)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: copiedId === shop.id ? "#16a34a" : "#ea580c",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {copiedId === shop.id ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>Copy Details</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#334155" }}>
                        Password:{" "}
                        <code style={{ color: "#c2410c", fontFamily: "monospace", fontWeight: 800, background: "#ffffff", padding: "2px 6px", borderRadius: "3px", border: "1px solid #cbd5e1" }}>
                          {isPasswordVisible ? (shop.password || "shop123") : "••••••••"}
                        </code>
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(shop.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {isPasswordVisible ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* Internal Notes if any */}
                  {shop.notes && (
                    <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                      Note: {shop.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9",
                      marginTop: "auto",
                    }}
                  >
                    {/* Toggle Status */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleStatus(shop.id, shop.status)}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: "5px",
                        background: isSuspended ? "#f0fdf4" : "#fef2f2",
                        border: isSuspended ? "1px solid #bbf7d0" : "1px solid #fecaca",
                        color: isSuspended ? "#15803d" : "#b91c1c",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      {isSuspended ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Activate</span>
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          <span>Suspend</span>
                        </>
                      )}
                    </button>

                    {/* Enter Branch Admin */}
                    <button
                      type="button"
                      onClick={() => startTransition(() => impersonateShop(shop.id, shop.name))}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "5px",
                        background: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 1px 4px rgba(220, 38, 38, 0.2)",
                      }}
                      title={`Open ${shop.name} Store Manager`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      <span>Enter</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(shop)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: "5px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        color: "#334155",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(shop.id, shop.name)}
                      style={{
                        padding: "7px 9px",
                        borderRadius: "5px",
                        background: "#ffffff",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Delete Shop"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (WHITE THEME) */
        <div
          style={{
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Shop &amp; Slug</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Owner &amp; Phone</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Plan / Currency</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Password</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Status</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => {
                const isSuspended = shop.status === "suspended";
                const isPasswordVisible = !!revealedPasswords[shop.id];

                return (
                  <tr key={shop.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{shop.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                        <a
                          href={`/${shop.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#16a34a",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            background: "#f0fdf4",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            border: "1px solid #bbf7d0",
                          }}
                          title="Open Live Menu"
                        >
                          <span>/{shop.slug}</span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyMenuLink(shop.slug)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: copiedSlug === shop.slug ? "#16a34a" : "#64748b",
                            cursor: "pointer",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Copy Link"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{shop.owner_name}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{shop.owner_phone || "—"}</div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", background: "#f1f5f9", color: "#ea580c", borderRadius: "3px", textTransform: "uppercase" }}>
                        {shop.plan} &bull; {shop.currency_symbol}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <code style={{ color: "#c2410c", fontFamily: "monospace", fontWeight: 700 }}>
                          {isPasswordVisible ? (shop.password || "shop123") : "••••••"}
                        </code>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(shop.id)}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "11px" }}
                        >
                          {isPasswordVisible ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(shop.id, shop.status)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: isSuspended ? "1px solid #fecaca" : "1px solid #bbf7d0",
                          background: isSuspended ? "#fee2e2" : "#dcfce7",
                          color: isSuspended ? "#b91c1c" : "#15803d",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {isSuspended ? "Suspended" : "Active"}
                      </button>
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(shop)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: copiedId === shop.id ? "#16a34a" : "#475569",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Copy Credentials"
                        >
                          {copiedId === shop.id ? "✓ Copied" : "Copy"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startTransition(() => impersonateShop(shop.id, shop.name))}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "none",
                            background: "#ea580c",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Enter Store Manager"
                        >
                          Enter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(shop)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #cbd5e1",
                            background: "#f1f5f9",
                            color: "#334155",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(shop.id, shop.name)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
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

      {/* ─── CREATE / EDIT MODAL ───────────────────────────────────── */}
      <ShopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editingShop={editingShop}
      />

      {/* ─── SQL MIGRATION MODAL (WHITE THEME) ─────────────────────── */}
      {showSqlModal && (
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
              maxWidth: "680px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
              color: "#0f172a",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ color: "#d97706" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    Migration 007: Super Admin Shops Table
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    Execute this SQL script in <strong>Supabase Dashboard &rarr; SQL Editor &rarr; Run</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", color: "#64748b", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <pre
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "16px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#0f172a",
                maxHeight: "360px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                marginBottom: "16px",
              }}
            >
              {sqlMigrationCode}
            </pre>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "5px",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopySql}
                style={{
                  padding: "8px 20px",
                  borderRadius: "5px",
                  background: copiedSql ? "#16a34a" : "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {copiedSql ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy SQL Script</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
