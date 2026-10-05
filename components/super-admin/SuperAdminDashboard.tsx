"use client";

import { useState, useEffect, useTransition } from "react";
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
import {
  Crown,
  Building2,
  Store,
  Plus,
  Clock,
  Search,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  AlertOctagon,
  ShoppingBag,
  Coins,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Database,
  LogOut,
  MessageSquare,
  ArrowUpRight,
  X,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

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
  const [pakistanTime, setPakistanTime] = useState<string>("");
  const [pakistanDate, setPakistanDate] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const updatePKTime = () => {
      const now = new Date();
      setPakistanTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setPakistanDate(
        now.toLocaleDateString("en-US", {
          timeZone: "Asia/Karachi",
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
    };

    updatePKTime();
    const interval = setInterval(updatePKTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyMenuLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Filtered shops
  const filteredShops = shops.filter((shop) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      shop.name.toLowerCase().includes(query) ||
      shop.owner_name.toLowerCase().includes(query) ||
      (shop.owner_phone && shop.owner_phone.includes(query)) ||
      (shop.branch_address && shop.branch_address.toLowerCase().includes(query)) ||
      shop.slug.toLowerCase().includes(query);

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
                whatsapp_session_id: (formData.get("whatsapp_session_id") as string) || null,
                whatsapp_api_key: (formData.get("whatsapp_api_key") as string) || null,
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
  whatsapp_session_id TEXT,
  whatsapp_api_key TEXT,
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
    <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "28px 20px", color: "#0f172a" }}>
      {/* ─── TOP EXECUTIVE COMMAND BAR ───────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.06)",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 6px 16px rgba(239, 68, 68, 0.28)",
              flexShrink: 0,
            }}
          >
            <Crown size={28} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Super Admin Console
              </h1>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 9px",
                  borderRadius: "20px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#16a34a",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#16a34a",
                    boxShadow: "0 0 6px #16a34a",
                  }}
                />
                Multi-Tenant Controller
              </div>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              Manage multi-shop pizza branches, credentials, live status, and network infrastructure.
            </p>
          </div>
        </div>

        {/* Right Section: Time & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Live Pakistan Standard Time Widget */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 14px",
              borderRadius: "20px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
            }}
            title="Current Pakistan Standard Time (PKT / Asia/Karachi)"
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 6px #10b981",
                flexShrink: 0,
              }}
            />
            <Clock size={14} className="text-emerald-500" />
            <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 800 }}>
              {pakistanTime || "Loading..."}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                background: "#16a34a",
                color: "#ffffff",
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              PKT
            </span>
            {pakistanDate && (
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                ({pakistanDate})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 16px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 3px 12px rgba(239, 68, 68, 0.28)",
              transition: "transform 0.15s ease",
            }}
            className="hover:scale-105"
          >
            <Plus size={16} />
            <span>Register New Branch</span>
          </button>

          <button
            type="button"
            onClick={() => startTransition(() => impersonateShop())}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "8px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-slate-50"
            title="Open default /admin dashboard"
          >
            <Store size={15} />
            <span>Store Manager</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "8px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#c2410c",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="View database schema migration"
          >
            <Database size={15} />
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
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            className="hover:bg-red-100"
            title="Logout from Super Admin Console"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ─── DATABASE MIGRATION WARNING ───────────────────── */}
      {!metrics.isDatabaseConfigured && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "10px",
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
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#92400e", marginBottom: "2px" }}>
                Database Schema Notice: Table &apos;shops&apos; not detected
              </div>
              <div style={{ fontSize: "12px", color: "#b45309" }}>
                Execute the SQL script in your Supabase Dashboard to enable multi-branch database persistence.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "6px",
              background: "#d97706",
              border: "none",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Database size={14} />
            <span>View SQL Script &rarr;</span>
          </button>
        </div>
      )}

      {/* ─── PLATFORM METRICS KPI MATRIX ───────────────────── */}
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
            borderTop: "3px solid #6366f1",
            borderRadius: "12px",
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
          className="admin-card-hover"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Total Network Shops
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#e0e7ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: "30px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {metrics.totalShops}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "4px" }}>
            Registered shop fleet
          </div>
        </div>

        {/* Metric 2: Active Online */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #bbf7d0",
            borderTop: "3px solid #10b981",
            borderRadius: "12px",
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
          className="admin-card-hover"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Active / Online
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: "30px", fontWeight: 900, color: "#16a34a", letterSpacing: "-0.02em" }}>
            {metrics.activeShops}
          </div>
          <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600, marginTop: "4px" }}>
            Taking orders live
          </div>
        </div>

        {/* Metric 3: Suspended */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fecaca",
            borderTop: "3px solid #ef4444",
            borderRadius: "12px",
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
          className="admin-card-hover"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Suspended / Paused
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertOctagon size={18} />
            </div>
          </div>
          <div style={{ fontSize: "30px", fontWeight: 900, color: "#dc2626", letterSpacing: "-0.02em" }}>
            {metrics.suspendedShops}
          </div>
          <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: 600, marginTop: "4px" }}>
            Access restricted
          </div>
        </div>

        {/* Metric 4: Total Orders */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fed7aa",
            borderTop: "3px solid #f97316",
            borderRadius: "12px",
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
          className="admin-card-hover"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Total Network Orders
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#ffedd5",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: "30px", fontWeight: 900, color: "#ea580c", letterSpacing: "-0.02em" }}>
            {metrics.totalOrders}
          </div>
          <div style={{ fontSize: "11px", color: "#ea580c", fontWeight: 600, marginTop: "4px" }}>
            All-time processed
          </div>
        </div>

        {/* Metric 5: Revenue */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #bae6fd",
            borderTop: "3px solid #0284c7",
            borderRadius: "12px",
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
          className="admin-card-hover"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Network Revenue
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#e0f2fe",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Coins size={18} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#0284c7", letterSpacing: "-0.02em" }}>
            Rs. {metrics.totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: 600, marginTop: "4px" }}>
            Combined sales volume
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ──────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "14px 18px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "280px" }}>
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search branches by name, owner, branch address, phone or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#0f172a",
              fontSize: "14px",
              fontWeight: 500,
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
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Status filter tabs */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: statusFilter === "all" ? "#ffffff" : "transparent",
                color: statusFilter === "all" ? "#0f172a" : "#64748b",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: statusFilter === "all" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              All ({shops.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: statusFilter === "active" ? "#ffffff" : "transparent",
                color: statusFilter === "active" ? "#16a34a" : "#64748b",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: statusFilter === "active" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Active ({shops.filter((s) => s.status === "active").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("suspended")}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: statusFilter === "suspended" ? "#ffffff" : "transparent",
                color: statusFilter === "suspended" ? "#dc2626" : "#64748b",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: statusFilter === "suspended" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Suspended ({shops.filter((s) => s.status === "suspended").length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === "cards" ? "#ffffff" : "transparent",
                color: viewMode === "cards" ? "#0f172a" : "#64748b",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: viewMode === "cards" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              <Layers size={14} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#0f172a" : "#64748b",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: viewMode === "table" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              <SlidersHorizontal size={14} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SHOPS FLEET LISTING ───────────────────────────── */}
      {filteredShops.length === 0 ? (
        <div
          style={{
            padding: "64px 20px",
            textAlign: "center",
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#f1f5f9",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              marginBottom: "14px",
            }}
          >
            <Building2 size={28} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
            No Shop Branches Found
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
            {searchQuery
              ? `No registered shops matched your search for "${searchQuery}".`
              : "No branches registered in the platform yet. Click below to register the first branch."}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 22px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
            }}
          >
            <Plus size={16} />
            <span>Register New Branch</span>
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* GRID CARDS VIEW */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
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
                  borderRadius: "14px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.18s ease",
                }}
                className="admin-card-hover"
              >
                {/* Card Top Strip */}
                <div
                  style={{
                    padding: "16px 18px",
                    background: isSuspended ? "#fff1f2" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: isSuspended ? "#fee2e2" : "#ffedd5",
                        color: isSuspended ? "#dc2626" : "#ea580c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Store size={20} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {shop.name}
                      </h3>
                      <div style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <span>ID #{shop.id}</span>
                        <span>&bull;</span>
                        <code style={{ background: "#ffffff", padding: "1px 5px", borderRadius: "4px", border: "1px solid #e2e8f0", color: "#ea580c", fontWeight: 700 }}>
                          /{shop.slug}
                        </code>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: isSuspended ? "#fee2e2" : "#dcfce7",
                      color: isSuspended ? "#b91c1c" : "#15803d",
                      border: isSuspended ? "1px solid #fecaca" : "1px solid #bbf7d0",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: isSuspended ? "#dc2626" : "#16a34a",
                        boxShadow: isSuspended ? "0 0 6px #dc2626" : "0 0 6px #16a34a",
                      }}
                    />
                    {isSuspended ? "Suspended" : "Active"}
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Owner & Contact Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                    <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", textTransform: "uppercase", fontWeight: 800, marginBottom: "2px" }}>
                        <User size={11} />
                        Owner Name
                      </span>
                      <span style={{ fontWeight: 800, color: "#0f172a" }}>{shop.owner_name}</span>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", textTransform: "uppercase", fontWeight: 800, marginBottom: "2px" }}>
                        <Phone size={11} />
                        WhatsApp / Phone
                      </span>
                      <span style={{ color: "#1e293b", fontWeight: 700 }}>{shop.owner_phone || "—"}</span>
                    </div>
                  </div>

                  {/* Plan & Location */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                    <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#64748b", display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: 800, marginBottom: "2px" }}>
                        Plan &amp; Currency
                      </span>
                      <span style={{ color: "#ea580c", fontWeight: 800, textTransform: "uppercase" }}>
                        {shop.currency_symbol} &bull; {shop.plan}
                      </span>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", textTransform: "uppercase", fontWeight: 800, marginBottom: "2px" }}>
                        <MapPin size={11} />
                        Branch Address
                      </span>
                      <span style={{ color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", fontWeight: 600 }}>
                        {shop.branch_address || "Main Branch"}
                      </span>
                    </div>
                  </div>

                  {/* Customer Menu Direct Link Box */}
                  <div
                    style={{
                      background: "#f0fdf4",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", display: "block" }}>
                        Live Customer Menu Link
                      </span>
                      <a
                        href={`/${shop.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#15803d",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                        title="Open this shop's customer menu in a new tab"
                      >
                        <span>/{shop.slug}</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyMenuLink(shop.slug)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #86efac",
                        background: "#ffffff",
                        color: copiedSlug === shop.slug ? "#16a34a" : "#15803d",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                      title="Copy shop direct menu URL"
                    >
                      {copiedSlug === shop.slug ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedSlug === shop.slug ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>

                  {/* Credentials Box */}
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                        Store Manager PIN (/admin/login)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(shop)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: copiedId === shop.id ? "#16a34a" : "#ea580c",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {copiedId === shop.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === shop.id ? "Copied Details!" : "Copy PIN"}</span>
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#334155" }}>
                        Password:{" "}
                        <code style={{ color: "#c2410c", fontFamily: "monospace", fontWeight: 800, background: "#ffffff", padding: "3px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
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
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{isPasswordVisible ? "Hide" : "Show"}</span>
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Integration indicator if configured */}
                  {shop.whatsapp_session_id && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#059669",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <MessageSquare size={12} />
                      <span>WhatsApp Alerts Session: <code>{shop.whatsapp_session_id}</code></span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      paddingTop: "14px",
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
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: isSuspended ? "#f0fdf4" : "#fef2f2",
                        border: isSuspended ? "1px solid #bbf7d0" : "1px solid #fecaca",
                        color: isSuspended ? "#15803d" : "#b91c1c",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isSuspended ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Activate</span>
                        </>
                      ) : (
                        <>
                          <AlertOctagon size={13} />
                          <span>Suspend</span>
                        </>
                      )}
                    </button>

                    {/* Enter Branch Admin */}
                    <button
                      type="button"
                      onClick={() => startTransition(() => impersonateShop(shop.id, shop.name))}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
                      }}
                      title={`Open ${shop.name} Store Manager Console`}
                    >
                      <Store size={13} />
                      <span>Enter /admin</span>
                      <ArrowUpRight size={12} />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(shop)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        color: "#334155",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(shop.id, shop.name)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "#ffffff",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Delete Branch"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 800, fontSize: "11px", textTransform: "uppercase" }}>Shop &amp; Slug</th>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 800, fontSize: "11px", textTransform: "uppercase" }}>Owner &amp; Contact</th>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 800, fontSize: "11px", textTransform: "uppercase" }}>Plan / Currency</th>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 800, fontSize: "11px", textTransform: "uppercase" }}>Login Password</th>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 800, fontSize: "11px", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => {
                const isSuspended = shop.status === "suspended";
                const isPasswordVisible = !!revealedPasswords[shop.id];

                return (
                  <tr key={shop.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50">
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>{shop.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
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
                            padding: "2px 8px",
                            borderRadius: "4px",
                            border: "1px solid #bbf7d0",
                          }}
                          title="Open Live Menu"
                        >
                          <span>/{shop.slug}</span>
                          <ExternalLink size={10} />
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
                          {copiedSlug === shop.slug ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{shop.owner_name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{shop.owner_phone || "—"}</div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 8px", background: "#f1f5f9", color: "#ea580c", borderRadius: "4px", textTransform: "uppercase" }}>
                        {shop.plan} &bull; {shop.currency_symbol}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <code style={{ color: "#c2410c", fontFamily: "monospace", fontWeight: 800, background: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                          {isPasswordVisible ? (shop.password || "shop123") : "••••••"}
                        </code>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(shop.id)}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}
                        >
                          {isPasswordVisible ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(shop.id, shop.status)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          border: isSuspended ? "1px solid #fecaca" : "1px solid #bbf7d0",
                          background: isSuspended ? "#fee2e2" : "#dcfce7",
                          color: isSuspended ? "#b91c1c" : "#15803d",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSuspended ? "#dc2626" : "#16a34a" }} />
                        <span>{isSuspended ? "Suspended" : "Active"}</span>
                      </button>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(shop)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
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
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 800,
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
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#f1f5f9",
                            color: "#334155",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(shop.id, shop.name)}
                          style={{
                            padding: "6px 9px",
                            borderRadius: "6px",
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} />
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

      {/* ─── SQL MIGRATION MODAL ─────────────────────── */}
      {showSqlModal && (
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
              maxWidth: "700px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "26px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              color: "#0f172a",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ color: "#d97706" }}>
                  <Database size={22} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 2px", fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                    Supabase Schema: Multi-Shop Table (007)
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    Run this script in <strong>Supabase Dashboard &rarr; SQL Editor &rarr; Run</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  color: "#64748b",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <pre
              style={{
                background: "#0a0f1d",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "16px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#e2e8f0",
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
                  padding: "9px 18px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopySql}
                style={{
                  padding: "9px 22px",
                  borderRadius: "8px",
                  background: copiedSql ? "#16a34a" : "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 3px 10px rgba(239, 68, 68, 0.25)",
                }}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? "Copied Script!" : "Copy SQL Script"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
