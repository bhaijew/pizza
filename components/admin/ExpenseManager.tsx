"use client";

/**
 * ExpenseManager — Modern Enterprise 5px Square UI for Restaurant Cost & Outgoings.
 * Features:
 * - Dedicated Popup Modal with Backdrop Blur
 * - Custom Category creation on-the-fly (persisted & automatically detected)
 * - Real-time Financial Outgoing KPIs (Today, This Month, Top Cost Center, All-Time)
 * - Precision search & category filter pills
 */
import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Expense, ExpenseCategory } from "@/types/menu";
import { createExpense, deleteExpense } from "@/lib/admin-actions";
import {
  Plus,
  X,
  Search,
  Trash2,
  Clock,
  Tag,
  FileText,
  Check,
  Layers,
  Sparkles,
  AlertCircle,
  Receipt,
  Store,
} from "lucide-react";

interface ExpenseManagerProps {
  initialExpenses: Expense[];
  currencySymbol?: string;
  shopId?: number | null;
}

interface CategoryMeta {
  label: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
}

const BUILT_IN_CATEGORIES: Record<string, CategoryMeta> = {
  ingredients: {
    label: "Ingredients & Raw Materials",
    icon: "🍅",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  utilities: {
    label: "Utilities (Gas / Electricity / Water)",
    icon: "⚡",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  wages: {
    label: "Wages & Staff Salary",
    icon: "👨‍🍳",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  packaging: {
    label: "Packaging & Boxes",
    icon: "📦",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
  },
  rent: {
    label: "Shop Rent",
    icon: "🏢",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  maintenance: {
    label: "Repairs & Maintenance",
    icon: "🔧",
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200",
  },
  misc: {
    label: "Miscellaneous",
    icon: "📌",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  other: {
    label: "Other Expenses",
    icon: "📌",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

const CUSTOM_CATEGORY_PALETTES = [
  { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
  { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-800", border: "border-fuchsia-200" },
];

const QUICK_EMOJIS = ["🏷️", "⛽", "📢", "🛵", "🧹", "🥩", "🥤", "💡", "🛡️", "📦"];

function formatCategoryLabel(key: string): string {
  if (BUILT_IN_CATEGORIES[key]) return BUILT_IN_CATEGORIES[key].label;
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ExpenseManager({
  initialExpenses,
  currencySymbol = "Rs.",
  shopId = null,
}: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Custom categories state (stored per shop)
  const [customCategories, setCustomCategories] = useState<{ id: string; label: string; icon: string }[]>([]);
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "ingredients" as string,
    expense_date: todayStr,
    notes: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initialExpenses if updated from server
  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  // Load custom categories from localStorage + extract existing custom categories from expenses
  useEffect(() => {
    const storageKey = `solewhat_custom_expense_cats_${shopId ?? "main"}`;
    let saved: { id: string; label: string; icon: string }[] = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch {
      saved = [];
    }

    // Also scan initialExpenses for any custom categories already in database
    const existingCats = new Set<string>();
    saved.forEach((c) => existingCats.add(c.id.toLowerCase()));

    const fromExpenses: { id: string; label: string; icon: string }[] = [];
    initialExpenses.forEach((e) => {
      const catKey = (e.category || "").trim();
      if (catKey && !BUILT_IN_CATEGORIES[catKey.toLowerCase()] && !existingCats.has(catKey.toLowerCase())) {
        existingCats.add(catKey.toLowerCase());
        fromExpenses.push({
          id: catKey,
          label: formatCategoryLabel(catKey),
          icon: "🏷️",
        });
      }
    });

    const merged = [...saved, ...fromExpenses];
    setCustomCategories(merged);
  }, [initialExpenses, shopId]);

  // Save new custom category
  const handleSaveCustomCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const catId = trimmed.toLowerCase().replace(/\s+/g, "_");
    const exists =
      BUILT_IN_CATEGORIES[catId] ||
      customCategories.some((c) => c.id.toLowerCase() === catId);

    if (exists) {
      setFormData((prev) => ({ ...prev, category: catId }));
      setShowCustomCatInput(false);
      setNewCatName("");
      return;
    }

    const newEntry = {
      id: catId,
      label: trimmed,
      icon: newCatIcon || "🏷️",
    };

    const updated = [...customCategories, newEntry];
    setCustomCategories(updated);
    setFormData((prev) => ({ ...prev, category: catId }));

    try {
      const storageKey = `solewhat_custom_expense_cats_${shopId ?? "main"}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to persist custom category", err);
    }

    setShowCustomCatInput(false);
    setNewCatName("");
  };

  // Helper to get styling and label for any category (built-in or custom)
  const getCategoryInfo = useCallback(
    (catKey: string): CategoryMeta => {
      const lower = (catKey || "").toLowerCase();
      if (BUILT_IN_CATEGORIES[lower]) {
        return BUILT_IN_CATEGORIES[lower];
      }

      const customMatch = customCategories.find((c) => c.id.toLowerCase() === lower);
      const icon = customMatch?.icon || "🏷️";
      const label = customMatch?.label || formatCategoryLabel(catKey);

      // Deterministic palette selection based on string hash
      let hash = 0;
      for (let i = 0; i < catKey.length; i++) hash = catKey.charCodeAt(i) + ((hash << 5) - hash);
      const palette = CUSTOM_CATEGORY_PALETTES[Math.abs(hash) % CUSTOM_CATEGORY_PALETTES.length];

      return {
        label,
        icon,
        bg: palette.bg,
        text: palette.text,
        border: palette.border,
      };
    },
    [customCategories]
  );

  // Keyboard shortcut: Escape closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAddModal) {
        setShowAddModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal]);

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
  }, [expenses, getCategoryInfo]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCat =
        selectedCategory === "all" ||
        (e.category || "").toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const catInfo = getCategoryInfo(e.category);
      const matchesSearch =
        !q ||
        (e.title || "").toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        catInfo.label.toLowerCase().includes(q) ||
        String(e.amount).includes(q);

      return matchesCat && matchesSearch;
    });
  }, [expenses, selectedCategory, searchQuery, getCategoryInfo]);

  // Handle Add Expense Form Submit
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(formData.amount);
    if (!formData.title.trim()) {
      setFormError("Please enter an expense title / description.");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", formData.title.trim());
      fd.append("amount", String(amt));
      fd.append("category", formData.category);
      fd.append("expense_date", formData.expense_date);
      fd.append("notes", formData.notes.trim());

      const res = await createExpense({ error: null, success: false }, fd);
      if (res.error) {
        setFormError(res.error);
      } else {
        const newRecord: Expense = res.expense || {
          id: Date.now(),
          title: formData.title.trim(),
          amount: amt,
          category: formData.category,
          expense_date: formData.expense_date,
          notes: formData.notes.trim() || null,
          created_at: new Date().toISOString(),
          shop_id: shopId,
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
    if (!confirm("Are you sure you want to permanently delete this expense record?")) return;

    startTransition(async () => {
      const res = await deleteExpense(id);
      if (res.error) {
        alert("Failed to delete: " + res.error);
      } else {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
    });
  };

  // All available categories for filter tabs (Built-in + Custom)
  const allFilterCategories = useMemo(() => {
    const list: { key: string; label: string; icon: string }[] = [];

    // Built-in
    Object.entries(BUILT_IN_CATEGORIES)
      .filter(([key]) => key !== "other")
      .forEach(([key, meta]) => {
        list.push({ key, label: meta.label, icon: meta.icon });
      });

    // Custom
    customCategories.forEach((c) => {
      if (!list.some((item) => item.key.toLowerCase() === c.id.toLowerCase())) {
        list.push({ key: c.id, label: c.label, icon: c.icon });
      }
    });

    return list;
  }, [customCategories]);

  return (
    <div className="space-y-6">
      {/* ─── TOP HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-red-100 text-red-600 rounded-[5px] inline-flex">
              <Receipt size={18} />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
              Expense &amp; Cost Management
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Log raw materials, cheese &amp; flour batches, utility bills, staff wages, and daily shop outgoings.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setShowAddModal(true);
          }}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 flex items-center justify-center gap-2 transition-all rounded-[5px] shadow-sm hover:shadow cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Expense</span>
        </button>
      </div>

      {/* ─── KPI METRIC CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-[5px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
              Today&apos;s Expenses
            </p>
            <span className="text-xs">📅</span>
          </div>
          <p className="text-2xl font-black text-red-600 font-mono">
            {currencySymbol} {metrics.todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500">Current open shift</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-[5px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
              This Month
            </p>
            <span className="text-xs">⚡</span>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {currencySymbol} {metrics.monthTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500">Monthly operational cost</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-[5px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
              Top Cost Center
            </p>
            <span className="text-xs">🏆</span>
          </div>
          <p className="text-lg font-black text-slate-900 truncate" title={metrics.topCat}>
            {metrics.topCat}
          </p>
          <span className="text-[11px] text-slate-500 font-mono">
            {currencySymbol} {metrics.topCatAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-[5px] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
              Total Outgoings
            </p>
            <span className="text-xs">📊</span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {currencySymbol} {metrics.allTimeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500">{expenses.length} recorded entries</span>
        </div>
      </div>

      {/* ─── SEARCH & CATEGORY FILTER TABS ───────────────────── */}
      <div className="bg-white border border-slate-200 rounded-[5px] p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by title, category, vendor, amount, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-[5px] pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setShowAddModal(true);
            }}
            className="sm:hidden bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase px-3 py-2 rounded-[5px] flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-xs font-extrabold uppercase transition-all whitespace-nowrap rounded-[5px] cursor-pointer ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Categories ({expenses.length})
          </button>

          {allFilterCategories.map((cat) => {
            const count = expenses.filter(
              (e) => (e.category || "").toLowerCase() === cat.key.toLowerCase()
            ).length;
            const isSelected = selectedCategory.toLowerCase() === cat.key.toLowerCase();

            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-[5px] flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── EXPENSES TABLE ──────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-[5px] overflow-hidden shadow-xs">
        {filteredExpenses.length === 0 ? (
          <div className="p-14 text-center">
            <span className="text-4xl block mb-3">🧾</span>
            <p className="text-slate-900 font-extrabold text-sm">
              {searchQuery || selectedCategory !== "all"
                ? "No matching expenses found"
                : "No expenses recorded yet"}
            </p>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "all"
                ? "Try clearing your search query or selecting another category filter."
                : "Click \"Add New Expense\" to log restaurant grocery, flour, electricity, or staff wages."}
            </p>
            <button
              onClick={() => {
                if (searchQuery || selectedCategory !== "all") {
                  setSearchQuery("");
                  setSelectedCategory("all");
                } else {
                  setShowAddModal(true);
                }
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-[5px] hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {searchQuery || selectedCategory !== "all" ? "Reset Filters" : "+ Record First Expense"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-black">Date</th>
                  <th className="py-3 px-4 font-black">Expense Title</th>
                  <th className="py-3 px-4 font-black">Category</th>
                  <th className="py-3 px-4 font-black">Notes / Vendor / Bill</th>
                  <th className="py-3 px-4 font-black text-right">Amount</th>
                  <th className="py-3 px-4 font-black text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const cat = getCategoryInfo(exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <span>{exp.expense_date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {exp.title}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-[5px] border ${cat.bg} ${cat.text} ${cat.border}`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {exp.notes ? (
                          <span className="flex items-center gap-1">
                            <FileText size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{exp.notes}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-red-600 text-right text-sm whitespace-nowrap">
                        {currencySymbol} {Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={isPending}
                          title="Delete expense entry"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[4px] p-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
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

      {/* ─── DEDICATED EXPENSE POPUP MODAL (PORTAL) ───────────── */}
      {mounted && showAddModal && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-[5px] w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-red-600 text-white rounded-[5px]">
                  <Receipt size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Record New Expense
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Add restaurant outgoings, supplies, bills or staff costs
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-[4px] p-1.5 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-[5px] flex items-center gap-2 text-xs text-red-700 font-bold">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Expense Description / Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 50kg Mozzarella Cheese, Flour bags, Electricity Bill"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-[5px] px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all"
                />
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    Amount ({currencySymbol}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 font-mono">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-[5px] pl-10 pr-3 py-2 text-xs font-mono font-black text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Expense Date *
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, expense_date: todayStr }))}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border cursor-pointer ${
                          formData.expense_date === todayStr
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, expense_date: yesterdayStr }))}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border cursor-pointer ${
                          formData.expense_date === yesterdayStr
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-[5px] px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Category Selector with Custom Category Creator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Expense Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomCatInput((v) => !v)}
                    className="text-[11px] font-extrabold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>{showCustomCatInput ? "Hide Custom Category" : "+ Add Custom Category"}</span>
                  </button>
                </div>

                {/* Inline Custom Category Creator */}
                {showCustomCatInput && (
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-[5px] space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                    <p className="text-[11px] font-black text-red-800 uppercase tracking-wider">
                      Create Your Own Custom Category:
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        className="bg-white border border-red-300 rounded-[4px] px-2 py-1.5 text-sm focus:outline-none cursor-pointer"
                        title="Choose Icon"
                      >
                        {QUICK_EMOJIS.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="e.g. Generator Fuel, Marketing, Delivery Petrol"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveCustomCategory();
                          }
                        }}
                        className="flex-1 bg-white border border-red-300 rounded-[4px] px-2.5 py-1.5 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={handleSaveCustomCategory}
                        disabled={!newCatName.trim()}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black rounded-[4px] cursor-pointer transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Options Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-[5px] bg-slate-50/50">
                  {/* Built-in Categories */}
                  {Object.entries(BUILT_IN_CATEGORIES)
                    .filter(([key]) => key !== "other")
                    .map(([key, meta]) => {
                      const isSelected = formData.category.toLowerCase() === key.toLowerCase();
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: key })}
                          className={`p-2 rounded-[4px] border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white border-red-600 shadow-xs ring-1 ring-red-600"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <span className="text-sm shrink-0">{meta.icon}</span>
                          <span className={`text-[11px] font-bold truncate ${isSelected ? "text-red-700 font-black" : ""}`}>
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}

                  {/* Custom Categories Added by Admin */}
                  {customCategories.map((cat) => {
                    const isSelected = formData.category.toLowerCase() === cat.id.toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-2 rounded-[4px] border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white border-red-600 shadow-xs ring-1 ring-red-600"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <span className="text-sm shrink-0">{cat.icon}</span>
                        <span className={`text-[11px] font-bold truncate ${isSelected ? "text-red-700 font-black" : ""}`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes / Vendor / Bill # */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Notes / Vendor / Bill # (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Receipt number, supplier name (e.g. Metro / Al-Madina Traders), or extra details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-[5px] px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none resize-none transition-all"
                />
              </div>

              {/* Live Preview Strip */}
              {Number(formData.amount) > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-[5px] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold">Selected:</span>
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black border ${getCategoryInfo(formData.category).bg} ${getCategoryInfo(formData.category).text} ${getCategoryInfo(formData.category).border}`}
                    >
                      {getCategoryInfo(formData.category).icon} {getCategoryInfo(formData.category).label}
                    </span>
                  </div>

                  <div className="font-mono font-black text-red-600 text-sm">
                    {currencySymbol} {Number(formData.amount).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-[5px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 transition-all rounded-[5px] shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
                >
                  {isPending ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Expense</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
