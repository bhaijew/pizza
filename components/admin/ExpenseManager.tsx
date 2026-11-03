"use client";

/**
 * ExpenseManager — Modern Restaurant Cost & Outgoings Tracking for Sole What.
 * Manages daily shop outgoings with user-defined & standard categories:
 * Ingredients, Utilities, Wages, Packaging, Rent, Fuel, Delivery, Maintenance, etc.
 * Features:
 * - Direct Custom Category entry: user can type ANY category name directly
 * - 1-Click Quick Category Preset Pills
 * - Dynamic Category Filter Pills in the Table
 * - Financial KPIs & Daily Closing Integration
 */
import { useState, useTransition, useMemo } from "react";
import type { Expense, ExpenseCategory } from "@/types/menu";
import { createExpense, deleteExpense } from "@/lib/admin-actions";

interface ExpenseManagerProps {
  initialExpenses: Expense[];
  currencySymbol?: string;
  shopId?: number | null;
  shopName?: string;
}

// Keyword-based emoji and color matching for any custom category
function getCategoryInfo(categoryKey: string) {
  const raw = (categoryKey || "misc").trim();
  const lower = raw.toLowerCase();

  let icon = "🏷️";
  if (lower.includes("oil") || lower.includes("tel") || lower.includes("ghee")) icon = "🫒";
  else if (lower.includes("ingredient") || lower.includes("cheese") || lower.includes("sauce") || lower.includes("flour") || lower.includes("atta") || lower.includes("dough")) icon = "🍅";
  else if (lower.includes("electric") || lower.includes("utility") || lower.includes("water") || lower.includes("bill") || lower.includes("power")) icon = "⚡";
  else if (lower.includes("gas") || lower.includes("cylinder") || lower.includes("lpg")) icon = "🔥";
  else if (lower.includes("wage") || lower.includes("salary") || lower.includes("staff") || lower.includes("worker") || lower.includes("cook") || lower.includes("labor")) icon = "👨‍🍳";
  else if (lower.includes("pack") || lower.includes("box") || lower.includes("carton") || lower.includes("bag")) icon = "📦";
  else if (lower.includes("rent") || lower.includes("shop rent")) icon = "🏢";
  else if (lower.includes("fuel") || lower.includes("petrol") || lower.includes("diesel")) icon = "⛽";
  else if (lower.includes("bike") || lower.includes("rider") || lower.includes("delivery")) icon = "🛵";
  else if (lower.includes("repair") || lower.includes("maintenance")) icon = "🔧";
  else if (lower.includes("clean") || lower.includes("detergent") || lower.includes("wash") || lower.includes("soap")) icon = "🧹";
  else if (lower.includes("market") || lower.includes("ad") || lower.includes("facebook") || lower.includes("print")) icon = "📢";
  else if (lower.includes("grocery") || lower.includes("sabzi") || lower.includes("vegetable") || lower.includes("onion") || lower.includes("tomato")) icon = "🛒";
  else if (lower.includes("chicken") || lower.includes("meat") || lower.includes("beef") || lower.includes("mutton")) icon = "🥩";
  else if (lower.includes("dairy") || lower.includes("milk") || lower.includes("dahi") || lower.includes("cream")) icon = "🥛";
  else if (lower.includes("drink") || lower.includes("beverage") || lower.includes("cold drink") || lower.includes("soda")) icon = "🥤";

  const formatted = raw
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    label: formatted,
    icon,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  };
}

