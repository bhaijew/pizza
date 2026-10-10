"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Product,
  Category,
  RawIngredient,
  ProductRecipeItem,
  StockAudit,
  StockAuditItem,
  IngredientWastageLog,
} from "@/types/menu";
import {
  updateProductInventory,
  quickRestockProduct,
} from "@/lib/admin-actions";
import {
  saveRawIngredient,
  deleteRawIngredient,
  quickRestockIngredient,
  getProductRecipes,
  saveProductRecipe,
  logIngredientWastage,
  calculateKitchenAuditData,
  saveStockAudit,
} from "@/lib/recipe-actions";
import {
  Boxes,
  Sliders,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertTriangle,
  Clock,
  Layers,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FileText,
  Pizza,
} from "@/components/admin/AdminIcons";

interface InventoryManagerProps {
  products: Product[];
  categories: Category[];
  initialIngredients?: RawIngredient[];
  isTableMissing?: boolean;
  initialWastageLogs?: IngredientWastageLog[];
  initialAudits?: StockAudit[];
  currencySymbol?: string;
  shopName?: string;
}

type TabType = "raw_materials" | "recipes" | "audit" | "wastage" | "finished_goods";
type ProductFilter = "all" | "low" | "out" | "tracked";

export default function InventoryManager({
  products: initialProducts = [],
  categories = [],
  initialIngredients = [],
  isTableMissing = false,
  initialWastageLogs = [],
  initialAudits = [],
  currencySymbol = "Rs.",
  shopName = "Store",
}: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("raw_materials");
  const [isPending, startTransition] = useTransition();
  const [copiedMigration, setCopiedMigration] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // TAB 1: RAW INGREDIENTS (KACHA MAAL) STATE
  // ─────────────────────────────────────────────────────────────
  const [ingredients, setIngredients] = useState<RawIngredient[]>(initialIngredients);
  const [rawSearch, setRawSearch] = useState("");
  const [rawCategoryFilter, setRawCategoryFilter] = useState("all");

  // Add / Edit Raw Material Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RawIngredient | null>(null);
  const [ingFormName, setIngFormName] = useState("");
  const [ingFormCategory, setIngFormCategory] = useState("meat");
  const [ingFormUnit, setIngFormUnit] = useState("kg");
  const [ingFormStock, setIngFormStock] = useState<number>(0);
  const [ingFormThreshold, setIngFormThreshold] = useState<number>(1);
  const [ingFormCost, setIngFormCost] = useState<number>(0);

  // Quick Restock Modal
  const [restockModalItem, setRestockModalItem] = useState<RawIngredient | null>(null);
  const [restockAddAmount, setRestockAddAmount] = useState<number>(1);
  const [restockNote, setRestockNote] = useState("");

  const handleOpenAddModal = (item?: RawIngredient) => {
    if (item) {
      setEditingIngredient(item);
      setIngFormName(item.name);
      setIngFormCategory(item.category);
      setIngFormUnit(item.unit);
      setIngFormStock(item.current_stock);
      setIngFormThreshold(item.low_stock_threshold);
      setIngFormCost(item.cost_per_unit);
    } else {
      setEditingIngredient(null);
      setIngFormName("");
      setIngFormCategory("meat");
      setIngFormUnit("kg");
      setIngFormStock(0);
      setIngFormThreshold(1);
      setIngFormCost(0);
    }
    setShowAddModal(true);
  };

  const handleSaveIngredient = () => {
    if (!ingFormName.trim()) {
      showToast("Please enter an ingredient name", "error");
      return;
    }
    startTransition(async () => {
      const res = await saveRawIngredient({
        id: editingIngredient?.id,
        name: ingFormName,
        category: ingFormCategory,
        unit: ingFormUnit,
        current_stock: ingFormStock,
        low_stock_threshold: ingFormThreshold,
        cost_per_unit: ingFormCost,
      });

      if (res.success && res.data) {
        if (editingIngredient) {
          setIngredients((prev) => prev.map((x) => (x.id === res.data!.id ? res.data! : x)));
          showToast(`Updated "${res.data.name}" successfully!`);
        } else {
          setIngredients((prev) => [res.data!, ...prev]);
          showToast(`Added "${res.data.name}" to raw inventory!`);
        }
        setShowAddModal(false);
      } else {
        showToast(res.error || "Failed to save ingredient", "error");
      }
    });
  };

  const handleDeleteIngredient = (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteRawIngredient(id);
      if (res.success) {
        setIngredients((prev) => prev.filter((x) => x.id !== id));
        showToast(`Deleted "${name}"`);
      } else {
        showToast(res.error || "Failed to delete", "error");
      }
    });
  };

  const handleQuickRestockRaw = () => {
    if (!restockModalItem) return;
    startTransition(async () => {
      const res = await quickRestockIngredient(
        restockModalItem.id,
        restockAddAmount,
        restockNote || `Restocked ${restockAddAmount} ${restockModalItem.unit}`
      );
      if (res.success && res.newStock !== undefined) {
        setIngredients((prev) =>
          prev.map((x) =>
            x.id === restockModalItem.id ? { ...x, current_stock: res.newStock! } : x
          )
        );
        showToast(
          `Added +${restockAddAmount} ${restockModalItem.unit} to ${restockModalItem.name}! New stock: ${res.newStock} ${restockModalItem.unit}`
        );
        setRestockModalItem(null);
      } else {
        showToast(res.error || "Restock failed", "error");
      }
    });
  };

  const filteredIngredients = ingredients.filter((item) => {
    const matchSearch =
      !rawSearch.trim() || item.name.toLowerCase().includes(rawSearch.toLowerCase());
    const matchCat = rawCategoryFilter === "all" || item.category === rawCategoryFilter;
    return matchSearch && matchCat;
  });

  const totalRawValue = ingredients.reduce(
    (sum, ing) => sum + (Number(ing.current_stock) || 0) * (Number(ing.cost_per_unit) || 0),
    0
  );
  const lowRawCount = ingredients.filter(
    (ing) => Number(ing.current_stock) <= Number(ing.low_stock_threshold)
  ).length;

  // ─────────────────────────────────────────────────────────────
  // TAB 2: RECIPE BUILDER (BOM) STATE
  // ─────────────────────────────────────────────────────────────
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    initialProducts[0] ? Number(initialProducts[0].id) : null
  );
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [recipeLines, setRecipeLines] = useState<
    { ingredient_id: number; quantity_required: number; notes: string }[]
  >([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const currentProduct = initialProducts.find((p) => Number(p.id) === selectedProductId);

  // Load existing recipe when product or variation changes
  useEffect(() => {
    if (!selectedProductId) return;
    let isMounted = true;
    setLoadingRecipe(true);
    getProductRecipes(selectedProductId).then((res) => {
      if (!isMounted) return;
      setLoadingRecipe(false);
      if (res.success && res.data) {
        const currentVarLower = selectedVariation.toLowerCase().trim();
        const matched = res.data.filter((r) => {
          if (!r.variation_name) return !selectedVariation;
          return r.variation_name.toLowerCase().trim() === currentVarLower;
        });

        if (matched.length > 0) {
          setRecipeLines(
            matched.map((m) => ({
              ingredient_id: m.ingredient_id,
              quantity_required: Number(m.quantity_required),
              notes: m.notes || "",
            }))
          );
        } else {
          setRecipeLines([]);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedProductId, selectedVariation]);

  const handleAddRecipeLine = () => {
    if (ingredients.length === 0) {
      showToast("Please add raw materials first in Tab 1", "error");
      return;
    }
    setRecipeLines((prev) => [
      ...prev,
      {
        ingredient_id: ingredients[0].id,
        quantity_required: 0.5,
        notes: "",
      },
    ]);
  };

  const handleRemoveRecipeLine = (index: number) => {
    setRecipeLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRecipeLine = (
    index: number,
    field: "ingredient_id" | "quantity_required" | "notes",
    val: any
  ) => {
    setRecipeLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: val } : line))
    );
  };

  const handleSaveRecipeFormula = () => {
    if (!selectedProductId) return;
    startTransition(async () => {
      const res = await saveProductRecipe(
        selectedProductId,
        selectedVariation || null,
        recipeLines
      );
      if (res.success) {
        showToast(
          `Recipe saved for "${currentProduct?.name}${
            selectedVariation ? ` (${selectedVariation})` : ""
          }"!`
        );
      } else {
        showToast(res.error || "Failed to save recipe", "error");
      }
    });
  };

  // Auto-scale recipe from Small to Big, Large, and Extra Large!
  const handleAutoScaleToAllSizes = () => {
    if (!selectedProductId || recipeLines.length === 0) {
      showToast("Please add at least 1 ingredient line first", "error");
      return;
    }
    const currentVars = currentProduct?.variations || [];
    if (currentVars.length === 0) {
      showToast("This product has no size variations set. Add variations in Products first.", "error");
      return;
    }

    startTransition(async () => {
      let countSaved = 0;
      for (const v of currentVars) {
        const vName = v.name.toLowerCase();
        let multiplier = 1.0;
        if (vName.includes("small")) multiplier = 1.0;
        else if (vName.includes("big") || vName.includes("medium") || vName.includes("regular")) multiplier = 1.4;
        else if (vName.includes("large") && !vName.includes("extra")) multiplier = 1.8;
        else if (vName.includes("extra") || vName.includes("xl") || vName.includes("family")) multiplier = 2.4;
        else multiplier = 1.3;

        const scaledLines = recipeLines.map((line) => {
          const ing = ingredients.find((x) => x.id === line.ingredient_id);
          const isPcs = ing?.unit === "pcs";
          const newQty = isPcs ? line.quantity_required : Number((line.quantity_required * multiplier).toFixed(3));
          return {
            ingredient_id: line.ingredient_id,
            quantity_required: newQty,
            notes: line.notes,
          };
        });

        await saveProductRecipe(selectedProductId, v.name, scaledLines);
        countSaved++;
      }
      showToast(`Auto-scaled & saved recipes for all ${countSaved} sizes (Small, Big, Large, XL)!`);
    });
  };

  const handleApplyPizzaTemplate = () => {
    if (ingredients.length === 0) {
      showToast("Please add raw materials first in Tab 1", "error");
      return;
    }
    const meatIng = ingredients.find((x) => x.category === "meat" || x.name.toLowerCase().includes("chicken") || x.name.toLowerCase().includes("meat") || x.name.toLowerCase().includes("beef"));
    const cheeseIng = ingredients.find((x) => x.category === "dairy" || x.name.toLowerCase().includes("cheese"));
    const doughIng = ingredients.find((x) => x.category === "bakery" || x.name.toLowerCase().includes("dough"));
    const sauceIng = ingredients.find((x) => x.category === "sauces" || x.name.toLowerCase().includes("sauce"));
    const boxIng = ingredients.find((x) => x.category === "packaging" || x.name.toLowerCase().includes("box"));

    const lines: { ingredient_id: number; quantity_required: number; notes: string }[] = [];
    if (meatIng) lines.push({ ingredient_id: meatIng.id, quantity_required: 0.5, notes: "Meat (Half kg)" });
    if (cheeseIng) lines.push({ ingredient_id: cheeseIng.id, quantity_required: 0.1, notes: "Cheese (100g)" });
    if (doughIng) lines.push({ ingredient_id: doughIng.id, quantity_required: 1, notes: "Pizza Dough Base" });
    if (sauceIng) lines.push({ ingredient_id: sauceIng.id, quantity_required: 0.05, notes: "Pizza Sauce" });
    if (boxIng) lines.push({ ingredient_id: boxIng.id, quantity_required: 1, notes: "Pizza Box" });

    if (lines.length === 0) {
      lines.push({ ingredient_id: ingredients[0].id, quantity_required: 0.5, notes: "" });
    }
    setRecipeLines(lines);
    showToast("Loaded Standard Pizza Recipe Template!");
  };

  const handleApplyBurgerTemplate = () => {
    if (ingredients.length === 0) {
      showToast("Please add raw materials first in Tab 1", "error");
      return;
    }
    const meatIng = ingredients.find((x) => x.category === "meat" || x.name.toLowerCase().includes("patty") || x.name.toLowerCase().includes("chicken") || x.name.toLowerCase().includes("beef"));
    const bunIng = ingredients.find((x) => x.category === "bakery" || x.name.toLowerCase().includes("bun"));
    const cheeseIng = ingredients.find((x) => x.category === "dairy" || x.name.toLowerCase().includes("cheese"));
    const sauceIng = ingredients.find((x) => x.category === "sauces" || x.name.toLowerCase().includes("sauce") || x.name.toLowerCase().includes("mayo"));

    const lines: { ingredient_id: number; quantity_required: number; notes: string }[] = [];
    if (meatIng) lines.push({ ingredient_id: meatIng.id, quantity_required: 0.15, notes: "Patty Meat (150g)" });
    if (bunIng) lines.push({ ingredient_id: bunIng.id, quantity_required: 1, notes: "Burger Bun (1 pcs)" });
    if (cheeseIng) lines.push({ ingredient_id: cheeseIng.id, quantity_required: 0.03, notes: "Cheese Slice" });
    if (sauceIng) lines.push({ ingredient_id: sauceIng.id, quantity_required: 0.02, notes: "Sauce / Mayo" });

    if (lines.length === 0) {
      lines.push({ ingredient_id: ingredients[0].id, quantity_required: 0.15, notes: "" });
    }
    setRecipeLines(lines);
    showToast("Loaded Standard Burger Recipe Template!");
  };

  // Recipe cost calculation
  const recipeCost = recipeLines.reduce((acc, line) => {
    const ing = ingredients.find((x) => x.id === line.ingredient_id);
    if (!ing) return acc;
    return acc + Number(line.quantity_required) * (Number(ing.cost_per_unit) || 0);
  }, 0);

  let productPrice = Number(currentProduct?.price) || 0;
  if (selectedVariation && currentProduct?.variations) {
    const varObj = currentProduct.variations.find(
      (v) => v.name.toLowerCase() === selectedVariation.toLowerCase()
    );
    if (varObj) productPrice = Number(varObj.price) || productPrice;
  }
  const grossProfit = productPrice - recipeCost;
  const foodCostPercent = productPrice > 0 ? (recipeCost / productPrice) * 100 : 0;

  // ─────────────────────────────────────────────────────────────
  // TAB 3: KITCHEN VARIANCE & THEFT AUDIT STATE (THE USER'S FEATURE!)
  // ─────────────────────────────────────────────────────────────
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const [auditStart, setAuditStart] = useState(firstOfMonth);
  const [auditEnd, setAuditEnd] = useState(todayStr);
  const [auditTitle, setAuditTitle] = useState(
    `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()} Kitchen Audit`
  );
  const [auditorName, setAuditorName] = useState("Store Manager");
  const [auditNotes, setAuditNotes] = useState("");
  const [auditItems, setAuditItems] = useState<StockAuditItem[]>([]);
  const [auditOrdersCount, setAuditOrdersCount] = useState(0);
  const [auditTheoreticalCost, setAuditTheoreticalCost] = useState(0);
  const [auditAuditsHistory, setAuditAuditsHistory] = useState<StockAudit[]>(initialAudits);
  const [calculatingAudit, setCalculatingAudit] = useState(false);

  const handleRunAuditCalculation = () => {
    setCalculatingAudit(true);
    calculateKitchenAuditData(`${auditStart}T00:00:00.000Z`, `${auditEnd}T23:59:59.999Z`).then(
      (res) => {
        setCalculatingAudit(false);
        if (res.success) {
          setAuditItems(res.items);
          setAuditOrdersCount(res.ordersCount);
          setAuditTheoreticalCost(res.totalTheoreticalUsedCost);
          showToast(`Audited ${res.ordersCount} completed orders in selected period!`);
        } else {
          showToast(res.error || "Failed to calculate audit", "error");
        }
      }
    );
  };

  const handleUpdateAuditActualCount = (ingredientId: number, actualCount: number) => {
    setAuditItems((prev) =>
      prev.map((item) => {
        if (item.ingredient_id !== ingredientId) return item;
        const variance = Number((actualCount - item.expected_stock).toFixed(3));
        const lossAmount =
          variance < 0 ? Math.abs(variance) * (Number(item.cost_per_unit) || 0) : 0;
        return {
          ...item,
          actual_counted: actualCount,
          variance,
          loss_amount: Number(lossAmount.toFixed(2)),
        };
      })
    );
  };

  const totalAuditLoss = auditItems.reduce((acc, it) => acc + (it.loss_amount || 0), 0);

  const handleFinalizeAudit = () => {
    if (auditItems.length === 0) {
      showToast("Calculate audit data first", "error");
      return;
    }
    if (!confirm(`Finalize and record this audit? Total variance loss: ${currencySymbol} ${totalAuditLoss.toFixed(2)}`)) {
      return;
    }

    startTransition(async () => {
      const res = await saveStockAudit({
        audit_title: auditTitle,
        period_start: auditStart,
        period_end: auditEnd,
        audited_by: auditorName,
        items_data: auditItems,
        total_loss_amount: Number(totalAuditLoss.toFixed(2)),
        notes: auditNotes,
      });

      if (res.success && res.data) {
        setAuditAuditsHistory((prev) => [res.data!, ...prev]);
        setIngredients((prev) =>
          prev.map((ing) => {
            const found = auditItems.find((x) => x.ingredient_id === ing.id);
            return found ? { ...ing, current_stock: found.actual_counted } : ing;
          })
        );
        showToast("Audit saved and inventory levels synchronized!");
      } else {
        showToast(res.error || "Failed to save audit", "error");
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  // TAB 4: KITCHEN WASTAGE LOG (BURNING / EXPIRY / DROPPING)
  // ─────────────────────────────────────────────────────────────
  const [wastageLogs, setWastageLogs] = useState<IngredientWastageLog[]>(initialWastageLogs);
  const [wasteIngId, setWasteIngId] = useState<number>(
    ingredients[0] ? ingredients[0].id : 0
  );
  const [wasteQty, setWasteQty] = useState<number>(0.5);
  const [wasteReason, setWasteReason] = useState("Burned in pizza oven");
  const [wasteChef, setWasteChef] = useState("Chef");

  const handleLogWaste = () => {
    if (!wasteIngId || wasteQty <= 0) {
      showToast("Please enter a valid quantity", "error");
      return;
    }
    startTransition(async () => {
      const res = await logIngredientWastage(wasteIngId, wasteQty, wasteReason, wasteChef);
      if (res.success) {
        const ing = ingredients.find((x) => x.id === wasteIngId);
        showToast(`Logged ${wasteQty} ${ing?.unit || "kg"} wastage`);
        setIngredients((prev) =>
          prev.map((x) =>
            x.id === wasteIngId
              ? { ...x, current_stock: Math.max(0, Number((x.current_stock - wasteQty).toFixed(3))) }
              : x
          )
        );
        setWastageLogs((prev) => [
          {
            id: Date.now(),
            ingredient_id: wasteIngId,
            quantity_wasted: wasteQty,
            reason: wasteReason,
            reported_by: wasteChef,
            cost_loss: (ing?.cost_per_unit || 0) * wasteQty,
            created_at: new Date().toISOString(),
            ingredient: ing,
          },
          ...prev,
        ]);
        setWasteQty(0.5);
      } else {
        showToast(res.error || "Failed to log wastage", "error");
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  // TAB 5: FINISHED PRODUCTS INVENTORY (LEGACY RETAIL GOODS)
  // ─────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [prodSearch, setProdSearch] = useState("");
  const [prodCatFilter, setProdCatFilter] = useState("all");
  const [prodStockFilter, setProdStockFilter] = useState<ProductFilter>("all");
  const [editingProdId, setEditingProdId] = useState<number | string | null>(null);
  const [editProdStock, setEditProdStock] = useState<number>(0);
  const [editProdThreshold, setEditProdThreshold] = useState<number>(5);
  const [editProdTrack, setEditProdTrack] = useState<boolean>(true);

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !prodSearch.trim() ||
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(prodSearch.toLowerCase()));
    const matchCat = prodCatFilter === "all" || String(p.category_id) === prodCatFilter;
    let matchFilter = true;
    const stock = p.stock_quantity ?? 0;
    const thresh = p.low_stock_threshold ?? 5;
    if (prodStockFilter === "low") matchFilter = !!p.track_inventory && stock > 0 && stock <= thresh;
    else if (prodStockFilter === "out") matchFilter = !!p.track_inventory && stock <= 0;
    else if (prodStockFilter === "tracked") matchFilter = !!p.track_inventory;
    return matchSearch && matchCat && matchFilter;
  });

  const handleQuickAddProd = (productId: number | string, qty: number) => {
    startTransition(async () => {
      const res = await quickRestockProduct(Number(productId), qty);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stock_quantity: (p.stock_quantity ?? 0) + qty,
                  track_inventory: true,
                  is_available: true,
                }
              : p
          )
        );
        showToast(`Added +${qty} units to product!`);
      } else {
        showToast(res.error || "Failed to restock product", "error");
      }
    });
  };

  const handleSaveEditProd = (productId: number | string) => {
    startTransition(async () => {
      const res = await updateProductInventory(
        Number(productId),
        editProdStock,
        editProdTrack,
        editProdThreshold
      );
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stock_quantity: editProdStock,
                  track_inventory: editProdTrack,
                  low_stock_threshold: editProdThreshold,
                }
              : p
          )
        );
        setEditingProdId(null);
        showToast("Product stock settings saved!");
      } else {
        showToast(res.error || "Failed to update product stock", "error");
      }
    });
  };

  const copyMigrationCode = () => {
    const sqlText = `-- Migration 014: Recipe & Raw Material Inventory
-- File: supabase/migrations/014_recipe_inventory_and_audit.sql
-- Copy and run in Supabase Dashboard SQL Editor`;
    navigator.clipboard.writeText(sqlText);
    setCopiedMigration(true);
    showToast("Copied Migration 014 info to clipboard!");
    setTimeout(() => setCopiedMigration(false), 3000);
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto", color: "#0f172a" }}>
      {/* Toast Alert */}
      {statusMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: statusMessage.type === "success" ? "#065f46" : "#991b1b",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {statusMessage.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Migration Notice Banner if table missing */}
      {isTableMissing && (
        <div
          style={{
            background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
            border: "2px solid #f59e0b",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b45309",
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#92400e" }}>
                Phase 1 Database Setup Required
              </h4>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#78350f" }}>
                Run <strong>Migration 014</strong> in your Supabase Dashboard SQL Editor to activate
                Recipe Tracking, BOM formulas, and Chef Wastage Audits.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={copyMigrationCode}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 6,
                background: "#d97706",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {copiedMigration ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedMigration ? "Copied!" : "Copy Migration 014 SQL"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0f172a" }}>
              Kitchen Inventory & Recipe Control
            </h1>
            <span
              style={{
                background: "#e0e7ff",
                color: "#4338ca",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.5,
              }}
            >
              PHASE 1 ACTIVE
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Track raw materials (Meat, Cheese, Sauces, Boxes), product recipes (BOM), and chef
            theft/wastage variance for <strong>{shopName}</strong>.
          </p>
        </div>

        {activeTab === "raw_materials" && (
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 6,
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
            }}
          >
            <Plus size={16} />
            <span>+ Add Raw Material (Kacha Maal)</span>
          </button>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e2e8f0",
          gap: 6,
          marginBottom: 24,
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("raw_materials")}
          style={{
            padding: "12px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "raw_materials" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "raw_materials" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "raw_materials" ? 800 : 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: -2,
          }}
        >
          <Boxes size={18} />
          <span>Raw Materials ({ingredients.length})</span>
          {lowRawCount > 0 && (
            <span
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                padding: "2px 7px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                border: "1px solid #fecaca",
              }}
            >
              {lowRawCount} Low
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("recipes")}
          style={{
            padding: "12px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "recipes" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "recipes" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "recipes" ? 800 : 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: -2,
          }}
        >
          <Pizza size={18} />
          <span>Product Recipes (BOM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          style={{
            padding: "12px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "audit" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "audit" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "audit" ? 800 : 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: -2,
          }}
        >
          <Sliders size={18} />
          <span>Monthly Stock Audit & Theft Check</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("wastage")}
          style={{
            padding: "12px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "wastage" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "wastage" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "wastage" ? 800 : 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: -2,
          }}
        >
          <Trash2 size={18} />
          <span>Kitchen Wastage Log ({wastageLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("finished_goods")}
          style={{
            padding: "12px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "finished_goods" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "finished_goods" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "finished_goods" ? 800 : 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: -2,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Ready Products Stock</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: RAW INGREDIENTS LIST & RESTOCK */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "raw_materials" && (
        <div>
          {/* KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                padding: "18px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                RAW MATERIALS TRACKED
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                {ingredients.length}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Meat, Dairy, Sauces, Boxes, etc.
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "18px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                LOW STOCK ALERTS
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: lowRawCount > 0 ? "#dc2626" : "#059669",
                  marginTop: 4,
                }}
              >
                {lowRawCount}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Below kitchen safety limit
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "18px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                ESTIMATED RAW INVENTORY VALUE
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                {currencySymbol} {totalRawValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Current stock × Purchase cost
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "18px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                KITCHEN AUTO-DEDUCTION
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 8 }}>
                ACTIVE ON EVERY ORDER
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Meat & boxes auto-deducted on sale
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div
            style={{
              background: "#ffffff",
              padding: "16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              marginBottom: 20,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 260 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search raw material (e.g. Chicken Meat, Cheese, Box)..."
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px 0 34px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <Search
                  size={15}
                  color="#94a3b8"
                  style={{ position: "absolute", left: 11, top: 12 }}
                />
              </div>

              <select
                value={rawCategoryFilter}
                onChange={(e) => setRawCategoryFilter(e.target.value)}
                style={{
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  background: "#ffffff",
                  color: "#334155",
                  outline: "none",
                }}
              >
                <option value="all">All Categories</option>
                <option value="meat">Meat & Poultry</option>
                <option value="dairy">Dairy & Cheese</option>
                <option value="bakery">Bakery & Dough</option>
                <option value="sauces">Sauces & Oils</option>
                <option value="packaging">Boxes & Packaging</option>
                <option value="vegetables">Vegetables</option>
                <option value="spices">Spices & Seasoning</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Raw Materials Table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      RAW INGREDIENT
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      CATEGORY
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      CURRENT STOCK
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      STATUS
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      LOW THRESHOLD
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      COST / UNIT
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      STOCK VALUE
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800 }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                        No raw materials found. Click "+ Add Raw Material" above to add meat, cheese,
                        or packaging boxes.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const stock = Number(ing.current_stock) || 0;
                      const thresh = Number(ing.low_stock_threshold) || 1;
                      const isLow = stock <= thresh;
                      const isOut = stock <= 0;
                      const value = stock * (Number(ing.cost_per_unit) || 0);

                      return (
                        <tr
                          key={ing.id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: isOut ? "#fff5f5" : isLow ? "#fffbf0" : "transparent",
                          }}
                        >
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 800, color: "#0f172a" }}>{ing.name}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              style={{
                                textTransform: "capitalize",
                                background: "#f1f5f9",
                                padding: "3px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#475569",
                              }}
                            >
                              {ing.category}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
                              {stock.toFixed(3)}
                            </span>{" "}
                            <span style={{ color: "#64748b", fontWeight: 700 }}>{ing.unit}</span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {isOut ? (
                              <span
                                style={{
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  padding: "3px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              >
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span
                                style={{
                                  background: "#fff7ed",
                                  color: "#ea580c",
                                  border: "1px solid #fed7aa",
                                  padding: "3px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              >
                                Low Stock
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: "#ecfdf5",
                                  color: "#059669",
                                  border: "1px solid #a7f3d0",
                                  padding: "3px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              >
                                In Stock
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#64748b" }}>
                            ≤ {thresh} {ing.unit}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>
                            {currencySymbol} {Number(ing.cost_per_unit).toFixed(2)} / {ing.unit}
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>
                            {currencySymbol} {value.toFixed(2)}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setRestockModalItem(ing);
                                  setRestockAddAmount(ing.unit === "pcs" ? 10 : 5);
                                  setRestockNote("");
                                }}
                                style={{
                                  background: "#059669",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                + Restock
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenAddModal(ing)}
                                style={{
                                  background: "#f1f5f9",
                                  color: "#334155",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 4,
                                  padding: "6px 8px",
                                  cursor: "pointer",
                                }}
                                title="Edit ingredient"
                              >
                                <Edit2 size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                style={{
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "6px 8px",
                                  cursor: "pointer",
                                }}
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: RECIPE BUILDER (BOM & COSTING) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "recipes" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
          {/* Left Column: Product Selector */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              padding: 16,
              height: "fit-content",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800 }}>Select Menu Item</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>
              Link raw ingredients with exact weights/quantities to build this item's recipe.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {initialProducts.map((p) => {
                const isSelected = Number(p.id) === selectedProductId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(Number(p.id));
                      setSelectedVariation("");
                    }}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: isSelected ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                      background: isSelected ? "#fef2f2" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? "#ef4444" : "#0f172a",
                          fontSize: 13,
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Price: {currencySymbol} {Number(p.price || 0).toFixed(2)}
                      </div>
                    </div>
                    {isSelected && <Check size={14} color="#ef4444" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Recipe Formulation */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              padding: 24,
            }}
          >
            {currentProduct ? (
              <div>
                {/* Product Title & Variation Tabs */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 20,
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: 16,
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                      {currentProduct.name} Recipe Formula
                    </h2>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                      Define raw meat, cheese, dough, sauces, and box consumed per 1 unit.
                    </div>
                  </div>

                  {/* Variation pills if product has variations */}
                  {currentProduct.variations && currentProduct.variations.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#f1f5f9",
                        padding: 3,
                        borderRadius: 6,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedVariation("")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: "none",
                          background: selectedVariation === "" ? "#ffffff" : "transparent",
                          fontWeight: selectedVariation === "" ? 800 : 600,
                          fontSize: 12,
                          color: selectedVariation === "" ? "#0f172a" : "#64748b",
                          cursor: "pointer",
                          boxShadow: selectedVariation === "" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        }}
                      >
                        Base / Default
                      </button>
                      {currentProduct.variations.map((v) => {
                        const isVarSelected =
                          selectedVariation.toLowerCase() === v.name.toLowerCase();
                        return (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => setSelectedVariation(v.name)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 4,
                              border: "none",
                              background: isVarSelected ? "#ffffff" : "transparent",
                              fontWeight: isVarSelected ? 800 : 600,
                              fontSize: 12,
                              color: isVarSelected ? "#ef4444" : "#64748b",
                              cursor: "pointer",
                              boxShadow: isVarSelected ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                            }}
                          >
                            {v.name} ({currencySymbol} {v.price})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recipe Financial Summary Banner */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 24,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                      ESTIMATED RECIPE COST (COGS)
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                      {currencySymbol} {recipeCost.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Raw material cost</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                      SELLING PRICE
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                      {currencySymbol} {productPrice.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Customer price</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                      GROSS PROFIT PER UNIT
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: grossProfit >= 0 ? "#059669" : "#dc2626",
                        marginTop: 4,
                      }}
                    >
                      {currencySymbol} {grossProfit.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      Margin: {productPrice > 0 ? ((grossProfit / productPrice) * 100).toFixed(1) : 0}%
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                      FOOD COST %
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: foodCostPercent > 45 ? "#ea580c" : "#059669",
                        marginTop: 4,
                      }}
                    >
                      {foodCostPercent.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Industry benchmark &lt; 35%</div>
                  </div>
                </div>

                {/* Recipe Line Items */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#334155" }}>
                      Required Raw Ingredients per 1 Pizza / Item:
                    </h4>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={handleApplyPizzaTemplate}
                        style={{
                          background: "#fef2f2",
                          color: "#ef4444",
                          border: "1px solid #fecaca",
                          borderRadius: 4,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        🍕 Auto-Fill Pizza Formula
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyBurgerTemplate}
                        style={{
                          background: "#fffbeb",
                          color: "#d97706",
                          border: "1px solid #fde68a",
                          borderRadius: 4,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        🍔 Auto-Fill Burger Formula
                      </button>
                      <button
                        type="button"
                        onClick={handleAddRecipeLine}
                        style={{
                          background: "#0f172a",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 4,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Plus size={14} />
                        <span>Add Line</span>
                      </button>
                    </div>
                  </div>

                  {loadingRecipe ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                      Loading recipe formula...
                    </div>
                  ) : recipeLines.length === 0 ? (
                    <div
                      style={{
                        padding: 36,
                        textAlign: "center",
                        background: "#f8fafc",
                        borderRadius: 6,
                        border: "1px dashed #cbd5e1",
                      }}
                    >
                      <Pizza size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
                      <div style={{ fontWeight: 800, color: "#475569" }}>No Recipe Configured Yet</div>
                      <div style={{ fontSize: 12, color: "#64748b", margin: "4px 0 16px" }}>
                        Click below to define how much meat, cheese, sauce or box this pizza consumes.
                      </div>
                      <button
                        type="button"
                        onClick={handleAddRecipeLine}
                        style={{
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 16px",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        + Add First Ingredient (e.g. 0.5 kg Meat)
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {recipeLines.map((line, idx) => {
                        const selectedIng = ingredients.find((x) => x.id === line.ingredient_id);
                        const lineCost =
                          Number(line.quantity_required) * (Number(selectedIng?.cost_per_unit) || 0);

                        return (
                          <div
                            key={idx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1.8fr 1.2fr 1.5fr 1fr 40px",
                              gap: 12,
                              alignItems: "center",
                              background: "#f8fafc",
                              padding: "10px 14px",
                              borderRadius: 6,
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {/* Ingredient Dropdown */}
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3 }}>
                                Raw Material
                              </label>
                              <select
                                value={line.ingredient_id}
                                onChange={(e) =>
                                  handleUpdateRecipeLine(idx, "ingredient_id", Number(e.target.value))
                                }
                                style={{
                                  width: "100%",
                                  height: 36,
                                  borderRadius: 4,
                                  border: "1px solid #cbd5e1",
                                  fontSize: 13,
                                  padding: "0 8px",
                                  background: "#ffffff",
                                }}
                              >
                                {ingredients.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name} ({ing.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quantity Needed */}
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3 }}>
                                Quantity ({selectedIng?.unit || "kg"})
                              </label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={line.quantity_required}
                                onChange={(e) =>
                                  handleUpdateRecipeLine(idx, "quantity_required", Number(e.target.value))
                                }
                                style={{
                                  width: "100%",
                                  height: 36,
                                  borderRadius: 4,
                                  border: "1px solid #cbd5e1",
                                  fontSize: 13,
                                  padding: "0 8px",
                                }}
                              />
                            </div>

                            {/* Optional Notes */}
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3 }}>
                                Prep Notes (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Boneless diced"
                                value={line.notes}
                                onChange={(e) =>
                                  handleUpdateRecipeLine(idx, "notes", e.target.value)
                                }
                                style={{
                                  width: "100%",
                                  height: 36,
                                  borderRadius: 4,
                                  border: "1px solid #cbd5e1",
                                  fontSize: 12,
                                  padding: "0 8px",
                                }}
                              />
                            </div>

                            {/* Line Cost */}
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3 }}>
                                Line Cost
                              </label>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                                {currencySymbol} {lineCost.toFixed(2)}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipeLine(idx)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: 6,
                              }}
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Save Recipe Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  {currentProduct.variations && currentProduct.variations.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleAutoScaleToAllSizes}
                      disabled={isPending}
                      style={{
                        background: "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        padding: "11px 18px",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
                      }}
                    >
                      <Sparkles size={16} />
                      <span>⚡ Auto-Scale & Save for All Sizes (Small, Big, Large, XL)</span>
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={handleSaveRecipeFormula}
                    disabled={isPending}
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      padding: "11px 24px",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <Check size={16} />
                    <span>Save This Size Formula</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                Select a product from the left menu to view or edit its recipe formula.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: MONTHLY STOCK AUDIT & CHEF THEFT CHECK */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div>
          {/* Audit Controls & Date Range */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#0f172a" }}>
                  Monthly Kitchen Audit & Variance Check (Chef Theft / Wastage Control)
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  System calculates ideal consumption based on sold pizzas (e.g. 4 small pizzas = 2 kg
                  meat). Compare with kitchen scale weight to detect missing stock!
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block" }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={auditStart}
                    onChange={(e) => setAuditStart(e.target.value)}
                    style={{
                      height: 36,
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      padding: "0 10px",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block" }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={auditEnd}
                    onChange={(e) => setAuditEnd(e.target.value)}
                    style={{
                      height: 36,
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      padding: "0 10px",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div style={{ alignSelf: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleRunAuditCalculation}
                    disabled={calculatingAudit}
                    style={{
                      height: 36,
                      background: "#0f172a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 4,
                      padding: "0 16px",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <RefreshCw size={14} className={calculatingAudit ? "spin" : ""} />
                    <span>Calculate Kitchen Usage</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* If Audit Calculated: Display Table */}
          {auditItems.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              {/* Summary Badges */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                    ORDERS ANALYZED
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                    {auditOrdersCount} Orders
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>In selected date period</div>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                    FORMULA RAW USAGE COST
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                    {currencySymbol} {auditTheoreticalCost.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Ideal recipe consumption</div>
                </div>

                <div
                  style={{
                    background: totalAuditLoss > 0 ? "#fef2f2" : "#ecfdf5",
                    padding: 16,
                    borderRadius: 8,
                    border: totalAuditLoss > 0 ? "1px solid #fecaca" : "1px solid #a7f3d0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: totalAuditLoss > 0 ? "#dc2626" : "#059669",
                    }}
                  >
                    MISSING / CHEF VARIANCE LOSS
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: totalAuditLoss > 0 ? "#dc2626" : "#059669",
                      marginTop: 4,
                    }}
                  >
                    {currencySymbol} {totalAuditLoss.toFixed(2)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: totalAuditLoss > 0 ? "#b91c1c" : "#047857",
                      fontWeight: 700,
                    }}
                  >
                    {totalAuditLoss > 0 ? "Unaccounted stock difference!" : "100% Stock matched perfectly!"}
                  </div>
                </div>
              </div>

              {/* Audit Grid */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: 800 }}>
                          INGREDIENT
                        </th>
                        <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800 }}>
                          OPENING
                        </th>
                        <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800 }}>
                          RESTOCKED
                        </th>
                        <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800 }}>
                          IDEAL CONSUMED (RECIPES)
                        </th>
                        <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800 }}>
                          EXPECTED IN KITCHEN
                        </th>
                        <th
                          style={{
                            padding: "12px 14px",
                            textAlign: "center",
                            fontWeight: 800,
                            background: "#eff6ff",
                            color: "#1e40af",
                          }}
                        >
                          ACTUAL COUNT (SCALE WEIGHT)
                        </th>
                        <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800 }}>
                          VARIANCE
                        </th>
                        <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800 }}>
                          RUPEE LOSS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditItems.map((item) => {
                        const isMissing = item.variance < 0;
                        const isMatch = item.variance === 0;

                        return (
                          <tr
                            key={item.ingredient_id}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: isMissing ? "#fff5f5" : "transparent",
                            }}
                          >
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.name}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>Unit: {item.unit}</div>
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center", color: "#64748b" }}>
                              {item.opening_stock.toFixed(3)} {item.unit}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center", color: "#059669" }}>
                              +{item.restocked_stock.toFixed(3)} {item.unit}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800, color: "#0f172a" }}>
                              {item.ideal_consumed.toFixed(3)} {item.unit}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800, color: "#334155" }}>
                              {item.expected_stock.toFixed(3)} {item.unit}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center", background: "#f8fafc" }}>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={item.actual_counted}
                                onChange={(e) =>
                                  handleUpdateAuditActualCount(
                                    item.ingredient_id,
                                    Number(e.target.value)
                                  )
                                }
                                style={{
                                  width: 90,
                                  height: 32,
                                  textAlign: "center",
                                  borderRadius: 4,
                                  border: "1.5px solid #3b82f6",
                                  fontWeight: 800,
                                  fontSize: 13,
                                  color: "#1e3a8a",
                                }}
                              />
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              {isMissing ? (
                                <span
                                  style={{
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                    padding: "3px 8px",
                                    borderRadius: 4,
                                    fontWeight: 900,
                                    fontSize: 12,
                                  }}
                                >
                                  {item.variance.toFixed(3)} {item.unit} Missing!
                                </span>
                              ) : isMatch ? (
                                <span
                                  style={{
                                    background: "#ecfdf5",
                                    color: "#059669",
                                    padding: "3px 8px",
                                    borderRadius: 4,
                                    fontWeight: 800,
                                    fontSize: 12,
                                  }}
                                >
                                  Exact Match
                                </span>
                              ) : (
                                <span
                                  style={{
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                    padding: "3px 8px",
                                    borderRadius: 4,
                                    fontWeight: 800,
                                    fontSize: 12,
                                  }}
                                >
                                  +{item.variance.toFixed(3)} {item.unit} Excess
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <span
                                style={{
                                  fontWeight: 900,
                                  color: item.loss_amount > 0 ? "#dc2626" : "#059669",
                                }}
                              >
                                {currencySymbol} {item.loss_amount.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Finalize Button */}
                <div
                  style={{
                    padding: 16,
                    background: "#f8fafc",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 260 }}>
                    <input
                      type="text"
                      placeholder="Audit title (e.g. October 2026 Monthly Audit)"
                      value={auditTitle}
                      onChange={(e) => setAuditTitle(e.target.value)}
                      style={{
                        height: 36,
                        padding: "0 10px",
                        borderRadius: 4,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        flex: 1,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Audited by (Manager name)"
                      value={auditorName}
                      onChange={(e) => setAuditorName(e.target.value)}
                      style={{
                        height: 36,
                        padding: "0 10px",
                        borderRadius: 4,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        width: 160,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalizeAudit}
                    disabled={isPending}
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      padding: "10px 20px",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Check size={16} />
                    <span>Save & Finalize Kitchen Audit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Past Audits History */}
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800 }}>
              Saved Kitchen Audits History ({auditAuditsHistory.length})
            </h4>

            {auditAuditsHistory.length === 0 ? (
              <div
                style={{
                  padding: 30,
                  textAlign: "center",
                  background: "#ffffff",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  color: "#94a3b8",
                }}
              >
                No historical audits recorded yet. Run your first audit calculation above and click
                "Save & Finalize".
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {auditAuditsHistory.map((audit) => (
                  <div
                    key={audit.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      padding: "14px 18px",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                        {audit.audit_title}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        Period: {new Date(audit.period_start).toLocaleDateString()} —{" "}
                        {new Date(audit.period_end).toLocaleDateString()} | Audited by:{" "}
                        <strong>{audit.audited_by}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: audit.total_loss_amount > 0 ? "#dc2626" : "#059669",
                        }}
                      >
                        {audit.total_loss_amount > 0
                          ? `-${currencySymbol} ${Number(audit.total_loss_amount).toFixed(2)} Loss`
                          : "Zero Variance (No Loss)"}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        Recorded on {new Date(audit.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: KITCHEN WASTAGE LOG */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "wastage" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
          {/* Left Form */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              padding: 20,
              height: "fit-content",
            }}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
              Log Kitchen Spoilage / Wastage
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>
              Log burned pizza, dropped dough, expired sauce, or chef preparation accidents.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                  Raw Ingredient
                </label>
                <select
                  value={wasteIngId}
                  onChange={(e) => setWasteIngId(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    padding: "0 10px",
                    fontSize: 13,
                    background: "#ffffff",
                  }}
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                  Quantity Wasted
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    padding: "0 10px",
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                  Reason for Wastage
                </label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    padding: "0 10px",
                    fontSize: 13,
                    background: "#ffffff",
                  }}
                >
                  <option value="Burned in pizza oven">Burned in pizza oven</option>
                  <option value="Dropped on kitchen floor">Dropped on kitchen floor</option>
                  <option value="Expired / Spoiled in chiller">Expired / Spoiled in chiller</option>
                  <option value="Chef preparation / dough mistake">Chef preparation / dough mistake</option>
                  <option value="Customer complaint remake">Customer complaint remake</option>
                  <option value="Quality check / sample tasting">Quality check / sample tasting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                  Reported By (Chef / Staff)
                </label>
                <input
                  type="text"
                  value={wasteChef}
                  onChange={(e) => setWasteChef(e.target.value)}
                  placeholder="e.g. Chef Bilal"
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    padding: "0 10px",
                    fontSize: 13,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleLogWaste}
                disabled={isPending}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  marginTop: 6,
                }}
              >
                Log Wastage & Deduct Stock
              </button>
            </div>
          </div>

          {/* Right History Table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                Recent Kitchen Wastage Entries ({wastageLogs.length})
              </h4>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 800 }}>
                      INGREDIENT
                    </th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 800 }}>
                      QUANTITY
                    </th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 800 }}>
                      REASON
                    </th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 800 }}>
                      CHEF / STAFF
                    </th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800 }}>
                      COST LOSS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wastageLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                        No wastage recorded. Excellent kitchen control!
                      </td>
                    </tr>
                  ) : (
                    wastageLogs.map((log) => {
                      const ingName =
                        log.ingredient?.name ||
                        ingredients.find((x) => x.id === log.ingredient_id)?.name ||
                        "Item";

                      return (
                        <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                            {ingName}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#dc2626", fontWeight: 800 }}>
                            {Number(log.quantity_wasted).toFixed(3)}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>{log.reason}</td>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>{log.reported_by}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#dc2626" }}>
                            {currencySymbol} {Number(log.cost_loss || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 5: FINISHED PRODUCTS INVENTORY (LEGACY RETAIL GOODS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "finished_goods" && (
        <div>
          {/* Search Bar & Filter */}
          <div
            style={{
              background: "#ffffff",
              padding: "16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              marginBottom: 20,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 260 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search finished products (Drinks, pizzas)..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px 0 34px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 11, top: 12 }} />
              </div>

              <select
                value={prodCatFilter}
                onChange={(e) => setProdCatFilter(e.target.value)}
                style={{
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 4,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  background: "#ffffff",
                  outline: "none",
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 6 }}>
              {(["all", "low", "out", "tracked"] as ProductFilter[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setProdStockFilter(st)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 4,
                    border: "none",
                    background: prodStockFilter === st ? "#ffffff" : "transparent",
                    color: prodStockFilter === st ? "#0f172a" : "#64748b",
                    fontWeight: prodStockFilter === st ? 800 : 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Finished Products Table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      PRODUCT NAME
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      CATEGORY
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      STOCK COUNT
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      TRACKING
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>
                      ALERT THRESHOLD
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800 }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isEditing = editingProdId === p.id;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {currencySymbol} {Number(p.price || 0).toFixed(2)}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>
                          {p.category?.name || "General"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editProdStock}
                              onChange={(e) => setEditProdStock(parseInt(e.target.value, 10) || 0)}
                              style={{ width: 80, height: 32, padding: "0 8px", borderRadius: 4, border: "1px solid #cbd5e1" }}
                            />
                          ) : (
                            <span style={{ fontWeight: 800, fontSize: 14 }}>
                              {p.track_inventory ? p.stock_quantity ?? 0 : "Untracked"}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {isEditing ? (
                            <input
                              type="checkbox"
                              checked={editProdTrack}
                              onChange={(e) => setEditProdTrack(e.target.checked)}
                            />
                          ) : p.track_inventory ? (
                            <span style={{ color: "#059669", fontWeight: 700 }}>Tracked</span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>Disabled</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editProdThreshold}
                              onChange={(e) => setEditProdThreshold(parseInt(e.target.value, 10) || 1)}
                              style={{ width: 70, height: 32, padding: "0 8px", borderRadius: 4, border: "1px solid #cbd5e1" }}
                            />
                          ) : p.track_inventory ? (
                            `≤ ${p.low_stock_threshold ?? 5}`
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleSaveEditProd(p.id)}
                                style={{
                                  background: "#059669",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProdId(null)}
                                style={{
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 4,
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleQuickAddProd(p.id, 5)}
                                style={{
                                  background: "#f1f5f9",
                                  color: "#334155",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 4,
                                  padding: "5px 9px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProdId(p.id);
                                  setEditProdStock(p.stock_quantity ?? 0);
                                  setEditProdThreshold(p.low_stock_threshold ?? 5);
                                  setEditProdTrack(p.track_inventory ?? false);
                                }}
                                style={{
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 4,
                                  padding: "5px 8px",
                                  cursor: "pointer",
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT RAW MATERIAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              maxWidth: 520,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
              {editingIngredient ? "Edit Raw Material" : "+ Add New Raw Material (Kacha Maal)"}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                  Ingredient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Meat (Boneless), Mozzarella Cheese, 7-inch Box"
                  value={ingFormName}
                  onChange={(e) => setIngFormName(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    padding: "0 10px",
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={ingFormCategory}
                    onChange={(e) => setIngFormCategory(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      padding: "0 10px",
                      fontSize: 13,
                      background: "#ffffff",
                    }}
                  >
                    <option value="meat">Meat & Poultry</option>
                    <option value="dairy">Dairy & Cheese</option>
                    <option value="bakery">Bakery & Dough</option>
                    <option value="sauces">Sauces & Oils</option>
                    <option value="packaging">Boxes & Packaging</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="spices">Spices & Seasoning</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                    Unit of Measurement
                  </label>
                  <select
                    value={ingFormUnit}
                    onChange={(e) => setIngFormUnit(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      padding: "0 10px",
                      fontSize: 13,
                      background: "#ffffff",
                    }}
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="l">l (Liters)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="pcs">pcs (Pieces / Boxes)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={ingFormStock}
                    onChange={(e) => setIngFormStock(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      padding: "0 10px",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                    Low Alert (≤)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={ingFormThreshold}
                    onChange={(e) => setIngFormThreshold(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      padding: "0 10px",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                    Cost / {ingFormUnit}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ingFormCost}
                    onChange={(e) => setIngFormCost(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      padding: "0 10px",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "9px 16px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveIngredient}
                  disabled={isPending}
                  style={{
                    background: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    padding: "9px 20px",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Save Ingredient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: QUICK RESTOCK RAW MATERIAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {restockModalItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              maxWidth: 440,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#0f172a" }}>
              Restock {restockModalItem.name}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Current stock: <strong>{Number(restockModalItem.current_stock).toFixed(3)} {restockModalItem.unit}</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                  Quantity to Add ({restockModalItem.unit})
                </label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {[1, 5, 10, 25].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRestockAddAmount(amt)}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: 4,
                        border: "1px solid #cbd5e1",
                        background: restockAddAmount === amt ? "#0f172a" : "#f8fafc",
                        color: restockAddAmount === amt ? "#ffffff" : "#334155",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      +{amt} {restockModalItem.unit}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={restockAddAmount}
                  onChange={(e) => setRestockAddAmount(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    padding: "0 10px",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                  Supplier / Purchase Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Purchased from City Meat Market"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    padding: "0 10px",
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "9px 16px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickRestockRaw}
                  disabled={isPending}
                  style={{
                    background: "#059669",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    padding: "9px 20px",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Confirm Restock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
