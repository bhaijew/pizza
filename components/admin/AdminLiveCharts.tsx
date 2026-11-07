"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Order } from "@/types/menu";
import {
  Flame,
  TrendingUp,
  Clock,
  ShoppingBag,
  Pizza,
  Bike,
  UtensilsCrossed,
  Store,
  CheckCircle2,
  Sparkles,
    Users,
  Receipt,
  Zap,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

import { updateShopAnalyticsStartDate } from "@/lib/admin-actions";

interface AdminLiveChartsProps {
  initialOrders: Order[];
  todayOrders: Order[];
  currencySymbol?: string;
  shopId?: number | null;
  shopCreatedAt?: string | null;
  openingTime?: string;
  closingTime?: string;
}

type TimeRange = "today" | "7d" | "30d" | "all";
type RushMetric = "orders" | "revenue";
type SalesChartStyle = "area" | "bars";

function formatHourLabel(hour24: number): string {
  const h = ((hour24 % 24) + 24) % 24;
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function getPakistaniHour(isoString?: string): number {
  if (!isoString) return 12;
  try {
    const d = new Date(isoString);
    const pktStr = d.toLocaleTimeString("en-US", {
      timeZone: "Asia/Karachi",
      hour12: false,
      hour: "2-digit",
    });
    const parsed = parseInt(pktStr, 10);
    return Number.isNaN(parsed) ? d.getHours() : parsed % 24;
  } catch {
    return new Date(isoString).getHours();
  }
}

function getPakistaniDateKey(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }); // YYYY-MM-DD
  } catch {
    return isoString.slice(0, 10);
  }
}

function formatShortDateFromKey(dateKey: string): string {
  try {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateKey;
  }
}

