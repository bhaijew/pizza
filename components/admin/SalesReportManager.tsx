"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Order } from "@/types/menu";
import {
  TrendingUp,
  ShoppingBag,
  Bike,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

interface SalesReportManagerProps {
  orders: Order[];
  currencySymbol?: string;
  shopName?: string;
}

type PeriodRange = "15d" | "30d";

export default function SalesReportManager({
  orders = [],
  currencySymbol = "Rs.",
  shopName = "Store",
}: SalesReportManagerProps) {
  const [period, setPeriod] = useState<PeriodRange>("15d");
  const [filterType, setFilterType] = useState<"all" | "dine_in" | "takeaway" | "delivery">("all");

  const daysCount = period === "15d" ? 15 : 30;

  // 1. Filter orders for current period (last 15 or 30 days)
  const { currentOrders, previousOrders } = useMemo(() => {
    const now = new Date();
    const periodMs = daysCount * 24 * 60 * 60 * 1000;
    const currentCutoff = new Date(now.getTime() - periodMs);
    const previousCutoff = new Date(now.getTime() - 2 * periodMs);

    const curr = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= currentCutoff && d <= now;
    });

    const prev = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= previousCutoff && d < currentCutoff;
    });

    return { currentOrders: curr, previousOrders: prev };
  }, [orders, daysCount]);

  // Filter by channel if selected
  const activeOrders = useMemo(() => {
    if (filterType === "all") return currentOrders;
    return currentOrders.filter((o) => (o.order_type || "takeaway") === filterType);
  }, [currentOrders, filterType]);

  // 2. Compute Period Aggregates
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

    const dayMap = new Map<
      string,
      {
        dateStr: string;
        dateObj: Date;
        revenue: number;
        totalOrders: number;
        dineIn: number;
        takeaway: number;
        delivery: number;
      }
    >();

    for (const ord of activeOrders) {
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

      const dStr = ord.created_at?.slice(0, 10);
      if (dStr) {
        let day = dayMap.get(dStr);
        if (!day) {
          day = {
            dateStr: dStr,
            dateObj: new Date(ord.created_at),
            revenue: 0,
            totalOrders: 0,
            dineIn: 0,
            takeaway: 0,
            delivery: 0,
          };
          dayMap.set(dStr, day);
        }
        if (ord.status !== "cancelled") {
          day.revenue += ordTotal;
        }
        day.totalOrders++;
        if (type === "dine_in") day.dineIn++;
        else if (type === "delivery") day.delivery++;
        else day.takeaway++;
      }
    }

    const totalOrdersCount = activeOrders.length;
    const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const dailyAverage = Math.round(totalRevenue / daysCount);

    // Sorted daily entries (newest first for table)
    const dailyBreakdown = Array.from(dayMap.values()).sort(
      (a, b) => b.dateStr.localeCompare(a.dateStr)
    );

    // Peak sales day
    let peakDay: { dateStr: string; revenue: number } | null = null;
    for (const day of dailyBreakdown) {
      if (!peakDay || day.revenue > peakDay.revenue) {
        peakDay = { dateStr: day.dateStr, revenue: day.revenue };
      }
    }

    // Previous period revenue comparison
    const prevRev = previousOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    const growthPct =
      prevRev > 0
        ? Math.round(((totalRevenue - prevRev) / prevRev) * 100)
        : totalRevenue > 0
        ? 100
        : 0;

    return {
      totalRevenue,
      totalOrdersCount,
      completedCount,
      cancelledCount,
      aov,
      dailyAverage,
      dineInCount,
      dineInRev,
      takeawayCount,
      takeawayRev,
      deliveryCount,
      deliveryRev,
      dailyBreakdown,
      peakDay,
      prevRev,
      growthPct,
    };
  }, [activeOrders, previousOrders, daysCount]);

  // Export CSV
  const handleExportCSV = () => {
    if (activeOrders.length === 0) {
      alert("No sales data available to export for this period.");
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
      "Status",
      "Total Amount",
      "Items Summary",
    ];

    const rows = activeOrders.map((o) => {
      const d = o.created_at ? new Date(o.created_at) : new Date();
      const date = d.toISOString().slice(0, 10);
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const tableOrToken =
        o.order_type === "dine_in" ? `Table ${o.table_number || "—"}` : o.token_number || "—";
      const itemsSummary = (o.items || [])
        .map((i) => {
          const q = i.quantity || i.qty || 1;
          const varName =
            i.selectedVariation ||
            (typeof i.selected_variation === "object"
              ? (i.selected_variation as any)?.name
              : i.selected_variation);
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
        o.status,
        Number(o.total || 0).toFixed(2),
        `"${itemsSummary.replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `sales_${daysCount}_days_report_${shopName.replace(/\s+/g, "_")}_${
        new Date().toISOString().slice(0, 10)
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Back to Analytics</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Audit Report
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 m-0">
            {period === "15d" ? "15-Day" : "30-Day"} Sales Report
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Comprehensive business performance &amp; sales breakdown for{" "}
            <strong>{shopName}</strong>
          </p>
        </div>

        {/* Controls: 15d vs 30d Toggle & Export */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => setPeriod("15d")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === "15d"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 15 Days
            </button>
            <button
              type="button"
              onClick={() => setPeriod("30d")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === "30d"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 30 Days (Month)
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Revenue ({daysCount}d)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            {currencySymbol} {stats.totalRevenue.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {stats.growthPct >= 0 ? (
              <span className="inline-flex items-center text-emerald-700 font-bold">
                <span className="mr-0.5">↗</span>
                +{stats.growthPct}%
              </span>
            ) : (
              <span className="inline-flex items-center text-red-600 font-bold">
                <span className="mr-0.5">↘</span>
                {stats.growthPct}%
              </span>
            )}
            <span className="text-slate-400">vs prev {daysCount} days</span>
          </div>
        </div>

        {/* Daily Average Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daily Average
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {currencySymbol} {stats.dailyAverage.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Average revenue earned per day
          </div>
        </div>

        {/* Orders Placed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.totalOrdersCount}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {stats.completedCount} completed • {stats.cancelledCount} cancelled
          </div>
        </div>

        {/* Average Order Value (AOV) & Peak Day */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avg Order Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {currencySymbol} {stats.aov.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium truncate">
            {stats.peakDay ? (
              <span>
                Peak: <strong>{stats.peakDay.dateStr}</strong> ({currencySymbol}{" "}
                {stats.peakDay.revenue.toLocaleString()})
              </span>
            ) : (
              "No peak recorded"
            )}
          </div>
        </div>
      </div>

      {/* Service Channel Distribution Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Takeaway / Counter */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Takeaway (Token)
              </div>
              <div className="text-lg font-black text-slate-900">
                {stats.takeawayCount}{" "}
                <span className="text-xs font-semibold text-slate-400">
                  (
                  {stats.totalOrdersCount > 0
                    ? Math.round((stats.takeawayCount / stats.totalOrdersCount) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-amber-600">
              {currencySymbol} {stats.takeawayRev.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Takeaway Volume</div>
          </div>
        </div>

        {/* Dine-In */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 text-base">
              🍽️
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Dine-In (Table)
              </div>
              <div className="text-lg font-black text-slate-900">
                {stats.dineInCount}{" "}
                <span className="text-xs font-semibold text-slate-400">
                  (
                  {stats.totalOrdersCount > 0
                    ? Math.round((stats.dineInCount / stats.totalOrdersCount) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-red-600">
              {currencySymbol} {stats.dineInRev.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Table Dining</div>
          </div>
        </div>

        {/* Rider Delivery */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rider Delivery
              </div>
              <div className="text-lg font-black text-slate-900">
                {stats.deliveryCount}{" "}
                <span className="text-xs font-semibold text-slate-400">
                  (
                  {stats.totalOrdersCount > 0
                    ? Math.round((stats.deliveryCount / stats.totalOrdersCount) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-orange-600">
              {currencySymbol} {stats.deliveryRev.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Home Delivery</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Daily Breakdown Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 m-0">
              Daily Breakdown ({daysCount} Days)
            </h2>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Day-by-day record of customer orders, channel distribution, and gross revenue
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Filter Channel:</span>
            {(["all", "takeaway", "dine_in", "delivery"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === t
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t === "all"
                  ? "All Channels"
                  : t === "takeaway"
                  ? "Takeaway"
                  : t === "dine_in"
                  ? "Dine-In"
                  : "Delivery"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {stats.dailyBreakdown.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No sales records found for this {daysCount}-day window and selected channel.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Takeaway</th>
                  <th className="py-3 px-4">Dine-In</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4 text-right">Daily Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.dailyBreakdown.map((row) => {
                  const dayName = row.dateObj.toLocaleDateString("en-US", { weekday: "short" });
                  const formattedDate = row.dateObj.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <tr key={row.dateStr} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span className="inline-block w-10 text-slate-400 font-semibold text-xs">
                          {dayName}
                        </span>
                        <span>{formattedDate}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs">
                          {row.totalOrders}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {row.takeaway > 0 ? (
                          <span className="text-amber-700 font-semibold">{row.takeaway}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {row.dineIn > 0 ? (
                          <span className="text-red-700 font-semibold">{row.dineIn}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {row.delivery > 0 ? (
                          <span className="text-orange-700 font-semibold">{row.delivery}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 font-black text-right text-emerald-700 text-sm">
                        {currencySymbol} {row.revenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
