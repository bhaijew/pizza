"use server";

import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { formatWhatsAppPhone } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  discountAmount: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  message: string;
}

export interface CustomerLoyaltyInfo {
  phone: string;
  customerName?: string;
  pointsBalance: number;
  rupeeValue: number;
  totalOrders: number;
  totalSpent: number;
}

// In-memory default fallbacks if database table migration pending
const FALLBACK_PROMOS = [
  { code: "WELCOME20", discountType: "percentage", value: 20, minSubtotal: 500, maxDiscount: 400 },
  { code: "FLAT100", discountType: "fixed", value: 100, minSubtotal: 800, maxDiscount: 100 },
  { code: "PIZZA500", discountType: "fixed", value: 500, minSubtotal: 2500, maxDiscount: 500 },
];

/**
 * Validate promo coupon code against active rules
 */
export async function validatePromoCode(
  rawCode: string,
  subtotal: number,
  shopId?: number | null
): Promise<PromoValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, discountAmount: 0, message: "Please enter a promo code." };
  }

  if (subtotal <= 0) {
    return { valid: false, discountAmount: 0, message: "Your cart is empty." };
  }

  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      let query = db
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true);

      if (shopId) {
        query = query.or(`shop_id.eq.${shopId},shop_id.is.null`);
      }

      const { data: promo, error } = await query.maybeSingle();

      if (!error && promo) {
        // Check expiry date
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
          return { valid: false, discountAmount: 0, message: "This coupon code has expired." };
        }

        // Check usage limit
        if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
          return { valid: false, discountAmount: 0, message: "This coupon has reached its maximum usage limit." };
        }

        // Check minimum subtotal requirement
        const minReq = Number(promo.min_order_amount) || 0;
        if (subtotal < minReq) {
          return {
            valid: false,
            discountAmount: 0,
            message: `Minimum order amount of Rs. ${minReq} required for coupon "${code}".`,
          };
        }

        let discount = 0;
        if (promo.discount_type === "percentage") {
          discount = (subtotal * Number(promo.discount_value)) / 100;
          if (promo.max_discount_amount) {
            discount = Math.min(discount, Number(promo.max_discount_amount));
          }
        } else {
          discount = Math.min(subtotal, Number(promo.discount_value));
        }

        discount = Number(discount.toFixed(2));

        return {
          valid: true,
          code: promo.code,
          discountAmount: discount,
          discountType: promo.discount_type,
          discountValue: Number(promo.discount_value),
          message: `Coupon "${promo.code}" applied! You saved Rs. ${discount}.`,
        };
      }
    } catch (err) {
      console.warn("[validatePromoCode] DB lookup error, checking fallbacks:", err);
    }
  }

  // Check fallback promo codes
  const match = FALLBACK_PROMOS.find((p) => p.code === code);
  if (match) {
    if (subtotal < match.minSubtotal) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order amount of Rs. ${match.minSubtotal} required for coupon "${code}".`,
      };
    }

    let discount = 0;
    if (match.discountType === "percentage") {
      discount = (subtotal * match.value) / 100;
      if (match.maxDiscount) discount = Math.min(discount, match.maxDiscount);
    } else {
      discount = Math.min(subtotal, match.value);
    }
    discount = Number(discount.toFixed(2));

    return {
      valid: true,
      code: match.code,
      discountAmount: discount,
      discountType: match.discountType as any,
      discountValue: match.value,
      message: `Coupon "${match.code}" applied! You saved Rs. ${discount}.`,
    };
  }

  return { valid: false, discountAmount: 0, message: `Invalid coupon code "${code}".` };
}

/**
 * Look up customer loyalty points balance by phone number
 */
export async function lookupCustomerLoyalty(
  rawPhone: string,
  shopId?: number | null
): Promise<CustomerLoyaltyInfo | null> {
  const cleanPhone = formatWhatsAppPhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 10) return null;

  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      let query = db.from("customer_loyalty").select("*").eq("phone", cleanPhone);
      if (shopId) {
        query = query.or(`shop_id.eq.${shopId},shop_id.is.null`);
      }

      const { data: record, error } = await query.maybeSingle();
      if (!error && record) {
        const points = Number(record.points_balance) || 0;
        return {
          phone: cleanPhone,
          customerName: record.customer_name || "Valued Customer",
          pointsBalance: points,
          rupeeValue: points, // 1 point = Rs. 1
          totalOrders: Number(record.total_orders) || 0,
          totalSpent: Number(record.total_spent) || 0,
        };
      }
    } catch {
      // Table may be pending migration
    }
  }

  return null;
}

/**
 * Record loyalty points earned and redeemed upon order completion
 */
export async function processLoyaltyPoints(
  rawPhone: string,
  customerName: string,
  orderTotal: number,
  pointsRedeemed: number = 0,
  shopId?: number | null
): Promise<{ earned: number; newBalance: number }> {
  const cleanPhone = formatWhatsAppPhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 10) return { earned: 0, newBalance: 0 };

  // Earn 1 point per Rs. 50 spent (2% cashback equivalent)
  const earned = Math.max(0, Math.floor(orderTotal / 50));

  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      const { data: existing } = await db
        .from("customer_loyalty")
        .select("*")
        .eq("phone", cleanPhone)
        .maybeSingle();

      const prevPoints = Number(existing?.points_balance) || 0;
      const prevOrders = Number(existing?.total_orders) || 0;
      const prevSpent = Number(existing?.total_spent) || 0;

      const newBalance = Math.max(0, prevPoints - pointsRedeemed) + earned;

      await db.from("customer_loyalty").upsert({
        phone: cleanPhone,
        customer_name: customerName,
        points_balance: newBalance,
        total_orders: prevOrders + 1,
        total_spent: Number((prevSpent + orderTotal).toFixed(2)),
        shop_id: shopId || null,
        updated_at: new Date().toISOString(),
      });

      return { earned, newBalance };
    } catch (err) {
      console.warn("[processLoyaltyPoints] Non-blocking loyalty update error:", err);
    }
  }

  return { earned, newBalance: earned };
}

/**
 * Admin: Fetch all promo codes
 */
export async function fetchAdminPromoCodes(shopId?: number | null) {
  if (!isServiceRoleConfigured()) return [];
  try {
    const db = createAdminClient();
    let query = db.from("promo_codes").select("*").order("created_at", { ascending: false });
    if (shopId) {
      query = query.or(`shop_id.eq.${shopId},shop_id.is.null`);
    }
    const { data } = await query;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Admin: Create a new promo code
 */
export async function createPromoCode(formData: FormData): Promise<{ error: string | null; success: boolean }> {
  if (!isServiceRoleConfigured()) return { error: "Database not configured.", success: false };

  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const description = (formData.get("description") as string)?.trim() || null;
  const discount_type = (formData.get("discount_type") as "percentage" | "fixed") || "fixed";
  const discount_value = Number(formData.get("discount_value")) || 0;
  const min_order_amount = Number(formData.get("min_order_amount")) || 0;
  const max_discount_amount = Number(formData.get("max_discount_amount")) || null;
  const usage_limit = Number(formData.get("usage_limit")) || 500;

  if (!code || discount_value <= 0) {
    return { error: "Coupon code and positive discount value are required.", success: false };
  }

  try {
    const db = createAdminClient();
    const { error } = await db.from("promo_codes").insert({
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      is_active: true,
    });

    if (error) return { error: error.message, success: false };
    revalidatePath("/admin/promos");
    return { error: null, success: true };
  } catch (err: any) {
    return { error: err.message, success: false };
  }
}
