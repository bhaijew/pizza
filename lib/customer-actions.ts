"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { getActiveShopContext } from "@/lib/admin-actions";

export interface CustomerOrderSummary {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  orderType: string;
  createdAt: string;
  deliveryAddress: string | null;
  items: {
    name: string;
    qty: number;
    price: number;
    detail?: string;
  }[];
}

export interface CustomerRecord {
  phone: string;
  customerName: string;
  deliveryAddress: string;
  alternateAddresses: string[];
  notes: string;
  pointsBalance: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  lastOrderNumber: string | null;
  shopId: number | null;
  orders: CustomerOrderSummary[];
}

interface CrmCustomerMeta {
  phone: string;
  customerName?: string;
  deliveryAddress?: string;
  notes?: string;
  pointsBalance?: number;
  totalOrders?: number;
  totalSpent?: number;
  shopId?: number | null;
  updatedAt?: string;
  deleted?: boolean;
}

/**
 * Normalizes Pakistani & international phone numbers to a canonical key.
 * E.g. "923334867615" -> "03334867615", "+92 333 4867615" -> "03334867615"
 */
function normalizeCustomerPhone(raw?: string | null): {
  canonical: string;
  whatsapp: string;
  rawDigits: string;
} {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) {
    return { canonical: "", whatsapp: "", rawDigits: "" };
  }

  // Convert 923XXXXXXXXX -> 03XXXXXXXXX for canonical local representation
  if (digits.startsWith("92") && digits.length >= 11) {
    const local = "0" + digits.slice(2);
    return { canonical: local, whatsapp: digits, rawDigits: digits };
  }

  // Convert 03XXXXXXXXX -> 923XXXXXXXXX for WhatsApp representation
  if (digits.startsWith("0") && digits.length >= 10) {
    const wa = "92" + digits.slice(1);
    return { canonical: digits, whatsapp: wa, rawDigits: digits };
  }

  // Convert 3XXXXXXXXX (10 digits) -> 03XXXXXXXXX
  if (digits.startsWith("3") && digits.length === 10) {
    return { canonical: "0" + digits, whatsapp: "92" + digits, rawDigits: digits };
  }

  return { canonical: digits, whatsapp: digits, rawDigits: digits };
}

/**
 * Extracts delivery address from an order row (checks delivery_address column first, then [DELIVERY: ...] in notes)
 */
function extractOrderAddress(order: any): string {
  if (order?.delivery_address && typeof order.delivery_address === "string" && order.delivery_address.trim()) {
    return order.delivery_address.trim();
  }
  const notes = typeof order?.notes === "string" ? order.notes : "";
  const match = notes.match(/\[DELIVERY:\s*Address:\s*([^|\]]+)/i);
  if (match && match[1]) {
    const addr = match[1].trim();
    if (addr && addr.toLowerCase() !== "n/a") {
      return addr;
    }
  }
  return "";
}

/**
 * Extracts phone from an order row (checks customer_phone column first, then notes)
 */
