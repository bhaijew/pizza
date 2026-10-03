"use client";

/**
 * DailyClosingManager — Clean White Theme for Day-End Reconciliation & Z-Report.
 * Calculates today's Dine-In (Table QR) sales, Takeaway sales, Deducts Day Expenses,
 * calculates Net Daily Profit, and allows 1-click register closing & receipt printing.
 */
import { useState, useTransition } from "react";
import { recordDailyClosing, fetchDailyClosingData } from "@/lib/admin-actions";

interface DailyClosingProps {
  initialData: {
    date: string;
    totalOrders: number;
    totalSales: number;
    dineInSales: number;
    takeawaySales: number;
    dineInOrdersCount: number;
    takeawayOrdersCount: number;
    totalExpenses: number;
    netProfit: number;
    isClosed: boolean;
    closingRecord?: any;
    orders: any[];
    expenses: any[];
  };
  currencySymbol?: string;
  shopName?: string;
}

export default function DailyClosingManager({
  initialData,
  currencySymbol = "$",
  shopName = "Pizza System",
}: DailyClosingProps) {
  const [data, setData] = useState(initialData);
  const [selectedDate, setSelectedDate] = useState(initialData.date);
  const [isPending, startTransition] = useTransition();
  const [closedBy, setClosedBy] = useState("Manager");
  const [notes, setNotes] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Switch date
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    startTransition(async () => {
      try {
        const result = await fetchDailyClosingData(newDate);
        setData(result);
        setFeedbackMsg(null);
      } catch (err: any) {
        setFeedbackMsg({ type: "error", text: "Failed to load data for date: " + err.message });
      }
    });
  };

  // Perform closing
  const handleConfirmClose = () => {
    startTransition(async () => {
      const res = await recordDailyClosing(selectedDate, closedBy, notes);
      if (res.error) {
        setFeedbackMsg({ type: "error", text: res.error });
      } else {
        setFeedbackMsg({ type: "success", text: `Register successfully closed for ${selectedDate}!` });
        setShowCloseModal(false);
        // Refresh closing data
        const updated = await fetchDailyClosingData(selectedDate);
        setData(updated);
      }
    });
  };

  // Print Z-Report
  const handlePrint = () => {
    window.print();
  };

  const isProfitable = data.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <span>📑</span> Daily Closing & Z-Report
          </h1>
          <p className="text-xs text-gray-500">
            Reconcile daily table and takeaway sales against expenses for exact daily net profit.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-1.5 shadow-sm">
            <span className="text-xs text-gray-500 uppercase font-bold">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs text-gray-900 font-mono focus:outline-none"
            />
          </div>

          <button
            onClick={handlePrint}
            className="bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase px-3 py-2 border border-gray-300 rounded transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>🖨️</span> Print Z-Report
          </button>

          {!data.isClosed ? (
            <button
              onClick={() => setShowCloseModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 transition-colors rounded shadow-sm flex items-center gap-1.5"
            >
              <span>🔒</span> Close Register
            </button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs uppercase px-3 py-1.5 rounded flex items-center gap-1.5">
              <span>✓</span> Register Closed
            </div>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 text-xs rounded border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Register Status Banner */}
      <div
        className={`p-4 rounded border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          data.isClosed
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              data.isClosed ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
            }`}
          />
          <div>
            <p className="font-bold text-xs uppercase tracking-wider">
              {data.isClosed ? "Register Locked & Reconciled" : "Register Currently Open — Live Tracking"}
            </p>
            <p className="text-[11px] opacity-75">
              {data.isClosed && data.closingRecord
                ? `Closed on ${data.closingRecord.created_at ? new Date(data.closingRecord.created_at).toLocaleTimeString() : data.date} by ${data.closingRecord.closed_by || "Manager"}`
                : "Real-time orders and expenses are dynamically updating."}
            </p>
          </div>
        </div>

        {data.closingRecord?.notes && (
          <div className="text-xs bg-white/80 px-3 py-1.5 rounded border border-gray-200 max-w-md">
            <span className="text-gray-500 font-bold uppercase text-[10px]">Closing Note: </span>
            <span className="text-gray-900">{data.closingRecord.notes}</span>
          </div>
        )}
      </div>

      {/* KPI Financial Overview Cards (Clean White) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Sales */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            Total Revenue
          </p>
          <p className="text-2xl font-black text-gray-900">
            {currencySymbol}
            {data.totalSales.toFixed(2)}
          </p>
          <span className="text-[11px] text-gray-500">{data.totalOrders} total orders</span>
        </div>

        {/* Dine-In (Table QR) Sales */}
        <div className="bg-white border border-blue-200 rounded p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest uppercase text-blue-700 mb-1">
              Dine-In (Table QR)
            </p>
            <span className="text-xs">🪑</span>
          </div>
          <p className="text-2xl font-black text-blue-600">
            {currencySymbol}
            {data.dineInSales.toFixed(2)}
          </p>
          <span className="text-[11px] text-blue-600/70">{data.dineInOrdersCount} table orders</span>
        </div>

        {/* Takeaway Sales */}
        <div className="bg-white border border-purple-200 rounded p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest uppercase text-purple-700 mb-1">
              Takeaway / Delivery
            </p>
            <span className="text-xs">🥡</span>
          </div>
          <p className="text-2xl font-black text-purple-600">
            {currencySymbol}
            {data.takeawaySales.toFixed(2)}
          </p>
          <span className="text-[11px] text-purple-600/70">{data.takeawayOrdersCount} takeaway orders</span>
        </div>

        {/* Total Day Expenses */}
        <div className="bg-white border border-red-200 rounded p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest uppercase text-red-600 mb-1">
              Day Expenses
            </p>
            <span className="text-xs">💸</span>
          </div>
          <p className="text-2xl font-black text-red-600">
            -{currencySymbol}
            {data.totalExpenses.toFixed(2)}
          </p>
          <span className="text-[11px] text-red-500">{data.expenses.length} expense entries</span>
        </div>

        {/* Net Profit */}
        <div
          className={`rounded border p-4 shadow-sm ${
            isProfitable
              ? "bg-emerald-50 border-emerald-300"
              : "bg-red-50 border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${
                isProfitable ? "text-emerald-800" : "text-red-800"
              }`}
            >
              Net Day Profit
            </p>
            <span className="text-xs">{isProfitable ? "📈" : "📉"}</span>
          </div>
          <p
            className={`text-2xl font-black ${
              isProfitable ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {isProfitable ? "" : "-"}
            {currencySymbol}
            {Math.abs(data.netProfit).toFixed(2)}
          </p>
          <span className="text-[11px] text-gray-500">Revenue - Expenses</span>
        </div>
      </div>

      {/* Two Column Grid: Today's Orders Breakdown & Today's Expenses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Column */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-xs font-bold uppercase text-gray-900 tracking-wider flex items-center gap-2">
              <span>🧾</span> Day Orders Breakdown ({data.orders.length})
            </h3>
            <span className="text-xs font-mono font-bold text-gray-900">
              {currencySymbol}{data.totalSales.toFixed(2)}
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 text-xs">
            {data.orders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No orders logged for this date.</p>
            ) : (
              data.orders.map((order) => {
                const isTable =
                  order.order_type === "dine_in" ||
                  !!order.table_number ||
                  order.notes?.includes("[DINE-IN:");
                return (
                  <div
                    key={order.id}
                    className="py-2.5 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">
                          #{String(order.id).slice(0, 8)}
                        </span>
                        {isTable ? (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            TABLE #{order.table_number || "—"}
                          </span>
                        ) : (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            TAKEAWAY
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-gray-600 text-[11px] truncate max-w-xs mt-0.5">
                        {order.customer_name || "Guest"}
                        {order.items?.length ? ` • ${order.items.length} item(s)` : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-gray-900">
                        {currencySymbol}
                        {Number(order.total).toFixed(2)}
                      </span>
                      <p
                        className={`text-[10px] font-bold uppercase ${
                          order.status === "delivered" || order.status === "completed"
                            ? "text-emerald-600"
                            : order.status === "cancelled"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expenses Column */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-xs font-bold uppercase text-gray-900 tracking-wider flex items-center gap-2">
              <span>💸</span> Day Outgoings Breakdown ({data.expenses.length})
            </h3>
            <span className="text-xs font-mono font-bold text-red-600">
              -{currencySymbol}{data.totalExpenses.toFixed(2)}
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 text-xs">
            {data.expenses.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No expenses recorded for this date.</p>
            ) : (
              data.expenses.map((exp: any) => (
                <div
                  key={exp.id}
                  className="py-2.5 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <p className="font-bold text-gray-900">{exp.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        {exp.category}
                      </span>
                      {exp.notes && (
                        <span className="text-[10px] text-gray-400 truncate max-w-xs">
                          • {exp.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-red-600">
                    -{currencySymbol}
                    {Number(exp.amount).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Printable Z-Report Container (Visible in Print Mode) */}
      <div id="z-report-print" className="hidden print:block text-black bg-white p-6 font-mono max-w-sm mx-auto">
        <div className="text-center pb-4 border-b border-black">
          <h2 className="text-xl font-bold uppercase">{shopName}</h2>
          <p className="text-xs">DAILY Z-REPORT & REGISTER SUMMARY</p>
          <p className="text-xs">Date: {data.date}</p>
        </div>

        <div className="py-4 space-y-1 text-xs border-b border-black">
          <div className="flex justify-between">
            <span>Total Orders:</span>
            <span>{data.totalOrders}</span>
          </div>
          <div className="flex justify-between">
            <span>Dine-In (Table QR) Orders:</span>
            <span>{data.dineInOrdersCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Takeaway Orders:</span>
            <span>{data.takeawayOrdersCount}</span>
          </div>
        </div>

        <div className="py-4 space-y-1.5 text-xs border-b border-black">
          <div className="flex justify-between font-bold">
            <span>TOTAL GROSS SALES:</span>
            <span>{currencySymbol}{data.totalSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pl-2">
            <span>Dine-In Sales:</span>
            <span>{currencySymbol}{data.dineInSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pl-2">
            <span>Takeaway Sales:</span>
            <span>{currencySymbol}{data.takeawaySales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-red-600 pt-1">
            <span>TOTAL EXPENSES:</span>
            <span>-{currencySymbol}{data.totalExpenses.toFixed(2)}</span>
          </div>
        </div>

        <div className="py-4 text-center border-b border-black">
          <p className="text-xs font-bold uppercase">NET OPERATING PROFIT</p>
          <p className="text-2xl font-black">
            {currencySymbol}{data.netProfit.toFixed(2)}
          </p>
        </div>

        <div className="pt-4 text-[10px] text-center">
          <p>Register Status: {data.isClosed ? "CLOSED" : "OPEN"}</p>
          <p>Closed By: {data.closingRecord?.closed_by || closedBy}</p>
          <p className="mt-2 text-[9px]">Generated by Pizza System POS</p>
        </div>
      </div>

      {/* Close Register Modal (Clean White) */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <span>🔒</span> Reconcile & Close Register
              </h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              This will lock the day register for <span className="font-bold text-gray-900">{selectedDate}</span>, save total sales ({currencySymbol}{data.totalSales}), expenses ({currencySymbol}{data.totalExpenses}), and final net profit ({currencySymbol}{data.netProfit}).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Manager / Cashier Name *
                </label>
                <input
                  type="text"
                  required
                  value={closedBy}
                  onChange={(e) => setClosedBy(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Closing Notes (Float cash, drawer balance, notes)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Cash drawer balanced, 100 float kept for tomorrow morning..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition-colors rounded shadow-sm disabled:opacity-50"
              >
                {isPending ? "Closing Register..." : "Confirm & Close Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
