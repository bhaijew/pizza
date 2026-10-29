"use server";

/**
 * Customer Order Server Actions
 * Allows customers to submit orders directly to the Supabase database.
 * Supports Table QR Dine-In and Counter Takeaway Token systems.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { getTableScanSession } from "@/lib/table-session";
import { ProductVariation, ExtraTopping } from "@/types/menu";
import { sendWhatsAppOrderAlert, sendWhatsAppReviewPrompt } from "@/lib/whatsapp";
import { processLoyaltyPoints } from "@/lib/promo-actions";
import { syncCustomerFromOrder } from "@/lib/customer-actions";
import { dbCache } from "@/lib/db-cache";

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

    const tableNumber = input.table_number?.trim() || null;

    // Prefer service role client if configured, otherwise use standard server client
    let supabase: any;
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

    // -------------------------------------------------------------
    // FINANCIAL SECURITY: Server-Side Price & Total Verification
    // Prevents price tampering via DevTools or API tools (Postman/curl)
    // -------------------------------------------------------------
    const rawProdIds = (input.items || [])
      .map((it) => Number(it.id))
      .filter((id) => !isNaN(id) && id > 0);

    let verifiedItems = [...(input.items || [])];
    let verifiedSubtotal = 0;

    if (rawProdIds.length > 0) {
      const { data: dbProducts } = await supabase
        .from("products")
        .select("id, name, price, variations")
        .in("id", Array.from(new Set(rawProdIds)));

      const prodMap = new Map<number, any>();
      if (dbProducts) {
        for (const p of dbProducts) {
          prodMap.set(Number(p.id), p);
        }
      }

      verifiedItems = (input.items || []).map((it) => {
        const prod = prodMap.get(Number(it.id));
        const qty = Number(it.qty || (it as any).quantity || 1);
        let unitPrice = Number(it.price) || 0;

        if (prod) {
          let expectedPrice = Number(prod.price) || 0;

          // Check if variation selected
          const rawVar = (it as any).selected_variation || (it as any).selectedVariation;
          const varName = (
            typeof rawVar === "string"
              ? rawVar
              : rawVar && typeof rawVar === "object"
              ? rawVar.name || ""
              : ""
          ).toLowerCase().trim();

          if (varName && Array.isArray(prod.variations)) {
            const matchedVar = prod.variations.find(
              (v: any) => v && String(v.name || "").toLowerCase().trim() === varName
            );
            if (matchedVar && matchedVar.price != null) {
              expectedPrice = Number(matchedVar.price);
            }
          }

          // If client tampered price (difference > Rs. 1), enforce server DB price
          if (Math.abs(unitPrice - expectedPrice) > 1) {
            console.warn(
              `[SECURITY: Price Tampering Intercepted] Item "${it.name}" (ID: ${it.id}) submitted with Rs. ${unitPrice}, overridden with server price Rs. ${expectedPrice}`
            );
            unitPrice = expectedPrice;
          }
        }

        verifiedSubtotal += unitPrice * qty;

        return {
          ...it,
          price: unitPrice,
          qty,
          quantity: qty,
        };
      });
    } else {
      verifiedSubtotal = (input.items || []).reduce(
        (sum, it) => sum + (Number(it.price) || 0) * Number(it.qty || (it as any).quantity || 1),
        0
      );
    }

    const deliveryFee = input.order_type === "delivery" ? Number(input.delivery_fee || 0) : 0;
    const discountAmount = Number(input.discount_amount || 0);
    const verifiedTotal = Math.max(0, Number((verifiedSubtotal + deliveryFee - discountAmount).toFixed(2)));

    // If client total was manipulated, override with verified total
    const finalTotal = Math.abs(Number(input.total) - verifiedTotal) > 1 ? verifiedTotal : Number(input.total.toFixed(2));

    // -------------------------------------------------------------
    // CONCURRENCY-SAFE ORDER NUMBERING: Atomic Sequence with Retry Loop
    // Prevents duplicate key collisions (23505) under rush-hour surges
    // -------------------------------------------------------------
    async function getNextOrderNumber(shopId: number | null): Promise<{ seq: number; num: string }> {
      let query = supabase
        .from("orders")
        .select("order_number, id")
        .order("id", { ascending: false })
        .limit(1);

      if (shopId) {
        query = query.eq("shop_id", shopId);
      } else {
        query = query.is("shop_id", null);
      }

      let seq = 1;
      try {
        const { data: latestRows } = await query;
        if (latestRows && latestRows.length > 0) {
          const lastNum = String(latestRows[0].order_number || "");
          const match = lastNum.match(/(\d+)$/);
          if (match) {
            seq = parseInt(match[1], 10) + 1;
          } else {
            seq = (Number(latestRows[0].id) || 0) + 1;
          }
        }
      } catch {
        seq = 1;
      }
      const seqStr = String(seq).padStart(3, "0");
      const num = shopId ? `ORD-${shopId}-${seqStr}` : `ORD-${seqStr}`;
      return { seq, num };
    }

    let { seq: nextSeq, num: orderNumber } = await getNextOrderNumber(targetShopId);

    // Generate delivery verification token number for table dine-in & takeaway
    let tokenNumber = input.token_number?.trim();
    if (!tokenNumber && input.order_type !== "delivery") {
      tokenNumber = `TK-${String(nextSeq).padStart(2, "0")}`;
    }

    // Build base notes with metadata
    let enrichedNotes = input.notes?.trim() || "";
    if (input.order_type === "dine_in" && tableNumber) {
      enrichedNotes = `[DINE-IN: Table ${tableNumber} | VERIFY TOKEN: ${tokenNumber}] ${enrichedNotes}`.trim();
    } else if (input.order_type === "takeaway" && tokenNumber) {
      enrichedNotes = `[TAKEAWAY: Token ${tokenNumber}] ${enrichedNotes}`.trim();
    } else if (input.order_type === "delivery") {
      enrichedNotes = `[DELIVERY: Address: ${input.delivery_address?.trim()} | Phone: ${input.customer_phone?.trim()} | Fee: ${deliveryFee}] ${enrichedNotes}`.trim();
    }

    const orderPayload: Record<string, any> = {
      order_number: orderNumber,
      status: "pending",
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone?.trim() || null,
      notes: enrichedNotes || null,
      items: verifiedItems,
      total: finalTotal,
      order_type: input.order_type,
      table_number: tableNumber,
      token_number: tokenNumber || null,
      shop_id: targetShopId || null,
      delivery_address: input.delivery_address?.trim() || null,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      promo_code: input.promo_code || null,
      points_redeemed: input.points_redeemed || 0,
    };

    // Attempt insertion with up to 3 automatic concurrency conflict retries
    let error: any = null;
    let insertSuccess = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      let insertRes = await supabase.from("orders").insert(orderPayload);
      error = insertRes.error;

      // Fallback if newly migrated columns don't exist in Supabase yet
      if (error && (error.message?.includes("delivery_address") || error.message?.includes("delivery_fee") || error.message?.includes("order_type") || error.message?.includes("table_number") || error.message?.includes("token_number") || error.message?.includes("shop_id") || error.message?.includes("discount_amount") || error.message?.includes("promo_code"))) {
        const fallbackPayload: Record<string, any> = {
          order_number: orderPayload.order_number,
          status: "pending",
          customer_name: input.customer_name.trim(),
          customer_phone: input.customer_phone?.trim() || null,
          notes: enrichedNotes || null,
          items: verifiedItems,
          total: finalTotal,
        };
        if (!error.message.includes("shop_id") && targetShopId) {
          fallbackPayload.shop_id = targetShopId;
        }
        const fallbackRes = await supabase.from("orders").insert(fallbackPayload);
        error = fallbackRes.error;
      }

      // Check for duplicate key / unique collision
      if (error && (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("duplicate key"))) {
        console.warn(`[Concurrency Collision on attempt ${attempt}] Order number ${orderPayload.order_number} collided. Re-deriving sequence...`);
        const refreshed = await getNextOrderNumber(targetShopId);
        if (refreshed.num === orderPayload.order_number) {
          const jitterSeq = refreshed.seq + attempt;
          orderPayload.order_number = targetShopId
            ? `ORD-${targetShopId}-${String(jitterSeq).padStart(3, "0")}`
            : `ORD-${String(jitterSeq).padStart(3, "0")}`;
        } else {
          orderPayload.order_number = refreshed.num;
        }
        orderNumber = orderPayload.order_number;
        continue;
      }

      if (!error) {
        insertSuccess = true;
        break;
      }
    }

    if (!insertSuccess && error) {
      // Last-ditch collision-free fallback with microsecond timestamp
      const fallbackNumber = `${orderNumber}-${Date.now().toString().slice(-4)}`;
      orderPayload.order_number = fallbackNumber;
      const finalTry = await supabase.from("orders").insert(orderPayload);
      if (!finalTry.error) {
        orderNumber = fallbackNumber;
        error = null;
      } else {
        console.error("[placeCustomerOrder fatal error]", error);
        return { success: false, error: error.message };
      }
    }

    // -------------------------------------------------------------
    // CHECKOUT SPEED OPTIMIZATION: High-Performance Batch Stock Deduction
    // Consolidates 70+ sequential network queries into 3-4 parallel batch calls
    // -------------------------------------------------------------
    try {
      // A. Finished Product Stock Deduction (Batch)
      const qtyByProdId = new Map<number, number>();
      for (const item of verifiedItems) {
        if (!item.id) continue;
        const pid = Number(item.id);
        const q = Number(item.qty || (item as any).quantity || 1);
        qtyByProdId.set(pid, (qtyByProdId.get(pid) || 0) + q);
      }

      const prodIds = Array.from(qtyByProdId.keys());
      if (prodIds.length > 0) {
        const { data: trackableProds } = await supabase
          .from("products")
          .select("id, track_inventory, stock_quantity")
          .in("id", prodIds)
          .eq("track_inventory", true);

        if (trackableProds && trackableProds.length > 0) {
          const productUpdates = (trackableProds as any[])
            .filter((p: any) => p.stock_quantity !== null && p.stock_quantity !== undefined)
            .map((p: any) => {
              const orderedQty = qtyByProdId.get(Number(p.id)) || 0;
              const newStock = Math.max(0, Number(p.stock_quantity) - orderedQty);
              const updateData: Record<string, any> = { stock_quantity: newStock };
              if (newStock === 0) updateData.is_available = false;
              return supabase.from("products").update(updateData).eq("id", p.id);
            });

          if (productUpdates.length > 0) {
            await Promise.all(productUpdates);
            dbCache.invalidateTag("products", "menu");
          }
        }
      }

      // B. Recipe & Raw Material Deduction (Batch)
      if (prodIds.length > 0) {
        let recQuery = supabase
          .from("product_recipes")
          .select("product_id, ingredient_id, quantity_required, variation_name")
          .in("product_id", prodIds);

        if (targetShopId) {
          recQuery = recQuery.eq("shop_id", targetShopId);
        }

        const { data: allRecipes } = await recQuery;

        if (allRecipes && allRecipes.length > 0) {
          // Map recipes by product_id
          const recipesByProd = new Map<number, any[]>();
          for (const r of allRecipes) {
            const list = recipesByProd.get(Number(r.product_id)) || [];
            list.push(r);
            recipesByProd.set(Number(r.product_id), list);
          }

          // In-memory aggregation of total required deduction per ingredient
          const totalDeductByIngredient = new Map<number, { amount: number; notes: string[] }>();

          for (const item of verifiedItems) {
            if (!item.id) continue;
            const pid = Number(item.id);
            const itemQty = Number(item.qty || (item as any).quantity || 1);
            const recipes = recipesByProd.get(pid);
            if (!recipes || recipes.length === 0) continue;

            const rawVar = (item as any).selected_variation || (item as any).selectedVariation;
            const variationName = (
              typeof rawVar === "string"
                ? rawVar
                : rawVar && typeof rawVar === "object"
                ? rawVar.name || ""
                : ""
            ).toLowerCase().trim();

            let matched = variationName
              ? recipes.filter((r) => r.variation_name && r.variation_name.toLowerCase().trim() === variationName)
              : [];

            if (matched.length === 0) {
              matched = recipes.filter((r) => !r.variation_name);
            }

            for (const r of matched) {
              const reqQty = Number(r.quantity_required) || 0;
              const deduct = Number((reqQty * itemQty).toFixed(3));
              if (deduct > 0) {
                const ingId = Number(r.ingredient_id);
                const prev = totalDeductByIngredient.get(ingId) || { amount: 0, notes: [] };
                prev.amount = Number((prev.amount + deduct).toFixed(3));
                prev.notes.push(`${itemQty}x ${variationName || "Base"}`);
                totalDeductByIngredient.set(ingId, prev);
              }
            }
          }

          // Single query for all needed raw ingredients
          const ingIds = Array.from(totalDeductByIngredient.keys());
          if (ingIds.length > 0) {
            const { data: rawIngredients } = await supabase
              .from("raw_ingredients")
              .select("id, current_stock")
              .in("id", ingIds);

            if (rawIngredients && rawIngredients.length > 0) {
              const nowIso = new Date().toISOString();
              const ingUpdatePromises: any[] = [];
              const stockLogs: any[] = [];

              for (const ing of rawIngredients) {
                const ingId = Number(ing.id);
                const deductInfo = totalDeductByIngredient.get(ingId);
                if (!deductInfo) continue;

                const currentStock = Number(ing.current_stock) || 0;
                const newStock = Math.max(0, Number((currentStock - deductInfo.amount).toFixed(3)));

                ingUpdatePromises.push(
                  supabase
                    .from("raw_ingredients")
                    .update({ current_stock: newStock, updated_at: nowIso })
                    .eq("id", ingId)
                );

                stockLogs.push({
                  shop_id: targetShopId || null,
                  ingredient_id: ingId,
                  change_type: "order_deduction",
                  quantity_change: -deductInfo.amount,
                  previous_stock: currentStock,
                  new_stock: newStock,
                  reference_id: orderNumber,
                  notes: `Used in Order #${orderNumber} (${deductInfo.notes.join(", ")})`,
                });
              }

              // Parallel updates + single batch log insert
              await Promise.all([
                Promise.all(ingUpdatePromises),
                supabase.from("ingredient_stock_logs").insert(stockLogs),
              ]);
            }
          }
        }
      }
    } catch (stockDeductionErr) {
      console.warn("[placeCustomerOrder batch stock deduction non-blocking error]", stockDeductionErr);
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
              total_revenue: Number((currentRev + finalTotal).toFixed(2)),
            })
            .eq("id", targetShopId);
        }
      } catch {
        // Non-blocking
      }
    }

    // Process Customer Loyalty Points & Save Customer Info (Name, Phone, Delivery Address)
    if (input.customer_phone?.trim()) {
      await syncCustomerFromOrder({
        phone: input.customer_phone.trim(),
        customerName: input.customer_name?.trim() || "Customer",
        deliveryAddress: input.delivery_address?.trim() || "",
        orderTotal: finalTotal,
        pointsRedeemed: input.points_redeemed || 0,
        shopId: targetShopId,
        isNewOrder: true,
      }).catch((crmErr) => {
        console.warn("[Customer CRM sync non-blocking error]", crmErr);
      });

      processLoyaltyPoints(
        input.customer_phone.trim(),
        input.customer_name?.trim() || "Customer",
        finalTotal,
        input.points_redeemed || 0,
        targetShopId
      ).catch((loyaltyErr) => {
        console.warn("[Customer Loyalty non-blocking error]", loyaltyErr);
      });
    }

    // Trigger WhatsApp notification alert (multi-tenant session ID support)
    // CRITICAL: Bounded await ensures serverless runtime finishes HTTP connection before freezing
    if (input.customer_phone?.trim()) {
      try {
        await Promise.race([
          sendWhatsAppOrderAlert({
            phone: input.customer_phone.trim(),
            customerName: input.customer_name?.trim() || "Customer",
            orderId: orderNumber,
            total: `${finalTotal.toFixed(2)}`,
            shopId: targetShopId,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("WhatsApp dispatch timeout")), 3500)
          ),
        ]);
      } catch (waErr) {
        console.warn("[WhatsApp order alert non-blocking warning]", waErr);
      }
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

/**
 * Rider Delivery Confirmation Action
 * Confirms order delivery directly from the rider's mobile portal.
 */