function extractOrderPhone(order: any): string {
  if (order?.customer_phone && typeof order.customer_phone === "string" && order.customer_phone.trim()) {
    return order.customer_phone.trim();
  }
  const notes = typeof order?.notes === "string" ? order.notes : "";
  const match = notes.match(/Phone:\s*([0-9+\-\s]{7,16})/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return "";
}

/**
 * Infers order type from order row
 */
function inferOrderType(order: any): string {
  if (order?.order_type) return String(order.order_type);
  const notes = typeof order?.notes === "string" ? order.notes : "";
  if (notes.includes("[DELIVERY:") || order?.delivery_address) return "delivery";
  if (notes.includes("[TAKEAWAY:") || order?.token_number) return "takeaway";
  if (order?.table_number) return "dine_in";
  return "walk_in";
}

/**
 * Reads saved CRM customer metadata from shops.feature_flags.crm_customers or shop_settings.feature_flags.crm_customers
 */
async function readCrmMetaMap(
  db: ReturnType<typeof createAdminClient>,
  shopId?: number | null
): Promise<Record<string, CrmCustomerMeta>> {
  const result: Record<string, CrmCustomerMeta> = {};

  try {
    if (shopId) {
      const { data: shop } = await db
        .from("shops")
        .select("feature_flags")
        .eq("id", shopId)
        .maybeSingle();
      const map = shop?.feature_flags?.crm_customers;
      if (map && typeof map === "object") {
        Object.assign(result, map);
      }
    } else {
      // Master admin view: merge from shop_settings and all shops
      const { data: settings } = await db
        .from("shop_settings")
        .select("feature_flags")
        .eq("id", "main")
        .maybeSingle();
      if (settings?.feature_flags?.crm_customers && typeof settings.feature_flags.crm_customers === "object") {
        Object.assign(result, settings.feature_flags.crm_customers);
      }

      const { data: shops } = await db.from("shops").select("id, feature_flags");
      if (Array.isArray(shops)) {
        for (const s of shops) {
          const map = s?.feature_flags?.crm_customers;
          if (map && typeof map === "object") {
            for (const [k, v] of Object.entries(map)) {
              result[k] = { ...(v as CrmCustomerMeta), shopId: (v as CrmCustomerMeta)?.shopId ?? s.id };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[readCrmMetaMap warning]:", err);
  }

  return result;
}

/**
 * Writes/merges a single customer's CRM metadata into feature_flags.crm_customers
 */
async function writeCrmMetaEntry(
  db: ReturnType<typeof createAdminClient>,
  canonicalPhone: string,
  entry: CrmCustomerMeta,
  shopId?: number | null
): Promise<void> {
  if (!canonicalPhone) return;

  try {
    if (shopId) {
      const { data: shop } = await db
        .from("shops")
        .select("feature_flags")
        .eq("id", shopId)
        .maybeSingle();
      const flags = shop?.feature_flags && typeof shop.feature_flags === "object" ? { ...shop.feature_flags } : {};
      const crmMap = flags.crm_customers && typeof flags.crm_customers === "object" ? { ...flags.crm_customers } : {};
      crmMap[canonicalPhone] = {
        ...(crmMap[canonicalPhone] || {}),
        ...entry,
        phone: canonicalPhone,
        shopId,
        updatedAt: new Date().toISOString(),
      };
      flags.crm_customers = crmMap;
      await db.from("shops").update({ feature_flags: flags }).eq("id", shopId);
    } else {
      const { data: settings } = await db
        .from("shop_settings")
        .select("feature_flags")
        .eq("id", "main")
        .maybeSingle();
      const flags =
        settings?.feature_flags && typeof settings.feature_flags === "object" ? { ...settings.feature_flags } : {};
      const crmMap = flags.crm_customers && typeof flags.crm_customers === "object" ? { ...flags.crm_customers } : {};
      crmMap[canonicalPhone] = {
        ...(crmMap[canonicalPhone] || {}),
        ...entry,
        phone: canonicalPhone,
        updatedAt: new Date().toISOString(),
      };
      flags.crm_customers = crmMap;
      await db.from("shop_settings").update({ feature_flags: flags }).eq("id", "main");
    }
  } catch (err) {
    console.warn("[writeCrmMetaEntry warning]:", err);
  }
}

/**
 * Automatically saves/syncs Customer Name, Phone, and Delivery Address whenever an order
 * is placed, recreated, or edited.
 */
export async function syncCustomerFromOrder(params: {
  phone?: string | null;
  customerName?: string | null;
  deliveryAddress?: string | null;
  orderTotal?: number;
  pointsRedeemed?: number;
  shopId?: number | null;
  isNewOrder?: boolean;
}): Promise<{ success: boolean }> {
  if (!isServiceRoleConfigured()) return { success: false };

  const { canonical, whatsapp } = normalizeCustomerPhone(params.phone);
  if (!canonical || canonical.length < 7) {
    return { success: false };
  }

  const db = createAdminClient();
  const cleanName = (params.customerName || "").trim();
  const cleanAddress = (params.deliveryAddress || "").trim();
  const orderTotal = Math.max(0, Number(params.orderTotal) || 0);
  const pointsRedeemed = Math.max(0, Number(params.pointsRedeemed) || 0);
  const earnedPoints = params.isNewOrder ? Math.floor(orderTotal / 100) : 0;

  try {
    // 1. Check existing customer_loyalty row (match canonical 03... or whatsapp 923...)
    const phoneCandidates = Array.from(new Set([canonical, whatsapp].filter(Boolean)));
    const { data: existingRows } = await db
      .from("customer_loyalty")
      .select("*")
      .in("phone", phoneCandidates);

    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;
    const targetPhoneKey = existing?.phone || canonical;

    const currentPoints = existing ? Number(existing.points_balance) || 0 : 0;
    const currentOrders = existing ? Number(existing.total_orders) || 0 : 0;
    const currentSpent = existing ? Number(existing.total_spent) || 0 : 0;

    const newPoints = params.isNewOrder
      ? Math.max(0, currentPoints - pointsRedeemed + earnedPoints)
      : currentPoints;
    const newTotalOrders = params.isNewOrder ? currentOrders + 1 : Math.max(1, currentOrders);
    const newTotalSpent = params.isNewOrder ? currentSpent + orderTotal : Math.max(orderTotal, currentSpent);

    const resolvedName =
      cleanName && cleanName.toLowerCase() !== "walk-in customer" && cleanName.toLowerCase() !== "customer"
        ? cleanName
        : existing?.customer_name || cleanName || "Valued Customer";

    const resolvedAddress = cleanAddress || (existing as any)?.delivery_address || "";

    // Upsert into customer_loyalty (try with delivery_address first, fallback to standard columns)
    const loyaltyPayload: Record<string, any> = {
      phone: targetPhoneKey,
      customer_name: resolvedName,
      points_balance: newPoints,
      total_orders: newTotalOrders,
      total_spent: Number(newTotalSpent.toFixed(2)),
      shop_id: params.shopId ?? existing?.shop_id ?? null,
      updated_at: new Date().toISOString(),
    };

    if (resolvedAddress) {
      loyaltyPayload.delivery_address = resolvedAddress;
    }

    const { error: upsertErr } = await db
      .from("customer_loyalty")
      .upsert(loyaltyPayload, { onConflict: "phone" });

    if (upsertErr && upsertErr.message.includes("delivery_address")) {
      delete loyaltyPayload.delivery_address;
      await db.from("customer_loyalty").upsert(loyaltyPayload, { onConflict: "phone" });
    }

    // 2. Also persist Name, Phone, and Delivery Address in CRM feature_flags store
    const crmMap = await readCrmMetaMap(db, params.shopId);
    const existingMeta = crmMap[canonical] || {};

    await writeCrmMetaEntry(
      db,
      canonical,
      {
        phone: canonical,
        customerName:
          cleanName && cleanName.toLowerCase() !== "walk-in customer"
            ? cleanName
            : existingMeta.customerName || resolvedName,
        deliveryAddress: cleanAddress || existingMeta.deliveryAddress || resolvedAddress,
        notes: existingMeta.notes || "",
        pointsBalance: newPoints,
        totalOrders: newTotalOrders,
        totalSpent: Number(newTotalSpent.toFixed(2)),
        shopId: params.shopId ?? existingMeta.shopId ?? null,
        deleted: false,
      },
      params.shopId
    );

    return { success: true };
  } catch (err) {
    console.warn("[syncCustomerFromOrder error]:", err);
    return { success: false };
  }
}

/**
 * Fetches unified Customer Info directory for the Admin Panel (/admin/customers).
 * Combines:
 *   1. All orders from `public.orders` (extracting customer_name, customer_phone, delivery_address, order history)
 *   2. All records from `public.customer_loyalty`
 *   3. All saved CRM overrides from `feature_flags.crm_customers`
 */
export async function fetchAdminCustomers(shopIdParam?: number | null): Promise<CustomerRecord[]> {
  if (!isServiceRoleConfigured()) return [];

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();
    const effectiveShopId = shopIdParam !== undefined ? shopIdParam : activeShop.shopId;

    // 1. Fetch orders
    let ordersQuery = db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (effectiveShopId) {
      ordersQuery = ordersQuery.eq("shop_id", effectiveShopId);
    }

    // 2. Fetch customer_loyalty
    let loyaltyQuery = db
      .from("customer_loyalty")
      .select("*")
      .order("updated_at", { ascending: false });

    if (effectiveShopId) {
      loyaltyQuery = loyaltyQuery.or(`shop_id.eq.${effectiveShopId},shop_id.is.null`);
    }

    const [{ data: ordersData }, { data: loyaltyData }, crmMetaMap] = await Promise.all([
      ordersQuery,
      loyaltyQuery,
      readCrmMetaMap(db, effectiveShopId),
    ]);

    const customerMap = new Map<
      string,
      {
        phone: string;
        names: string[];
        addresses: string[];
        notes: string;
        pointsBalance: number;
        loyaltyOrders: number;
        loyaltySpent: number;
        shopId: number | null;
        orders: CustomerOrderSummary[];
        updatedAt: string;
      }
    >();

    const ensureEntry = (canonicalPhone: string, defaultShopId: number | null = effectiveShopId ?? null) => {
      if (!customerMap.has(canonicalPhone)) {
        customerMap.set(canonicalPhone, {
          phone: canonicalPhone,
          names: [],
          addresses: [],
          notes: "",
          pointsBalance: 0,
          loyaltyOrders: 0,
          loyaltySpent: 0,
          shopId: defaultShopId,
          orders: [],
          updatedAt: "",
        });
      }
      return customerMap.get(canonicalPhone)!;
    };

    // Process orders first (already sorted newest -> oldest)
    if (Array.isArray(ordersData)) {
      for (const ord of ordersData) {
        const rawPhone = extractOrderPhone(ord);
        const { canonical } = normalizeCustomerPhone(rawPhone);
        if (!canonical || canonical.length < 7) continue;

        const entry = ensureEntry(canonical, ord.shop_id ?? effectiveShopId ?? null);

        const ordName = typeof ord.customer_name === "string" ? ord.customer_name.trim() : "";
        if (
          ordName &&
          ordName.toLowerCase() !== "walk-in customer" &&
          ordName.toLowerCase() !== "customer" &&
          !entry.names.includes(ordName)
        ) {
          entry.names.push(ordName);
        }

        const ordAddr = extractOrderAddress(ord);
        if (ordAddr && !entry.addresses.some((a) => a.toLowerCase() === ordAddr.toLowerCase())) {
          entry.addresses.push(ordAddr);
        }

        const rawItems = Array.isArray(ord.items) ? ord.items : [];
        const parsedItems = rawItems.map((it: any) => ({
          name: it?.name || "Item",
          qty: Number(it?.qty || it?.quantity || 1),
          price: Number(it?.price || 0),
          detail:
            it?.detail ||
            (it?.selected_variation
              ? typeof it.selected_variation === "object"
                ? it.selected_variation.name
                : String(it.selected_variation)
              : undefined),
        }));

        entry.orders.push({
          id: Number(ord.id),
          orderNumber: ord.order_number || `#${ord.id}`,
          total: Number(ord.total) || 0,
          status: ord.status || "pending",
          orderType: inferOrderType(ord),
          createdAt: ord.created_at || new Date().toISOString(),
          deliveryAddress: ordAddr || null,
          items: parsedItems,
        });

        if (!entry.updatedAt || new Date(ord.created_at) > new Date(entry.updatedAt)) {
          entry.updatedAt = ord.created_at;
        }
      }
    }

    // Process customer_loyalty rows
    if (Array.isArray(loyaltyData)) {
      for (const loy of loyaltyData) {
        const { canonical } = normalizeCustomerPhone(loy.phone);
        if (!canonical || canonical.length < 7) continue;

        // If scoped to a specific shopId and this loyalty row has shop_id = null,
        // only include it if it either matches an order in this shop OR is in this shop's crmMetaMap
        if (effectiveShopId && !loy.shop_id && !customerMap.has(canonical) && !crmMetaMap[canonical]) {
          continue;
        }

        const entry = ensureEntry(canonical, loy.shop_id ?? effectiveShopId ?? null);

        const loyName = typeof loy.customer_name === "string" ? loy.customer_name.trim() : "";
        if (
          loyName &&
          loyName.toLowerCase() !== "walk-in customer" &&
          loyName.toLowerCase() !== "valued customer" &&
          !entry.names.includes(loyName)
        ) {
          entry.names.push(loyName);
        }

        const loyAddr = typeof (loy as any).delivery_address === "string" ? (loy as any).delivery_address.trim() : "";
        if (loyAddr && !entry.addresses.some((a) => a.toLowerCase() === loyAddr.toLowerCase())) {
          entry.addresses.push(loyAddr);
        }

        entry.pointsBalance = Math.max(entry.pointsBalance, Number(loy.points_balance) || 0);
        entry.loyaltyOrders = Math.max(entry.loyaltyOrders, Number(loy.total_orders) || 0);
        entry.loyaltySpent = Math.max(entry.loyaltySpent, Number(loy.total_spent) || 0);
        if (!entry.updatedAt && loy.updated_at) {
          entry.updatedAt = loy.updated_at;
        }
      }
    }

    // Process CRM metadata overrides (manual edits / additions)
    for (const [phoneKey, meta] of Object.entries(crmMetaMap)) {
      const { canonical } = normalizeCustomerPhone(phoneKey);
      if (!canonical) continue;

      if (meta.deleted) {
        customerMap.delete(canonical);
        continue;
      }

      const entry = ensureEntry(canonical, meta.shopId ?? effectiveShopId ?? null);
      if (meta.customerName && meta.customerName.trim()) {
        // Put manually saved name at the front
        entry.names = [meta.customerName.trim(), ...entry.names.filter((n) => n !== meta.customerName!.trim())];
      }
      if (meta.deliveryAddress && meta.deliveryAddress.trim()) {
        entry.addresses = [
          meta.deliveryAddress.trim(),
          ...entry.addresses.filter((a) => a.toLowerCase() !== meta.deliveryAddress!.trim().toLowerCase()),
        ];
      }
      if (meta.notes !== undefined) {
        entry.notes = meta.notes;
      }
      if (typeof meta.pointsBalance === "number") {
        entry.pointsBalance = meta.pointsBalance;
      }
      if (!entry.updatedAt && meta.updatedAt) {
        entry.updatedAt = meta.updatedAt;
      }
    }

    // Build final sorted array
    const results: CustomerRecord[] = [];

    for (const entry of customerMap.values()) {
      const validOrders = entry.orders.filter((o) => o.status !== "cancelled");
      const calculatedOrdersCount = validOrders.length;
      const calculatedSpent = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      const totalOrders = Math.max(calculatedOrdersCount, entry.loyaltyOrders);
      const totalSpent = calculatedOrdersCount > 0 ? calculatedSpent : entry.loyaltySpent;
      const pointsBalance =
        entry.pointsBalance > 0 ? entry.pointsBalance : Math.floor(totalSpent / 100);

      const latestOrder = entry.orders[0] || null;
      const primaryName = entry.names[0] || "Valued Customer";
      const primaryAddress = entry.addresses[0] || "";
      const alternateAddresses = entry.addresses.slice(1);

      results.push({
        phone: entry.phone,
        customerName: primaryName,
        deliveryAddress: primaryAddress,
        alternateAddresses,
        notes: entry.notes || "",
        pointsBalance,
        totalOrders,
        totalSpent: Number(totalSpent.toFixed(2)),
        lastOrderAt: latestOrder?.createdAt || entry.updatedAt || null,
        lastOrderNumber: latestOrder?.orderNumber || null,
        shopId: entry.shopId,
        orders: entry.orders,
      });
    }

    results.sort((a, b) => {
      const timeA = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
      const timeB = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
      return timeB - timeA;
    });

    return results;
  } catch (err) {
    console.error("[fetchAdminCustomers error]:", err);
    return [];
  }
}

/**
 * Create or Edit a Customer record from the Admin Customer Info page.
 * Updates customer_loyalty, CRM metadata, and syncs matching orders.
 */
export async function upsertAdminCustomer(input: {
  phone: string;
  originalPhone?: string;
  customerName: string;
  deliveryAddress: string;
  notes?: string;
  pointsBalance?: number;
  shopId?: number | null;
}): Promise<{ success: boolean; error: string | null }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Supabase service role key is not configured." };
  }

  const { canonical, whatsapp } = normalizeCustomerPhone(input.phone);
  if (!canonical || canonical.length < 7) {
    return { success: false, error: "Please enter a valid phone number." };
  }

  const cleanName = input.customerName.trim() || "Valued Customer";
  const cleanAddress = input.deliveryAddress.trim();
  const cleanNotes = (input.notes || "").trim();

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();
    const effectiveShopId = input.shopId !== undefined ? input.shopId : activeShop.shopId;

    // If phone number was changed during edit, clean up old phone entry
    if (input.originalPhone) {
      const oldNorm = normalizeCustomerPhone(input.originalPhone);
      if (oldNorm.canonical && oldNorm.canonical !== canonical) {
        await db
          .from("customer_loyalty")
          .delete()
          .in("phone", [oldNorm.canonical, oldNorm.whatsapp].filter(Boolean));
        await writeCrmMetaEntry(db, oldNorm.canonical, { phone: oldNorm.canonical, deleted: true }, effectiveShopId);
      }
    }

    // 1. Check existing loyalty record
    const phoneCandidates = Array.from(new Set([canonical, whatsapp].filter(Boolean)));
    const { data: existingRows } = await db
      .from("customer_loyalty")
      .select("*")
      .in("phone", phoneCandidates);
    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;
    const targetPhoneKey = existing?.phone || canonical;

    const resolvedPoints =
      input.pointsBalance !== undefined
        ? Math.max(0, Number(input.pointsBalance) || 0)
        : Number(existing?.points_balance) || 0;

    const loyaltyPayload: Record<string, any> = {
      phone: targetPhoneKey,
      customer_name: cleanName,
      points_balance: resolvedPoints,
      total_orders: Number(existing?.total_orders) || 0,
      total_spent: Number(existing?.total_spent) || 0,
      shop_id: effectiveShopId ?? existing?.shop_id ?? null,
      updated_at: new Date().toISOString(),
    };

    if (cleanAddress) {
      loyaltyPayload.delivery_address = cleanAddress;
    }

    const { error: loyErr } = await db
      .from("customer_loyalty")
      .upsert(loyaltyPayload, { onConflict: "phone" });

    if (loyErr && loyErr.message.includes("delivery_address")) {
      delete loyaltyPayload.delivery_address;
      await db.from("customer_loyalty").upsert(loyaltyPayload, { onConflict: "phone" });
    }

    // 2. Save in CRM metadata store (persists deliveryAddress & notes reliably)
    await writeCrmMetaEntry(
      db,
      canonical,
      {
        phone: canonical,
        customerName: cleanName,
        deliveryAddress: cleanAddress,
        notes: cleanNotes,
        pointsBalance: resolvedPoints,
        shopId: effectiveShopId,
        deleted: false,
      },
      effectiveShopId
    );

    // 3. Also update matching orders where customer_name or delivery_address is missing or needs sync
    const matchPhones = Array.from(
      new Set([
        canonical,
        whatsapp,
        input.originalPhone ? normalizeCustomerPhone(input.originalPhone).canonical : "",
        input.originalPhone ? normalizeCustomerPhone(input.originalPhone).whatsapp : "",
      ].filter(Boolean))
    );

    if (matchPhones.length > 0) {
      let ordUpdateQuery = db
        .from("orders")
        .update({
          customer_name: cleanName,
          customer_phone: canonical,
          ...(cleanAddress ? { delivery_address: cleanAddress } : {}),
        })
        .in("customer_phone", matchPhones);

      if (effectiveShopId) {
        ordUpdateQuery = ordUpdateQuery.eq("shop_id", effectiveShopId);
      }

      await ordUpdateQuery;
    }

    revalidatePath("/admin/customers");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/order-lookup");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to save customer info." };
  }
}

/**
 * Delete a customer record from the CRM & loyalty table.
 */
export async function deleteAdminCustomer(
  phone: string,
  shopId?: number | null
): Promise<{ success: boolean; error: string | null }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Supabase service role key is not configured." };
  }

  const { canonical, whatsapp } = normalizeCustomerPhone(phone);
  if (!canonical) {
    return { success: false, error: "Invalid phone number." };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();
    const effectiveShopId = shopId !== undefined ? shopId : activeShop.shopId;

    await db
      .from("customer_loyalty")
      .delete()
      .in("phone", Array.from(new Set([canonical, whatsapp, phone].filter(Boolean))));

    await writeCrmMetaEntry(
      db,
      canonical,
      {
        phone: canonical,
        deleted: true,
      },
      effectiveShopId
    );

    revalidatePath("/admin/customers");
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete customer." };
  }
}

