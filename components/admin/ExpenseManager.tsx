"use client";

/**
 * ExpenseManager — Modern Restaurant Cost & Outgoings Tracking for Sole What.
 * Manages daily shop outgoings (Ingredients, Utilities, Wages, Packaging, Rent, Misc,
 * plus custom user-defined categories like Fuel, Delivery, Marketing, Repairs).
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

const STANDARD_CATEGORIES: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  ingredients: {
    label: "Ingredients",
    icon: "🍅",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  utilities: {
    label: "Utilities",
    icon: "⚡",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  wages: {
    label: "Wages & Staff",
    icon: "👨‍🍳",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  packaging: {
    label: "Packaging",
    icon: "📦",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
  },
  rent: {
    label: "Rent",
    icon: "🏢",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  maintenance: {
    label: "Maintenance",
    icon: "🔧",
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200",
  },
  misc: {
    label: "Miscellaneous",
    icon: "📌",
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  other: {
    label: "Other Expenses",
    icon: "🏷️",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

/** Format category key into a friendly label and icon (standard or custom) */
function getCategoryInfo(categoryKey: string) {
  const key = (categoryKey || "misc").toLowerCase().trim();
  if (STANDARD_CATEGORIES[key]) {
    return STANDARD_CATEGORIES[key];
  }
  // Custom user-defined category
  const formatted = key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    label: formatted,
    icon: "🏷️",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  };
}