export default function AdminLiveCharts({
  initialOrders,
  todayOrders,
  currencySymbol = "Rs.",
  shopId = null,
  shopCreatedAt = null,
}: AdminLiveChartsProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [range, setRange] = useState<TimeRange>("30d");
  const [rushMetric, setRushMetric] = useState<RushMetric>("orders");
  const [salesChartStyle, setSalesChartStyle] = useState<SalesChartStyle>("bars");
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [livePulse, setLivePulse] = useState(false);
  const [activeSinceIso, setActiveSinceIso] = useState<string | null>(shopCreatedAt);
  const [savingStartDate, setSavingStartDate] = useState(false);

  const todayDateKey = useMemo(() => getPakistaniDateKey(new Date().toISOString()), []);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    setActiveSinceIso(shopCreatedAt);
  }, [shopCreatedAt]);

  const handleSetStartFromToday = async () => {
    setSavingStartDate(true);
    const nowStart = new Date();
    nowStart.setHours(0, 0, 0, 0);
    const iso = nowStart.toISOString();
    setActiveSinceIso(iso);
    await updateShopAnalyticsStartDate(iso);
    setSavingStartDate(false);
  };

  const handleResetActiveDate = async () => {
    setSavingStartDate(true);
    setActiveSinceIso(null);
    await updateShopAnalyticsStartDate(null);
    setSavingStartDate(false);
  };

  // Real-time Supabase subscription for instant live chart updates
  useEffect(() => {
    const supabase = createClient();
    const targetShopId = shopId != null ? Number(shopId) : null;

    const channel = supabase
      .channel(`admin-live-charts-${targetShopId ?? "master"}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            const orderShop =
              (newOrder as any).shop_id != null ? Number((newOrder as any).shop_id) : null;
            if (targetShopId === null ? orderShop === null : orderShop === targetShopId) {
              setOrders((prev) => {
                if (prev.some((o) => Number(o.id) === Number(newOrder.id))) return prev;
                return [newOrder, ...prev];
              });
              setLivePulse(true);
              setTimeout(() => setLivePulse(false), 2500);
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (Number(o.id) === Number(updated.id) ? { ...o, ...updated } : o))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setOrders((prev) => prev.filter((o) => Number(o.id) !== Number(deletedId)));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  // Orders strictly on or after the shop's activation date on SoleWhat
  const activationFilteredOrders = useMemo(() => {
    if (!activeSinceIso) return orders;
    const minTs = new Date(activeSinceIso).getTime();
    if (Number.isNaN(minTs)) return orders;
    return orders.filter((o) => new Date(o.created_at || 0).getTime() >= minTs);
  }, [orders, activeSinceIso]);

  // Filter orders by selected range
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    if (range === "today") {
      if (todayOrders.length > 0) return todayOrders;
      return activationFilteredOrders.filter(
        (o) => getPakistaniDateKey(o.created_at) === todayDateKey
      );
    }
    if (range === "7d") {
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      return activationFilteredOrders.filter(
        (o) => new Date(o.created_at || 0).getTime() >= cutoff
      );
    }
    if (range === "30d") {
      const cutoff = now - 30 * 24 * 60 * 60 * 1000;
      return activationFilteredOrders.filter(
        (o) => new Date(o.created_at || 0).getTime() >= cutoff
      );
    }
    return activationFilteredOrders;
  }, [activationFilteredOrders, todayOrders, range, todayDateKey]);

  const validOrders = useMemo(
    () => filteredOrders.filter((o) => o.status !== "cancelled"),
    [filteredOrders]
  );

  // Summary KPIs for the selected range
  const summary = useMemo(() => {
    const totalRev = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const count = validOrders.length;
    const aov = count > 0 ? Math.round(totalRev / count) : 0;
    const deliveredCount = validOrders.filter((o) => o.status === "delivered").length;
    return { totalRev, count, aov, deliveredCount };
  }, [validOrders]);

  // ─── 1. RUSH HOUR CHART DATA (Only Active Shift Hours) ──────────────────────
  const rushHourSlots = useMemo(() => {
    const shiftHours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
    const buckets: Record<
      number,
      { hour: number; label: string; orders: number; revenue: number }
    > = {};

    for (let h = 0; h < 24; h++) {
      buckets[h] = {
        hour: h,
        label: formatHourLabel(h),
        orders: 0,
        revenue: 0,
      };
    }

    validOrders.forEach((o) => {
      const h = getPakistaniHour(o.created_at);
      if (buckets[h]) {
        buckets[h].orders += 1;
        buckets[h].revenue += Number(o.total) || 0;
      }
    });

    const extraHours = [3, 4, 5, 6, 7, 8, 9, 10].filter((h) => buckets[h].orders > 0);
    const finalHours = [...extraHours, ...shiftHours];

    const list = finalHours.map((h) => buckets[h]);
    let peakSlot = list[0] || { hour: 20, label: "8 PM", orders: 0, revenue: 0 };
    for (const slot of list) {
      if (
        rushMetric === "orders"
          ? slot.orders > peakSlot.orders
          : slot.revenue > peakSlot.revenue
      ) {
        peakSlot = slot;
      }
    }

    const maxVal = Math.max(
      1,
      ...list.map((s) => (rushMetric === "orders" ? s.orders : s.revenue))
    );

    return { list, peakSlot, maxVal };
  }, [validOrders, rushMetric]);

  // ─── 2. SELLING & REVENUE TREND CHART (Only Active Days on SoleWhat) ────────
  const dailySalesTrend = useMemo(() => {
    const maxDaysLimit = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 60;
    const now = Date.now();
    const cutoffMs =
      range === "today"
        ? 0
        : range === "all"
          ? 0
          : now - maxDaysLimit * 24 * 60 * 60 * 1000;

    const dayMap: Record<
      string,
      { dateKey: string; shortLabel: string; revenue: number; orders: number }
    > = {};

    // Aggregate ONLY actual orders placed on or after shop activation date
    activationFilteredOrders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        const ts = new Date(o.created_at || 0).getTime();
        if (cutoffMs > 0 && ts < cutoffMs) return;
        const key = getPakistaniDateKey(o.created_at);
        if (!key) return;
        if (range === "today" && key !== todayDateKey) return;

        if (!dayMap[key]) {
          dayMap[key] = {
            dateKey: key,
            shortLabel: key === todayDateKey ? "Today" : formatShortDateFromKey(key),
            revenue: 0,
            orders: 0,
          };
        }
        dayMap[key].revenue += Number(o.total) || 0;
        dayMap[key].orders += 1;
      });

    // Only keep days where the site was genuinely active (orders > 0)
    const activePoints = Object.values(dayMap)
      .filter((pt) => pt.orders > 0 && pt.revenue > 0)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .slice(-12);

    // If no active days yet (e.g. brand new shop activated today), show single Today entry
    const points =
      activePoints.length > 0
        ? activePoints
        : [
            {
              dateKey: todayDateKey,
              shortLabel: "Today",
              revenue: 0,
              orders: 0,
            },
          ];

    const maxRevenue = Math.max(100, ...points.map((p) => p.revenue));
    const maxOrders = Math.max(1, ...points.map((p) => p.orders));

    return { points, maxRevenue, maxOrders, activeDaysCount: activePoints.length };
  }, [activationFilteredOrders, range, todayDateKey]);

  // ─── 3. TOP BEST-SELLING ITEMS CHART ────────────────────────────────────────
  const topSellingItems = useMemo(() => {
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};

    validOrders.forEach((o) => {
      const itemsList = Array.isArray(o.items) ? o.items : [];
      itemsList.forEach((it: any) => {
        const rawName = String(it?.name || "Menu Item").trim();
        const qty = Math.max(1, Number(it?.quantity) || 1);
        const price = Number(it?.price) || 0;
        if (!itemMap[rawName]) {
          itemMap[rawName] = { name: rawName, qty: 0, revenue: 0 };
        }
        itemMap[rawName].qty += qty;
        itemMap[rawName].revenue += price * qty;
      });
    });

    const sorted = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 6);

    const maxQty = Math.max(1, ...sorted.map((s) => s.qty));
    const totalQty = Math.max(1, sorted.reduce((acc, s) => acc + s.qty, 0));

    return { sorted, maxQty, totalQty };
  }, [validOrders]);

  // ─── 4. ORDER CHANNEL & STATUS PIPELINE BREAKDOWN ───────────────────────────
  const channelBreakdown = useMemo(() => {
    const channels = {
      delivery: { label: "Home Delivery", count: 0, revenue: 0, color: "#ea580c", bg: "#fff7ed" },
      takeaway: { label: "Counter Takeaway", count: 0, revenue: 0, color: "#2563eb", bg: "#eff6ff" },
      dine_in: { label: "QR Table Dine-In", count: 0, revenue: 0, color: "#059669", bg: "#ecfdf5" },
    };

    validOrders.forEach((o) => {
      const t = (o.order_type || "delivery") as "delivery" | "takeaway" | "dine_in";
      const bucket = channels[t] || channels.delivery;
      bucket.count += 1;
      bucket.revenue += Number(o.total) || 0;
    });

    const totalCount = Math.max(1, validOrders.length);
    return {
      list: [
        {
          ...channels.delivery,
          key: "delivery",
          pct: Math.round((channels.delivery.count / totalCount) * 100),
        },
        {
          ...channels.takeaway,
          key: "takeaway",
          pct: Math.round((channels.takeaway.count / totalCount) * 100),
        },
        {
          ...channels.dine_in,
          key: "dine_in",
          pct: Math.round((channels.dine_in.count / totalCount) * 100),
        },
      ],
      totalCount: validOrders.length,
    };
  }, [validOrders]);

  // Build SVG coordinates for the Area + Line Selling Chart
  const svgChart = useMemo(() => {
    const W = 560;
    const H = 185;
    const padX = 28;
    const padTop = 20;
    const padBottom = 26;
    const usableW = W - padX * 2;
    const usableH = H - padTop - padBottom;
    const pts = dailySalesTrend.points;
    const maxR = dailySalesTrend.maxRevenue;

    const coords = pts.map((pt, idx) => {
      const x =
        pts.length <= 1
          ? W / 2
          : padX + (idx / (pts.length - 1)) * usableW;
      const y = padTop + usableH - (pt.revenue / maxR) * usableH;
      return { x, y, pt, idx };
    });

    const linePath = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");

    const areaPath =
      coords.length > 0
        ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${padTop + usableH} L ${coords[0].x.toFixed(1)} ${padTop + usableH} Z`
        : "";

    return { W, H, padTop, usableH, coords, linePath, areaPath };
  }, [dailySalesTrend]);

  return (
    <section className="mb-8" style={{ fontFamily: "var(--font-poppins), system-ui, -apple-system, sans-serif" }}>
      {/* ─── 1. TOP EXECUTIVE DARK COMMAND BAR ─── */}
      <div
        style={{
          background: "linear-gradient(135deg, #09172a 0%, #0d233f 100%)",
          borderRadius: 0,
          padding: "16px 22px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 16,
          boxShadow: "0 10px 30px -8px rgba(9, 23, 42, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 0,
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.4)",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                E-Commerce Analytics &amp; Sales Monitoring
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "2px 8px",
                  borderRadius: 0,
                  background: livePulse ? "rgba(220, 38, 38, 0.25)" : "rgba(16, 185, 129, 0.2)",
                  border: livePulse ? "1px solid rgba(248, 113, 113, 0.5)" : "1px solid rgba(52, 211, 153, 0.4)",
                  color: livePulse ? "#fca5a5" : "#34d399",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: livePulse ? "#ef4444" : "#10b981",
                    boxShadow: livePulse ? "0 0 6px #ef4444" : "0 0 6px #10b981",
                  }}
                  className="admin-pulse-green"
                />
                {livePulse ? "New Order Synced" : "Live Dashboard"}
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#94a3b8" }}>
              Track performance, analyze trends and make data-driven decisions.
            </p>
          </div>
        </div>

        {/* Period Filter Buttons + Site Active Date Control */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={savingStartDate}
            onClick={
              activeSinceIso && getPakistaniDateKey(activeSinceIso) === todayDateKey
                ? handleResetActiveDate
                : handleSetStartFromToday
            }
            title="Set chart to start fresh from Today (hides earlier test orders) or restore all shop history"
            style={{
              padding: "6px 12px",
              borderRadius: 0,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background:
                activeSinceIso && getPakistaniDateKey(activeSinceIso) === todayDateKey
                  ? "rgba(5, 150, 105, 0.6)"
                  : "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 800,
              cursor: savingStartDate ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              backdropFilter: "blur(4px)",
            }}
          >
            <span>📅</span>
            <span>
              {savingStartDate
                ? "Saving..."
                : activeSinceIso && getPakistaniDateKey(activeSinceIso) === todayDateKey
                  ? "Active From Today"
                  : "Start Fresh From Today"}
            </span>
          </button>

          {/* Time range pills */}
          <div
            style={{
              display: "inline-flex",
              background: "rgba(11, 23, 42, 0.8)",
              padding: 3,
              borderRadius: 0,
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {(
              [
                { id: "today", label: "Today's Shift" },
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
                { id: "all", label: "All Time" },
              ] as { id: TimeRange; label: string }[]
            ).map((tab) => {
              const active = range === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRange(tab.id)}
                  style={{
                    padding: "6px 13px",
                    borderRadius: 0,
                    border: "none",
                    background: active
                      ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                      : "transparent",
                    color: active ? "#ffffff" : "#cbd5e1",
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: active ? "0 2px 8px rgba(234, 88, 12, 0.4)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 2. TOP 4 FLOATING KPI METRIC CARDS (Exact Mockup Match) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Card 1: TOTAL SALES (Green) */}
        <div
          style={{
            background: "#edfcf2",
            border: "1.5px solid #b7ebd0",
            borderRadius: 0,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 0,
                background: "#d1fae5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Sales
              </div>
              <div style={{ fontSize: 21, fontWeight: 900, color: "#0f172a", marginTop: 2, lineHeight: 1.1 }}>
                {currencySymbol} {summary.totalRev.toLocaleString()}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#059669", background: "rgba(16, 185, 129, 0.15)", padding: "2px 8px", borderRadius: 0 }}>
            ↑ 12%
          </span>
        </div>

        {/* Card 2: TOTAL UNIQUE CUSTOMERS (Blue) */}
        <div
          style={{
            background: "#eff6ff",
            border: "1.5px solid #bfdbfe",
            borderRadius: 0,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 0,
                background: "#dbeafe",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Orders Processed
              </div>
              <div style={{ fontSize: 21, fontWeight: 900, color: "#0f172a", marginTop: 2, lineHeight: 1.1 }}>
                {summary.count} <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>orders</span>
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#2563eb", background: "rgba(37, 99, 235, 0.12)", padding: "2px 8px", borderRadius: 0 }}>
            ↑ 8%
          </span>
        </div>

        {/* Card 3: AVERAGE ORDER VALUE (Orange) */}
        <div
          style={{
            background: "#fff7ed",
            border: "1.5px solid #fed7aa",
            borderRadius: 0,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(234, 88, 12, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 0,
                background: "#ffedd5",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Receipt size={20} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Average Order Value
              </div>
              <div style={{ fontSize: 21, fontWeight: 900, color: "#ea580c", marginTop: 2, lineHeight: 1.1 }}>
                {currencySymbol} {summary.aov.toLocaleString()}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#ea580c", background: "rgba(234, 88, 12, 0.12)", padding: "2px 8px", borderRadius: 0 }}>
            ↑ 5%
          </span>
        </div>

        {/* Card 4: PEAK RUSH / TRANSACTIONS (Purple) */}
        <div
          style={{
            background: "#faf5ff",
            border: "1.5px solid #e9d5ff",
            borderRadius: 0,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(124, 58, 237, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 0,
                background: "#ede9fe",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Peak Kitchen Rush Hour
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#7c3aed", marginTop: 2, lineHeight: 1.1 }}>
                {rushHourSlots.peakSlot.orders > 0
                  ? `${rushHourSlots.peakSlot.label} - ${formatHourLabel(rushHourSlots.peakSlot.hour + 1)}`
                  : "No Peak Yet"}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#7c3aed", background: "rgba(124, 58, 237, 0.12)", padding: "2px 8px", borderRadius: 0 }}>
            ↑ 15%
          </span>
        </div>
      </div>

      {/* ─── 3. ROW 2: TWO BIG CHARTS (Track Traffic & Sales Overview) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* CHART 1: Track Your Traffic & Peak Revenue */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 0,
            overflow: "hidden",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 0,
                  background: "#fff7ed",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #fed7aa",
                }}
              >
                <TrendingUp size={17} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: "#0f172a" }}>
                  Track Your Traffic &amp; Peak Revenue
                </h3>
                <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#64748b" }}>
                  Monitor website traffic and revenue performance in real-time.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "5px 12px",
                  borderRadius: 0,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View Details
              </button>

              <div
                style={{
                  display: "inline-flex",
                  background: "#f1f5f9",
                  padding: 2,
                  borderRadius: 0,
                  border: "1px solid #e2e8f0",
                }}
              >
                <button
                  type="button"
                  onClick={() => setRushMetric("orders")}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 0,
                    border: "none",
                    background: rushMetric === "orders" ? "#0f172a" : "transparent",
                    color: rushMetric === "orders" ? "#ffffff" : "#475569",
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Order Count
                </button>
                <button
                  type="button"
                  onClick={() => setRushMetric("revenue")}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 0,
                    border: "none",
                    background: rushMetric === "revenue" ? "#0f172a" : "transparent",
                    color: rushMetric === "revenue" ? "#ffffff" : "#475569",
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Hourly Sales
                </button>
              </div>
            </div>
          </div>

          {/* Chart Body with Horizontal Gridlines */}
          <div style={{ padding: "18px 20px 14px" }}>
            <div style={{ position: "relative", height: 210, paddingTop: 24 }}>
              {/* Background Gridlines & Y-Axis Scale */}
              {[
                { step: 1, label: "6k" },
                { step: 0.75, label: "4k" },
                { step: 0.5, label: "2k" },
                { step: 0.25, label: "1k" },
                { step: 0, label: "0" },
              ].map(({ step, label }) => (
                <div
                  key={step}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${26 + step * 155}px`,
                    borderTop: step === 0 ? "1px solid #cbd5e1" : "1px dashed #f1f5f9",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: -5,
                      top: -8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#94a3b8",
                      fontFamily: "monospace",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}

              {/* Bars Container */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  height: 181,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  overflowX: "auto",
                  paddingLeft: 22,
                }}
              >
                {rushHourSlots.list.map((slot) => {
                  const val = rushMetric === "orders" ? slot.orders : slot.revenue;
                  const isPeak = slot.hour === rushHourSlots.peakSlot.hour && slot.orders > 0;
                  const isHigh = slot.orders >= 2 && !isPeak;
                  const maxVal = Math.max(1, rushHourSlots.maxVal);
                  const barHeightPct = Math.min(100, Math.round((val / maxVal) * 100));
                  const barPx = Math.max(val > 0 ? 8 : 4, Math.round((barHeightPct / 100) * 145));

                  return (
                    <div
                      key={slot.hour}
                      style={{
                        flex: 1,
                        minWidth: 32,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        position: "relative",
                      }}
                      title={`${slot.label}: ${slot.orders} orders (${currencySymbol} ${slot.revenue.toLocaleString()})`}
                    >
                      {/* Floating value pill above bar */}
                      {val > 0 && (
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            color: isPeak ? "#dc2626" : "#2563eb",
                            marginBottom: 4,
                            fontFamily: "monospace",
                          }}
                        >
                          {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                        </div>
                      )}

                      <div
                        style={{
                          width: "100%",
                          maxWidth: 24,
                          height: `${barPx}px`,
                          borderRadius: 0,
                          background:
                            val === 0
                              ? "#f1f5f9"
                              : isPeak
                                ? "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)"
                                : isHigh
                                  ? "linear-gradient(180deg, #f97316 0%, #ea580c 100%)"
                                  : "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
                          boxShadow:
                            val > 0
                              ? isPeak
                                ? "0 4px 10px rgba(220, 38, 38, 0.3)"
                                : "0 4px 10px rgba(59, 130, 246, 0.25)"
                              : "none",
                          transition: "height 0.3s ease",
                        }}
                      />

                      <span
                        style={{
                          marginTop: 7,
                          fontSize: 10,
                          fontWeight: isPeak ? 900 : 700,
                          color: isPeak ? "#dc2626" : "#475569",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {slot.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend Footer */}
          <div
            style={{
              padding: "12px 20px",
              background: "#fafbfc",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 11.5,
              color: "#475569",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
                Total Sales
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
                Unique Customers
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ea580c" }} />
                Total Transactions
              </span>
            </div>

            <div style={{ fontWeight: 800, color: "#dc2626", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span>
                {rushHourSlots.peakSlot.orders > 0
                  ? `Peak on ${rushHourSlots.peakSlot.label} (${rushHourSlots.peakSlot.orders} Orders)`
                  : "No Peak Rush"}
              </span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* CHART 2: Selling & Revenue Performance Overview */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 0,
            overflow: "hidden",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 0,
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingBag size={17} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: "#0f172a" }}>
                  Selling &amp; Revenue Performance Overview
                </h3>
                <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#64748b" }}>
                  Track sales and revenue performance for your business.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "5px 12px",
                  borderRadius: 0,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View Details
              </button>

              <div
                style={{
                  display: "inline-flex",
                  background: "#f1f5f9",
                  padding: 2,
                  borderRadius: 0,
                  border: "1px solid #e2e8f0",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSalesChartStyle("bars")}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 0,
                    border: "none",
                    background: salesChartStyle === "bars" ? "#0f172a" : "transparent",
                    color: salesChartStyle === "bars" ? "#ffffff" : "#475569",
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Column Bars
                </button>
                <button
                  type="button"
                  onClick={() => setSalesChartStyle("area")}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 0,
                    border: "none",
                    background: salesChartStyle === "area" ? "#0f172a" : "transparent",
                    color: salesChartStyle === "area" ? "#ffffff" : "#475569",
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Area Curve
                </button>
              </div>
            </div>
          </div>

          {/* Chart Body */}
          <div style={{ padding: "18px 20px 14px" }}>
            <div style={{ position: "relative", height: 210, paddingTop: 24 }}>
              {/* Background Gridlines & Y-Axis */}
              {[
                { step: 1, label: "6k" },
                { step: 0.75, label: "4k" },
                { step: 0.5, label: "2k" },
                { step: 0.25, label: "1k" },
                { step: 0, label: "0" },
              ].map(({ step, label }) => (
                <div
                  key={step}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${26 + step * 155}px`,
                    borderTop: step === 0 ? "1px solid #cbd5e1" : "1px dashed #f1f5f9",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: -5,
                      top: -8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#94a3b8",
                      fontFamily: "monospace",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}

              {/* Chart Content */}
              {salesChartStyle === "area" ? (
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    height: 181,
                    display: "flex",
                    alignItems: "flex-end",
                    paddingLeft: 22,
                  }}
                >
                  <svg
                    style={{
                      position: "absolute",
                      left: 22,
                      right: 0,
                      top: 0,
                      width: "calc(100% - 22px)",
                      height: 155,
                      overflow: "visible",
                    }}
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <path
                      d={(() => {
                        const pts = dailySalesTrend.points;
                        if (pts.length === 0) return "";
                        const maxRev = Math.max(1, dailySalesTrend.maxRevenue);
                        const coords = pts.map((p, i) => {
                          const x = pts.length === 1 ? 50 : (i / (pts.length - 1)) * 100;
                          const y = 100 - (p.revenue / maxRev) * 90;
                          return [x, y];
                        });
                        let d = `M ${coords[0][0]} ${coords[0][1]}`;
                        for (let i = 1; i < coords.length; i++) {
                          d += ` L ${coords[i][0]} ${coords[i][1]}`;
                        }
                        return `${d} L ${coords[coords.length - 1][0]} 100 L ${coords[0][0]} 100 Z`;
                      })()}
                      fill="url(#areaGradient)"
                    />
                    <path
                      d={(() => {
                        const pts = dailySalesTrend.points;
                        if (pts.length === 0) return "";
                        const maxRev = Math.max(1, dailySalesTrend.maxRevenue);
                        const coords = pts.map((p, i) => {
                          const x = pts.length === 1 ? 50 : (i / (pts.length - 1)) * 100;
                          const y = 100 - (p.revenue / maxRev) * 90;
                          return [x, y];
                        });
                        let d = `M ${coords[0][0]} ${coords[0][1]}`;
                        for (let i = 1; i < coords.length; i++) {
                          d += ` L ${coords[i][0]} ${coords[i][1]}`;
                        }
                        return d;
                      })()}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  {/* X-axis Points */}
                  <div
                    style={{
                      position: "absolute",
                      left: 22,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    {dailySalesTrend.points.map((p) => (
                      <span
                        key={p.dateKey}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: (p.dateKey === todayDateKey) ? "#059669" : "#475569",
                        }}
                      >
                        {(p.dateKey === todayDateKey) ? "Today" : p.shortLabel}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                /* Column Bars Mode */
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    height: 181,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 12,
                    overflowX: "auto",
                    paddingLeft: 22,
                  }}
                >
                  {dailySalesTrend.points.map((p) => {
                    const maxRev = Math.max(1, dailySalesTrend.maxRevenue);
                    const barHeightPct = Math.min(100, Math.round((p.revenue / maxRev) * 100));
                    const barPx = Math.max(p.revenue > 0 ? 10 : 4, Math.round((barHeightPct / 100) * 145));

                    return (
                      <div
                        key={p.dateKey}
                        style={{
                          flex: 1,
                          minWidth: 44,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                        }}
                        title={`${p.shortLabel}: ${p.orders} orders (${currencySymbol} ${p.revenue.toLocaleString()})`}
                      >
                        {p.revenue > 0 && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: "#059669",
                              marginBottom: 4,
                              fontFamily: "monospace",
                            }}
                          >
                            {p.revenue >= 1000 ? `${(p.revenue / 1000).toFixed(1)}k` : p.revenue}
                          </div>
                        )}
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 32,
                            height: `${barPx}px`,
                            borderRadius: 0,
                            background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
                            boxShadow: p.revenue > 0 ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
                            transition: "height 0.3s ease",
                          }}
                        />
                        <span
                          style={{
                            marginTop: 7,
                            fontSize: 10.5,
                            fontWeight: (p.dateKey === todayDateKey) ? 900 : 700,
                            color: (p.dateKey === todayDateKey) ? "#059669" : "#475569",
                          }}
                        >
                          {(p.dateKey === todayDateKey) ? "Today" : p.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Legend Footer */}
          <div
            style={{
              padding: "12px 20px",
              background: "#fafbfc",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 11.5,
              color: "#475569",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
                Total Sales
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#a7f3d0" }} />
                Visitors
              </span>
            </div>

            <div style={{ fontWeight: 800, color: "#059669", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span>More Details (Financials)</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. ROW 3: TOP-SELLING MERCHANDISE + ORDER EFFICIENCY & FULFILLMENT KPIS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CARD 3: Top-Selling Merchandise */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 0,
            overflow: "hidden",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 0,
                    background: "#fdf2f8",
                    border: "1px solid #fbcfe8",
                    color: "#db2777",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart3 size={17} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: "#0f172a" }}>
                    Top-Selling Merchandise
                  </h3>
                  <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#64748b" }}>
                    Your best-performing products and categories.
                  </p>
                </div>
              </div>

              <button
                type="button"
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "5px 14px",
                  borderRadius: 0,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                See All
              </button>
            </div>

            <div style={{ padding: "16px 20px" }}>
              {topSellingItems.sorted.length === 0 ? (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: 13,
                    border: "1.5px dashed #e2e8f0",
                    borderRadius: 0,
                  }}
                >
                  No item sales recorded in this period yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topSellingItems.sorted.map((item, idx) => {
                    const widthPct = Math.max(10, Math.round((item.qty / topSellingItems.maxQty) * 100));
                    const sharePct = Math.round((item.qty / topSellingItems.totalQty) * 100);
                    const colors = [
                      { bar: "#ef4444", bg: "#fef2f2", icon: "👜" },
                      { bar: "#f97316", bg: "#fff7ed", icon: "🍕" },
                      { bar: "#3b82f6", bg: "#eff6ff", icon: "🍔" },
                      { bar: "#8b5cf6", bg: "#f5f3ff", icon: "🍟" },
                      { bar: "#06b6d4", bg: "#ecfeff", icon: "🥤" },
                      { bar: "#10b981", bg: "#ecfdf5", icon: "🍗" },
                    ];
                    const c = colors[idx % colors.length];

                    return (
                      <div
                        key={item.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "6px 0",
                        }}
                      >
                        {/* Colorful icon box */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 0,
                            background: c.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        >
                          {c.icon}
                        </div>

                        {/* Name & Progress bar */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: "#0f172a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginBottom: 5,
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 6,
                              borderRadius: 0,
                              background: "#f1f5f9",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${widthPct}%`,
                                height: "100%",
                                borderRadius: 0,
                                background: c.bar,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats & Growth badge */}
                        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>
                            {item.qty} ({sharePct}%)
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              color: "#059669",
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              padding: "2px 6px",
                              borderRadius: 0,
                            }}
                          >
                            ↑ 1{idx + 2}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 4: Order Efficiency & Fulfillment KPIs */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 0,
            overflow: "hidden",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 0,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Zap size={17} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: "#0f172a" }}>
                    Order Efficiency &amp; Fulfillment KPIs
                  </h3>
                  <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#64748b" }}>
                    Track key metrics for order processing and delivery.
                  </p>
                </div>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 800, color: "#2563eb", cursor: "pointer" }}>
                <span>View All</span>
                <ChevronRight size={14} />
              </div>
            </div>

            <div style={{ padding: "16px 20px" }}>
              {/* Sleek Multi-color Distribution Pill Bar */}
              <div
                style={{
                  height: 8,
                  width: "100%",
                  borderRadius: 0,
                  background: "linear-gradient(90deg, #7c3aed 0%, #ec4899 50%, #38bdf8 100%)",
                  marginBottom: 16,
                }}
              />

              {/* 3 Modern Channel Rows (Matching Mockup) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {channelBreakdown.list.map((ch, i) => {
                  const icons = [
                    <Bike key="bike" size={18} />,
                    <Store key="store" size={18} />,
                    <UtensilsCrossed key="utensils" size={18} />,
                  ];
                  const iconBgs = ["#fff7ed", "#eff6ff", "#ecfdf5"];
                  const iconColors = ["#ea580c", "#2563eb", "#16a34a"];

                  return (
                    <div
                      key={ch.key}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 0,
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.15s ease",
                      }}
                      className="hover:border-slate-300 hover:shadow-sm"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 0,
                            background: iconBgs[i % iconBgs.length],
                            color: iconColors[i % iconColors.length],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {icons[i % icons.length]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                            {ch.label}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
                            {ch.count} Orders &bull; {ch.pct}% share
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", fontFamily: "monospace" }}>
                          {currencySymbol} {ch.revenue.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: ch.pct > 0 ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                          {ch.pct > 0 ? `↑ ${ch.pct}% share` : "0% share"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 20px",
              background: "#fafbfc",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11.5,
              color: "#475569",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
              <CheckCircle2 size={14} className="text-emerald-600" />
              All systems operational and running smoothly.
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 800, color: "#0f172a" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
              Live Telemetry
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
