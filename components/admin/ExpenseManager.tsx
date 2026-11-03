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
import { useState, useTransition, useMemo, useEffect } from "react";
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

  // Prevent page scroll when expense modal is open
  useEffect(() => {
    if (showAddModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showAddModal]);

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
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            overflow: "hidden",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              maxWidth: 750,
              width: "100%",
              boxShadow: "0 20px 50px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              animation: "fadeIn 0.18s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Compact) */}
            <div
              style={{
                padding: "10px 18px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "#ecfdf5",
                    border: "1.5px solid #a7f3d0",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                  </svg>
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 15.5,
                      fontWeight: 900,
                      margin: 0,
                      color: "#0f172a",
                      letterSpacing: "-0.2px",
                      lineHeight: 1.2,
                    }}
                  >
                    Record Expense
                  </h2>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "#64748b" }}>
                    Enter restaurant outgoing, e.g. spices, fuel, or daily operational costs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "#f1f5f9",
                  border: "none",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                className="hover:bg-slate-200"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div
                style={{
                  margin: "8px 18px 0",
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 11.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Non-Scrollable Form Content */}
            <form onSubmit={handleAddExpense} style={{ margin: 0 }}>
              <div style={{ padding: "12px 18px 12px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1fr",
                    gap: 14,
                  }}
                >
                  {/* Left Column: Description & Notes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Expense Description */}
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#0f172a",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "#059669" }}>🏷️</span>
                        <span>Expense Description / Title</span>
                        <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <span style={{ position: "absolute", left: 10, color: "#94a3b8", display: "flex", alignItems: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Cooking Oil, Mozzarella Cheese, Gas Cylinder..."
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "6px 12px 6px 32px",
                            height: 35,
                            borderRadius: 7,
                            border: "1.5px solid #cbd5e1",
                            fontSize: 12.5,
                            color: "#0f172a",
                            outline: "none",
                            boxSizing: "border-box",
                            background: "#ffffff",
                          }}
                        />
                      </div>
                    </div>

                    {/* Notes / Vendor / Bill # */}
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#0f172a",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "#059669" }}>📃</span>
                        <span>Notes / Vendor / Bill #</span>
                        <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: 10.5 }}>(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Supplier name, receipt number, cash via online payment details..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{
                          width: "100%",
                          height: 60,
                          minHeight: 60,
                          maxHeight: 60,
                          padding: "6px 10px",
                          borderRadius: 7,
                          border: "1.5px solid #cbd5e1",
                          fontSize: 11.5,
                          color: "#0f172a",
                          outline: "none",
                          resize: "none",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                          lineHeight: 1.35,
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Amount, Date, and Expense Preview */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Amount & Date Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 10 }}>
                      {/* Amount */}
                      <div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#0f172a",
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ color: "#059669" }}>💸</span>
                          <span>Amount ({currencySymbol})</span>
                          <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: 7,
                            overflow: "hidden",
                            background: "#ffffff",
                            height: 35,
                          }}
                        >
                          <span
                            style={{
                              padding: "0 8px",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              background: "#f1f5f9",
                              color: "#334155",
                              fontSize: 11.5,
                              fontWeight: 800,
                              borderRight: "1.5px solid #cbd5e1",
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
                              flex: 1,
                              padding: "0 8px",
                              height: "100%",
                              border: "none",
                              fontSize: 13,
                              fontWeight: 800,
                              color: "#0f172a",
                              outline: "none",
                              fontFamily: "monospace",
                              width: "100%",
                            }}
                          />
                        </div>
                        {/* Quick Presets */}
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleQuickAmount(500)}
                            style={{
                              flex: 1,
                              padding: "2px 0",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#475569",
                              cursor: "pointer",
                            }}
                            className="hover:bg-slate-200"
                          >
                            +500
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAmount(1000)}
                            style={{
                              flex: 1,
                              padding: "2px 0",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#475569",
                              cursor: "pointer",
                            }}
                            className="hover:bg-slate-200"
                          >
                            +1,000
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAmount(5000)}
                            style={{
                              flex: 1,
                              padding: "2px 0",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#475569",
                              cursor: "pointer",
                            }}
                            className="hover:bg-slate-200"
                          >
                            +5,000
                          </button>
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          >
                            <span style={{ color: "#059669" }}>📅</span>
                            <span>Date</span>
                            <span style={{ color: "#dc2626" }}>*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, expense_date: todayStr })}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              padding: "1px 6px",
                              borderRadius: 8,
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#059669",
                              fontSize: 9.5,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />
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
                            height: 35,
                            padding: "0 8px",
                            borderRadius: 7,
                            border: "1.5px solid #cbd5e1",
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: "#0f172a",
                            outline: "none",
                            boxSizing: "border-box",
                            background: "#ffffff",
                            fontFamily: "monospace",
                          }}
                        />
                      </div>
                    </div>

                    {/* Expense Preview Card (Matching image 1) */}
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px dashed #86efac",
                        borderRadius: 10,
                        padding: "8px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: "#166534" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Expense Preview</span>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#15803d", fontFamily: "monospace" }}>
                          {formData.expense_date || todayStr}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 1 }}>
                        <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                          <div style={{ fontSize: 9.5, color: "#475569", fontWeight: 600 }}>Description</div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: "#0f172a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.2,
                            }}
                          >
                            {formData.title?.trim() || "Untitled Expense"}
                          </div>

                          <div style={{ fontSize: 9.5, color: "#475569", fontWeight: 600, marginTop: 4 }}>Amount</div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 900,
                              color: "#0f172a",
                              fontFamily: "monospace",
                              lineHeight: 1.1,
                            }}
                          >
                            {currencySymbol} {Number(formData.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* Aesthetic Receipt Slip Illustration with Checkmark */}
                        <div style={{ flexShrink: 0 }}>
                          <svg width="48" height="48" viewBox="0 0 68 68" fill="none">
                            <rect x="10" y="6" width="44" height="54" rx="6" fill="#ffffff" stroke="#86efac" strokeWidth="2" />
                            <line x1="18" y1="16" x2="38" y2="16" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="18" y1="24" x2="46" y2="24" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" />
                            <line x1="18" y1="31" x2="42" y2="31" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" />
                            <line x1="18" y1="38" x2="34" y2="38" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="13" fill="#10b981" />
                            <path d="M45 50l3.5 3.5 7.5-7.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer Bar */}
              <div
                style={{
                  padding: "9px 18px",
                  borderTop: "1px solid #f1f5f9",
                  background: "#fafbfc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#3b82f6" }}>ℹ️</span>
                  <span>Fields with <span style={{ color: "#dc2626" }}>*</span> are required</span>
                </span>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 7,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    className="hover:bg-slate-50"
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
                      padding: "6px 18px",
                      borderRadius: 7,
                      border: "none",
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: isPending ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                      transition: "all 0.15s ease",
                    }}
                    className="hover:brightness-110 active:scale-[0.98]"
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
