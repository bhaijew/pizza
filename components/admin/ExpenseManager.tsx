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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Category Input state: directly typed by user (no pre-added default)
  const [categoryInput, setCategoryInput] = useState("");

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
      const catKey = (e.category || "").toLowerCase().trim();
      const matchesCat =
        selectedCategory === "all" ||
        catKey === selectedCategory.toLowerCase().trim();

      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        catKey.includes(searchQuery.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [expenses, selectedCategory, searchQuery]);

  // Quick Amount Helper
  const handleQuickAmount = (increment: number) => {
    const current = parseFloat(formData.amount) || 0;
    setFormData((prev) => ({ ...prev, amount: String(current + increment) }));
  };

  // Open Modal with clean reset
  const handleOpenAddModal = () => {
    setFormError(null);
    setCategoryInput("");
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
    if (!categoryInput.trim()) {
      setFormError("Please enter an expense category (e.g. Oil, Meat, Vegetables, Wages).");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    const finalCategory = categoryInput.trim();

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
        setCategoryInput("");
        setFormData({
          title: "",
          amount: "",
          expense_date: todayStr,
          notes: "",
        });
      }
    });
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
            Log ingredients, daily supplies, utilities, wages, fuel, repairs, and custom restaurant overheads.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 flex items-center justify-center gap-2 transition-all rounded-xl shadow-md shadow-red-500/20 hover:shadow-lg cursor-pointer"
        >
          <span className="text-base font-bold">＋</span> Record New Expense
        </button>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search expense title, category, supplier, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Category Tabs (All + categories actually logged in expenses) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all whitespace-nowrap rounded-lg cursor-pointer ${
              selectedCategory === "all"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {availableCategories.map((catName) => {
            const info = getCategoryInfo(catName);
            const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
            return (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-red-100 text-red-800 border border-red-300 shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl block mb-2">🧾</span>
            <p className="text-gray-900 font-bold text-sm">No expenses found</p>
            <p className="text-gray-500 text-xs mt-1">
              Click &quot;Record New Expense&quot; to log your shop costs, raw materials, or bills.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Expense Title</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Notes / Vendor</th>
                  <th className="py-3 px-4 font-bold text-right">Amount</th>
                  <th className="py-3 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((exp) => {
                  const cat = getCategoryInfo(exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {exp.expense_date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {exp.title}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md border ${cat.bg} ${cat.text} ${cat.border}`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                        {exp.notes || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600 text-right text-sm whitespace-nowrap">
                        {currencySymbol}
                        {Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={isPending}
                          title="Delete expense"
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50 cursor-pointer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Modern Add Expense Modal (Full View 2-Column Executive Popup)  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
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
              borderRadius: 16,
              maxWidth: 820,
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.45)",
              border: "1px solid #cbd5e1",
              overflow: "hidden",
              animation: "fadeIn 0.18s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  💸
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      margin: 0,
                      color: "#0f172a",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    Record New Expense
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                    Log shop outgoings, supplies, bills, or operational costs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "#f1f5f9",
                  border: "none",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
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
                  margin: "16px 24px 0",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 12.5,
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
                  padding: "20px 24px",
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: 20,
                  }}
                >
                  {/* Left Column: Title, Category, Notes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Expense Title */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "#334155",
                          marginBottom: 6,
                        }}
                      >
                        Expense Description / Title <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 50kg Mozzarella Cheese, Cooking Oil, Gas Cylinder..."
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1.5px solid #cbd5e1",
                          fontSize: 13,
                          color: "#0f172a",
                          outline: "none",
                          transition: "border-color 0.15s ease",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Expense Category (Custom, No Pre-added Clutter) */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <label
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "#334155",
                          }}
                        >
                          Category <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          Custom Category
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        list="expense-category-suggestions"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        placeholder="e.g. Oil, Meat, Vegetables, Utilities, Wages..."
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1.5px solid #cbd5e1",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#0f172a",
                          outline: "none",
                          transition: "border-color 0.15s ease",
                          boxSizing: "border-box",
                        }}
                      />
                      <datalist id="expense-category-suggestions">
                        {availableCategories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                      <p style={{ margin: "5px 0 0", fontSize: 11, color: "#64748b" }}>
                        Type any custom category name directly (no pre-added preset limits).
                      </p>
                    </div>

                    {/* Notes / Vendor / Invoice # */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "#334155",
                          marginBottom: 6,
                        }}
                      >
                        Notes / Vendor / Invoice # <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Supplier name, receipt number, cash vs online payment..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1.5px solid #cbd5e1",
                          fontSize: 12.5,
                          color: "#0f172a",
                          outline: "none",
                          resize: "none",
                          transition: "border-color 0.15s ease",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Amount, Date, Live Voucher Preview */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Amount & Date in a 2-col mini grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 11.5,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "#334155",
                            marginBottom: 6,
                          }}
                        >
                          Amount ({currencySymbol}) <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: 12,
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
                              padding: "10px 12px 10px 38px",
                              borderRadius: 8,
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
                        {/* Quick increments */}
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleQuickAmount(500)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 5,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10.5,
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
                              padding: "3px 8px",
                              borderRadius: 5,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10.5,
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
                              padding: "3px 8px",
                              borderRadius: 5,
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              fontSize: 10.5,
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
                            marginBottom: 6,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 11.5,
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
                              fontSize: 10.5,
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
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1.5px solid #cbd5e1",
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "#0f172a",
                            outline: "none",
                            boxSizing: "border-box",
                            fontFamily: "monospace",
                          }}
                        />
                      </div>
                    </div>

                    {/* Live Digital Expense Receipt Preview Card */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                        borderRadius: 12,
                        padding: "16px 18px",
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.15)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                          paddingBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "1px",
                            color: "#94a3b8",
                            textTransform: "uppercase",
                          }}
                        >
                          Expense Voucher Preview
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#cbd5e1",
                            fontFamily: "monospace",
                          }}
                        >
                          {formData.expense_date || todayStr}
                        </span>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: 2,
                          }}
                        >
                          Amount
                        </div>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 900,
                            color: "#f87171",
                            fontFamily: "monospace",
                          }}
                        >
                          {currencySymbol} {Number(formData.amount || 0).toFixed(2)}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                          gap: 10,
                          paddingTop: 4,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10.5, color: "#94a3b8", marginBottom: 2 }}>
                            Item / Title:
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#f8fafc",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formData.title || "Untitled Expense"}
                          </div>
                        </div>

                        <div>
                          {(() => {
                            const cat = getCategoryInfo(categoryInput || "Custom");
                            return (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  background: "rgba(255, 255, 255, 0.12)",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#ffffff",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span>{cat.icon}</span>
                                <span>{categoryInput.trim() || "Uncategorized"}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer Bar */}
              <div
                style={{
                  padding: "14px 24px",
                  borderTop: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 11.5, color: "#64748b" }}>
                  Fields with <span style={{ color: "#dc2626" }}>*</span> are required
                </span>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: 12.5,
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
                      gap: 6,
                      padding: "8px 20px",
                      borderRadius: 6,
                      border: "none",
                      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                      color: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: isPending ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isPending ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <svg
                          width="14"
                          height="14"
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
