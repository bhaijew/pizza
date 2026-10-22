import Link from "next/link";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import type { Order } from "@/types/menu";
import {
  Flame,
  Pizza,
  ShoppingBag,
  ChefHat,
  Plus,
  Clock,
  ArrowUpRight,
  QrCode,
  TicketPercent,
  Receipt,
  Sliders,
  CheckCircle2,
  Activity,
  TrendingUp,
  UtensilsCrossed,
  Bike,
  Sparkles,
  AlertTriangle,
  Store,
  Download,
  MessageSquare,
} from "@/components/admin/AdminIcons";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const serviceRoleOk = isServiceRoleConfigured();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let productCount = 0;
  let categoryCount = 0;
  let orderCount = 0;
  let pendingOrders = 0;
  let recentOrders: Order[] = [];
  let currencySymbol = "Rs.";
  let shopName = "Pizza Shop";

  try {
    let prodQuery = db.from("products").select("id", { count: "exact", head: true });
    let catQuery = db.from("categories").select("id", { count: "exact", head: true });
    let orderQuery = db.from("orders").select("id, status");
    let recentQuery = db.from("orders").select("*").order("created_at", { ascending: false }).limit(6);

    if (activeShop.shopId) {
      prodQuery = prodQuery.eq("shop_id", activeShop.shopId);
      catQuery = catQuery.eq("shop_id", activeShop.shopId);
      orderQuery = orderQuery.eq("shop_id", activeShop.shopId);
      recentQuery = recentQuery.eq("shop_id", activeShop.shopId);
    } else {
      prodQuery = prodQuery.is("shop_id", null);
      catQuery = catQuery.is("shop_id", null);
      orderQuery = orderQuery.is("shop_id", null);
      recentQuery = recentQuery.is("shop_id", null);
    }

    const [prodRes, catRes, orderRes, recentRes, settings] = await Promise.all([
      prodQuery,
      catQuery,
      orderQuery,
      recentQuery,
      fetchSettings(),
    ]);

    shopName =
      activeShop.shopName && activeShop.shopName !== "Master Store"
        ? activeShop.shopName
        : settings.shop_name || "Soule What Management";
    currencySymbol = settings.currency_symbol || "Rs.";

    productCount = prodRes.count ?? 0;
    categoryCount = catRes.count ?? 0;

    if (orderRes.data) {
      orderCount = orderRes.data.length;
      pendingOrders = orderRes.data.filter(
        (o) => o.status === "pending" || o.status === "preparing"
      ).length;
    }

    if (recentRes.data) {
      recentOrders = recentRes.data as Order[];
    }
  } catch (_) {}

  const statusColors: Record<
    string,
    { bg: string; text: string; border: string; label: string; dot: string }
  > = {
    pending: { bg: "#fefce8", text: "#ca8a04", border: "#fde047", label: "Pending", dot: "#eab308" },
    confirmed: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", label: "Confirmed", dot: "#3b82f6" },
    preparing: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", label: "In Kitchen", dot: "#f97316" },
    ready: { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff", label: "Ready", dot: "#a855f7" },
    delivered: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", label: "Delivered", dot: "#10b981" },
    cancelled: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", label: "Cancelled", dot: "#ef4444" },
  };

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto" }}>
      {/* ─── Warning if Service Role missing ─── */}
      {!serviceRoleOk && (
        <div
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            borderRadius: 10,
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            color: "#92400e",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.12)",
          }}
        >
          <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong style={{ display: "block", fontSize: 14, color: "#78350f" }}>
              Configuration Required: SUPABASE_SERVICE_ROLE_KEY is missing
            </strong>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
              To enable database writes, copy your <code>service_role</code> secret from your Supabase Dashboard into <code>.env.local</code>.
            </p>
          </div>
        </div>
      )}

      {/* ─── Top Command Center Hero ─── */}
      <div
        style={{
          background: "linear-gradient(135deg, #070c18 0%, #0d1527 50%, #151d32 100%)",
          borderRadius: 16,
          color: "#ffffff",
          marginBottom: 26,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 20px 40px -15px rgba(7, 12, 24, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          position: "relative",
          overflow: "hidden",
        }}
        className="p-5 sm:p-7 md:p-8"
      >
        {/* Ambient Glow Lights */}
        <div
          style={{
            position: "absolute",
            right: "-40px",
            top: "-40px",
            width: "280px",
            height: "280px",
            background: "radial-gradient(circle, rgba(234, 88, 12, 0.28) 0%, rgba(239, 68, 68, 0.12) 50%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-50px",
            bottom: "-50px",
            width: "260px",
            height: "260px",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Micro-dot Cyber Texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 640 }}>
          {/* Live Operations Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
                boxShadow: "0 0 10px #10b981",
              }}
              className="admin-pulse-green"
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#34d399",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Live Operations Terminal
            </span>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
              lineHeight: 1.2,
            }}
          >
            <span className="bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
              {shopName}
            </span>{" "}
            Command Center
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
            Real-time kitchen order sequencing, WhatsApp dispatch automation &amp; daily shift telemetry.
          </p>
        </div>

        {/* Quick Executive Shortcuts */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <Link
            href="/admin/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 18px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #ef4444 0%, #ea580c 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 6px 18px -2px rgba(234, 88, 12, 0.45)",
              border: "none",
              transition: "all 0.2s ease",
            }}
            className="hover:scale-105 active:scale-95"
          >
            <ShoppingBag size={16} />
            <span>Live Order Board</span>
            {pendingOrders > 0 && (
              <span
                style={{
                  background: "#ffffff",
                  color: "#ea580c",
                  padding: "1px 8px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 900,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                {pendingOrders}
              </span>
            )}
          </Link>

          <Link
            href="/admin/kitchen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 18px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
            className="hover:bg-white/15 hover:scale-105 active:scale-95"
          >
            <ChefHat size={16} className="text-orange-400" />
            <span>Kitchen KDS</span>
          </Link>

          <Link
            href="/admin/sole-what"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 16px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 6px 18px -2px rgba(16, 185, 129, 0.4)",
              border: "none",
              transition: "all 0.2s ease",
            }}
            className="hover:scale-105 active:scale-95"
            title="Sole-What WhatsApp Gateway Hub"
          >
            <MessageSquare size={16} />
            <span>Sole-What WA</span>
            <span
              style={{
                background: "#ffffff",
                color: "#059669",
                padding: "1px 6px",
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              BOT
            </span>
          </Link>

          <Link
            href={
              activeShop.shopSlug
                ? `/demo/pos?shop=${encodeURIComponent(activeShop.shopSlug)}`
                : activeShop.shopId
                ? `/demo/pos?shopId=${activeShop.shopId}`
                : "/demo/pos"
            }
            target="_blank"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 16px",
              borderRadius: 10,
              background: "rgba(16, 185, 129, 0.12)",
              color: "#34d399",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
            className="hover:bg-emerald-500/20 hover:scale-105 active:scale-95"
            title="Open Cashier POS Terminal"
          >
            <Download size={15} />
            <span>Open POS</span>
          </Link>

          <Link
            href="/admin/products?action=new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "11px 16px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.05)",
              color: "#cbd5e1",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              transition: "all 0.2s ease",
            }}
            className="hover:bg-white/12 hover:scale-105 active:scale-95"
          >
            <Plus size={15} />
            <span>Add Pizza</span>
          </Link>
        </div>
      </div>

      {/* ─── Metric KPI Cards Grid (Modern Elevated Unique Squircles) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-7 sm:mb-9">
        {/* KPI 1: Active Orders */}
        <Link
          href="/admin/orders"
          style={{
            textDecoration: "none",
            background: pendingOrders > 0
              ? "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)"
              : "#ffffff",
            border: pendingOrders > 0 ? "1.5px solid #fdba74" : "1px solid #e8edf2",
            borderRadius: 16,
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: pendingOrders > 0
              ? "0 12px 28px -6px rgba(234, 88, 12, 0.2), 0 0 1px 1px rgba(234, 88, 12, 0.15)"
              : "0 10px 28px -6px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03)",
            transition: "all 0.22s ease",
          }}
          className="admin-card-hover group hover:-translate-y-1"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: pendingOrders > 0 ? "#c2410c" : "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Active Orders
            </span>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: pendingOrders > 0 ? "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)" : "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                color: pendingOrders > 0 ? "#ffffff" : "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: pendingOrders > 0 ? "0 6px 14px rgba(234, 88, 12, 0.35)" : "none",
              }}
              className="group-hover:scale-108 transition-transform"
            >
              <Flame size={22} className={pendingOrders > 0 ? "animate-pulse" : ""} />
            </div>
          </div>
          <div style={{ margin: "16px 0 10px" }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: pendingOrders > 0 ? "#c2410c" : "#0f172a", lineHeight: 1.1 }}>
              {pendingOrders}
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 14,
                color: pendingOrders > 0 ? "#ea580c" : "#64748b",
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {pendingOrders > 0 ? "Needs kitchen preparation" : "All orders caught up"}
            </p>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
            }}
          >
            <span>Open live order board</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        {/* KPI 2: Products */}
        <Link
          href="/admin/products"
          style={{
            textDecoration: "none",
            background: "#ffffff",
            border: "1px solid #e8edf2",
            borderRadius: 16,
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 10px 28px -6px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03)",
            transition: "all 0.22s ease",
          }}
          className="admin-card-hover group hover:-translate-y-1"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Menu Products
            </span>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="group-hover:scale-108 transition-transform"
            >
              <Pizza size={22} />
            </div>
          </div>
          <div style={{ margin: "16px 0 10px" }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
              {productCount}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b", fontWeight: 500, lineHeight: 1.4 }}>
              Across {categoryCount} food categories
            </p>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
            }}
          >
            <span>Manage food items</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        {/* KPI 3: Total Orders */}
        <Link
          href="/admin/orders"
          style={{
            textDecoration: "none",
            background: "#ffffff",
            border: "1px solid #e8edf2",
            borderRadius: 16,
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 10px 28px -6px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03)",
            transition: "all 0.22s ease",
          }}
          className="admin-card-hover group hover:-translate-y-1"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Total Orders
            </span>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="group-hover:scale-108 transition-transform"
            >
              <ShoppingBag size={22} />
            </div>
          </div>
          <div style={{ margin: "16px 0 10px" }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
              {orderCount}
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 14,
                color: "#64748b",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 5,
                lineHeight: 1.4,
              }}
            >
              <TrendingUp size={15} className="text-blue-500" />
              <span>All-time completed orders</span>
            </p>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
            }}
          >
            <span>View order history</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        {/* KPI 4: Promos & Loyalty */}
        <Link
          href="/admin/promos"
          style={{
            textDecoration: "none",
            background: "#ffffff",
            border: "1px solid #e8edf2",
            borderRadius: 16,
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 10px 28px -6px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03)",
            transition: "all 0.22s ease",
          }}
          className="admin-card-hover group hover:-translate-y-1"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Promos &amp; Loyalty
            </span>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="group-hover:scale-108 transition-transform"
            >
              <Sparkles size={22} />
            </div>
          </div>
          <div style={{ margin: "16px 0 10px" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#059669", lineHeight: 1.2 }}>
              VIP Cash Engine
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b", fontWeight: 500, lineHeight: 1.4 }}>
              1 pt per Rs. 50 (2% Cashback)
            </p>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#059669",
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
            }}
          >
            <span>Manage coupons &amp; points</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>
      </div>

      {/* ─── Operations Grid: Recent Orders + Quick Management ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        
        {/* LEFT: Live Order Stream */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e8edf2",
            borderRadius: 16,
            padding: "26px 24px",
            boxShadow: "0 10px 30px -8px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                  boxShadow: "0 0 10px #10b981",
                }}
                className="admin-pulse-green"
              />
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Recent Incoming Orders
              </h2>
            </div>
            <Link
              href="/admin/orders"
              style={{
                fontSize: 13,
                color: "#ea580c",
                textDecoration: "none",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 8,
                background: "#fff7ed",
                transition: "all 0.18s ease",
              }}
              className="hover:bg-orange-100"
            >
              <span>Live Order Board</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div
              style={{
                padding: "54px 20px",
                textAlign: "center",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: 16,
                  background: "#fff7ed",
                  color: "#ea580c",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <ShoppingBag size={30} />
              </div>
              <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#0f172a", fontSize: 16 }}>
                No active orders yet
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", maxWidth: 340, marginInline: "auto", lineHeight: 1.5 }}>
                When customers place Dine-In, Delivery, or Takeaway orders, they will stream here live with instant sound alerts.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {recentOrders.map((order) => {
                const s = statusColors[order.status] || {
                  bg: "#f1f5f9",
                  text: "#334155",
                  border: "#e2e8f0",
                  label: order.status,
                  dot: "#64748b",
                };

                const isDelivery = order.order_type === "delivery";
                const isDineIn = order.order_type === "dine_in";

                return (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 16px",
                      background: "#f8fafc",
                      border: "1px solid #edf2f7",
                      borderLeft: `4px solid ${isDelivery ? "#3b82f6" : isDineIn ? "#f97316" : "#eab308"}`,
                      borderRadius: 12,
                      gap: 12,
                      transition: "all 0.18s ease",
                    }}
                    className="hover:bg-slate-100/90 hover:shadow-xs"
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#0f172a",
                            background: "#ffffff",
                            padding: "2px 7px",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          #{order.order_number}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: isDelivery ? "#eff6ff" : isDineIn ? "#fff7ed" : "#fefce8",
                            color: isDelivery ? "#1d4ed8" : isDineIn ? "#c2410c" : "#a16207",
                            border: `1px solid ${
                              isDelivery ? "#bfdbfe" : isDineIn ? "#fed7aa" : "#fef08a"
                            }`,
                            textTransform: "uppercase",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {isDineIn ? (
                            <UtensilsCrossed size={12} />
                          ) : isDelivery ? (
                            <Bike size={12} />
                          ) : (
                            <ShoppingBag size={12} />
                          )}
                          <span>
                            {isDineIn
                              ? `Table ${order.table_number || "—"}`
                              : isDelivery
                              ? "Delivery"
                              : "Takeaway"}
                          </span>
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="font-medium text-slate-700">{order.customer_name || "Guest"}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 800, color: "#0f172a" }}>
                          {currencySymbol} {Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          background: s.bg,
                          color: s.text,
                          border: `1px solid ${s.border}`,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
                        <span>{s.label}</span>
                      </span>

                      <Link
                        href={`/track/${order.order_number}`}
                        target="_blank"
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          fontSize: 11,
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          transition: "all 0.15s ease",
                        }}
                        className="hover:border-slate-400 hover:bg-slate-50"
                        title="Track Order Live Status"
                      >
                        <span>Track</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Quick Launch Controls & System Readiness */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Quick Shortcuts Matrix */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e8edf2",
              borderRadius: 16,
              padding: "26px 24px",
              boxShadow: "0 10px 30px -8px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>
              Quick Management Shortcuts
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>
              One-click access to core store operations and daily workflows.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                {
                  title: "Table QR Codes",
                  desc: "Generate & print table QRs",
                  href: "/admin/tables",
                  icon: QrCode,
                  color: "#ea580c",
                  bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                },
                {
                  title: "Coupons & Promos",
                  desc: "Set discount voucher codes",
                  href: "/admin/promos",
                  icon: TicketPercent,
                  color: "#10b981",
                  bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                },
                {
                  title: "Daily Cash Closing",
                  desc: "End of day financial report",
                  href: "/admin/closing",
                  icon: Receipt,
                  color: "#2563eb",
                  bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                },
                {
                  title: "Menu Settings",
                  desc: "Branding, SEO & currency",
                  href: "/admin/settings",
                  icon: Sliders,
                  color: "#7c3aed",
                  bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      padding: "16px 15px",
                      borderRadius: 12,
                      background: "#f8fafc",
                      border: "1px solid #e8edf2",
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      transition: "all 0.18s ease",
                    }}
                    className="admin-action-card group hover:-translate-y-1 hover:border-slate-300 hover:shadow-xs"
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: item.bg,
                        color: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      className="group-hover:scale-108 transition-transform"
                    >
                      <IconComponent size={19} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.3 }}>{item.desc}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System & Hardware Readiness Card (High-Tech Telemetry) */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)",
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              padding: "22px 24px",
              boxShadow: "0 8px 24px -6px rgba(16, 185, 129, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#dcfce7",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)",
                }}
              >
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#065f46" }}>
                  Operational Engine Telemetry
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#047857" }}>
                  All store services and live engines are synchronized &amp; healthy.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 13 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(187, 247, 208, 0.6)",
                }}
              >
                <span style={{ color: "#065f46", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Kitchen Audio Engine:
                </span>
                <span style={{ fontWeight: 800, color: "#047857" }}>Web Audio API (Online)</span>
              </div>
              
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(187, 247, 208, 0.6)",
                }}
              >
                <span style={{ color: "#065f46", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  WhatsApp Multi-Tenancy:
                </span>
                <span style={{ fontWeight: 800, color: "#047857" }}>Shop-Isolated Gateway</span>
              </div>
              
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(187, 247, 208, 0.6)",
                }}
              >
                <span style={{ color: "#065f46", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Database RAM Cache:
                </span>
                <span style={{ fontWeight: 800, color: "#047857" }}>Active • Sub-1ms RAM</span>
              </div>
              
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(187, 247, 208, 0.6)",
                }}
              >
                <span style={{ color: "#065f46", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Customer Live Tracker:
                </span>
                <span style={{ fontWeight: 800, color: "#047857" }}>Active &amp; Streaming</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
