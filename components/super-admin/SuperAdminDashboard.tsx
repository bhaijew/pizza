"use client";

import { useState, useEffect, useTransition } from "react";
import type { Shop, PosStaff } from "@/types/menu";
import type { SuperAdminMetrics } from "@/lib/super-admin-data";
import {
  createShop,
  updateShop,
  toggleShopStatus,
  deleteShop,
  impersonateShop,
  superAdminLogout,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  toggleStaffPosAccess,
  deleteStaff,
  seedMasterBranch,
  verifyCloudSyncHealth,
} from "@/lib/super-admin-actions";
import ShopModal from "./ShopModal";
import StaffModal from "./StaffModal";
import BrandLogo from "@/components/BrandLogo";
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
  Users,
  KeyRound,
  Laptop,
  RefreshCw,
  Sun,
  Moon,
  Menu,
  ChevronRight,
  Pizza,
  Tags,
  ChefHat,
  Radio,
  FileText,
  Activity,
  CheckCircle,
} from "lucide-react";

interface SuperAdminDashboardProps {
  initialShops: Shop[];
  initialStaff?: PosStaff[];
  initialMetrics: SuperAdminMetrics;
}

type TabType = "overview" | "branches" | "staff" | "flodesktop" | "schema";

export default function SuperAdminDashboard({
  initialShops,
  initialStaff = [],
  initialMetrics,
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [sidebarTheme, setSidebarTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [staffList, setStaffList] = useState<PosStaff[]>(initialStaff);
  const [metrics, setMetrics] = useState<SuperAdminMetrics>(initialMetrics);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>("all");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modals & Popups
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<PosStaff | null>(null);

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string | number, boolean>>({});
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // FloDesktop Sync Status State
  const [isSyncingFloDesktop, setIsSyncingFloDesktop] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Pakistan Time
  const [pakistanTime, setPakistanTime] = useState<string>("");
  const [pakistanDate, setPakistanDate] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  // Load theme preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pizza_super_admin_sidebar_theme");
      if (saved === "light" || saved === "dark") {
        setSidebarTheme(saved);
      }
    } catch {}
  }, []);

  const toggleSidebarTheme = () => {
    const next = sidebarTheme === "dark" ? "light" : "dark";
    setSidebarTheme(next);
    try {
      localStorage.setItem("pizza_super_admin_sidebar_theme", next);
    } catch {}
  };

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

  const handleCopyText = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered branches
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

  // Filtered staff
  const filteredStaff = staffList.filter((st) => {
    const query = staffSearchQuery.toLowerCase();
    const matchesSearch =
      st.name.toLowerCase().includes(query) ||
      (st.email && st.email.toLowerCase().includes(query)) ||
      st.role.toLowerCase().includes(query) ||
      (st.pin && st.pin.includes(query));

    const matchesRole =
      staffRoleFilter === "all" || st.role === staffRoleFilter;

    return matchesSearch && matchesRole;
  });

  // Branch CRUD Handlers
  const handleOpenAddBranch = () => {
    setEditingShop(null);
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (shop: Shop) => {
    setEditingShop(shop);
    setIsBranchModalOpen(true);
  };

  const handleBranchModalSubmit = async (formData: FormData, editingId?: number | string) => {
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

  const handleToggleShopStatus = (id: number | string, currentStatus: "active" | "suspended" | "pending") => {
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
        alert(`Error updating branch status: ${res.error}`);
        setShops((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: currentStatus } : s))
        );
      }
    });
  };

  const handleDeleteShop = (id: number | string, name: string) => {
    if (!confirm(`Are you sure you want to delete branch "${name}"? This action cannot be undone.`)) {
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
        alert(`Error deleting branch: ${res.error}`);
      }
    });
  };

  const handleSeedMasterBranch = () => {
    startTransition(async () => {
      const res = await seedMasterBranch();
      if (res.error) {
        alert(res.error);
      } else if (res.shop) {
        setShops((prev) => [res.shop!, ...prev]);
        setMetrics((prev) => ({
          ...prev,
          totalShops: prev.totalShops + 1,
          activeShops: prev.activeShops + 1,
        }));
      }
    });
  };

  // Staff CRUD Handlers
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: PosStaff) => {
    setEditingStaff(staff);
    setIsStaffModalOpen(true);
  };

  const handleStaffModalSubmit = async (formData: FormData, editingId?: string) => {
    const rawShopId = (formData.get("shop_id") as string)?.trim();
    const parsedShopId = rawShopId && rawShopId !== "all" && !isNaN(Number(rawShopId)) ? Number(rawShopId) : null;

    if (editingId) {
      const res = await updateStaff(editingId, formData);
      if (!res.error) {
        setStaffList((prev) =>
          prev.map((st) => {
            if (st.id === editingId) {
              return {
                ...st,
                name: formData.get("name") as string,
                email: (formData.get("email") as string) || null,
                role: formData.get("role") as any,
                pin: (formData.get("pin") as string) || st.pin,
                shop_id: parsedShopId,
                has_pos_access: formData.get("has_pos_access") === "true",
                is_active: formData.get("is_active") === "true",
              };
            }
            return st;
          })
        );
      }
      return res;
    } else {
      const res = await createStaff({ error: null, success: false }, formData);
      if (res.staff) {
        setStaffList((prev) => [res.staff!, ...prev]);
        setMetrics((prev) => ({
          ...prev,
          totalStaff: (prev.totalStaff || 0) + 1,
          activeStaff: res.staff!.is_active ? (prev.activeStaff || 0) + 1 : prev.activeStaff,
        }));
      }
      return { error: res.error };
    }
  };

  const handleToggleStaffActive = (id: string, currentActive: boolean) => {
    setStaffList((prev) =>
      prev.map((st) => (st.id === id ? { ...st, is_active: !currentActive } : st))
    );
    startTransition(async () => {
      const res = await toggleStaffStatus(id, currentActive);
      if (res.error) {
        alert(`Error toggling staff status: ${res.error}`);
        setStaffList((prev) =>
          prev.map((st) => (st.id === id ? { ...st, is_active: currentActive } : st))
        );
      }
    });
  };

  const handleToggleStaffPosAccess = (id: string, currentAccess: boolean) => {
    setStaffList((prev) =>
      prev.map((st) => (st.id === id ? { ...st, has_pos_access: !currentAccess } : st))
    );
    startTransition(async () => {
      const res = await toggleStaffPosAccess(id, currentAccess);
      if (res.error) {
        alert(`Error toggling POS access: ${res.error}`);
        setStaffList((prev) =>
          prev.map((st) => (st.id === id ? { ...st, has_pos_access: currentAccess } : st))
        );
      }
    });
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete staff member "${name}"?`)) {
      return;
    }

    setStaffList((prev) => prev.filter((st) => st.id !== id));
    setMetrics((prev) => ({
      ...prev,
      totalStaff: Math.max(0, (prev.totalStaff || 1) - 1),
    }));

    startTransition(async () => {
      const res = await deleteStaff(id);
      if (res.error) {
        alert(`Error deleting staff: ${res.error}`);
      }
    });
  };

  // Verify Supabase Cloud Sync (Zero Port Dependency)
  const handleVerifyCloudSync = async () => {
    setIsSyncingFloDesktop(true);
    setSyncFeedback(null);
    try {
      const res = await verifyCloudSyncHealth();
      if (res.success) {
        setSyncFeedback(
          `☁️ Live Cloud Active: ${res.totalStaff} POS Staff members and ${res.totalShops} Branches are saved in Supabase Cloud. Active FloDesktop POS terminals receive realtime updates via WebSocket automatically — zero local port or manual trigger required!`
        );
      } else {
        setSyncFeedback(`⚠️ Cloud check response: ${res.message}`);
      }
    } catch (e: any) {
      setSyncFeedback(`⚠️ Cloud verification note: ${e?.message || String(e)}`);
    } finally {
      setIsSyncingFloDesktop(false);
      setTimeout(() => setSyncFeedback(null), 8000);
    }
  };

  const isLight = sidebarTheme === "light";

  const sqlMigrationCode = `-- Supabase Multi-Tenant Fleet & POS Staff Schema
-- Run in Supabase SQL Editor if needed:

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

CREATE TABLE IF NOT EXISTS public.pos_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('manager', 'cashier', 'waiter', 'chef', 'owner')),
  pin TEXT NOT NULL DEFAULT '1234',
  has_pos_access BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops (slug);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops (status);
