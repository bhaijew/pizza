"use client";

/**
 * DailyClosingManager — Clean Theme for Day-End Reconciliation & Executive Z-Report.
 * Calculates today's Dine-In (Table QR) sales, Takeaway sales, Deducts Day Expenses,
 * calculates Net Daily Profit, auto-detects Admin vs Staff closing identity,
 * exports professional PDF Z-Reports, and dispatches automated WhatsApp closing summaries.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  recordDailyClosing,
  fetchDailyClosingData,
  sendDailyClosingWhatsAppAction,
} from "@/lib/admin-actions";
import { exportDailyClosingPDF, openDailyClosingPrintView } from "@/lib/daily-closing-pdf";

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
    shiftWindow?: string;
    openingTime?: string;
    closingTime?: string;
  };
  currencySymbol?: string;
  shopName?: string;
  userRole?: string;
  staffName?: string;
  ownerPhone?: string;
  shopId?: number | null;
}

export default function DailyClosingManager({
  initialData,
  currencySymbol = "Rs.",
  shopName = "Pizza System",
  userRole = "admin",
  staffName = "Store Admin",
  ownerPhone = "",
  shopId = null,
}: DailyClosingProps) {
  const [data, setData] = useState(initialData);
  const [selectedDate, setSelectedDate] = useState(initialData.date);
  const [isPending, startTransition] = useTransition();

  // Dynamic Closed By initialization based on logged-in role & name
  const detectedClosedBy =
    userRole === "admin"
      ? `Admin (${staffName || "Store Admin"})`
      : `Staff (${staffName || "Cashier"})`;

  const [closedBy, setClosedBy] = useState(detectedClosedBy);
  const [notes, setNotes] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(ownerPhone || "");
  const [autoExportPDF, setAutoExportPDF] = useState(true);
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState(true);

  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
    whatsappUrl?: string;
    closedByTag?: string;
  } | null>(null);

  // Switch date
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    startTransition(async () => {
      try {
        const result = await fetchDailyClosingData(newDate);
        setData(result);
        setFeedbackMsg(null);
      } catch (err: any) {
        setFeedbackMsg({
          type: "error",
          text: "Failed to load data for date: " + err.message,
        });
      }
    });
  };

  // Trigger direct automatic PDF file download
  const handleExportPDF = () => {
    try {
      exportDailyClosingPDF({
        ...data,
        shopName,
        currencySymbol,
        closedBy: data.closingRecord?.closed_by || closedBy,
        notes: notes || data.closingRecord?.notes,
      });
      setFeedbackMsg({
        type: "success",
        text: `📥 Z-Report PDF for ${selectedDate} has started downloading automatically to your device!`,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: "Failed to download PDF: " + (err?.message || "Unknown error"),
      });
    }
  };

  // Open full-screen printable view
  const handlePrint = () => {
    openDailyClosingPrintView({
      ...data,
      shopName,
      currencySymbol,
      closedBy: data.closingRecord?.closed_by || closedBy,
      notes: notes || data.closingRecord?.notes,
    });
  };

  // Perform register closing
  const handleConfirmClose = () => {
    startTransition(async () => {
      const closingPerson = closedBy.trim() || detectedClosedBy;

      // 1. Record closing in Supabase database
      const res = await recordDailyClosing(selectedDate, closingPerson, notes);
      if (res.error) {
        setFeedbackMsg({ type: "error", text: res.error });
        return;
      }

      // 2. Fetch updated dataset
      const updated = await fetchDailyClosingData(selectedDate);
      setData(updated);
      setShowCloseModal(false);

      // 3. Auto Export PDF report if selected
      if (autoExportPDF) {
        setTimeout(() => {
          exportDailyClosingPDF({
            ...updated,
            shopName,
            currencySymbol,
            closedBy: closingPerson,
            notes,
          });
        }, 200);
      }

      // 4. Send automated WhatsApp Closing Alert
      let waUrl: string | undefined = undefined;
      let waNotice = "";

      if (autoSendWhatsApp && whatsappPhone.trim()) {
        try {
          const waRes = await sendDailyClosingWhatsAppAction({
            date: selectedDate,
            closedBy: closingPerson,
            notes,
            recipientPhone: whatsappPhone.trim(),
          });
          waUrl = waRes.whatsappUrl;
          if (waRes.success) {
            waNotice = `📲 WhatsApp daily closing summary dispatched to ${whatsappPhone}!`;
          } else if (waRes.error) {
            waNotice = `⚠️ WhatsApp gateway: ${waRes.error}. (Direct share link available below)`;
          }
        } catch (waErr: any) {
          waNotice = `⚠️ WhatsApp notice: ${waErr?.message || "Failed to trigger auto bot."}`;
        }
      }

      setFeedbackMsg({
        type: "success",
        text: `✓ Register successfully closed for ${selectedDate} by ${closingPerson}! ${waNotice}`,
        whatsappUrl: waUrl,
        closedByTag: closingPerson,
      });
    });
  };

  const isProfitable = data.netProfit >= 0;
  const activeClosedBy = data.closingRecord?.closed_by || closedBy;

  return (
    <div className="space-y-6" style={{ borderRadius: "5px" }}>
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span>📑</span> Daily Closing &amp; Z-Report
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "5px",
                background: userRole === "admin" ? "#fef3c7" : "#ecfdf5",
                color: userRole === "admin" ? "#92400e" : "#065f46",
                border: `1px solid ${userRole === "admin" ? "#fde68a" : "#a7f3d0"}`,
              }}
            >
              {userRole === "admin" ? `👑 ADMIN (${staffName})` : `👤 STAFF (${staffName})`}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Reconcile daily table and takeaway sales against expenses for exact daily net profit.
          </p>
          {data.shiftWindow && (
            <div
              style={{ borderRadius: "5px" }}
              className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold"
            >
              <span>🕒</span>
              <span>
                Operating Shift: <strong>{data.shiftWindow}</strong> (PKT / UTC+5)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Picker */}
          <div
            style={{ borderRadius: "5px" }}
            className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-1.5 shadow-sm"
          >
            <span className="text-xs text-gray-500 uppercase font-bold">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs text-gray-900 font-mono focus:outline-none"
            />
          </div>

          {/* Export PDF Button (Instant Automatic Download) */}
          <button
            onClick={handleExportPDF}
            style={{ borderRadius: "5px" }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-3.5 py-2 transition-colors shadow-sm flex items-center gap-1.5 border-none cursor-pointer"
            title="Instantly download complete executive PDF with all orders, timestamps & financial breakdown"
          >
            <span>📥</span>
            <span>Download PDF (All Orders)</span>
          </button>

          {/* Print Z-Report */}
          <button
            onClick={handlePrint}
            style={{ borderRadius: "5px" }}
            className="bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase px-3 py-2 border border-gray-300 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>🖨️</span> Print Slip
          </button>

          {/* Quick Search Order (ORD-) Link */}
          <Link
            href="/admin/order-lookup"
            style={{ borderRadius: "5px" }}
            className="bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs uppercase px-3 py-2 border border-sky-200 transition-colors shadow-sm flex items-center gap-1.5 no-underline"
            title="Search order by ORD- number and view complete financial details"
          >
            <span>🔍</span> Search Order (ORD-)
          </Link>

          {!data.isClosed ? (
            <button
              onClick={() => setShowCloseModal(true)}
              style={{ borderRadius: "5px" }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 transition-colors shadow-sm flex items-center gap-1.5 border-none cursor-pointer"
            >
              <span>🔒</span> Close Register
            </button>
          ) : (
            <div
              style={{ borderRadius: "5px" }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs uppercase px-3 py-1.5 flex items-center gap-1.5"
            >
              <span>✓</span> Register Closed
            </div>
          )}
        </div>
      </div>

      {/* Feedback Banner with Direct WhatsApp & PDF Actions */}
      {feedbackMsg && (
        <div
          style={{ borderRadius: "5px" }}
          className={`p-3.5 text-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{feedbackMsg.type === "success" ? "🎉" : "⚠️"}</span>
            <div>
              <p className="font-bold">{feedbackMsg.text}</p>
              {feedbackMsg.closedByTag && (
                <p className="text-[11px] opacity-80 mt-0.5">
                  Audit Log: Closed by <strong>{feedbackMsg.closedByTag}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {feedbackMsg.whatsappUrl && (
              <a
                href={feedbackMsg.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ borderRadius: "5px" }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs no-underline shadow-sm transition-transform hover:scale-105"
              >
                <span>📲</span>
                <span>Open in WhatsApp</span>
              </a>
            )}

            <button
              onClick={handleExportPDF}
              style={{ borderRadius: "5px" }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs cursor-pointer shadow-sm"
            >
              <span>📄</span>
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-gray-400 hover:text-gray-700 font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Register Status Banner with Closed By Display */}
      <div
        style={{ borderRadius: "5px" }}
        className={`p-4 border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          data.isClosed
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              data.isClosed ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
            }`}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-xs uppercase tracking-wider">
                {data.isClosed ? "Register Locked & Reconciled" : "Register Currently Open — Live Shift"}
              </p>
              {data.isClosed && (
                <span
                  style={{ borderRadius: "5px" }}
                  className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 tracking-wider uppercase"
                >
                  CLOSED BY: {data.closingRecord?.closed_by || activeClosedBy}
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {data.isClosed && data.closingRecord
                ? `Reconciled on ${
                    data.closingRecord.created_at
                      ? new Date(data.closingRecord.created_at).toLocaleTimeString()
                      : data.date
                  } by ${data.closingRecord.closed_by || "Manager"}`
                : `Currently active session operator: ${userRole === "admin" ? "Admin" : "Staff"} (${staffName})`}
            </p>
          </div>
        </div>

        {data.closingRecord?.notes && (
          <div
            style={{ borderRadius: "5px" }}
            className="text-xs bg-white/90 px-3 py-1.5 border border-gray-200 max-w-md shadow-sm"
          >
            <span className="text-gray-500 font-bold uppercase text-[10px]">Closing Note: </span>
            <span className="text-gray-900">{data.closingRecord.notes}</span>
          </div>
        )}
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Sales */}
        <div
          style={{ borderRadius: "5px" }}
          className="bg-white border border-gray-200 p-4 shadow-sm"
        >
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
        <div
          style={{ borderRadius: "5px" }}
          className="bg-white border border-blue-200 p-4 shadow-sm"
        >
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
        <div
          style={{ borderRadius: "5px" }}
          className="bg-white border border-purple-200 p-4 shadow-sm"
        >
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
        <div
          style={{ borderRadius: "5px" }}
          className="bg-white border border-red-200 p-4 shadow-sm"
        >
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
          style={{ borderRadius: "5px" }}
          className={`border p-4 shadow-sm ${
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
        <div
          style={{ borderRadius: "5px" }}
          className="bg-white border border-gray-200 p-4 space-y-3 shadow-sm"
        >
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
                          <span
                            style={{ borderRadius: "5px" }}
                            className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.2"
                          >
                            TABLE #{order.table_number || "—"}
                          </span>
                        ) : (
                          <span
                            style={{ borderRadius: "5px" }}
                            className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-1.5 py-0.2"
                          >
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
        <div
          style={{ borderRadius: "5px" }}
          className="bg-white border border-gray-200 p-4 space-y-3 shadow-sm"
        >
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
          <p className="text-xs">DAILY Z-REPORT &amp; REGISTER SUMMARY</p>
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
          <p>Closed By: {data.closingRecord?.closed_by || activeClosedBy}</p>
          <p className="mt-2 text-[9px]">Generated by {shopName} POS System</p>
        </div>
      </div>

      {/* ─── Close Register Modal with Operator Identity & WhatsApp Alert ─── */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            style={{ borderRadius: "5px" }}
            className="bg-white border border-gray-200 w-full max-w-lg p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <div>
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
                    Reconcile &amp; Close Register
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Business Date: <strong>{selectedDate}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Operator Identity Tag */}
            <div
              style={{ borderRadius: "5px" }}
              className={`p-3 text-xs flex items-center justify-between border ${
                userRole === "admin"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] opacity-75">
                  Closing Operator Identity
                </span>
                <p className="font-extrabold text-sm mt-0.5">
                  {userRole === "admin" ? `👑 ADMIN — ${staffName}` : `👤 STAFF — ${staffName}`}
                </p>
              </div>
              <span
                style={{ borderRadius: "5px" }}
                className="px-2 py-0.5 text-[10px] font-black uppercase bg-white/80 border border-current"
              >
                {userRole === "admin" ? "Store Admin" : "Staff Member"}
              </span>
            </div>

            <div
              style={{ borderRadius: "5px" }}
              className="bg-gray-50 border border-gray-200 p-3 text-xs text-gray-700 space-y-1.5"
            >
              <div className="flex justify-between">
                <span>Gross Day Sales:</span>
                <strong className="text-gray-900">
                  {currencySymbol}
                  {data.totalSales.toFixed(2)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Deducted Shift Expenses:</span>
                <strong className="text-red-600">
                  -{currencySymbol}
                  {data.totalExpenses.toFixed(2)}
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200 font-bold text-sm">
                <span>Net Cash Balance:</span>
                <span className={isProfitable ? "text-emerald-700" : "text-red-700"}>
                  {currencySymbol}
                  {data.netProfit.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Closed By Name / Audit Tag *
                </label>
                <input
                  type="text"
                  required
                  value={closedBy}
                  onChange={(e) => setClosedBy(e.target.value)}
                  style={{ borderRadius: "5px" }}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-900 font-semibold focus:border-red-500 focus:outline-none"
                  placeholder="e.g. Admin (Ali) or Staff (Farhan)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center justify-between">
                  <span>Owner WhatsApp Number (Alert Notification)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">📲 Direct WhatsApp Bot</span>
                </label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  style={{ borderRadius: "5px" }}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-900 font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. 03001234567 or 923001234567"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Closing Notes (Float cash, drawer balance, notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cash drawer balanced, 100 float kept for tomorrow morning..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ borderRadius: "5px" }}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>

              {/* Automation Switches */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                  <input
                    type="checkbox"
                    checked={autoExportPDF}
                    onChange={(e) => setAutoExportPDF(e.target.checked)}
                    className="accent-orange-600"
                  />
                  <span>📄 Automatically download and open <strong>Executive PDF Report</strong></span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                  <input
                    type="checkbox"
                    checked={autoSendWhatsApp}
                    onChange={(e) => setAutoSendWhatsApp(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  <span>📲 Send WhatsApp Closing Report to Owner phone</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                style={{ borderRadius: "5px" }}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-300 bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                disabled={isPending}
                style={{ borderRadius: "5px" }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition-colors shadow-sm disabled:opacity-50 border-none cursor-pointer flex items-center gap-2"
              >
                <span>🔒</span>
                <span>{isPending ? "Reconciling & Closing..." : "Confirm & Close Register"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
