"use server";

/**
 * Customer Order Server Actions
 * Allows customers to submit orders directly to the Supabase database.
 * Supports Table QR Dine-In and Counter Takeaway Token systems.
 */
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { getTableScanSession } from "@/lib/table-session";
import { ProductVariation, ExtraTopping } from "@/types/menu";
import { sendWhatsAppOrderAlert } from "@/lib/whatsapp";
import { processLoyaltyPoints } from "@/lib/promo-actions";

export interface CreateOrderItem {
  id: string | number;
  name: string;
  price: number;
  qty: number;
  selected_variation?: ProductVariation | null;
  selected_toppings?: ExtraTopping[] | null;
}

export interface CreateOrderInput {
  order_type: "dine_in" | "takeaway" | "delivery";
  table_number?: string;
  token_number?: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_fee?: number;
  discount_amount?: number;
  promo_code?: string | null;
  points_redeemed?: number;
  notes?: string;
  items: CreateOrderItem[];
  total: number;
  shop_id?: number | null;
}

export async function placeCustomerOrder(input: CreateOrderInput): Promise<{
  success: boolean;
  orderNumber?: string;
  orderType?: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string;
  tokenNumber?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  error?: string;
}> {
  try {
    if (!input.customer_name?.trim()) {
      return { success: false, error: "Please enter your name." };
    }
    if (!input.customer_phone?.trim()) {
      return { success: false, error: "Please enter your mobile/WhatsApp number for order updates." };
    }
    if (input.order_type === "dine_in" && !input.table_number?.trim()) {
      return { success: false, error: "Please specify your Table Number." };
    }
    if (input.order_type === "delivery" && !input.delivery_address?.trim()) {
      return { success: false, error: "Please enter your complete delivery address." };
    }
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }

    // Verify 60-Minute Table Scan Session for Dine-In to prevent orders from home
    if (input.order_type === "dine_in" && input.table_number) {
      const sessionCheck = await getTableScanSession(input.table_number);
      if (!sessionCheck.valid) {
        return {
          success: false,
          error:
            "Your 60-minute table session has expired. To prevent unauthorized orders, please scan the QR code physically at your table.",
        };
      }
    }

    // Generate human-friendly order number e.g. ORD-7492
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${randomSuffix}`;

    // Generate delivery verification token number for table dine-in & takeaway
    let tokenNumber = input.token_number?.trim();
    if (!tokenNumber && input.order_type !== "delivery") {
      const tokenDigit = Math.floor(10 + Math.random() * 90);
      tokenNumber = `TK-${tokenDigit}`;
    }

    const tableNumber = input.table_number?.trim() || null;

    // Prefer service role client if configured, otherwise use standard server client
    let supabase;
    if (isServiceRoleConfigured()) {
      supabase = createAdminClient();
    } else {
      const cookieStore = await cookies();
      supabase = createClient(cookieStore);
    }

    // Determine target shop_id
    let targetShopId = input.shop_id ?? null;
    if (!targetShopId && tableNumber) {
      const { data: matchedTable } = await supabase
        .from("restaurant_tables")
        .select("shop_id")
        .eq("table_number", tableNumber)
        .maybeSingle();
      if (matchedTable?.shop_id) {
        targetShopId = matchedTable.shop_id;
      }
    }

    if (!targetShopId) {
      const cookieStore = await cookies();
      const adminCookieShop = cookieStore.get("pizza_admin_shop_id")?.value;
      if (adminCookieShop) {
        targetShopId = parseInt(adminCookieShop, 10);
      }
    }

    // Build base notes with metadata
    let enrichedNotes = input.notes?.trim() || "";
    if (input.order_type === "dine_in" && tableNumber) {
      enrichedNotes = `[DINE-IN: Table ${tableNumber} | VERIFY TOKEN: ${tokenNumber}] ${enrichedNotes}`.trim();
    } else if (input.order_type === "takeaway" && tokenNumber) {
      enrichedNotes = `[TAKEAWAY: Token ${tokenNumber}] ${enrichedNotes}`.trim();
    } else if (input.order_type === "delivery") {
      enrichedNotes = `[DELIVERY: Address: ${input.delivery_address?.trim()} | Phone: ${input.customer_phone?.trim()} | Fee: ${input.delivery_fee || 0}] ${enrichedNotes}`.trim();
    }

    const orderPayload: Record<string, any> = {
      order_number: orderNumber,
      status: "pending",
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone?.trim() || null,
      notes: enrichedNotes || null,
      items: input.items,
      total: Number(input.total.toFixed(2)),
      order_type: input.order_type,
      table_number: tableNumber,
      token_number: tokenNumber || null,
      shop_id: targetShopId || null,
      delivery_address: input.delivery_address?.trim() || null,
      delivery_fee: input.delivery_fee || 0,
      discount_amount: input.discount_amount || 0,
      promo_code: input.promo_code || null,
      points_redeemed: input.points_redeemed || 0,
    };

    // Attempt insert with new columns
    let { error } = await supabase.from("orders").insert(orderPayload);

    // If new columns don't exist yet in Supabase (migration pending), fallback to basic payload
    if (error && (error.message.includes("delivery_address") || error.message.includes("delivery_fee") || error.message.includes("order_type") || error.message.includes("table_number") || error.message.includes("token_number") || error.message.includes("shop_id") || error.message.includes("discount_amount") || error.message.includes("promo_code"))) {
      const fallbackPayload: Record<string, any> = {
        order_number: orderNumber,
        status: "pending",
        customer_name: input.customer_name.trim(),
        customer_phone: input.customer_phone?.trim() || null,
        notes: enrichedNotes || null,
        items: input.items,
        total: Number(input.total.toFixed(2)),
      };
      if (!error.message.includes("shop_id") && targetShopId) {
        fallbackPayload.shop_id = targetShopId;
      }
      const retryRes = await supabase.from("orders").insert(fallbackPayload);
      error = retryRes.error;
    }

    if (error) {
      console.error("[placeCustomerOrder error]", error);
      return { success: false, error: error.message };
    }

    // Feature 7: Inventory Automatic Stock Deduction (Finished Products)
    try {
      for (const orderedItem of input.items) {
        if (!orderedItem.id) continue;
        const { data: prodData } = await supabase
          .from("products")
          .select("id, track_inventory, stock_quantity")
          .eq("id", orderedItem.id)
          .maybeSingle();

        if (prodData && prodData.track_inventory && prodData.stock_quantity !== null && prodData.stock_quantity !== undefined) {
          const newStock = Math.max(0, Number(prodData.stock_quantity) - (orderedItem.qty || 1));
          const updates: Record<string, any> = { stock_quantity: newStock };
          if (newStock === 0) {
            updates.is_available = false;
          }
          await supabase.from("products").update(updates).eq("id", orderedItem.id);
        }
      }
    } catch (stockErr) {
      console.warn("[placeCustomerOrder stock deduction non-blocking error]", stockErr);
    }

    // Phase 1: Recipe & Raw Material Automatic Stock Deduction (Kacha Maal)
    try {
      for (const orderedItem of input.items) {
        if (!orderedItem.id) continue;
        const prodId = Number(orderedItem.id);
        const qty = Number(orderedItem.qty || (orderedItem as any).quantity || 1);

        // Robustly extract variation name whether it's string, object or null
        const rawVar =
          (orderedItem as any).selected_variation ||
          (orderedItem as any).selectedVariation;
        const variationName = (
          typeof rawVar === "string"
            ? rawVar
            : rawVar && typeof rawVar === "object"
            ? rawVar.name || ""
            : ""
        ).toLowerCase().trim();

        // Check if recipes exist for this product FOR THIS SHOP
        let recQuery = supabase
          .from("product_recipes")
          .select("ingredient_id, quantity_required, variation_name")
          .eq("product_id", prodId);

        if (targetShopId) {
          recQuery = recQuery.eq("shop_id", targetShopId);
        }

        const { data: recipes } = await recQuery;

        if (recipes && recipes.length > 0) {
          // 1. If variationName exists (e.g. "Small"), look for recipes matching this variation
          let matchedRecipes = variationName
            ? recipes.filter(
                (r) =>
                  r.variation_name &&
                  r.variation_name.toLowerCase().trim() === variationName
              )
            : [];

          // 2. If no variation-specific recipe matched, fall back to base recipes (where variation_name is null/empty)
          if (matchedRecipes.length === 0) {
            matchedRecipes = recipes.filter((r) => !r.variation_name);
          }

          for (const recipe of matchedRecipes) {
            const reqQty = Number(recipe.quantity_required) || 0;
            const deductAmount = Number((reqQty * qty).toFixed(3));

            if (deductAmount > 0) {
              const { data: ing } = await supabase
                .from("raw_ingredients")
                .select("current_stock")
                .eq("id", recipe.ingredient_id)
                .maybeSingle();

              if (ing) {
                const currentStock = Number(ing.current_stock) || 0;
                const newStock = Math.max(0, Number((currentStock - deductAmount).toFixed(3)));

                await supabase
                  .from("raw_ingredients")
                  .update({ current_stock: newStock, updated_at: new Date().toISOString() })
                  .eq("id", recipe.ingredient_id);

                await supabase.from("ingredient_stock_logs").insert({
                  shop_id: targetShopId || null,
                  ingredient_id: recipe.ingredient_id,
                  change_type: "order_deduction",
                  quantity_change: -deductAmount,
                  previous_stock: currentStock,
                  new_stock: newStock,
                  reference_id: orderNumber,
                  notes: `Used in Order #${orderNumber} (${qty}x ${variationName || "Base"})`,
                });
              }
            }
          }
        }
      }
    } catch (recipeErr) {
      console.warn("[placeCustomerOrder recipe deduction non-blocking error]", recipeErr);
    }

    // If order succeeded and belongs to a registered shop, increment its aggregate counters
    if (targetShopId) {
      try {
        const { data: currentShop } = await supabase
          .from("shops")
          .select("total_orders_count, total_revenue")
          .eq("id", targetShopId)
          .maybeSingle();

        if (currentShop) {
          const currentCount = Number(currentShop.total_orders_count) || 0;
          const currentRev = Number(currentShop.total_revenue) || 0;
          await supabase
            .from("shops")
            .update({
              total_orders_count: currentCount + 1,
              total_revenue: Number((currentRev + input.total).toFixed(2)),
            })
            .eq("id", targetShopId);
        }
      } catch {
        // Non-blocking
      }
    }

    // Process Customer Loyalty Points (Feature 5: 1 point per Rs. 50 spent)
    if (input.customer_phone?.trim()) {
      processLoyaltyPoints(
        input.customer_phone.trim(),
        input.customer_name?.trim() || "Customer",
        input.total,
        input.points_redeemed || 0,
        targetShopId
      ).catch((loyaltyErr) => {
        console.warn("[Customer Loyalty non-blocking error]", loyaltyErr);
      });
    }

    // Trigger WhatsApp notification alert (multi-tenant session ID support)
    if (input.customer_phone?.trim()) {
      sendWhatsAppOrderAlert({
        phone: input.customer_phone.trim(),
        customerName: input.customer_name?.trim() || "Customer",
        orderId: orderNumber,
        total: `${input.total.toFixed(2)}`,
        shopId: targetShopId,
      }).catch((waErr) => {
        console.error("[WhatsApp order alert non-blocking error]", waErr);
      });
    }

    return {
      success: true,
      orderNumber,
      orderType: input.order_type,
      tableNumber: tableNumber ?? undefined,
      tokenNumber: tokenNumber ?? undefined,
      deliveryAddress: input.delivery_address?.trim() ?? undefined,
      deliveryFee: input.delivery_fee,
    };
  } catch (err: any) {
    console.error("[placeCustomerOrder exception]", err);
    return { success: false, error: err?.message || "Failed to submit order." };
  }
}

export async function getTrackableOrder(orderNumber: string): Promise<{
  success: boolean;
  order?: any;
  error?: string;
}> {
  try {
    const cleanNumber = orderNumber.trim();
    if (!cleanNumber) {
      return { success: false, error: "Please enter a valid order number." };
    }

    let supabase;
    if (isServiceRoleConfigured()) {
      supabase = createAdminClient();
    } else {
      const cookieStore = await cookies();
      supabase = createClient(cookieStore);
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .ilike("order_number", cleanNumber)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: `Order "${cleanNumber}" was not found. Please check the order reference.` };
    }

    return { success: true, order: data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to track order." };
  }
}

export async function findRecentOrdersByPhone(phone: string): Promise<{
  success: boolean;
  orders?: any[];
  error?: string;
}> {
  try {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return { success: false, error: "Please enter a phone number." };
    }

    let supabase;
    if (isServiceRoleConfigured()) {
      supabase = createAdminClient();
    } else {
      const cookieStore = await cookies();
      supabase = createClient(cookieStore);
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .ilike("customer_phone", `%${cleanPhone}%`)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, orders: data || [] };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to look up orders." };
  }
}