CREATE INDEX IF NOT EXISTS idx_pos_staff_pin ON public.pos_staff (pin);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shops" ON public.shops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read pos_staff" ON public.pos_staff FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service full shops" ON public.shops FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service full pos_staff" ON public.pos_staff FOR ALL TO service_role USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: isLight ? "#f8fafc" : "#090d16",
        color: isLight ? "#0f172a" : "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        transition: "background 0.2s ease",
      }}
    >
      <style>{`
        .super-nav-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }
        .super-nav-dark-default {
          color: #94a3b8;
        }
        .super-nav-dark-default:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(3px);
        }
        .super-nav-dark-default:hover .nav-icon {
          color: #f97316 !important;
          transform: scale(1.08);
        }
        .super-nav-dark-active {
          color: #ffffff;
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.24) 0%, rgba(249, 115, 22, 0.08) 100%);
          font-weight: 800;
          box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.4);
        }
        .super-nav-dark-active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 4px;
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444;
        }

        .super-nav-light-default {
          color: #475569;
        }
        .super-nav-light-default:hover {
          color: #0f172a;
          background: #f1f5f9;
          transform: translateX(3px);
        }
        .super-nav-light-default:hover .nav-icon {
          color: #ea580c !important;
          transform: scale(1.08);
        }
        .super-nav-light-active {
          color: #dc2626;
          background: #fef2f2;
          font-weight: 800;
          box-shadow: inset 0 0 0 1px #fecaca;
        }
        .super-nav-light-active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 4px;
          background: #dc2626;
        }

        .admin-card-hover {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .admin-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.08);
        }
        .pulse-emerald {
          animation: pulseGlow 2s infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>

      {/* ─── SIDEBAR / SLIDER (Desktop & Mobile Drawer) ────────────────────────── */}
      <aside
        style={{
          width: "270px",
          background: isLight
            ? "#ffffff"
            : "linear-gradient(180deg, #0e1526 0%, #090d18 100%)",
          borderRight: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          maxHeight: "100vh",
          zIndex: 50,
          boxShadow: isLight ? "2px 0 16px rgba(0, 0, 0, 0.03)" : "4px 0 30px rgba(0, 0, 0, 0.5)",
          transition: "background 0.2s ease, transform 0.25s ease",
        }}
        className={`${mobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50" : "hidden md:flex"}`}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "20px 18px",
            borderBottom: isLight ? "1px solid #f1f5f9" : "1px solid rgba(255, 255, 255, 0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
                flexShrink: 0,
              }}
            >
              <Crown size={22} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: "15px",
                  color: isLight ? "#0f172a" : "#ffffff",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Super Admin
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginTop: "2px",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                  }}
                  className="pulse-emerald"
                />
                <span>Multi-Shop Controller</span>
              </div>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: isLight ? "#64748b" : "#94a3b8",
              cursor: "pointer",
              padding: "4px",
            }}
            className="md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grouped Sidebar Navigation */}
        <nav
          style={{
            padding: "16px 12px",
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Group 1: Fleet Management */}
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: isLight ? "#94a3b8" : "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0 10px 6px",
              }}
            >
              Fleet &amp; Terminals
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {/* Tab 1: Overview */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("overview");
                  setMobileMenuOpen(false);
                }}
                className={`super-nav-btn ${
                  activeTab === "overview"
                    ? isLight
                      ? "super-nav-light-active"
                      : "super-nav-dark-active"
                    : isLight
                    ? "super-nav-light-default"
                    : "super-nav-dark-default"
                }`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex", color: activeTab === "overview" ? "#ef4444" : undefined }}>
                    <Activity size={18} />
                  </span>
                  <span>HQ Overview</span>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(239, 68, 68, 0.14)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                  }}
                >
                  LIVE
                </span>
              </button>

              {/* Tab 2: Branches Fleet */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("branches");
                  setMobileMenuOpen(false);
                }}
                className={`super-nav-btn ${
                  activeTab === "branches"
                    ? isLight
                      ? "super-nav-light-active"
                      : "super-nav-dark-active"
                    : isLight
                    ? "super-nav-light-default"
                    : "super-nav-dark-default"
                }`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex", color: activeTab === "branches" ? "#ea580c" : undefined }}>
                    <Building2 size={18} />
                  </span>
                  <span>Shop Branches</span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: "10px",
                    background: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.1)",
                    color: isLight ? "#0f172a" : "#ffffff",
                  }}
                >
                  {shops.length}
                </span>
              </button>

              {/* Tab 3: Staff & POS Access */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("staff");
                  setMobileMenuOpen(false);
                }}
                className={`super-nav-btn ${
                  activeTab === "staff"
                    ? isLight
                      ? "super-nav-light-active"
                      : "super-nav-dark-active"
                    : isLight
                    ? "super-nav-light-default"
                    : "super-nav-dark-default"
                }`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex", color: activeTab === "staff" ? "#10b981" : undefined }}>
                    <Users size={18} />
                  </span>
                  <span>Staff &amp; POS Access</span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: "10px",
                    background: isLight ? "#dcfce7" : "rgba(16, 185, 129, 0.2)",
                    color: "#16a34a",
                  }}
                >
                  {staffList.length}
                </span>
              </button>
            </div>
          </div>

          {/* Group 2: Store Master & Products */}
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: isLight ? "#94a3b8" : "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0 10px 6px",
              }}
            >
              Master Catalog &amp; KDS
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <a
                href="/admin/products"
                className={`super-nav-btn ${isLight ? "super-nav-light-default" : "super-nav-dark-default"}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex" }}>
                    <Pizza size={18} />
                  </span>
                  <span>Global Products</span>
                </div>
                <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
              </a>

              <a
                href="/admin/categories"
                className={`super-nav-btn ${isLight ? "super-nav-light-default" : "super-nav-dark-default"}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex" }}>
                    <Tags size={18} />
                  </span>
                  <span>Menu Categories</span>
                </div>
                <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
              </a>

              <a
                href="/admin/orders"
                className={`super-nav-btn ${isLight ? "super-nav-light-default" : "super-nav-dark-default"}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex" }}>
                    <ShoppingBag size={18} />
                  </span>
                  <span>Live Store Orders</span>
                </div>
                <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
              </a>

              <a
                href="/admin/kitchen"
                className={`super-nav-btn ${isLight ? "super-nav-light-default" : "super-nav-dark-default"}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex" }}>
                    <ChefHat size={18} />
                  </span>
                  <span>Kitchen Display (KDS)</span>
                </div>
                <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
              </a>
            </div>
          </div>

          {/* Group 3: Platform & Hardware */}
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: isLight ? "#94a3b8" : "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0 10px 6px",
              }}
            >
              POS Hub &amp; Cloud Sync
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("flodesktop");
                  setMobileMenuOpen(false);
                }}
                className={`super-nav-btn ${
                  activeTab === "flodesktop"
                    ? isLight
                      ? "super-nav-light-active"
                      : "super-nav-dark-active"
                    : isLight
                    ? "super-nav-light-default"
                    : "super-nav-dark-default"
                }`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex", color: activeTab === "flodesktop" ? "#6366f1" : undefined }}>
                    <Laptop size={18} />
                  </span>
                  <span>FloDesktop POS Hub</span>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(99, 102, 241, 0.16)",
                    color: "#6366f1",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}
                >
                  SYNC
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("schema");
                  setMobileMenuOpen(false);
                }}
                className={`super-nav-btn ${
                  activeTab === "schema"
                    ? isLight
                      ? "super-nav-light-active"
                      : "super-nav-dark-active"
                    : isLight
                    ? "super-nav-light-default"
                    : "super-nav-dark-default"
                }`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="nav-icon" style={{ display: "flex" }}>
                    <Database size={18} />
                  </span>
                  <span>Database Schema</span>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Sidebar Action Widget */}
        <div
          style={{
            marginTop: "auto",
            padding: "14px",
            borderTop: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: isLight ? "#f8fafc" : "rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Theme Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderRadius: "8px",
              background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.05)",
              border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: isLight ? "#64748b" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {isLight ? <Sun size={13} /> : <Moon size={13} />}
              Slider Theme
            </span>
            <button
              type="button"
              onClick={toggleSidebarTheme}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 9px",
                borderRadius: "5px",
                background: isLight ? "#0f172a" : "#ffffff",
                color: isLight ? "#ffffff" : "#0f172a",
                fontSize: "11px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
              }}
            >
              {isLight ? <Moon size={11} /> : <Sun size={11} />}
              <span>{isLight ? "Dark" : "Light"}</span>
            </button>
          </div>

          {/* Store Manager Quick Switch */}
          <button
            type="button"
            onClick={() => startTransition(() => impersonateShop())}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "9px 12px",
              borderRadius: "8px",
              background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.06)",
              color: isLight ? "#0f172a" : "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
              cursor: "pointer",
            }}
            title="Open Branch Store Manager (/admin)"
          >
            <Store size={14} className="text-orange-500" />
            <span>Store Manager</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => startTransition(() => superAdminLogout())}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: isLight ? "#fef2f2" : "rgba(239, 68, 68, 0.12)",
              color: "#dc2626",
              fontSize: "12px",
              fontWeight: 700,
              border: isLight ? "1px solid #fecaca" : "1px solid rgba(239, 68, 68, 0.3)",
              cursor: "pointer",
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh" }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: "64px",
            background: isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(14, 21, 38, 0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 30,
            boxShadow: isLight ? "0 1px 3px rgba(0, 0, 0, 0.02)" : "0 4px 16px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: isLight ? "#0f172a" : "#ffffff",
                cursor: "pointer",
                padding: "6px",
              }}
              className="md:hidden"
            >
              <Menu size={22} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: isLight ? "#64748b" : "#94a3b8", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                <Crown size={14} className="text-red-500" />
                Super Admin
              </span>
              <ChevronRight size={14} style={{ color: isLight ? "#cbd5e1" : "#475569" }} />
              <span style={{ fontSize: "14px", fontWeight: 800, color: isLight ? "#0f172a" : "#ffffff" }}>
                {activeTab === "overview" && "Executive HQ Overview"}
                {activeTab === "branches" && "Shop Branches Fleet"}
                {activeTab === "staff" && "Staff & POS Terminal Access"}
                {activeTab === "flodesktop" && "FloDesktop POS Integration"}
                {activeTab === "schema" && "Database SQL Schema"}
              </span>
            </div>
          </div>

          {/* Right: PKT clock & Quick action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Live PKT Clock */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 12px",
                borderRadius: "20px",
                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.06)",
                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
                color: isLight ? "#0f172a" : "#ffffff",
                fontSize: "12px",
              }}
              className="hidden sm:inline-flex"
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} className="pulse-emerald" />
              <Clock size={13} className="text-emerald-500" />
              <span style={{ fontFamily: "monospace", fontWeight: 800 }}>{pakistanTime || "Loading..."}</span>
              <span style={{ fontSize: "9px", fontWeight: 800, background: "#10b981", color: "#ffffff", padding: "1px 4px", borderRadius: "3px" }}>
                PKT
              </span>
            </div>

            {/* Quick Register Branch */}
            <button
              type="button"
              onClick={handleOpenAddBranch}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(239, 68, 68, 0.25)",
              }}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Register Branch</span>
              <span className="sm:hidden">Branch</span>
            </button>

            {/* Quick Add Staff */}
            <button
              type="button"
              onClick={handleOpenAddStaff}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(16, 185, 129, 0.25)",
              }}
            >
              <User size={14} />
              <span className="hidden sm:inline">Add POS Staff</span>
              <span className="sm:hidden">Staff</span>
            </button>
          </div>
        </header>

        {/* Sync notification toast */}
        {syncFeedback && (
          <div
            style={{
              padding: "12px 24px",
              background: "#eff6ff",
              borderBottom: "1px solid #bfdbfe",
              color: "#1e40af",
              fontSize: "13px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{syncFeedback}</span>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              style={{ background: "transparent", border: "none", color: "#1e40af", cursor: "pointer" }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Tab Body Content */}
        <main style={{ padding: "24px 28px", flex: 1, maxWidth: "1400px", width: "100%", boxSizing: "border-box", margin: "0 auto" }}>
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: HQ OVERVIEW
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div>
              {/* Executive Welcome Card */}
              <div
                style={{
                  background: isLight ? "#ffffff" : "#0e1526",
                  border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "24px 28px",
                  marginBottom: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "18px",
                  boxShadow: isLight ? "0 4px 18px rgba(0, 0, 0, 0.03)" : "0 8px 24px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: isLight ? "#0f172a" : "#ffffff" }}>
                      Super Admin Platform Matrix
                    </h1>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#16a34a",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      Cloud Sync Ready
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: isLight ? "#64748b" : "#94a3b8" }}>
                    Centrally control pizza shop branches, staff terminal authorizations, 4-digit PINs, and FloDesktop POS sync.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("branches")}
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
                    }}
                  >
                    <Building2 size={16} />
                    <span>Manage Fleet ({shops.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("staff")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "9px 16px",
                      borderRadius: "8px",
                      background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.08)",
                      border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.15)",
                      color: isLight ? "#0f172a" : "#ffffff",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <Users size={16} className="text-emerald-500" />
                    <span>POS Staff ({staffList.length})</span>
                  </button>
                </div>
              </div>

              {/* 5 KPI MATRIX CARDS */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  marginBottom: "28px",
                }}
              >
                {/* Total Branches */}
                <div
                  style={{
                    background: isLight ? "#ffffff" : "#0e1526",
                    borderTop: "3px solid #6366f1",
                    borderLeft: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRight: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                  }}
                  className="admin-card-hover"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: isLight ? "#64748b" : "#94a3b8", textTransform: "uppercase" }}>
                      Registered Branches
                    </span>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building2 size={17} />
                    </div>
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: isLight ? "#0f172a" : "#ffffff" }}>
                    {shops.length}
                  </div>
                  <div style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8", marginTop: "4px" }}>
                    Multi-tenant fleet size
                  </div>
                </div>

                {/* Active Online */}
                <div
                  style={{
                    background: isLight ? "#ffffff" : "#0e1526",
                    borderTop: "3px solid #10b981",
                    borderLeft: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.2)",
                    borderRight: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.2)",
                    borderBottom: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                  }}
                  className="admin-card-hover"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>
                      Active / Online
                    </span>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 size={17} />
                    </div>
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: "#16a34a" }}>
                    {shops.filter((s) => s.status === "active").length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px" }}>
                    Taking live customer orders
                  </div>
                </div>

                {/* POS Staff Terminals */}
                <div
                  style={{
                    background: isLight ? "#ffffff" : "#0e1526",
                    borderTop: "3px solid #14b8a6",
                    borderLeft: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRight: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderBottom: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                  }}
                  className="admin-card-hover"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#0d9488", textTransform: "uppercase" }}>
                      Authorized POS Staff
                    </span>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#ccfbf1", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={17} />
                    </div>
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: "#0d9488" }}>
                    {staffList.filter((s) => s.is_active && s.has_pos_access !== false).length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#0d9488", marginTop: "4px" }}>
                    Active 4-digit PIN terminals
                  </div>
                </div>

                {/* Total Orders */}
                <div
                  style={{
                    background: isLight ? "#ffffff" : "#0e1526",
                    borderTop: "3px solid #f97316",
                    borderLeft: isLight ? "1px solid #fed7aa" : "1px solid rgba(249, 115, 22, 0.2)",
                    borderRight: isLight ? "1px solid #fed7aa" : "1px solid rgba(249, 115, 22, 0.2)",
                    borderBottom: isLight ? "1px solid #fed7aa" : "1px solid rgba(249, 115, 22, 0.2)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                  }}
                  className="admin-card-hover"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>
                      Network Orders
                    </span>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#ffedd5", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShoppingBag size={17} />
                    </div>
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: "#ea580c" }}>
                    {metrics.totalOrders}
                  </div>
                  <div style={{ fontSize: "11px", color: "#ea580c", marginTop: "4px" }}>
                    All-time processed volume
                  </div>
                </div>

                {/* Network Revenue */}
                <div
                  style={{
                    background: isLight ? "#ffffff" : "#0e1526",
                    borderTop: "3px solid #0284c7",
                    borderLeft: isLight ? "1px solid #bae6fd" : "1px solid rgba(2, 132, 199, 0.2)",
                    borderRight: isLight ? "1px solid #bae6fd" : "1px solid rgba(2, 132, 199, 0.2)",
                    borderBottom: isLight ? "1px solid #bae6fd" : "1px solid rgba(2, 132, 199, 0.2)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                  }}
                  className="admin-card-hover"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284c7", textTransform: "uppercase" }}>
                      Network Revenue
                    </span>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Coins size={17} />
                    </div>
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 900, color: "#0284c7" }}>
                    Rs. {metrics.totalRevenue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "11px", color: "#0284c7", marginTop: "4px" }}>
                    Consolidated sales volume
                  </div>
                </div>
              </div>

              {/* Quick Action Matrix Grid */}
              <div style={{ marginBottom: "28px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 14px", color: isLight ? "#0f172a" : "#ffffff" }}>
                  Executive Shortcuts &amp; Quick Launches
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {/* Action 1: Register New Branch */}
                  <div
                    onClick={handleOpenAddBranch}
                    style={{
                      background: isLight ? "#ffffff" : "#0e1526",
                      border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      cursor: "pointer",
                    }}
                    className="admin-card-hover"
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: isLight ? "#0f172a" : "#ffffff" }}>
                        Register New Shop Branch
                      </div>
                      <div style={{ fontSize: "12px", color: isLight ? "#64748b" : "#94a3b8", marginTop: "2px" }}>
                        Deploy a new branch with manager password &amp; custom slug
                      </div>
                    </div>
                  </div>

                  {/* Action 2: Add POS Staff */}
                  <div
                    onClick={handleOpenAddStaff}
                    style={{
                      background: isLight ? "#ffffff" : "#0e1526",
                      border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      cursor: "pointer",
                    }}
                    className="admin-card-hover"
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <KeyRound size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: isLight ? "#0f172a" : "#ffffff" }}>
                        Authorize POS Staff Member
                      </div>
                      <div style={{ fontSize: "12px", color: isLight ? "#64748b" : "#94a3b8", marginTop: "2px" }}>
                        Assign Cashier/Manager role and generate 4-digit PIN
                      </div>
                    </div>
                  </div>

                  {/* Action 3: Verify Cloud Sync */}
                  <div
                    onClick={handleVerifyCloudSync}
                    style={{
                      background: isLight ? "#ffffff" : "#0e1526",
                      border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      cursor: "pointer",
                    }}
                    className="admin-card-hover"
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <RefreshCw size={22} className={isSyncingFloDesktop ? "animate-spin" : ""} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: isLight ? "#0f172a" : "#ffffff" }}>
                        Verify Cloud Sync Status
                      </div>
                      <div style={{ fontSize: "12px", color: isLight ? "#64748b" : "#94a3b8", marginTop: "2px" }}>
                        Staff PINs &amp; menus auto-stream to POS terminals via WebSocket (Zero Port Config)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fleet & Staff Snapshots */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
                {/* Branches Preview */}
                <div
                  style={{
                    background: isLight ? "#ffffff" : "#0e1526",
                    border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Building2 size={18} className="text-orange-500" />
                      <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: isLight ? "#0f172a" : "#ffffff" }}>
                        Active Branches ({shops.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("branches")}
                      style={{ background: "transparent", border: "none", color: "#ea580c", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      View All &rarr;
                    </button>
                  </div>

                  {shops.length === 0 ? (
                    <div style={{ padding: "28px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "10px" }}>
                      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>No branches registered yet.</p>
                      <button
                        type="button"
                        onClick={handleSeedMasterBranch}
                        style={{ padding: "7px 14px", borderRadius: "6px", background: "#ea580c", color: "#ffffff", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                      >
                        ⚡ Seed Master Branch
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {shops.slice(0, 4).map((shop) => (
                        <div
                          key={shop.id}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.04)",
                            border: isLight ? "1px solid #f1f5f9" : "1px solid rgba(255, 255, 255, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "13px", color: isLight ? "#0f172a" : "#ffffff" }}>
                              {shop.name}
                            </div>
                            <div style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8", display: "flex", gap: "6px" }}>
                              <span>/{shop.slug}</span>
                              <span>&bull;</span>
                              <span>{shop.owner_name}</span>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: shop.status === "active" ? "#dcfce7" : "#fee2e2",
                              color: shop.status === "active" ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {shop.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Staff Preview */}
                <div
                  style={{
                    background: isLight ? "#ffffff" : "#0e1526",
                    border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Users size={18} className="text-emerald-500" />
                      <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: isLight ? "#0f172a" : "#ffffff" }}>
                        POS Staff Members ({staffList.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("staff")}
                      style={{ background: "transparent", border: "none", color: "#10b981", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      View All &rarr;
                    </button>
                  </div>

                  {staffList.length === 0 ? (
                    <div style={{ padding: "28px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "10px" }}>
                      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>No staff members created yet.</p>
                      <button
                        type="button"
                        onClick={handleOpenAddStaff}
                        style={{ padding: "7px 14px", borderRadius: "6px", background: "#10b981", color: "#ffffff", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                      >
                        + Add First Staff Member
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {staffList.slice(0, 4).map((st) => (
                        <div
                          key={st.id}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.04)",
                            border: isLight ? "1px solid #f1f5f9" : "1px solid rgba(255, 255, 255, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: st.role === "manager" ? "#ede9fe" : st.role === "cashier" ? "#dcfce7" : "#e0e7ff",
                                color: st.role === "manager" ? "#7c3aed" : st.role === "cashier" ? "#16a34a" : "#4f46e5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "12px",
                              }}
                            >
                              {st.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "13px", color: isLight ? "#0f172a" : "#ffffff" }}>
                                {st.name}
                              </div>
                              <div style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8", textTransform: "capitalize" }}>
                                {st.role} &bull; PIN: {st.pin}
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: st.has_pos_access ? "#dcfce7" : "#fee2e2",
                              color: st.has_pos_access ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {st.has_pos_access ? "POS Authorized" : "Locked"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: SHOP BRANCHES FLEET
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "branches" && (
            <div>
              {/* Fleet Filter Bar */}
              <div
                style={{
                  background: isLight ? "#ffffff" : "#0e1526",
                  border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
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
                      color: isLight ? "#0f172a" : "#ffffff",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  {/* Status filter tabs */}
                  <div style={{ display: "flex", background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.06)", padding: "3px", borderRadius: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: statusFilter === "all" ? (isLight ? "#ffffff" : "rgba(255, 255, 255, 0.15)") : "transparent",
                        color: statusFilter === "all" ? (isLight ? "#0f172a" : "#ffffff") : "#64748b",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      All ({shops.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("active")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: statusFilter === "active" ? (isLight ? "#ffffff" : "rgba(255, 255, 255, 0.15)") : "transparent",
                        color: statusFilter === "active" ? "#16a34a" : "#64748b",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Active ({shops.filter((s) => s.status === "active").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("suspended")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: statusFilter === "suspended" ? (isLight ? "#ffffff" : "rgba(255, 255, 255, 0.15)") : "transparent",
                        color: statusFilter === "suspended" ? "#dc2626" : "#64748b",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Suspended ({shops.filter((s) => s.status === "suspended").length})
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div style={{ display: "flex", background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.06)", padding: "3px", borderRadius: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "none",
                        background: viewMode === "cards" ? (isLight ? "#ffffff" : "rgba(255, 255, 255, 0.15)") : "transparent",
                        color: viewMode === "cards" ? (isLight ? "#0f172a" : "#ffffff") : "#64748b",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Layers size={13} />
                      <span>Cards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "none",
                        background: viewMode === "table" ? (isLight ? "#ffffff" : "rgba(255, 255, 255, 0.15)") : "transparent",
                        color: viewMode === "table" ? (isLight ? "#0f172a" : "#ffffff") : "#64748b",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <SlidersHorizontal size={13} />
                      <span>Table</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddBranch}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} />
                    <span>Register Branch</span>
                  </button>
                </div>
              </div>

              {/* Fleet Listing Content */}
              {filteredShops.length === 0 ? (
                <div
                  style={{
                    padding: "64px 20px",
                    textAlign: "center",
                    background: isLight ? "#ffffff" : "#0e1526",
                    borderRadius: "14px",
                    border: isLight ? "1px dashed #cbd5e1" : "1px dashed rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.06)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      marginBottom: "14px",
                    }}
                  >
                    <Building2 size={28} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 6px", color: isLight ? "#0f172a" : "#ffffff" }}>
                    No Shop Branches Found
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
                    {searchQuery
                      ? `No registered shops match "${searchQuery}".`
                      : "No branches registered yet. Click below to quick seed the master branch or create a new branch."}
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={handleSeedMasterBranch}
                      style={{
                        padding: "9px 18px",
                        borderRadius: "8px",
                        background: "#ea580c",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      ⚡ Seed Master Pizza Branch
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAddBranch}
                      style={{
                        padding: "9px 18px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      + Register Branch
                    </button>
                  </div>
                </div>
              ) : viewMode === "cards" ? (
                /* CARDS VIEW */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
                  {filteredShops.map((shop) => {
                    const isSuspended = shop.status === "suspended";
                    const isPasswordVisible = !!revealedPasswords[shop.id];

                    return (
                      <div
                        key={shop.id}
                        style={{
                          background: isLight ? "#ffffff" : "#0e1526",
                          border: isSuspended
                            ? "1px solid #fecaca"
                            : isLight
                            ? "1px solid #e2e8f0"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "14px",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          boxShadow: isLight ? "0 2px 10px rgba(0, 0, 0, 0.03)" : "0 4px 16px rgba(0, 0, 0, 0.25)",
                        }}
                        className="admin-card-hover"
                      >
                        {/* Card Header Strip */}
                        <div
                          style={{
                            padding: "16px 18px",
                            background: isSuspended ? (isLight ? "#fff1f2" : "rgba(239, 68, 68, 0.1)") : isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)",
                            borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.06)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: isSuspended ? "#fee2e2" : "#ffedd5",
                                color: isSuspended ? "#dc2626" : "#ea580c",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Store size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: isLight ? "#0f172a" : "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {shop.name}
                              </h3>
                              <div style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8" }}>
                                ID #{shop.id} &bull; /{shop.slug}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "3px 9px",
                              borderRadius: "12px",
                              background: isSuspended ? "#fee2e2" : "#dcfce7",
                              color: isSuspended ? "#b91c1c" : "#15803d",
                              border: isSuspended ? "1px solid #fecaca" : "1px solid #bbf7d0",
                            }}
                          >
                            {isSuspended ? "Suspended" : "Active"}
                          </span>
                        </div>

                        {/* Card Details */}
                        <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                          {/* Owner & Phone */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                            <div style={{ background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)", padding: "7px 10px", borderRadius: "6px" }}>
                              <span style={{ fontSize: "10px", color: isLight ? "#64748b" : "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 800 }}>Owner</span>
                              <span style={{ fontWeight: 800, color: isLight ? "#0f172a" : "#ffffff" }}>{shop.owner_name}</span>
                            </div>
                            <div style={{ background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)", padding: "7px 10px", borderRadius: "6px" }}>
                              <span style={{ fontSize: "10px", color: isLight ? "#64748b" : "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 800 }}>Contact</span>
                              <span style={{ fontWeight: 700, color: isLight ? "#0f172a" : "#ffffff" }}>{shop.owner_phone || "—"}</span>
                            </div>
                          </div>

                          {/* Address & Plan */}
                          <div style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin size={13} className="shrink-0 text-red-500" />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {shop.branch_address || "Main Branch Location"}
                            </span>
                          </div>

                          {/* Customer Menu Link */}
                          <div
                            style={{
                              background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <a
                              href={`/${shop.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#16a34a",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>/{shop.slug}</span>
                              <ExternalLink size={12} />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyMenuLink(shop.slug)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: copiedSlug === shop.slug ? "#16a34a" : isLight ? "#64748b" : "#94a3b8",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              {copiedSlug === shop.slug ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedSlug === shop.slug ? "Copied" : "Copy"}</span>
                            </button>
                          </div>

                          {/* Manager Password Strip */}
                          <div
                            style={{
                              background: isLight ? "#fff7ed" : "rgba(249, 115, 22, 0.08)",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              border: isLight ? "1px solid #fed7aa" : "1px solid rgba(249, 115, 22, 0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <KeyRound size={13} className="text-orange-500" />
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#ea580c" }}>Manager PIN:</span>
                              <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "12px", color: isLight ? "#0f172a" : "#ffffff" }}>
                                {isPasswordVisible ? shop.password || "admin" : "••••••••"}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setRevealedPasswords((prev) => ({ ...prev, [shop.id]: !prev[shop.id] }))}
                                style={{ background: "transparent", border: "none", color: "#ea580c", cursor: "pointer", padding: "2px" }}
                                title="Toggle visibility"
                              >
                                {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(shop.password || "admin", shop.id)}
                                style={{ background: "transparent", border: "none", color: copiedId === shop.id ? "#16a34a" : "#ea580c", cursor: "pointer", padding: "2px" }}
                                title="Copy password"
                              >
                                {copiedId === shop.id ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div
                          style={{
                            padding: "10px 14px",
                            background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.02)",
                            borderTop: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => startTransition(() => impersonateShop(shop.id, shop.name))}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "#ea580c",
                              border: "none",
                              color: "#ffffff",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Store size={12} />
                            <span>Open Store</span>
                          </button>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleToggleShopStatus(shop.id, shop.status)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: isSuspended ? "#dcfce7" : "#fee2e2",
                                color: isSuspended ? "#16a34a" : "#dc2626",
                                border: "none",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {isSuspended ? "Resume" : "Pause"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditBranch(shop)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                                color: isLight ? "#0f172a" : "#ffffff",
                                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteShop(shop.id, shop.name)}
                              style={{
                                padding: "6px 8px",
                                borderRadius: "6px",
                                background: "transparent",
                                color: "#dc2626",
                                border: "none",
                                cursor: "pointer",
                              }}
                              title="Delete branch"
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
                    background: isLight ? "#ffffff" : "#0e1526",
                    border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    overflowX: "auto",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.04)", borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800, color: isLight ? "#475569" : "#94a3b8" }}>Branch</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800, color: isLight ? "#475569" : "#94a3b8" }}>Owner &amp; Contact</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800, color: isLight ? "#475569" : "#94a3b8" }}>Slug / URL</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800, color: isLight ? "#475569" : "#94a3b8" }}>Status</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: isLight ? "#475569" : "#94a3b8" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShops.map((shop) => (
                        <tr
                          key={shop.id}
                          style={{
                            borderBottom: isLight ? "1px solid #f1f5f9" : "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 800, color: isLight ? "#0f172a" : "#ffffff" }}>{shop.name}</div>
                            <div style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8" }}>ID #{shop.id} &bull; {shop.plan}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 700, color: isLight ? "#0f172a" : "#ffffff" }}>{shop.owner_name}</div>
                            <div style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8" }}>{shop.owner_phone || "—"}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <a href={`/${shop.slug}`} target="_blank" rel="noreferrer" style={{ color: "#ea580c", fontWeight: 700, textDecoration: "none" }}>
                              /{shop.slug}
                            </a>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "10px",
                                background: shop.status === "active" ? "#dcfce7" : "#fee2e2",
                                color: shop.status === "active" ? "#16a34a" : "#dc2626",
                              }}
                            >
                              {shop.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => startTransition(() => impersonateShop(shop.id, shop.name))}
                                style={{ padding: "5px 10px", borderRadius: "5px", background: "#ea580c", color: "#ffffff", border: "none", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                              >
                                Launch
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditBranch(shop)}
                                style={{ padding: "5px 10px", borderRadius: "5px", background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)", color: isLight ? "#0f172a" : "#ffffff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: STAFF & POS TERMINAL ACCESS (USER SYSTEM)
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "staff" && (
            <div>
              {/* Guidance Banner */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.1)",
                  border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.25)",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#10b981", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "14px", color: isLight ? "#166534" : "#34d399" }}>
                      Centralized POS Terminal Access Control
                    </div>
                    <div style={{ fontSize: "12px", color: isLight ? "#15803d" : "#a7f3d0", marginTop: "2px" }}>
                      Staff &amp; PINs are saved in Supabase Cloud. Active FloDesktop terminals auto-sync in real-time via WebSocket (Zero port config).
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={handleVerifyCloudSync}
                    disabled={isSyncingFloDesktop}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.1)",
                      border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(255, 255, 255, 0.15)",
                      color: isLight ? "#166534" : "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <RefreshCw size={13} className={isSyncingFloDesktop ? "animate-spin" : ""} />
                    <span>Verify Cloud Sync</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddStaff}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 3px 10px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Staff Member</span>
                  </button>
                </div>
              </div>

              {/* Staff Search & Filter */}
              <div
                style={{
                  background: isLight ? "#ffffff" : "#0e1526",
                  border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
                  <Search size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search staff by name, role, PIN or email..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: isLight ? "#0f172a" : "#ffffff",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  />
                  {staffSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStaffSearchQuery("")}
                      style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.06)", padding: "3px", borderRadius: "8px" }}>
                    {["all", "cashier", "manager", "waiter", "chef"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setStaffRoleFilter(r)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          background: staffRoleFilter === r ? (isLight ? "#ffffff" : "rgba(255, 255, 255, 0.15)") : "transparent",
                          color: staffRoleFilter === r ? (isLight ? "#0f172a" : "#ffffff") : "#64748b",
                          fontWeight: 700,
                          fontSize: "12px",
                          textTransform: "capitalize",
                          cursor: "pointer",
                        }}
                      >
                        {r === "all" ? `All (${staffList.length})` : r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Staff Grid Cards */}
              {filteredStaff.length === 0 ? (
                <div
                  style={{
                    padding: "64px 20px",
                    textAlign: "center",
                    background: isLight ? "#ffffff" : "#0e1526",
                    borderRadius: "14px",
                    border: isLight ? "1px dashed #cbd5e1" : "1px dashed rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#64748b", marginBottom: "14px" }}>
                    <Users size={28} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 6px", color: isLight ? "#0f172a" : "#ffffff" }}>
                    No Staff Members Found
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
                    {staffSearchQuery ? `No staff matched "${staffSearchQuery}".` : "Add cashier and manager profiles to grant FloDesktop POS terminal access."}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddStaff}
                    style={{
                      padding: "9px 20px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    + Add Staff Member
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                  {filteredStaff.map((staff) => {
                    const isPinVisible = !!revealedPins[staff.id];
                    const roleColor = {
                      manager: { bg: "#ede9fe", text: "#7c3aed" },
                      cashier: { bg: "#dcfce7", text: "#16a34a" },
                      chef: { bg: "#fef3c7", text: "#d97706" },
                      waiter: { bg: "#e0e7ff", text: "#4f46e5" },
                      owner: { bg: "#fee2e2", text: "#dc2626" },
                    }[staff.role] || { bg: "#f1f5f9", text: "#475569" };

                    return (
                      <div
                        key={staff.id}
                        style={{
                          background: isLight ? "#ffffff" : "#0e1526",
                          border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "14px",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          boxShadow: isLight ? "0 2px 10px rgba(0, 0, 0, 0.03)" : "0 4px 16px rgba(0, 0, 0, 0.25)",
                        }}
                        className="admin-card-hover"
                      >
                        {/* Header */}
                        <div
                          style={{
                            padding: "16px 18px",
                            background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)",
                            borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.06)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: roleColor.bg,
                                color: roleColor.text,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                                fontSize: "14px",
                              }}
                            >
                              {staff.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: isLight ? "#0f172a" : "#ffffff" }}>
                                {staff.name}
                              </h3>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  color: roleColor.text,
                                }}
                              >
                                {staff.role}
                              </span>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "3px 9px",
                              borderRadius: "12px",
                              background: staff.is_active ? "#dcfce7" : "#fee2e2",
                              color: staff.is_active ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {staff.is_active ? "Active" : "Disabled"}
                          </span>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                          {/* Branch badge */}
                          <div style={{ fontSize: "11px", fontWeight: 700, color: isLight ? "#475569" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Store size={13} className="shrink-0 text-emerald-600" />
                            <span>
                              {staff.shop_id
                                ? (shops.find((s) => s.id === staff.shop_id)?.name || `Branch #${staff.shop_id}`)
                                : "🌐 Universal (All Branches)"}
                            </span>
                          </div>

                          {staff.email && (
                            <div style={{ fontSize: "12px", color: isLight ? "#64748b" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Mail size={13} className="shrink-0" />
                              <span>{staff.email}</span>
                            </div>
                          )}

                          {/* 4-Digit PIN Card */}
                          <div
                            style={{
                              background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
                              borderRadius: "8px",
                              padding: "10px 14px",
                              border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <KeyRound size={16} className="text-emerald-600" />
                              <div>
                                <span style={{ fontSize: "10px", color: "#166534", fontWeight: 800, textTransform: "uppercase", display: "block" }}>
                                  FloDesktop POS Login PIN
                                </span>
                                <span style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 900, color: isLight ? "#0f172a" : "#ffffff", letterSpacing: "0.15em" }}>
                                  {isPinVisible ? staff.pin : "••••"}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setRevealedPins((prev) => ({ ...prev, [staff.id]: !prev[staff.id] }))}
                                style={{ background: "transparent", border: "none", color: "#166534", cursor: "pointer", padding: "2px" }}
                                title="Toggle PIN visibility"
                              >
                                {isPinVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(staff.pin, staff.id)}
                                style={{ background: "transparent", border: "none", color: copiedId === staff.id ? "#16a34a" : "#166534", cursor: "pointer", padding: "2px" }}
                                title="Copy PIN"
                              >
                                {copiedId === staff.id ? <Check size={15} /> : <Copy size={15} />}
                              </button>
                            </div>
                          </div>

                          {/* Terminal Access Switch Status */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)",
                            }}
                          >
                            <span style={{ color: isLight ? "#475569" : "#94a3b8", fontWeight: 600 }}>Terminal Authorization:</span>
                            <button
                              type="button"
                              onClick={() => handleToggleStaffPosAccess(staff.id, staff.has_pos_access)}
                              style={{
                                border: "none",
                                background: staff.has_pos_access ? "#dcfce7" : "#fee2e2",
                                color: staff.has_pos_access ? "#16a34a" : "#dc2626",
                                padding: "3px 10px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {staff.has_pos_access ? "Authorized" : "Revoked"}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            padding: "10px 14px",
                            background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.02)",
                            borderTop: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleStaffActive(staff.id, staff.is_active)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: staff.is_active ? "#fee2e2" : "#dcfce7",
                              color: staff.is_active ? "#dc2626" : "#16a34a",
                              border: "none",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {staff.is_active ? "Disable" : "Activate"}
                          </button>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditStaff(staff)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                                color: isLight ? "#0f172a" : "#ffffff",
                                border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.12)",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Edit PIN / Role
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id, staff.name)}
                              style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", padding: "4px" }}
                              title="Delete staff member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: FLODESKTOP POS INTEGRATION HUB
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "flodesktop" && (
            <div>
              <div
                style={{
                  background: isLight ? "#ffffff" : "#0e1526",
                  border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "24px 28px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Laptop size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0, color: isLight ? "#0f172a" : "#ffffff" }}>
                      FloDesktop POS Hybrid Integration
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: isLight ? "#64748b" : "#94a3b8" }}>
                      Dual-mode offline/cloud synchronization architecture with local SQLite database.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "10px", border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>Current Operating Mode</span>
                    <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px", color: isLight ? "#0f172a" : "#ffffff" }}>
                      Integrated Mode (Cloud Master)
                    </div>
                    <p style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8", margin: "4px 0 0" }}>
                      Menu products and staff credentials are controlled by Super Admin and mirrored to local POS terminals.
                    </p>
                  </div>

                  <div style={{ background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "10px", border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>Cloud Database Endpoint</span>
                    <div style={{ fontSize: "13px", fontFamily: "monospace", fontWeight: 700, marginTop: "4px", color: isLight ? "#0f172a" : "#ffffff", overflow: "hidden", textOverflow: "ellipsis" }}>
                      uadrrjrlhfttithjmdye.supabase.co
                    </div>
                    <p style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8", margin: "4px 0 0" }}>
                      Tables: <code>products</code>, <code>categories</code>, <code>shops</code>, <code>pos_staff</code>.
                    </p>
                  </div>

                  <div style={{ background: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "10px", border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>Terminal Port Requirement</span>
                    <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "4px", color: isLight ? "#0f172a" : "#ffffff" }}>
                      Zero Port Config (Client WebSocket)
                    </div>
                    <p style={{ fontSize: "11px", color: isLight ? "#64748b" : "#94a3b8", margin: "4px 0 0" }}>
                      FloDesktop connects outbound to Supabase. Terminal machines need no port forwarding or local HTTP servers.
                    </p>
                  </div>
                </div>

                {/* Instant Cloud Verification Action Bar */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleVerifyCloudSync}
                    disabled={isSyncingFloDesktop}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "10px 18px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 3px 12px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <RefreshCw size={15} className={isSyncingFloDesktop ? "animate-spin" : ""} />
                    <span>Verify Supabase Cloud Live Sync</span>
                  </button>

                  <a
                    href="/admin/products"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "10px 18px",
                      borderRadius: "8px",
                      background: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.08)",
                      border: isLight ? "1px solid #cbd5e1" : "1px solid rgba(255, 255, 255, 0.15)",
                      color: isLight ? "#0f172a" : "#ffffff",
                      fontSize: "13px",
                      fontWeight: 800,
                      textDecoration: "none",
                    }}
                  >
                    <Pizza size={15} className="text-orange-500" />
                    <span>Manage Global Products Menu</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5: SQL SCHEMA
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "schema" && (
            <div>
              <div
                style={{
                  background: isLight ? "#ffffff" : "#0e1526",
                  border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "24px 28px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0, color: isLight ? "#0f172a" : "#ffffff" }}>
                      Supabase Cloud Schema (Shops &amp; POS Staff)
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: isLight ? "#64748b" : "#94a3b8" }}>
                      Run in your Supabase Dashboard &rarr; SQL Editor if setting up a fresh cloud instance.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySql}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "#ea580c",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedSql ? "Copied SQL!" : "Copy SQL Script"}</span>
                  </button>
                </div>

                <pre
                  style={{
                    background: isLight ? "#0f172a" : "#050811",
                    color: "#38bdf8",
                    padding: "18px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    lineHeight: 1.6,
                    overflowX: "auto",
                    margin: 0,
                    fontFamily: "monospace",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {sqlMigrationCode}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── MODALS ───────────────────────────────────────────────────────────── */}
      {/* Branch Modal */}
      <ShopModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onSubmit={handleBranchModalSubmit}
        editingShop={editingShop}
      />

      {/* Staff Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSubmit={handleStaffModalSubmit}
        editingStaff={editingStaff}
        shops={shops}
      />
    </div>
  );
}