export default function ExpenseManager({
  initialExpenses,
  currencySymbol = "$",
  shopId,
  shopName,
}: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Custom Category State
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  // Form state
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "ingredients" as ExpenseCategory,
    expense_date: todayStr,
    notes: "",
  });

  // Extract all distinct custom categories that have been recorded
  const customCategoriesList = useMemo(() => {
    const standardKeys = new Set(Object.keys(STANDARD_CATEGORIES));
    const set = new Set<string>();
    for (const exp of expenses) {
      const cat = (exp.category || "").trim();
      if (cat && !standardKeys.has(cat.toLowerCase()) && cat !== "other") {
        set.add(cat);
      }
    }
    return Array.from(set);
  }, [expenses]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7); // "YYYY-MM"

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

    // Top category
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
    setIsCustomMode(false);
    setCustomCategoryInput("");
    setFormData({
      title: "",
      amount: "",
      category: "ingredients",
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

    // Determine final category (custom vs standard)
    let finalCategory = formData.category;
    if (isCustomMode) {
      const customTrimmed = customCategoryInput.trim();
      if (!customTrimmed) {
        setFormError("Please enter a custom category name (e.g. Fuel, Delivery, Repairs).");
        return;
      }
      finalCategory = customTrimmed;
    }

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
          id: Date.now(),
          title: formData.title.trim(),
          amount: amt,
          category: finalCategory,
          expense_date: formData.expense_date,
          notes: formData.notes.trim() || null,
          created_at: new Date().toISOString(),
        };
        setExpenses((prev) => [newRecord, ...prev]);
        setShowAddModal(false);
        setIsCustomMode(false);
        setCustomCategoryInput("");
        setFormData({
          title: "",
          amount: "",
          category: "ingredients",
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
          <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <span>💸</span> Expense & Cost Management
          </h1>
          <p className="text-xs text-gray-500">
            Log ingredients, daily supplies, utilities, wages, fuel, repairs, and custom restaurant overheads.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 flex items-center justify-center gap-2 transition-all rounded-lg shadow-sm hover:shadow"
        >
          <span className="text-sm font-bold">＋</span> Record New Expense
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

        {/* Category Tabs (Includes standard + any custom categories) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all whitespace-nowrap rounded-lg ${
              selectedCategory === "all"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {Object.entries(STANDARD_CATEGORIES)
            .filter(([key]) => key !== "other")
            .map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg flex items-center gap-1.5 ${
                  selectedCategory === key
                    ? "bg-red-100 text-red-800 border border-red-200 shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            ))}

          {/* Dynamic custom categories tabs */}
          {customCategoriesList.map((customCat) => {
            const info = getCategoryInfo(customCat);
            const isSelected = selectedCategory.toLowerCase() === customCat.toLowerCase();
            return (
              <button
                key={customCat}
                onClick={() => setSelectedCategory(customCat)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-rose-100 text-rose-800 border border-rose-300 shadow-sm"
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
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50"
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
      {/* Modern Add Expense Modal (Elevated UI with Custom Category)  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden relative my-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/20">
                  💸
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white uppercase">
                    Record New Expense
                  </h3>
                  <p className="text-xs text-red-100 font-medium">
                    Log supplies, bills, wages & custom shop expenses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-sm font-bold transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              
              {/* Expense Title */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                  Expense Description / Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50kg Mozzarella Cheese, Gas Cylinder, Bike Fuel, Staff Tea"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Amount and Date (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                    Amount ({currencySymbol}) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-gray-500 font-mono">
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
                      className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-gray-900 font-mono font-bold focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all shadow-sm"
                    />
                  </div>
                  {/* Quick amount increment pills */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(500)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(1000)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      +1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(5000)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      +5,000
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700">
                      Expense Date *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, expense_date: todayStr })}
                      className="text-[10px] font-bold text-red-600 hover:underline"
                    >
                      Today
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono font-medium focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* Category Selector with Custom Category Support               */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <span>🏷️</span>
                    <span>Category *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(!isCustomMode);
                      if (!isCustomMode) {
                        setCustomCategoryInput("");
                      }
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                  >
                    {isCustomMode ? "← Choose Standard" : "＋ Type Custom Category"}
                  </button>
                </div>

                {!isCustomMode ? (
                  <div>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__custom__") {
                          setIsCustomMode(true);
                          setCustomCategoryInput("");
                        } else {
                          setFormData({ ...formData, category: val as ExpenseCategory });
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all shadow-sm"
                    >
                      <optgroup label="Standard Categories">
                        {Object.entries(STANDARD_CATEGORIES)
                          .filter(([key]) => key !== "other")
                          .map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.icon} {meta.label}
                            </option>
                          ))}
                      </optgroup>

                      {customCategoriesList.length > 0 && (
                        <optgroup label="Saved Custom Categories">
                          {customCategoriesList.map((custom) => (
                            <option key={custom} value={custom}>
                              🏷️ {getCategoryInfo(custom).label}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <option value="__custom__">
                        ➕ + Enter Custom Category...
                      </option>
                    </select>

                    {/* Quick Category Chips for Fast 1-Click Tap */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {["ingredients", "utilities", "wages", "packaging"].map((quickKey) => {
                        const info = STANDARD_CATEGORIES[quickKey];
                        const isSelected = !isCustomMode && formData.category === quickKey;
                        return (
                          <button
                            key={quickKey}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: quickKey as ExpenseCategory })}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                              isSelected
                                ? "bg-red-600 text-white shadow-sm"
                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <span>{info.icon}</span>
                            <span>{info.label}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(true)}
                        className="text-[10px] font-bold px-2 py-1 rounded-md bg-white text-red-600 border border-dashed border-red-300 hover:bg-red-50 transition-colors flex items-center gap-1"
                      >
                        <span>＋</span>
                        <span>Custom</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-red-500/30 rounded-xl p-3 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700">
                        Type Your Custom Category:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(false)}
                        className="text-[10px] text-gray-500 hover:text-gray-800 font-medium"
                      >
                        Cancel Custom
                      </button>
                    </div>
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g. Fuel / Petrol, Delivery Bike Repair, Grocery, Ice, Marketing"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 font-bold placeholder-gray-400 focus:bg-white focus:border-red-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500">
                      💡 Tip: This new category will be saved and available in your filters & reports.
                    </p>
                  </div>
                )}
              </div>

              {/* Notes / Vendor */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                  Notes / Vendor / Invoice # (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Supplier name, receipt / invoice number, cash vs online payment..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none resize-none transition-all shadow-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 transition-all rounded-xl shadow-md shadow-red-500/20 hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isPending ? "Saving..." : "Save Expense"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