/**
 * Syncs all historical orders into customer_loyalty & CRM store so every past order's
 * customer name, phone, and address is saved in the database.
 */
export async function syncAllOrdersToCustomers(
  shopId?: number | null
): Promise<{ success: boolean; syncedCount: number; error: string | null }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, syncedCount: 0, error: "Service role not configured." };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();
    const effectiveShopId = shopId !== undefined ? shopId : activeShop.shopId;

    const records = await fetchAdminCustomers(effectiveShopId);
    let syncedCount = 0;

    for (const rec of records) {
      if (!rec.phone) continue;

      const { canonical, whatsapp } = normalizeCustomerPhone(rec.phone);
      const { data: existingRows } = await db
        .from("customer_loyalty")
        .select("phone")
        .in("phone", Array.from(new Set([canonical, whatsapp].filter(Boolean))));

      const targetPhoneKey = existingRows && existingRows.length > 0 ? existingRows[0].phone : canonical;

      const payload: Record<string, any> = {
        phone: targetPhoneKey,
        customer_name: rec.customerName || "Valued Customer",
        points_balance: rec.pointsBalance,
        total_orders: rec.totalOrders,
        total_spent: rec.totalSpent,
        shop_id: rec.shopId ?? effectiveShopId ?? null,
        updated_at: new Date().toISOString(),
      };

      await db.from("customer_loyalty").upsert(payload, { onConflict: "phone" });

      await writeCrmMetaEntry(
        db,
        canonical,
        {
          phone: canonical,
          customerName: rec.customerName,
          deliveryAddress: rec.deliveryAddress,
          notes: rec.notes,
          pointsBalance: rec.pointsBalance,
          totalOrders: rec.totalOrders,
          totalSpent: rec.totalSpent,
          shopId: rec.shopId ?? effectiveShopId ?? null,
          deleted: false,
        },
        rec.shopId ?? effectiveShopId ?? null
      );

      syncedCount++;
    }

    revalidatePath("/admin/customers");
    return { success: true, syncedCount, error: null };
  } catch (err: any) {
    return { success: false, syncedCount: 0, error: err?.message || "Failed to sync orders." };
  }
}