export default function ExpenseManager({
  initialExpenses,
  currencySymbol = "Rs.",
  shopId,
  shopName,
}: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    expense_date: todayStr,
    notes: "",
  });

  // Extract distinct categories actually present in logged expenses
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const exp of expenses) {
      const cat = (exp.category || "").trim();
      if (cat) {
        set.add(cat);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7);

    let todayTotal = 0;
    let monthTotal = 0;
    let allTimeTotal = 0;
    const catTotals: Record<string, number> = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      allTimeTotal += amt;

      if (exp.expense_date === today) {
        todayTotal += amt;
      }
      if (exp.expense_date && exp.expense_date.startsWith(currentMonth)) {
        monthTotal += amt;
      }

      const catKey = (exp.category || "misc").toLowerCase().trim();
      catTotals[catKey] = (catTotals[catKey] || 0) + amt;
    }

    let topCat = "None";
    let topCatAmt = 0;
    for (const [cat, amt] of Object.entries(catTotals)) {
      if (amt > topCatAmt) {
        topCatAmt = amt;
        topCat = getCategoryInfo(cat).label;
      }
    }

    return {
      todayTotal,
      monthTotal,
      allTimeTotal,
      topCat,
      topCatAmt,
    };
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.expense_date && e.expense_date.includes(q))
      );
    });
  }, [expenses, searchQuery]);

  // Quick Amount Helper
  const handleQuickAmount = (increment: number) => {
    const current = parseFloat(formData.amount) || 0;
    setFormData((prev) => ({ ...prev, amount: String(current + increment) }));
  };

  // Open Modal with clean reset
  const handleOpenAddModal = () => {
    setFormError(null);
    setFormData({
      title: "",
      amount: "",
      expense_date: todayStr,
      notes: "",
    });
    setShowAddModal(true);
  };

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(formData.amount);
    if (!formData.title.trim()) {
      setFormError("Please enter an expense description / title.");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    const finalCategory = "General";

    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", formData.title.trim());
      fd.append("amount", String(amt));
      fd.append("category", finalCategory);
      fd.append("expense_date", formData.expense_date);
      fd.append("notes", formData.notes.trim());

      const res = await createExpense({ error: null, success: false }, fd);
      if (res.error) {
        setFormError(res.error);
      } else {
        const newRecord: Expense = {
          id: res.expense?.id || Date.now(),
          title: formData.title.trim(),
          amount: amt,
          category: finalCategory,
          expense_date: formData.expense_date,
          notes: formData.notes.trim() || null,
          created_at: new Date().toISOString(),
        };
        setExpenses((prev) => [newRecord, ...prev]);
        setShowAddModal(false);
        setFormData({
          title: "",
          amount: "",
          expense_date: todayStr,
          notes: "",
        });
      }
    });
  };

  // Print Expenses Slip / Voucher (Thermal or A4)
  const handlePrintExpensesSlip = (itemsToPrint?: Expense[]) => {
    const list = itemsToPrint || filteredExpenses;
    const printWindow = window.open("", "_blank", "width=840,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups to open the print view.");
      return;
    }

    const total = list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const dateFormatted = new Date().toLocaleDateString("en-PK", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const rows = list
      .map(
        (item, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">#${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 12px; color: #0f172a;">${item.title}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b; font-family: monospace;">${item.expense_date}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${item.notes || "—"}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 800; font-size: 12px; text-align: right; color: #dc2626; font-family: monospace;">${currencySymbol} ${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
    `
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Expense Voucher Slip - ${shopName || "Restaurant"}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .total-box { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 12px 18px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f1f5f9; padding: 8px 10px; font-size: 11px; text-align: left; text-transform: uppercase; color: #475569; border-bottom: 1.5px solid #cbd5e1; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 8px 18px; background: #dc2626; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
      🖨️ Print Slip
    </button>
  </div>
  <div class="header">
    <div>
      <h1 class="title">${shopName || "RESTAURANT"}</h1>
      <div class="subtitle">OFFICIAL EXPENSES &amp; OUTGOINGS VOUCHER SLIP</div>
      <div style="font-size: 11px; color: #475569; margin-top: 4px;">Generated on: ${dateFormatted}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Total Entries</div>
      <div style="font-size: 16px; font-weight: 800;">${list.length} Items</div>
    </div>
  </div>
  <div class="total-box">
    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569;">Total Outgoings Amount:</div>
    <div style="font-size: 22px; font-weight: 900; color: #dc2626; font-family: monospace;">${currencySymbol} ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Expense Description / Title</th>
        <th>Date</th>
        <th>Notes / Vendor / Bill #</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #94a3b8;">No expenses recorded.</td></tr>`}
    </tbody>
  </table>
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; display: grid; grid-template-columns: 1fr auto 1fr; gap: 24px; align-items: center;">
    <div>
      <div style="font-size: 11px; font-weight: 700; margin-bottom: 30px;">Cashier / Operator Signature</div>
      <div style="border-bottom: 1px solid #94a3b8; width: 80%;"></div>
    </div>
    <div style="text-align: center;">
      <div style="display: inline-block; border: 2.5px double #dc2626; outline: 1.5px dashed #dc2626; outline-offset: -5px; border-radius: 8px; padding: 10px 16px; text-align: center; color: #dc2626; transform: rotate(-3deg); background: rgba(220, 38, 38, 0.04); min-width: 175px;">
        <div style="font-size: 8.5px; letter-spacing: 2px;">★ ★ ★</div>
        <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 3px 0;">${(shopName || "RESTAURANT").toUpperCase()}</div>
        <div style="font-size: 8px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;">EXPENSE AUDIT VOUCHER</div>
        <div style="font-size: 9px; font-weight: 800; color: #047857; margin-top: 3px;">VERIFIED &amp; APPROVED</div>
        <div style="font-size: 8.5px; font-family: monospace; color: #64748b; margin-top: 2px;">${dateFormatted}</div>
      </div>
    </div>
    <div>
      <div style="font-size: 11px; font-weight: 700; margin-bottom: 30px; text-align: right;">Manager / Owner Approval</div>
      <div style="border-bottom: 1px solid #94a3b8; width: 80%; margin-left: auto;"></div>
    </div>
  </div>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Handle Delete Expense
  const handleDelete = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;

    startTransition(async () => {
      const res = await deleteExpense(id);
      if (res.error) {
        alert("Failed to delete: " + res.error);
      } else {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span>💸</span> Expense & Cost Management
            </h1>
            {shopName && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                {shopName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Log shop outgoings, supplies, utilities, wages, fuel, repairs, and daily operational overheads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrintExpensesSlip()}
            className="bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider px-3.5 py-2.5 flex items-center justify-center gap-1.5 transition-all rounded-xl border border-gray-300 shadow-sm cursor-pointer"
            title="Print expenses voucher slip"
          >
            <span>🖨️</span> Print Slip
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all rounded-xl shadow-md shadow-red-500/20 hover:shadow-lg cursor-pointer"
          >
            <span className="text-base font-bold">＋</span> Record Expense
          </button>
        </div>
      </div>

      {/* Metric KPI Cards (Clean White) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            Today&apos;s Expenses
          </p>
          <p className="text-2xl font-black text-red-600">
            {currencySymbol}
            {metrics.todayTotal.toFixed(2)}
          </p>
          <span className="text-[11px] text-gray-500 font-medium">Logged today</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            This Month
          </p>
          <p className="text-2xl font-black text-amber-600">
            {currencySymbol}
            {metrics.monthTotal.toFixed(2)}
          </p>
          <span className="text-[11px] text-gray-500 font-medium">Current monthly burn</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            Top Cost Center
          </p>
          <p className="text-xl font-black text-gray-900 truncate">{metrics.topCat}</p>
          <span className="text-[11px] text-gray-500 font-medium">
            {currencySymbol}
            {metrics.topCatAmt.toFixed(2)} total
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            All-Time Outgoings
          </p>
          <p className="text-2xl font-black text-gray-900">
            {currencySymbol}
            {metrics.allTimeTotal.toFixed(2)}
          </p>
          <span className="text-[11px] text-gray-500 font-medium">{expenses.length} total entries</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search expense description, notes, vendor, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-lg bg-gray-100 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl block mb-2">🧾</span>
            <p className="text-gray-900 font-bold text-sm">No expenses found</p>
            <p className="text-gray-500 text-xs mt-1">
              Click &quot;Record Expense&quot; to log shop costs, raw materials, or bills.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Expense Title / Description</th>
                  <th className="py-3 px-4 font-bold">Notes / Vendor / Bill #</th>
                  <th className="py-3 px-4 font-bold text-right">Amount</th>
                  <th className="py-3 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {exp.title}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                      {exp.notes || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-red-600 text-right text-sm whitespace-nowrap">
                      {currencySymbol}
                      {Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrintExpensesSlip([exp])}
                          title="Print single voucher slip"
                          className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 rounded hover:bg-gray-100 cursor-pointer text-xs"
                        >
                          🖨️
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={isPending}
                          title="Delete expense"
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50 cursor-pointer"
                        >
                          ✕
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Modern Add Expense Modal (Full View Frosted-White Executive)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255, 255, 255, 0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              maxWidth: 780,
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 50px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.08)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              animation: "fadeIn 0.18s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  💸
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      margin: 0,
                      color: "#0f172a",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    Record Expense
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                    Enter restaurant outgoings, supplies, fuel, or daily operational costs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: "#f1f5f9",
                  border: "none",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div
                style={{
                  margin: "14px 22px 0",
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Form & Scrollable Content Body */}
            <form
              onSubmit={handleAddExpense}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
                margin: 0,
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: 18,
                  }}
                >
                  {/* Left Column: Title & Notes (Category Removed) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Expense Description */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "#334155",
                          marginBottom: 5,
                        }}
                      >
                        Expense Description / Title <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cooking Oil, Mozzarella Cheese, Gas Cylinder, Staff Lunch..."
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 7,
                          border: "1.5px solid #cbd5e1",
                          fontSize: 13,
                          color: "#0f172a",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Notes / Vendor / Bill # */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "#334155",
                          marginBottom: 5,
                        }}
                      >
                        Notes / Vendor / Bill # <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Supplier name, receipt number, cash vs online payment details..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 7,
                          border: "1.5px solid #cbd5e1",
                          fontSize: 12,
                          color: "#0f172a",
                          outline: "none",
                          resize: "none",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Amount, Date, Clean Restaurant Receipt Voucher */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Amount & Date Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 10 }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "#334155",
                            marginBottom: 5,
                          }}
                        >
                          Amount ({currencySymbol}) <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: 10,
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#64748b",
                              fontFamily: "monospace",
                            }}
                          >
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "9px 10px 9px 36px",
                              borderRadius: 7,
                              border: "1.5px solid #cbd5e1",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#0f172a",
                              outline: "none",
                              boxSizing: "border-box",
                              fontFamily: "monospace",
                            }}
                          />
                        </div>
                        {/* Quick increment buttons */}
                        <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                          <button
                            type="button"
                            onClick={() => handleQuickAmount(500)}
                            style={{
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#475569",
                              cursor: "pointer",
                            }}
                          >
                            +500
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAmount(1000)}
                            style={{
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#475569",
                              cursor: "pointer",
                            }}
                          >
                            +1,000
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAmount(5000)}
                            style={{
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#475569",
                              cursor: "pointer",
                            }}
                          >
                            +5,000
                          </button>
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 5,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#334155",
                            }}
                          >
                            Date <span style={{ color: "#dc2626" }}>*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, expense_date: todayStr })}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#dc2626",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            Today
                          </button>
                        </div>
                        <input
                          type="date"
                          required
                          value={formData.expense_date}
                          onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 10px",
                            borderRadius: 7,
                            border: "1.5px solid #cbd5e1",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#0f172a",
                            outline: "none",
                            boxSizing: "border-box",
                            fontFamily: "monospace",
                          }}
                        />
                      </div>
                    </div>

                    {/* Clean Authentic POS Receipt Voucher (No AI slop) */}
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1.5px dashed #cbd5e1",
                        borderRadius: 9,
                        padding: "12px 15px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid #e2e8f0",
                          paddingBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            color: "#64748b",
                            textTransform: "uppercase",
                          }}
                        >
                          Voucher Slip Preview
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#64748b",
                            fontFamily: "monospace",
                          }}
                        >
                          {formData.expense_date || todayStr}
                        </span>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 9.5,
                            color: "#64748b",
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                        >
                          Outgoings Amount
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: "#0f172a",
                            fontFamily: "monospace",
                            marginTop: 1,
                          }}
                        >
                          {currencySymbol} {Number(formData.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid #e2e8f0",
                          paddingTop: 6,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                          <div style={{ fontSize: 9.5, color: "#64748b", textTransform: "uppercase" }}>
                            Description:
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#0f172a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formData.title || "Untitled Expense"}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: Number(formData.amount) > 0 ? "#ecfdf5" : "#f1f5f9",
                            color: Number(formData.amount) > 0 ? "#047857" : "#64748b",
                            border: `1px solid ${Number(formData.amount) > 0 ? "#a7f3d0" : "#cbd5e1"}`,
                          }}
                        >
                          {Number(formData.amount) > 0 ? "Ready to Record" : "Awaiting Amount"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer Bar */}
              <div
                style={{
                  padding: "12px 22px",
                  borderTop: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Fields with <span style={{ color: "#dc2626" }}>*</span> are required
                </span>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: "7px 15px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 18px",
                      borderRadius: 6,
                      border: "none",
                      background: "#dc2626",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: isPending ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isPending ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Save Expense</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
