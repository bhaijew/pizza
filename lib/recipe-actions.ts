"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { getActiveShopContext } from "@/lib/admin-actions";
import type {
  RawIngredient,
  ProductRecipeItem,
  StockAudit,
  StockAuditItem,
  IngredientWastageLog,
  IngredientStockLog,
} from "@/types/menu";

/**
 * Fetch all raw ingredients for the active shop
 */
export async function getRawIngredients(): Promise<{
  success: boolean;
  data: RawIngredient[];
  isTableMissing?: boolean;
  error?: string;
}> {
  if (!isServiceRoleConfigured()) {
    return { success: false, data: [], error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    let query = db
      .from("raw_ingredients")
      .select("*")
      .order("name", { ascending: true });

    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205" || error.message.includes("does not exist") || error.message.includes("schema cache")) {
        return { success: false, data: [], isTableMissing: true, error: "Database migration 014 has not been applied yet." };
      }
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data as RawIngredient[]) || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Save or update a raw ingredient
 */
export async function saveRawIngredient(input: {
  id?: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  low_stock_threshold: number;
  cost_per_unit: number;
}): Promise<{ success: boolean; data?: RawIngredient; error?: string }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    const payload: Record<string, any> = {
      name: input.name.trim(),
      category: input.category || "meat",
      unit: input.unit || "kg",
      current_stock: Number(input.current_stock) || 0,
      low_stock_threshold: Number(input.low_stock_threshold) || 1,
      cost_per_unit: Number(input.cost_per_unit) || 0,
      updated_at: new Date().toISOString(),
    };

    if (activeShop.shopId) {
      payload.shop_id = activeShop.shopId;
    }

    if (input.id) {
      const { data, error } = await db
        .from("raw_ingredients")
        .update(payload)
        .eq("id", input.id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      revalidatePath("/admin/inventory");
      return { success: true, data: data as RawIngredient };
    } else {
      const { data, error } = await db
        .from("raw_ingredients")
        .insert(payload)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      revalidatePath("/admin/inventory");
      return { success: true, data: data as RawIngredient };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete a raw ingredient
 */
export async function deleteRawIngredient(id: number): Promise<{ success: boolean; error?: string }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    let query = db.from("raw_ingredients").delete().eq("id", id);
    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }
    const { error } = await query;
    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Quick restock raw material (e.g. +5 kg chicken meat)
 */
export async function quickRestockIngredient(
  id: number,
  quantityToAdd: number,
  notes?: string
): Promise<{ success: boolean; newStock?: number; error?: string }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    const { data: item, error: fetchErr } = await db
      .from("raw_ingredients")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !item) {
      return { success: false, error: fetchErr?.message || "Ingredient not found" };
    }

    const prevStock = Number(item.current_stock) || 0;
    const newStock = Number((prevStock + quantityToAdd).toFixed(3));

    const { error: updateErr } = await db
      .from("raw_ingredients")
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) return { success: false, error: updateErr.message };

    // Record movement in ledger
    try {
      await db.from("ingredient_stock_logs").insert({
        shop_id: activeShop.shopId || null,
        ingredient_id: id,
        change_type: "restock",
        quantity_change: quantityToAdd,
        previous_stock: prevStock,
        new_stock: newStock,
        notes: notes || `Restocked +${quantityToAdd} ${item.unit}`,
      });
    } catch {
      // Non-blocking log
    }

    revalidatePath("/admin/inventory");
    return { success: true, newStock };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch recipe items for a given product
 */
