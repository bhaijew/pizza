"use client";

/**
 * ExpenseManager — Clean White Theme for Restaurant Cost & Outgoings Tracking.
 * Manages daily shop outgoings (Ingredients, Utilities, Wages, Packaging, Rent, Misc)
 * with instant financial summaries and integration with Daily Closing.
 */
import { useState, useTransition, useMemo } from "react";
import type { Expense, ExpenseCategory } from "@/types/menu";
import { createExpense, deleteExpense } from "@/lib/admin-actions";

interface ExpenseManagerProps {
  initialExpenses: Expense[];
  currencySymbol?: string;
}

const CATEGORY_META: Record<
  ExpenseCategory,
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
    icon: "📌",
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};

export default function ExpenseManager({
  initialExpenses,
  currencySymbol = "$",
}: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "ingredients" as ExpenseCategory,
    expense_date: todayStr,
    notes: "",
  });

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
      if (exp.expense_date.startsWith(currentMonth)) {
        monthTotal += amt;
      }

      catTotals[exp.category] = (catTotals[exp.category] || 0) + amt;
    }

    // Top category
    let topCat = "None";
    let topCatAmt = 0;
    for (const [cat, amt] of Object.entries(catTotals)) {
      if (amt > topCatAmt) {
        topCatAmt = amt;
        topCat = CATEGORY_META[cat as ExpenseCategory]?.label || cat;
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
      const matchesCat = selectedCategory === "all" || e.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [expenses, selectedCategory, searchQuery]);

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(formData.amount);
    if (!formData.title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setFormError("Please enter a valid amount greater than 0");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("amount", formData.amount);
      fd.append("category", formData.category);
      fd.append("expense_date", formData.expense_date);
      fd.append("notes", formData.notes);

      const res = await createExpense({ error: null, success: false }, fd);
      if (res.error) {
        setFormError(res.error);
      } else {
        const newRecord: Expense = {
          id: Date.now(),
          title: formData.title,
          amount: amt,
          category: formData.category,
          expense_date: formData.expense_date,
          notes: formData.notes || null,
          created_at: new Date().toISOString(),
        };
        setExpenses((prev) => [newRecord, ...prev]);
        setShowAddModal(false);
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
            Log raw materials, cheese/flour batches, gas/electric bills, wages, and restaurant overheads.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 flex items-center justify-center gap-2 transition-colors rounded shadow-sm"
        >
          <span>＋</span> Add New Expense
        </button>
      </div>

      {/* Metric KPI Cards (Clean White) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            Today&apos;s Expenses
          </p>
          <p className="text-2xl font-black text-red-600">
            {currencySymbol}
            {metrics.todayTotal.toFixed(2)}
          </p>
          <span className="text-[11px] text-gray-500">Logged today</span>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            This Month
          </p>
          <p className="text-2xl font-black text-amber-600">
            {currencySymbol}
            {metrics.monthTotal.toFixed(2)}
          </p>
          <span className="text-[11px] text-gray-500">Current monthly burn</span>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            Top Cost Center
          </p>
          <p className="text-xl font-black text-gray-900 truncate">{metrics.topCat}</p>
          <span className="text-[11px] text-gray-500">
            {currencySymbol}
            {metrics.topCatAmt.toFixed(2)} total
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            All-Time Outgoings
          </p>
          <p className="text-2xl font-black text-gray-900">
            {currencySymbol}
            {metrics.allTimeTotal.toFixed(2)}
          </p>
          <span className="text-[11px] text-gray-500">{expenses.length} total entries</span>
        </div>
      </div>

      {/* Filter and Search Bar (Clean White) */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-gray-200 rounded p-3 shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search expense title, notes, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors whitespace-nowrap rounded ${
              selectedCategory === "all"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_META)
            .filter(([key]) => key !== "other")
            .map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap rounded flex items-center gap-1.5 ${
                  selectedCategory === key
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Expenses Table (Clean White) */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl block mb-2">🧾</span>
            <p className="text-gray-900 font-bold text-sm">No expenses recorded</p>
            <p className="text-gray-500 text-xs mt-1">
              Click &quot;Add New Expense&quot; above to log your first restaurant expense.
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
                  const cat = CATEGORY_META[exp.category] || CATEGORY_META.misc;
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {exp.expense_date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {exp.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border ${cat.bg} ${cat.text} ${cat.border}`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                        {exp.notes || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600 text-right text-sm">
                        {currencySymbol}
                        {Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={isPending}
                          title="Delete expense"
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
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

      {/* Add Expense Modal (Clean White) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md p-6 space-y-4 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <span>➕</span> Record New Expense
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 p-2.5 rounded text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50kg Mozzarella Cheese or Gas Cylinder"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Amount ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                  }
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                >
                  {Object.entries(CATEGORY_META)
                    .filter(([key]) => key !== "other")
                    .map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.icon} {meta.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Notes / Vendor (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Receipt number, supplier name, or details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition-colors rounded disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
