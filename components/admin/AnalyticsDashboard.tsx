"use client";

import { useState, useMemo } from "react";
import { Order } from "@/types/menu";

interface AnalyticsDashboardProps {
  orders: Order[];
  currencySymbol?: string;
  shopName?: string;
}

type DateRange = "7d" | "30d" | "all" | "today";

export default function AnalyticsDashboard({
  orders = [],
  currencySymbol = "Rs.",
  shopName = "Store",
}: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (dateRange === "all") return orders;
    const now = new Date();

    if (dateRange === "today") {
      const todayStr = now.toISOString().slice(0, 10);
      return orders.filter((o) => o.created_at?.slice(0, 10) === todayStr);
    }

    const days = dateRange === "7d" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, dateRange]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let dineInCount = 0;
    let dineInRev = 0;
    let takeawayCount = 0;
    let takeawayRev = 0;
    let deliveryCount = 0;
    let deliveryRev = 0;

    const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();

    for (const ord of filteredOrders) {
      const ordTotal = Number(ord.total) || 0;
      if (ord.status !== "cancelled") {
        totalRevenue += ordTotal;
      }

      if (ord.status === "delivered" || (ord.status as string) === "completed") completedCount++;
      if (ord.status === "cancelled") cancelledCount++;

      const type = ord.order_type || "takeaway";
      if (type === "dine_in") {
        dineInCount++;
        dineInRev += ordTotal;
      } else if (type === "delivery") {
        deliveryCount++;
        deliveryRev += ordTotal;
      } else {
        takeawayCount++;
        takeawayRev += ordTotal;
      }

      // Aggregate items sold
      if (Array.isArray(ord.items)) {
        for (const itm of ord.items) {
          const itmName = itm.name || "Unknown Product";
          const qty = itm.quantity || itm.qty || 1;
          const linePrice = (Number(itm.price) || 0) * qty;
          const curr = productSalesMap.get(itmName) || { name: itmName, qty: 0, revenue: 0 };
          curr.qty += qty;
          curr.revenue += linePrice;
          productSalesMap.set(itmName, curr);
        }
      }
    }

    const totalOrdersCount = filteredOrders.length;
    const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrdersCount,
      completedCount,
      cancelledCount,
      aov,
      dineInCount,
      dineInRev,
      takeawayCount,
      takeawayRev,
      deliveryCount,
      deliveryRev,
      topProducts,
    };
  }, [filteredOrders]);

  // Daily Trend Data (Last 7 or 14 points)
  const chartData = useMemo(() => {
    const daysCount = dateRange === "30d" ? 14 : 7;
    const points: { dateStr: string; label: string; revenue: number; ordersCount: number }[] = [];

    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
      points.push({ dateStr, label, revenue: 0, ordersCount: 0 });
    }

    for (const ord of filteredOrders) {
      if (ord.status === "cancelled") continue;
      const dStr = ord.created_at?.slice(0, 10);
      const point = points.find((p) => p.dateStr === dStr);
      if (point) {
        point.revenue += Number(ord.total) || 0;
        point.ordersCount += 1;
      }
    }

    const maxRev = Math.max(...points.map((p) => p.revenue), 100);
    return { points, maxRev };
  }, [filteredOrders, dateRange]);

  // 1-Click CSV Export Function
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders available to export for this time range.");
      return;
    }

    const headers = [
      "Order Number",
      "Date",
      "Time",
      "Customer Name",
      "Phone",
      "Order Type",
      "Table or Token",
      "Delivery Address",
      "Status",
      "Total Amount",
      "Items Breakdown",
    ];

    const rows = filteredOrders.map((o) => {
      const d = o.created_at ? new Date(o.created_at) : new Date();
      const date = d.toISOString().slice(0, 10);
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const tableOrToken = o.order_type === "dine_in" ? `Table ${o.table_number || "—"}` : o.token_number || "—";
      const itemsSummary = (o.items || [])
        .map((i) => {
          const q = i.quantity || i.qty || 1;
          const varName = i.selectedVariation || (typeof i.selected_variation === "object" ? (i.selected_variation as any)?.name : i.selected_variation);
          return `${q}x ${i.name}${varName ? ` [${varName}]` : ""}`;
        })
        .join(" | ");

      return [
        o.order_number,
        date,
        time,
        `"${(o.customer_name || "").replace(/"/g, '""')}"`,
        `"${o.customer_phone || ""}"`,
        o.order_type || "takeaway",
        tableOrToken,
        `"${(o.delivery_address || "").replace(/"/g, '""')}"`,
        o.status,
        Number(o.total || 0).toFixed(2),
        `"${itemsSummary.replace(/"/g, '""')}"`,
      ].join(",");
    });

    // Add UTF-8 BOM so Excel opens Urdu/special characters properly
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${shopName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", color: "#0f172a" }}>
      {/* Top Header & Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, margin: "0 0 4px", color: "#0f172a" }}>
            Sales Analytics &amp; Reports
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Performance insights and sales breakdown for <strong>{shopName}</strong>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Date Range Selector */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 6, border: "1px solid #e2e8f0" }}>
            {(["today", "7d", "30d", "all"] as DateRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  border: "none",
                  background: dateRange === r ? "#ffffff" : "transparent",
                  color: dateRange === r ? "#0f172a" : "#64748b",
                  fontWeight: dateRange === r ? 800 : 600,
                  fontSize: 12,
                  cursor: "pointer",
                  boxShadow: dateRange === r ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {r === "today" ? "Today" : r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "All Time"}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {/* Gross Revenue */}
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
              Total Revenue
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 4, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#059669", margin: "0 0 4px" }}>
            {currencySymbol} {stats.totalRevenue.toLocaleString()}
          </h2>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            Average Order: {currencySymbol} {stats.aov.toLocaleString()}
          </span>
        </div>

        {/* Total Orders */}
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
              Orders Placed
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 4, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#2563eb", margin: "0 0 4px" }}>
            {stats.totalOrdersCount}
          </h2>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            {stats.completedCount} completed &bull; {stats.cancelledCount} cancelled
          </span>
        </div>

        {/* Delivery Orders */}
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
              Rider Delivery
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 4, background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="6" cy="19" r="3" />
                <circle cx="17" cy="19" r="3" />
                <path d="M14 6h3l3 4v6h-4" />
                <path d="M2 17h2" />
                <path d="M8.5 17h5.5" />
                <path d="M2 13h10V4H2v9z" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#ea580c", margin: "0 0 4px" }}>
            {stats.deliveryCount} <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>orders</span>
          </h2>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            {currencySymbol} {stats.deliveryRev.toLocaleString()} revenue
          </span>
        </div>

        {/* Dine-In vs Takeaway */}
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
              Dine-In / Counter
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 4, background: "#fdf2f8", color: "#db2777", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#db2777", margin: "0 0 4px" }}>
            {stats.dineInCount + stats.takeawayCount}
          </h2>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            {stats.dineInCount} Dine-In &bull; {stats.takeawayCount} Takeaway
          </span>
        </div>
      </div>

      {/* Grid: SVG Trend Chart & Service Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* SVG Revenue Bar Chart */}
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                Revenue Trend
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                Daily sales trajectory across the selected window
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", background: "#ecfdf5", padding: "3px 8px", borderRadius: 3 }}>
              Peak: {currencySymbol} {chartData.maxRev.toLocaleString()}
            </span>
          </div>

          {/* SVG Chart Graphic */}
          <div style={{ height: 180, display: "flex", alignItems: "flex-end", gap: 12, paddingBottom: 24, position: "relative" }}>
            {/* Horizontal Grid lines */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, borderBottom: "1px dashed #f1f5f9" }} />
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderBottom: "1px dashed #f1f5f9" }} />
            <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, borderBottom: "1px solid #e2e8f0" }} />

            {chartData.points.map((pt) => {
              const heightPct = Math.max(8, Math.round((pt.revenue / chartData.maxRev) * 100));
              return (
                <div key={pt.dateStr} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative", zIndex: 2 }}>
                  {/* Tooltip on hover */}
                  <div
                    title={`${pt.label}: ${currencySymbol} ${pt.revenue.toLocaleString()} (${pt.ordersCount} orders)`}
                    style={{
                      width: "100%",
                      maxWidth: 36,
                      height: `${heightPct}%`,
                      background: pt.revenue > 0 ? "linear-gradient(180deg, #dc2626 0%, #ea580c 100%)" : "#f1f5f9",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.4s ease",
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ position: "absolute", bottom: 4, fontSize: 10, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Type Share Breakdown */}
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
            Sales by Service
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "#64748b" }}>
            Channel distribution
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Delivery */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#ea580c" }} />
                  🛵 Delivery
                </span>
                <span style={{ color: "#ea580c" }}>
                  {stats.totalOrdersCount > 0 ? Math.round((stats.deliveryCount / stats.totalOrdersCount) * 100) : 0}% ({stats.deliveryCount})
                </span>
              </div>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stats.totalOrdersCount > 0 ? (stats.deliveryCount / stats.totalOrdersCount) * 100 : 0}%`, background: "#ea580c" }} />
              </div>
            </div>

            {/* Dine-In */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#dc2626" }} />
                  🍽️ Dine-In (Table)
                </span>
                <span style={{ color: "#dc2626" }}>
                  {stats.totalOrdersCount > 0 ? Math.round((stats.dineInCount / stats.totalOrdersCount) * 100) : 0}% ({stats.dineInCount})
                </span>
              </div>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stats.totalOrdersCount > 0 ? (stats.dineInCount / stats.totalOrdersCount) * 100 : 0}%`, background: "#dc2626" }} />
              </div>
            </div>

            {/* Takeaway */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b" }} />
                  🛍️ Takeaway (Token)
                </span>
                <span style={{ color: "#f59e0b" }}>
                  {stats.totalOrdersCount > 0 ? Math.round((stats.takeawayCount / stats.totalOrdersCount) * 100) : 0}% ({stats.takeawayCount})
                </span>
              </div>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stats.totalOrdersCount > 0 ? (stats.takeawayCount / stats.totalOrdersCount) * 100 : 0}%`, background: "#f59e0b" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
              Top 5 Best-Selling Items
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              High-volume products ordered during this period
            </p>
          </div>
        </div>

        {stats.topProducts.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", padding: "16px 0", textAlign: "center" }}>
            No sales recorded in this date range.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Rank</th>
                  <th style={{ padding: "8px 12px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Product Name</th>
                  <th style={{ padding: "8px 12px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Units Sold</th>
                  <th style={{ padding: "8px 12px", color: "#64748b", fontWeight: 800, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p, idx) => (
                  <tr key={p.name} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: 800, color: idx === 0 ? "#dc2626" : "#64748b" }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>
                      {p.name}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#334155" }}>
                      {p.qty} items
                    </td>
                    <td style={{ padding: "12px", fontWeight: 800, color: "#059669", textAlign: "right" }}>
                      {currencySymbol} {p.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
