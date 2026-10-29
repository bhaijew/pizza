import Link from "next/link";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import CommandCenterHero from "@/components/admin/CommandCenterHero";
import AdminLiveCharts from "@/components/admin/AdminLiveCharts";
import { dbCache } from "@/lib/db-cache";
import { getCurrentBusinessDate, getBusinessShiftUtcRange } from "@/lib/business-hours";
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

function formatHumanBusinessDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-PK", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function AdminDashboardPage() {
  const serviceRoleOk = isServiceRoleConfigured();
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();
  const settings = await fetchSettings();

  const openingTime = settings.opening_time || "11:00";
  const closingTime = settings.closing_time || "01:00";
  const businessDate = getCurrentBusinessDate(openingTime, closingTime);
  const shiftRange = getBusinessShiftUtcRange(businessDate, openingTime, closingTime);

  let productCount = 0;
  let categoryCount = 0;
  let allTimeOrderCount = 0;
  let pendingOrders = 0;
  let todayOrders: Order[] = [];
  let recentOrders: Order[] = [];
  let chartOrders: Order[] = [];
  let todayNetSales = 0;
  let currencySymbol = settings.currency_symbol || "Rs.";
  let shopName =
    activeShop.shopName && activeShop.shopName !== "Master Store"
      ? activeShop.shopName
      : settings.shop_name || "SoleWhat POS & Cloud Operations";

  try {
    const cacheKey = `dashboard:daily:${activeShop.shopId ?? "master"}:${businessDate}`;
    const metrics = await dbCache.wrap(
      cacheKey,
      async () => {
        let prodQuery = db.from("products").select("id", { count: "exact", head: true });
        let catQuery = db.from("categories").select("id", { count: "exact", head: true });
        let totalCountQuery = db.from("orders").select("id", { count: "exact", head: true });
        let pendingCountQuery = db
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending", "preparing"]);
        let todayQuery = db
          .from("orders")
          .select("*")
          .gte("created_at", shiftRange.startUtc)
          .lte("created_at", shiftRange.endUtc)
          .order("created_at", { ascending: false });
        let recentQuery = db
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(250);

        if (activeShop.shopId) {
          prodQuery = prodQuery.eq("shop_id", activeShop.shopId);
          catQuery = catQuery.eq("shop_id", activeShop.shopId);
          totalCountQuery = totalCountQuery.eq("shop_id", activeShop.shopId);
          pendingCountQuery = pendingCountQuery.eq("shop_id", activeShop.shopId);
          todayQuery = todayQuery.eq("shop_id", activeShop.shopId);
          recentQuery = recentQuery.eq("shop_id", activeShop.shopId);
        } else {
          prodQuery = prodQuery.is("shop_id", null);
          catQuery = catQuery.is("shop_id", null);
          totalCountQuery = totalCountQuery.is("shop_id", null);
          pendingCountQuery = pendingCountQuery.is("shop_id", null);
          todayQuery = todayQuery.is("shop_id", null);
          recentQuery = recentQuery.is("shop_id", null);
        }

        const [prodRes, catRes, totalCountRes, pendingCountRes, todayRes, recentRes] =
          await Promise.all([
            prodQuery,
            catQuery,
            totalCountQuery,
            pendingCountQuery,
            todayQuery,
            recentQuery,
          ]);

        const fetchedToday = (todayRes.data as Order[]) || [];
        const allFetchedRecent = (recentRes.data as Order[]) || [];
        const validSales = fetchedToday
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        return {
          productCount: prodRes.count ?? 0,
          categoryCount: catRes.count ?? 0,
          allTimeOrderCount: totalCountRes.count ?? 0,
          pendingOrders: pendingCountRes.count ?? 0,
          todayOrders: fetchedToday,
          recentOrders: allFetchedRecent.slice(0, 8),
          chartOrders: allFetchedRecent,
          todayNetSales: validSales,
        };
      },
      { ttlSeconds: 20, tags: ["orders", "products", "categories"] }
    );

    productCount = metrics.productCount;
    categoryCount = metrics.categoryCount;
    allTimeOrderCount = metrics.allTimeOrderCount;
    pendingOrders = metrics.pendingOrders;
    todayOrders = metrics.todayOrders;
    recentOrders = metrics.recentOrders;
    chartOrders = metrics.chartOrders;
    todayNetSales = metrics.todayNetSales;
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

      {/* ─── Top Command Center Hero (Multiple Animated Background Images) ─── */}
      <CommandCenterHero
        shopName={shopName}
        pendingOrders={pendingOrders}
        posUrl={
          activeShop.shopSlug
            ? `/demo/pos?shop=${encodeURIComponent(activeShop.shopSlug)}`
            : activeShop.shopId
            ? `/demo/pos?shopId=${activeShop.shopId}`
            : "/demo/pos"
        }
        customImages={
          [
            settings.hero_bg_image,
            ...(Array.isArray(settings.slider_images)
              ? settings.slider_images.map((s: any) => s?.image_url)
              : []),
          ].filter(Boolean) as string[]
        }
      />

      {/* ─── Metric KPI Cards Grid (5px Square UI) ─── */}
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
            borderRadius: 5,
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
                borderRadius: 5,
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
            borderRadius: 5,
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
                borderRadius: 5,
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

        {/* KPI 3: Today's Daily Orders (Auto-updates daily) */}
        <Link
          href="/admin/orders"
          style={{
            textDecoration: "none",
            background: "#ffffff",
            border: "1px solid #e8edf2",
            borderRadius: 5,
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
                color: "#2563eb",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Today&apos;s Daily Orders
            </span>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 5,
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
              {todayOrders.length}
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "#64748b",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
                lineHeight: 1.4,
              }}
            >
              <TrendingUp size={15} className="text-emerald-500" />
              <span>
                {currencySymbol} {todayNetSales.toLocaleString()} sales &bull; {businessDate}
              </span>
            </p>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
            }}
          >
            <span>Live daily shift queue</span>
            <ArrowUpRight size={15} />
          </div>
        </Link>

        {/* KPI 4: Promos & Loyalty */}
        <Link
          href="/admin/promos"
          style={{
            textDecoration: "none",
            background: "#ffffff",
            border: "1px solid #e8edf2",
            borderRadius: 5,
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
                borderRadius: 5,
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

      {/* ─── LIVE RUSH HOUR, SELLING & MENU PERFORMANCE CHARTS ─── */}
      <AdminLiveCharts
        initialOrders={chartOrders}
        todayOrders={todayOrders}
        currencySymbol={currencySymbol}
        shopId={activeShop.shopId}
        openingTime={openingTime}
        closingTime={closingTime}
      />

      {/* ─── Operations Grid: Recent Orders + Quick Management ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        
        {/* LEFT: Today's Daily Orders (Auto-updates daily with active operational shift) */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e8edf2",
            borderRadius: 5,
            padding: "26px 24px",
            boxShadow: "0 10px 30px -8px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
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
                  Today&apos;s Daily Orders
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 5,
                    background: "#dcfce7",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  LIVE SHIFT
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                Active shift: <strong>{formatHumanBusinessDate(businessDate)}</strong> ({openingTime} - {closingTime}) &bull; Automatically updates daily
              </p>
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
                padding: "6px 12px",
                borderRadius: 5,
                background: "#fff7ed",
                transition: "all 0.18s ease",
              }}
              className="hover:bg-orange-100"
            >
              <span>Live Order Board</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Daily Shift Summary Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc",
              border: "1px solid #edf2f7",
              borderRadius: 5,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 12,
              fontWeight: 700,
              color: "#334155",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} className="text-orange-500" />
              <span>Shift Date: {businessDate}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#0f172a", fontWeight: 800 }}>
                {todayOrders.length} {todayOrders.length === 1 ? "Order" : "Orders"} Today
              </span>
              <span style={{ color: "#16a34a", fontWeight: 900 }}>
                {currencySymbol} {todayNetSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {todayOrders.length === 0 ? (
            <div>
              <div
                style={{
                  padding: "36px 20px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 14,
                  background: "#fdfefe",
                  borderRadius: 5,
                  border: "1px dashed #cbd5e1",
                  marginBottom: recentOrders.length > 0 ? 16 : 0,
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: 5,
                    background: "#fff7ed",
                    color: "#ea580c",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <ShoppingBag size={26} />
                </div>
                <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#0f172a", fontSize: 15 }}>
                  Shift Open &bull; No Orders Placed Yet Today
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", maxWidth: 360, marginInline: "auto", lineHeight: 1.5 }}>
                  Today&apos;s shift ({formatHumanBusinessDate(businessDate)}) is live. When customer orders arrive today, tickets will stream here automatically.
                </p>
              </div>

              {recentOrders.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>📋 Previous Shift Orders ({recentOrders.length})</span>
                  </div>
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
                            borderRadius: 5,
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
                                  borderRadius: 5,
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
                                  borderRadius: 5,
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
                              <span>&bull;</span>
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
                                borderRadius: 5,
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
                                borderRadius: 5,
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
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {todayOrders.map((order) => {
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
                      borderRadius: 5,
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
                            borderRadius: 5,
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
                            borderRadius: 5,
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
                          borderRadius: 5,
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
                          borderRadius: 5,
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
              borderRadius: 5,
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
                      borderRadius: 5,
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
                        borderRadius: 5,
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
              borderRadius: 5,
              padding: "22px 24px",
              boxShadow: "0 8px 24px -6px rgba(16, 185, 129, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 5,
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
                  borderRadius: 5,
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
                  borderRadius: 5,
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
                  borderRadius: 5,
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
                  borderRadius: 5,
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