export async function getProductRecipes(productId: number | string): Promise<{
  success: boolean;
  data: ProductRecipeItem[];
  error?: string;
}> {
  if (!isServiceRoleConfigured()) {
    return { success: false, data: [], error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    let query = db
      .from("product_recipes")
      .select("*, ingredient:raw_ingredients(*)")
      .eq("product_id", Number(productId));

    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data as ProductRecipeItem[]) || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Save recipe ingredients for a product & variation
 */
export async function saveProductRecipe(
  productId: number,
  variationName: string | null,
  ingredients: { ingredient_id: number; quantity_required: number; notes?: string }[]
): Promise<{ success: boolean; error?: string }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    // 1. Delete existing recipe lines for this product and variation FOR THIS SHOP
    let delQuery = db
      .from("product_recipes")
      .delete()
      .eq("product_id", productId);

    if (activeShop.shopId) {
      delQuery = delQuery.eq("shop_id", activeShop.shopId);
    }

    if (variationName) {
      delQuery = delQuery.eq("variation_name", variationName);
    } else {
      delQuery = delQuery.is("variation_name", null);
    }

    await delQuery;

    // 2. Insert new recipe lines
    if (ingredients.length > 0) {
      const records = ingredients.map((line) => ({
        shop_id: activeShop.shopId || null,
        product_id: productId,
        variation_name: variationName || null,
        ingredient_id: line.ingredient_id,
        quantity_required: Number(line.quantity_required) || 0,
        notes: line.notes || null,
      }));

      const { error: insErr } = await db.from("product_recipes").insert(records);
      if (insErr) return { success: false, error: insErr.message };
    }

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Log accidental wastage / burned / expired items from kitchen
 */
export async function logIngredientWastage(
  ingredientId: number,
  quantityWasted: number,
  reason: string,
  reportedBy: string = "Chef"
): Promise<{ success: boolean; error?: string }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    const { data: ing, error: fetchErr } = await db
      .from("raw_ingredients")
      .select("*")
      .eq("id", ingredientId)
      .single();

    if (fetchErr || !ing) {
      return { success: false, error: "Ingredient not found" };
    }

    const prevStock = Number(ing.current_stock) || 0;
    const newStock = Math.max(0, Number((prevStock - quantityWasted).toFixed(3)));
    const costLoss = Number((quantityWasted * (Number(ing.cost_per_unit) || 0)).toFixed(2));

    // 1. Insert wastage record
    const { error: wasteErr } = await db.from("ingredient_wastage_logs").insert({
      shop_id: activeShop.shopId || null,
      ingredient_id: ingredientId,
      quantity_wasted: quantityWasted,
      reason,
      reported_by: reportedBy,
      cost_loss: costLoss,
    });

    if (wasteErr) return { success: false, error: wasteErr.message };

    // 2. Deduct from raw ingredients
    await db
      .from("raw_ingredients")
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", ingredientId);

    // 3. Movement log
    await db.from("ingredient_stock_logs").insert({
      shop_id: activeShop.shopId || null,
      ingredient_id: ingredientId,
      change_type: "wastage",
      quantity_change: -quantityWasted,
      previous_stock: prevStock,
      new_stock: newStock,
      notes: `Wastage: ${reason} (reported by ${reportedBy})`,
    });

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch Wastage Logs
 */
export async function getWastageLogs(): Promise<{
  success: boolean;
  data: IngredientWastageLog[];
  error?: string;
}> {
  if (!isServiceRoleConfigured()) {
    return { success: false, data: [], error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    let query = db
      .from("ingredient_wastage_logs")
      .select("*, ingredient:raw_ingredients(*)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }

    const { data, error } = await query;
    if (error) return { success: false, data: [], error: error.message };

    return { success: true, data: (data as IngredientWastageLog[]) || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

/**
 * Core Kitchen Variance Calculation (The User's Feature!)
 * Analyzes:
 * - Opening stock
 * - Total items sold in date range (e.g. 4 small pizzas)
 * - Sum of raw material recipes consumed (e.g. 4 × 0.5kg = 2kg meat)
 * - Ideal Expected Stock vs Actual Count
 */
export async function calculateKitchenAuditData(
  periodStart: string,
  periodEnd: string
): Promise<{
  success: boolean;
  items: StockAuditItem[];
  totalTheoreticalUsedCost: number;
  ordersCount: number;
  error?: string;
}> {
  if (!isServiceRoleConfigured()) {
    return { success: false, items: [], totalTheoreticalUsedCost: 0, ordersCount: 0, error: "Database not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    // 1. Fetch all raw ingredients for this shop
    let ingQuery = db.from("raw_ingredients").select("*").order("name", { ascending: true });
    if (activeShop.shopId) {
      ingQuery = ingQuery.eq("shop_id", activeShop.shopId);
    }
    const { data: rawIngredients, error: ingErr } = await ingQuery;
    if (ingErr || !rawIngredients) {
      return { success: false, items: [], totalTheoreticalUsedCost: 0, ordersCount: 0, error: ingErr?.message || "Failed to load ingredients" };
    }

    // 2. Fetch all product recipes for this shop
    let recQuery = db.from("product_recipes").select("*");
    if (activeShop.shopId) {
      recQuery = recQuery.eq("shop_id", activeShop.shopId);
    }
    const { data: allRecipes } = await recQuery;
    const recipes = (allRecipes as ProductRecipeItem[]) || [];

    // 3. Fetch completed orders in the selected period
    let ordQuery = db
      .from("orders")
      .select("id, items, created_at, status")
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd)
      .neq("status", "cancelled");

    if (activeShop.shopId) {
      ordQuery = ordQuery.eq("shop_id", activeShop.shopId);
    }

    const { data: ordersData } = await ordQuery;
    const orders = ordersData || [];

    // 4. Calculate total ideal consumption per raw ingredient
    const consumptionMap: Record<number, number> = {}; // ingredient_id -> ideal total consumed

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const prodId = Number(item.id);
        const qty = Number(item.quantity || item.qty || 1);
        const itemVariation = (item.selectedVariation || item.selected_variation || "").toLowerCase().trim();

        // Find recipe lines matching product
        const matchedRecipes = recipes.filter((r) => {
          if (r.product_id !== prodId) return false;
          if (!r.variation_name) return true; // base recipe applies to all
          return r.variation_name.toLowerCase().trim() === itemVariation;
        });

        for (const r of matchedRecipes) {
          const reqQty = Number(r.quantity_required) || 0;
          const totalIngredientUsed = reqQty * qty;
          consumptionMap[r.ingredient_id] = (consumptionMap[r.ingredient_id] || 0) + totalIngredientUsed;
        }
      }
    }

    // 5. Fetch restocks in this period from ingredient_stock_logs
    let logsQuery = db
      .from("ingredient_stock_logs")
      .select("ingredient_id, change_type, quantity_change")
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);

    if (activeShop.shopId) {
      logsQuery = logsQuery.eq("shop_id", activeShop.shopId);
    }

    const { data: logsData } = await logsQuery;
    const restockMap: Record<number, number> = {};
    if (logsData) {
      for (const log of logsData) {
        if (log.change_type === "restock") {
          restockMap[log.ingredient_id] = (restockMap[log.ingredient_id] || 0) + Number(log.quantity_change);
        }
      }
    }

    // 6. Assemble audit items
    let totalTheoreticalUsedCost = 0;
    const auditItems: StockAuditItem[] = rawIngredients.map((ing: any) => {
      const ingId = Number(ing.id);
      const idealUsed = Number((consumptionMap[ingId] || 0).toFixed(3));
      const restocked = Number((restockMap[ingId] || 0).toFixed(3));
      const currentStock = Number(ing.current_stock) || 0;
      const costPerUnit = Number(ing.cost_per_unit) || 0;

      // Expected stock is current stock (or theoretical stock)
      const expectedStock = Number(currentStock.toFixed(3));
      const actualCounted = expectedStock; // default initial proposal
      const variance = 0; // initially 0 until user modifies actual count

      totalTheoreticalUsedCost += idealUsed * costPerUnit;

      return {
        ingredient_id: ingId,
        name: ing.name,
        unit: ing.unit,
        cost_per_unit: costPerUnit,
        opening_stock: Number((currentStock - restocked + idealUsed).toFixed(3)),
        restocked_stock: restocked,
        ideal_consumed: idealUsed,
        expected_stock: expectedStock,
        actual_counted: actualCounted,
        variance: variance,
        loss_amount: 0,
      };
    });

    return {
      success: true,
      items: auditItems,
      totalTheoreticalUsedCost: Number(totalTheoreticalUsedCost.toFixed(2)),
      ordersCount: orders.length,
    };
  } catch (err: any) {
    return { success: false, items: [], totalTheoreticalUsedCost: 0, ordersCount: 0, error: err.message };
  }
}

/**
 * Save finalized Stock Audit record
 */
export async function saveStockAudit(audit: {
  audit_title: string;
  period_start: string;
  period_end: string;
  audited_by: string;
  items_data: StockAuditItem[];
  total_loss_amount: number;
  notes?: string;
}): Promise<{ success: boolean; data?: StockAudit; error?: string }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    const { data, error } = await db
      .from("stock_audits")
      .insert({
        shop_id: activeShop.shopId || null,
        audit_title: audit.audit_title,
        period_start: audit.period_start,
        period_end: audit.period_end,
        audited_by: audit.audited_by,
        items_data: audit.items_data,
        total_loss_amount: audit.total_loss_amount,
        notes: audit.notes || null,
        status: "completed",
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Also update raw_ingredients current_stock to match actual counted amounts from audit!
    for (const item of audit.items_data) {
      if (item.actual_counted !== undefined && !isNaN(item.actual_counted)) {
        await db
          .from("raw_ingredients")
          .update({
            current_stock: Number(item.actual_counted),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.ingredient_id);

        // Record adjustment in ledger
        if (item.variance !== 0) {
          await db.from("ingredient_stock_logs").insert({
            shop_id: activeShop.shopId || null,
            ingredient_id: item.ingredient_id,
            change_type: "audit_adjustment",
            quantity_change: item.variance,
            previous_stock: item.expected_stock,
            new_stock: item.actual_counted,
            notes: `Audit "${audit.audit_title}": Variance of ${item.variance} ${item.unit}`,
          });
        }
      }
    }

    revalidatePath("/admin/inventory");
    return { success: true, data: data as StockAudit };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch Past Stock Audits
 */
export async function getStockAudits(): Promise<{
  success: boolean;
  data: StockAudit[];
  error?: string;
}> {
  if (!isServiceRoleConfigured()) {
    return { success: false, data: [], error: "Supabase Service Role is not configured" };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();

    let query = db
      .from("stock_audits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }

    const { data, error } = await query;
    if (error) return { success: false, data: [], error: error.message };

    return { success: true, data: (data as StockAudit[]) || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}