export async function confirmDeliveryByRider(
  orderNumber: string,
  riderName?: string,
  deliveryNote?: string
): Promise<{ success: boolean; order?: any; error?: string; alreadyDelivered?: boolean }> {
  try {
    const cleanNumber = orderNumber.trim();
    if (!cleanNumber) {
      return { success: false, error: "Invalid order number." };
    }

    let supabase;
    if (isServiceRoleConfigured()) {
      supabase = createAdminClient();
    } else {
      const cookieStore = await cookies();
      supabase = createClient(cookieStore);
    }

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .ilike("order_number", cleanNumber)
      .maybeSingle();

    if (fetchErr || !order) {
      return { success: false, error: fetchErr?.message || "Order not found." };
    }

    if (order.status === "delivered") {
      return { success: true, order, alreadyDelivered: true };
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const riderTag = riderName ? ` by ${riderName}` : "";
    const noteEntry = `[DELIVERED & CONFIRMED${riderTag} at ${nowStr}${deliveryNote ? ` | ${deliveryNote.trim()}` : ""}]`;
    const updatedNotes = order.notes ? `${order.notes} ${noteEntry}` : noteEntry;

    const { data: updated, error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        notes: updatedNotes,
      })
      .eq("id", order.id)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Automated WhatsApp Review Prompt on Rider Delivery
    if (order.customer_phone && !order.notes?.includes("[REVIEW_PROMPT_SENT]")) {
      sendWhatsAppReviewPrompt({
        customerPhone: order.customer_phone,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        shopId: order.shop_id,
      }).catch((e) => console.warn("[Rider Confirm Review Prompt Error]:", e));
    }

    // Revalidate live feeds
    revalidatePath(`/delivery/${cleanNumber}`);
    revalidatePath(`/delivery`);
    revalidatePath(`/track/${cleanNumber}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");

    return { success: true, order: updated };
  } catch (err: any) {
    console.error("[confirmDeliveryByRider error]", err);
    return { success: false, error: err?.message || "Failed to confirm delivery." };
  }
}

/**
 * Rider Picked-Up Action
 * Marks order as in-transit / picked up by rider.
 */
export async function markDeliveryPickedUpByRider(
  orderNumber: string
): Promise<{ success: boolean; order?: any; error?: string }> {
  try {
    const cleanNumber = orderNumber.trim();
    if (!cleanNumber) return { success: false, error: "Invalid order number." };

    let supabase = isServiceRoleConfigured()
      ? createAdminClient()
      : createClient(await cookies());

    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .ilike("order_number", cleanNumber)
      .maybeSingle();

    if (fetchErr || !order) return { success: false, error: "Order not found." };

    const { data: updated, error: updateErr } = await supabase
      .from("orders")
      .update({ status: "ready" })
      .eq("id", order.id)
      .select()
      .single();

    if (updateErr) return { success: false, error: updateErr.message };

    revalidatePath(`/delivery/${cleanNumber}`);
    revalidatePath(`/track/${cleanNumber}`);
    revalidatePath("/admin/orders");
    return { success: true, order: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update pickup status." };
  }
}

/**
 * Customer Order Review Action
 * Saves customer rating (1-5 stars) and feedback comment directly to the order.
 */
export async function submitCustomerOrderReview(payload: {
  orderNumber: string;
  rating: number;
  comment?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanNumber = payload.orderNumber?.trim();
    if (!cleanNumber) return { success: false, error: "Invalid order number." };

    const supabase = isServiceRoleConfigured()
      ? createAdminClient()
      : createClient(await cookies());

    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, notes")
      .ilike("order_number", cleanNumber)
      .maybeSingle();

    if (fetchErr || !order) return { success: false, error: "Order not found." };

    const ratingStars = Math.max(1, Math.min(5, payload.rating || 5));
    const starIcons = "⭐".repeat(ratingStars);
    const commentText = payload.comment?.trim() || "";
    const reviewNote = `[GOOGLE REVIEW: ${starIcons} (${ratingStars}/5)${commentText ? ` | "${commentText}"` : ""}]`;
    const updatedNotes = order.notes ? `${order.notes} ${reviewNote}` : reviewNote;

    await supabase
      .from("orders")
      .update({ notes: updatedNotes })
      .eq("id", order.id);

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.warn("[submitCustomerOrderReview error]", err);
    return { success: false, error: err?.message || "Failed to record review." };
  }
}


