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
} from "lucide-react";

interface AdminLiveChartsProps {
  initialOrders: Order[];
  todayOrders: Order[];
  currencySymbol?: string;
  shopId?: number | null;
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

export default function AdminLiveCharts({
  initialOrders,
  todayOrders,
  currencySymbol = "Rs.",
  shopId = null,
}: AdminLiveChartsProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [range, setRange] = useState<TimeRange>("30d");
  const [rushMetric, setRushMetric] = useState<RushMetric>("orders");
  const [salesChartStyle, setSalesChartStyle] = useState<SalesChartStyle>("area");
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [livePulse, setLivePulse] = useState(false);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

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

  // Filter orders by selected range
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    if (range === "today") {
      if (todayOrders.length > 0) return todayOrders;
      const todayKey = getPakistaniDateKey(new Date().toISOString());
      return orders.filter((o) => getPakistaniDateKey(o.created_at) === todayKey);
    }
    if (range === "7d") {
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      return orders.filter((o) => new Date(o.created_at || 0).getTime() >= cutoff);
    }
    if (range === "30d") {
      const cutoff = now - 30 * 24 * 60 * 60 * 1000;
      return orders.filter((o) => new Date(o.created_at || 0).getTime() >= cutoff);
    }
    return orders;
  }, [orders, todayOrders, range]);

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

  // ─── 1. RUSH HOUR CHART DATA (11:00 AM to 2:00 AM + Full 24h) ────────────────
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

  // ─── 2. SELLING & REVENUE TREND CHART (Last 10 Days / Daily Trend) ──────────
  const dailySalesTrend = useMemo(() => {
    const daysCount = range === "7d" ? 7 : 10;
    const dayMap: Record<
      string,
      { dateKey: string; shortLabel: string; revenue: number; orders: number }
    > = {};

    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = getPakistaniDateKey(d.toISOString());
      const shortLabel = d.toLocaleDateString("en-PK", {
        timeZone: "Asia/Karachi",
        day: "numeric",
        month: "short",
      });
      dayMap[key] = { dateKey: key, shortLabel, revenue: 0, orders: 0 };
    }

    orders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        const key = getPakistaniDateKey(o.created_at);
        if (dayMap[key]) {
          dayMap[key].revenue += Number(o.total) || 0;
          dayMap[key].orders += 1;
        }
      });

    const points = Object.values(dayMap);
    const maxRevenue = Math.max(100, ...points.map((p) => p.revenue));
    const maxOrders = Math.max(1, ...points.map((p) => p.orders));

    return { points, maxRevenue, maxOrders };
  }, [orders, range]);

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
    <section className="mb-8">
      {/* ─── EXECUTIVE ANALYTICS COMMAND BAR (5px Square UI) ─── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 5,
          overflow: "hidden",
          marginBottom: 18,
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* Top Title Strip */}
        <div
          style={{
            padding: "14px 20px",
            background: "#0f172a",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 5,
                background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  LIVE EXECUTIVE ANALYTICS &amp; RUSH HOUR TELEMETRY
                </h2>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 8px",
                    borderRadius: 5,
                    background: livePulse ? "#dc2626" : "rgba(16, 185, 129, 0.18)",
                    border: livePulse ? "1px solid #fca5a5" : "1px solid rgba(16, 185, 129, 0.4)",
                    color: livePulse ? "#ffffff" : "#34d399",
                    fontSize: 10,
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: livePulse ? "#ffffff" : "#10b981",
                    }}
                  />
                  {livePulse ? "New Order Synced" : "Live Stream"}
                </span>
              </div>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>
                Real-time kitchen rush hours, revenue velocity curve, top menu items &amp; service channel breakdown
              </p>
            </div>
          </div>

          {/* Period Filter Buttons */}
          <div
            style={{
              display: "inline-flex",
              background: "#1e293b",
              padding: 3,
              borderRadius: 5,
              border: "1px solid #334155",
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
                    padding: "5px 12px",
                    borderRadius: 5,
                    border: "none",
                    background: active ? "#ea580c" : "transparent",
                    color: active ? "#ffffff" : "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Column Executive Metric Strip */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ background: "#f8fafc" }}
        >
          <div style={{ padding: "12px 18px", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Net Period Revenue
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#059669", marginTop: 2 }}>
              {currencySymbol} {summary.totalRev.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: "12px 18px", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Valid Orders Processed
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>
              {summary.count} <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>orders</span>
            </div>
          </div>

          <div style={{ padding: "12px 18px", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Average Order Basket
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#ea580c", marginTop: 2 }}>
              {currencySymbol} {summary.aov.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: "12px 18px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Peak Kitchen Rush Hour
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#dc2626", marginTop: 4 }}>
              {rushHourSlots.peakSlot.orders > 0
                ? `${rushHourSlots.peakSlot.label} – ${formatHourLabel(rushHourSlots.peakSlot.hour + 1)} (${rushHourSlots.peakSlot.orders} ord)`
                : "No Peak Yet"}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 1: RUSH HOUR CHART + SELLING & REVENUE VELOCITY CHART ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* CHART 1: RUSH HOUR / PEAK TRAFFIC CHART */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 5,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock size={15} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                  Rush Hour Traffic &amp; Peak Demand
                </h3>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                  Hourly order concentration across shift hours (PKT)
                </p>
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                background: "#e2e8f0",
                padding: 2,
                borderRadius: 5,
              }}
            >
              <button
                type="button"
                onClick={() => setRushMetric("orders")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 5,
                  border: "none",
                  background: rushMetric === "orders" ? "#0f172a" : "transparent",
                  color: rushMetric === "orders" ? "#ffffff" : "#475569",
                  fontSize: 11,
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
                  padding: "4px 10px",
                  borderRadius: 5,
                  border: "none",
                  background: rushMetric === "revenue" ? "#0f172a" : "transparent",
                  color: rushMetric === "revenue" ? "#ffffff" : "#475569",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Hourly Sales
              </button>
            </div>
          </div>

          {/* Chart Body with Horizontal Gridlines */}
          <div style={{ padding: "18px 18px 14px" }}>
            <div style={{ position: "relative", height: 210, paddingTop: 24 }}>
              {/* Background Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                <div
                  key={step}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${26 + step * 155}px`,
                    borderTop: step === 0 ? "1px solid #cbd5e1" : "1px dashed #e2e8f0",
                    pointerEvents: "none",
                  }}
                />
              ))}

              {/* Bars Container */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  height: 181,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 5,
                  overflowX: "auto",
                }}
              >
                {rushHourSlots.list.map((slot) => {
                  const val = rushMetric === "orders" ? slot.orders : slot.revenue;
                  const ratio = val / rushHourSlots.maxVal;
                  const barPx = val === 0 ? 4 : Math.max(12, Math.round(ratio * 150));
                  const isPeak = val > 0 && slot.hour === rushHourSlots.peakSlot.hour;
                  const isHigh = !isPeak && ratio >= 0.6;
                  const isHovered = hoveredHour === slot.hour;

                  return (
                    <div
                      key={slot.hour}
                      onMouseEnter={() => setHoveredHour(slot.hour)}
                      onMouseLeave={() => setHoveredHour(null)}
                      style={{
                        flex: "1 0 26px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        height: "100%",
                        position: "relative",
                        cursor: "pointer",
                      }}
                    >
                      {(val > 0 || isHovered) && (
                        <div
                          style={{
                            marginBottom: 4,
                            fontSize: 9.5,
                            fontWeight: 900,
                            color: isPeak ? "#dc2626" : "#0f172a",
                            ...(isHovered
                              ? {
                                  background: "#0f172a",
                                  color: "#ffffff",
                                  padding: "3px 7px",
                                  borderRadius: 5,
                                  position: "absolute",
                                  top: -18,
                                  zIndex: 20,
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                                }
                              : {}),
                          }}
                        >
                          {isHovered
                            ? `${slot.label}: ${slot.orders} ord • ${currencySymbol}${slot.revenue.toLocaleString()}`
                            : rushMetric === "orders"
                              ? slot.orders
                              : `${Math.round(slot.revenue / 1000)}k`}
                        </div>
                      )}

                      <div
                        style={{
                          width: "100%",
                          maxWidth: 22,
                          height: `${barPx}px`,
                          borderRadius: "4px 4px 0 0",
                          background:
                            val === 0
                              ? "#e2e8f0"
                              : isPeak
                                ? "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)"
                                : isHigh
                                  ? "linear-gradient(180deg, #ea580c 0%, #d97706 100%)"
                                  : "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                          transition: "height 0.3s ease",
                        }}
                      />

                      <span
                        style={{
                          marginTop: 7,
                          fontSize: 9.5,
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
              padding: "10px 18px",
              background: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 11,
              color: "#475569",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#dc2626" }} />
                Peak Rush
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#ea580c" }} />
                High Traffic
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#2563eb" }} />
                Normal Flow
              </span>
            </div>
            <span style={{ fontWeight: 800, color: "#0f172a" }}>
              Peak: {rushHourSlots.peakSlot.label} ({rushHourSlots.peakSlot.orders} Orders)
            </span>
          </div>
        </div>

        {/* CHART 2: SELLING & REVENUE VELOCITY CHART (SVG AREA CURVE + BARS TOGGLE) */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 5,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={15} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                  Selling &amp; Revenue Performance Curve
                </h3>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                  Daily net sales ({currencySymbol}) &amp; order volume trajectory
                </p>
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                background: "#e2e8f0",
                padding: 2,
                borderRadius: 5,
              }}
            >
              <button
                type="button"
                onClick={() => setSalesChartStyle("area")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 5,
                  border: "none",
                  background: salesChartStyle === "area" ? "#0f172a" : "transparent",
                  color: salesChartStyle === "area" ? "#ffffff" : "#475569",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Area Curve
              </button>
              <button
                type="button"
                onClick={() => setSalesChartStyle("bars")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 5,
                  border: "none",
                  background: salesChartStyle === "bars" ? "#0f172a" : "transparent",
                  color: salesChartStyle === "bars" ? "#ffffff" : "#475569",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Column Bars
              </button>
            </div>
          </div>

          {/* Chart Body */}
          <div style={{ padding: "18px 18px 14px" }}>
            {salesChartStyle === "area" ? (
              <div style={{ position: "relative", width: "100%", height: 210 }}>
                <svg
                  viewBox={`0 0 ${svgChart.W} ${svgChart.H}`}
                  style={{ width: "100%", height: "100%", overflow: "visible" }}
                >
                  <defs>
                    <linearGradient id="adminSalesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Dashed Reference Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                    const y = svgChart.padTop + svgChart.usableH * (1 - step);
                    return (
                      <line
                        key={step}
                        x1={20}
                        x2={svgChart.W - 20}
                        y1={y}
                        y2={y}
                        stroke={step === 0 ? "#cbd5e1" : "#e2e8f0"}
                        strokeDasharray={step === 0 ? undefined : "4 4"}
                        strokeWidth={1}
                      />
                    );
                  })}

                  {/* Gradient Area Fill */}
                  {svgChart.areaPath && (
                    <path d={svgChart.areaPath} fill="url(#adminSalesAreaGrad)" />
                  )}

                  {/* Crisp Emerald Line */}
                  {svgChart.linePath && (
                    <path
                      d={svgChart.linePath}
                      fill="none"
                      stroke="#059669"
                      strokeWidth={2.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Nodes & Labels */}
                  {svgChart.coords.map(({ x, y, pt, idx }) => {
                    const isHovered = hoveredDayIdx === idx;
                    const isLast = idx === svgChart.coords.length - 1;
                    return (
                      <g
                        key={pt.dateKey}
                        onMouseEnter={() => setHoveredDayIdx(idx)}
                        onMouseLeave={() => setHoveredDayIdx(null)}
                        style={{ cursor: "pointer" }}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 6 : isLast ? 5 : 4}
                          fill={isLast ? "#059669" : "#ffffff"}
                          stroke="#059669"
                          strokeWidth={2.5}
                        />
                        {(pt.revenue > 0 || isHovered) && (
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight={800}
                            fill="#0f172a"
                          >
                            {pt.revenue >= 1000
                              ? `${(pt.revenue / 1000).toFixed(1)}k`
                              : pt.revenue}
                          </text>
                        )}
                        <text
                          x={x}
                          y={svgChart.H - 4}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={isLast ? 900 : 700}
                          fill={isLast ? "#059669" : "#64748b"}
                        >
                          {isLast ? "Today" : pt.shortLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div style={{ position: "relative", height: 210, paddingTop: 24 }}>
                {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                  <div
                    key={step}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: `${26 + step * 155}px`,
                      borderTop: step === 0 ? "1px solid #cbd5e1" : "1px dashed #e2e8f0",
                      pointerEvents: "none",
                    }}
                  />
                ))}

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    height: 181,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 10,
                  }}
                >
                  {dailySalesTrend.points.map((pt, idx) => {
                    const ratio = pt.revenue / dailySalesTrend.maxRevenue;
                    const barPx = pt.revenue === 0 ? 4 : Math.max(12, Math.round(ratio * 150));
                    const isToday = idx === dailySalesTrend.points.length - 1;
                    return (
                      <div
                        key={pt.dateKey}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          height: "100%",
                        }}
                      >
                        {pt.revenue > 0 && (
                          <div style={{ marginBottom: 4, fontSize: 9.5, fontWeight: 900, color: "#0f172a" }}>
                            {pt.revenue >= 1000 ? `${(pt.revenue / 1000).toFixed(1)}k` : pt.revenue}
                          </div>
                        )}
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 32,
                            height: `${barPx}px`,
                            borderRadius: "4px 4px 0 0",
                            background:
                              pt.revenue === 0
                                ? "#e2e8f0"
                                : isToday
                                  ? "linear-gradient(180deg, #059669 0%, #047857 100%)"
                                  : "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)",
                          }}
                        />
                        <span
                          style={{
                            marginTop: 7,
                            fontSize: 9.5,
                            fontWeight: isToday ? 900 : 700,
                            color: isToday ? "#059669" : "#475569",
                          }}
                        >
                          {isToday ? "Today" : pt.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {(() => {
            const bestDay = [...dailySalesTrend.points].sort((a, b) => b.revenue - a.revenue)[0];
            return (
              <div
                style={{
                  padding: "10px 18px",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                  fontSize: 11,
                  color: "#475569",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
                  <Sparkles size={13} className="text-emerald-600" />
                  Best Day: <strong>{bestDay?.shortLabel || "Today"}</strong>
                </span>
                <span style={{ fontWeight: 900, color: "#059669" }}>
                  Peak Daily Sales: {currencySymbol} {(bestDay?.revenue || 0).toLocaleString()}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ─── ROW 2: TOP BEST-SELLING ITEMS + ORDER CHANNEL BREAKDOWN ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 3: TOP BEST-SELLING PRODUCTS */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 5,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Pizza size={15} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                  Top Selling Menu Items
                </h3>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                  Best-performing dishes ranked by volume &amp; revenue
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 9px",
                borderRadius: 5,
                background: "#0f172a",
                color: "#ffffff",
              }}
            >
              Top {topSellingItems.sorted.length}
            </span>
          </div>

          <div style={{ padding: "16px 18px" }}>
            {topSellingItems.sorted.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                  border: "1px dashed #cbd5e1",
                  borderRadius: 5,
                }}
              >
                No item sales recorded in this period yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {topSellingItems.sorted.map((item, idx) => {
                  const widthPct = Math.max(8, Math.round((item.qty / topSellingItems.maxQty) * 100));
                  const sharePct = Math.round((item.qty / topSellingItems.totalQty) * 100);
                  return (
                    <div
                      key={item.name}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 5,
                        border: "1px solid #e2e8f0",
                        background: idx === 0 ? "#fffdf9" : "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 5,
                              background: idx === 0 ? "#dc2626" : idx === 1 ? "#ea580c" : "#0f172a",
                              color: "#ffffff",
                              fontSize: 10.5,
                              fontWeight: 900,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <span
                            style={{
                              fontWeight: 800,
                              color: "#0f172a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#475569" }}>
                            {item.qty} sold ({sharePct}%)
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 900, color: "#059669" }}>
                            {currencySymbol} {item.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          height: 6,
                          borderRadius: 5,
                          background: "#f1f5f9",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${widthPct}%`,
                            height: "100%",
                            borderRadius: 5,
                            background:
                              idx === 0
                                ? "#dc2626"
                                : idx === 1
                                  ? "#ea580c"
                                  : "#2563eb",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CHART 4: ORDER CHANNEL SPLIT (DELIVERY vs TAKEAWAY vs DINE-IN) */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 5,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 5,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={15} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                    Order Channel &amp; Fulfillment Split
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                    Revenue &amp; basket share by service channel
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 9px",
                  borderRadius: 5,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
              >
                {channelBreakdown.totalCount} Orders
              </span>
            </div>

            <div style={{ padding: "16px 18px" }}>
              {/* Stacked Horizontal Distribution Bar */}
              <div
                style={{
                  height: 14,
                  width: "100%",
                  borderRadius: 5,
                  background: "#f1f5f9",
                  overflow: "hidden",
                  display: "flex",
                  marginBottom: 16,
                  border: "1px solid #e2e8f0",
                }}
              >
                {channelBreakdown.list.map((ch) =>
                  ch.count > 0 ? (
                    <div
                      key={ch.key}
                      style={{
                        width: `${Math.max(5, ch.pct)}%`,
                        background: ch.color,
                        height: "100%",
                        transition: "width 0.35s ease",
                      }}
                      title={`${ch.label}: ${ch.pct}%`}
                    />
                  ) : null
                )}
              </div>

              {/* Channel Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {channelBreakdown.list.map((ch) => (
                  <div
                    key={ch.key}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderLeft: `4px solid ${ch.color}`,
                      borderRadius: 5,
                      padding: "12px 14px",
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
                          borderRadius: 5,
                          background: ch.bg,
                          color: ch.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {ch.key === "delivery" ? (
                          <Bike size={17} />
                        ) : ch.key === "takeaway" ? (
                          <Store size={17} />
                        ) : (
                          <UtensilsCrossed size={17} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                          {ch.label}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                          {ch.count} Orders &bull; {ch.pct}% share
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                        {currencySymbol} {ch.revenue.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>
                        Avg {currencySymbol}{" "}
                        {ch.count > 0 ? Math.round(ch.revenue / ch.count).toLocaleString() : 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "10px 18px",
              background: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#475569",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
              <CheckCircle2 size={13} className="text-emerald-600" />
              Cancelled orders excluded from net revenue
            </span>
            <span style={{ fontWeight: 800, color: "#0f172a" }}>
              5px Square Telemetry
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
