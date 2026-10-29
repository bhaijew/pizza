"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import {
  sendWhatsAppReviewPrompt,
  sendWhatsAppManagerComplaintAlert,
  formatWhatsAppPhone,
} from "@/lib/whatsapp";

export interface ReviewOrderDetails {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  items: { name: string; qty: number; detail?: string }[];
  total: number;
  orderType: string;
  shopName: string;
  shopSlug?: string;
  shopLogo?: string | null;
  currencySymbol: string;
  googleReviewUrl: string;
  alreadyReviewed: boolean;
  existingRating?: number | null;
}

/**
 * Fetch public order and restaurant details for the review landing page
 */
export async function getReviewOrderDetails(orderNumber: string): Promise<{
  success: boolean;
  data?: ReviewOrderDetails;
  error?: string;
}> {
  try {
    const cleanNumber = orderNumber.trim();
    if (!cleanNumber) {
      return { success: false, error: "Order number is required." };
    }

    if (!isServiceRoleConfigured()) {
      return { success: false, error: "Database service unavailable." };
    }

    const db = createAdminClient();

    // 1. Fetch order
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, items, total, order_type, notes, shop_id, review_rating")
      .ilike("order_number", cleanNumber)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, error: "Order not found." };
    }

    // 2. Fetch associated shop
    let shopName = "SoleWhat Store";
    let shopSlug = "";
    let shopLogo: string | null = null;
    let currencySymbol = "Rs.";
    let googleReviewUrl = "";

    if (order.shop_id) {
      const { data: shop } = await db
        .from("shops")
        .select("id, name, slug, logo_url, currency_symbol, google_review_url")
        .eq("id", order.shop_id)
        .maybeSingle();

      if (shop) {
        if (shop.name) shopName = shop.name;
        if (shop.slug) shopSlug = shop.slug;
        if (shop.logo_url) shopLogo = shop.logo_url;
        if (shop.currency_symbol) currencySymbol = shop.currency_symbol;
        if (shop.google_review_url) googleReviewUrl = shop.google_review_url;
      }
    }

    // Fallback google review URL if shop hasn't set one yet
    if (!googleReviewUrl) {
      googleReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${shopName} Pakistan`
      )}`;
    }

    // Parse items
    let parsedItems: any[] = [];
    if (Array.isArray(order.items)) {
      parsedItems = order.items;
    } else if (typeof order.items === "string") {
      try {
        parsedItems = JSON.parse(order.items);
      } catch {
        parsedItems = [];
      }
    }

    const items = parsedItems.map((it: any) => ({
      name: it.name || it.product_name || "Menu Item",
      qty: Number(it.qty || it.quantity || 1),
      detail: it.detail || (it.selected_variation ? it.selected_variation.name : undefined),
    }));

    // Check if already reviewed
    const alreadyReviewed = Boolean(
      order.review_rating ||
      order.notes?.includes("[REVIEW:") ||
      order.notes?.includes("[CUSTOMER_REVIEW:")
    );

    return {
      success: true,
      data: {
        orderNumber: order.order_number,
        customerName: order.customer_name || "Valued Customer",
        customerPhone: order.customer_phone,
        items,
        total: Number(order.total) || 0,
        orderType: order.order_type || "takeaway",
        shopName,
        shopSlug,
        shopLogo,
        currencySymbol,
        googleReviewUrl,
        alreadyReviewed,
        existingRating: order.review_rating ?? null,
      },
    };
  } catch (err: any) {
    console.error("[getReviewOrderDetails exception]:", err);
    return { success: false, error: err?.message || "Failed to load order review." };
  }
}

export interface SubmitOrderReviewInput {
  orderNumber: string;
  rating: number;
  tags?: string[];
  feedback?: string;
}

/**
 * Submit Customer Review
 * - 4-5 Stars: Direct customer to Google Maps to boost SEO rating
 * - 1-3 Stars (Reputation Guard): Intercept privately, send WhatsApp Red Alert to Manager
 */
export async function submitOrderReview({
  orderNumber,
  rating,
  tags = [],
  feedback = "",
}: SubmitOrderReviewInput): Promise<{
  success: boolean;
  isNegative?: boolean;
  googleReviewUrl?: string;
  error?: string;
  message?: string;
}> {
  try {
    const cleanNumber = orderNumber.trim();
    if (!cleanNumber) {
      return { success: false, error: "Order number is required." };
    }

    const numRating = Math.max(1, Math.min(5, Math.round(Number(rating))));

    if (!isServiceRoleConfigured()) {
      return { success: false, error: "Database service unavailable." };
    }

    const db = createAdminClient();

    // 1. Fetch order & shop
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, notes, shop_id")
      .ilike("order_number", cleanNumber)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, error: "Order not found." };
    }

    let shopName = "SoleWhat Store";
    let ownerPhone = "";
    let googleReviewUrl = "";

    if (order.shop_id) {
      const { data: shop } = await db
        .from("shops")
        .select("name, owner_phone, phone, google_review_url")
        .eq("id", order.shop_id)
        .maybeSingle();

      if (shop) {
        if (shop.name) shopName = shop.name;
        if (shop.owner_phone) ownerPhone = shop.owner_phone;
        else if (shop.phone) ownerPhone = shop.phone;
        if (shop.google_review_url) googleReviewUrl = shop.google_review_url;
      }
    }

    if (!googleReviewUrl) {
      googleReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${shopName} Pakistan`
      )}`;
    }

    const isNegative = numRating <= 3;
    const cleanTags = tags.map((t) => t.trim()).filter(Boolean);
    const cleanFeedback = feedback.trim();

    // 2. Insert into order_reviews table (failsafe)
    try {
      await db.from("order_reviews").insert({
        shop_id: order.shop_id,
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        rating: numRating,
        tags: cleanTags,
        feedback: cleanFeedback,
        is_google_posted: !isNegative,
        alert_sent: isNegative,
        created_at: new Date().toISOString(),
      });
    } catch (insertErr) {
      console.warn("[submitOrderReview] order_reviews table write failed, falling back to orders notes:", insertErr);
    }

    // 3. Cache into orders table
    const noteEntry = `[REVIEW:${numRating}★${cleanTags.length > 0 ? ` | Tags: ${cleanTags.join(",")}` : ""}${
      cleanFeedback ? ` | Note: ${cleanFeedback}` : ""
    }]`;
    const updatedNotes = order.notes ? `${order.notes} ${noteEntry}` : noteEntry;

    await db
      .from("orders")
      .update({
        notes: updatedNotes,
        review_rating: numRating,
        review_feedback: cleanFeedback || null,
        review_tags: cleanTags.length > 0 ? cleanTags : null,
        review_submitted_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // 4. REPUTATION GUARD: If 1-3 stars, send Red Alert to manager
    if (isNegative && ownerPhone) {
      try {
        await sendWhatsAppManagerComplaintAlert({
          managerPhone: ownerPhone,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          rating: numRating,
          tags: cleanTags,
          feedback: cleanFeedback,
          shopId: order.shop_id,
          shopName,
        });
      } catch (alertErr) {
        console.error("[submitOrderReview] Failed to dispatch WhatsApp complaint alert:", alertErr);
      }
    }

    revalidatePath(`/review/${cleanNumber}`);
    revalidatePath(`/track/${cleanNumber}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");

    return {
      success: true,
      isNegative,
      googleReviewUrl: !isNegative ? googleReviewUrl : undefined,
      message: isNegative
        ? "Your feedback has been securely delivered to restaurant management."
        : "Thank you for the 5-star praise!",
    };
  } catch (err: any) {
    console.error("[submitOrderReview exception]:", err);
    return { success: false, error: err?.message || "Failed to submit review." };
  }
}

/**
 * Trigger review prompt WhatsApp alert manually for an order
 */
export async function dispatchReviewPromptAlert(orderNumber: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const cleanNumber = orderNumber.trim();
    if (!cleanNumber || !isServiceRoleConfigured()) {
      return { success: false, error: "Invalid request." };
    }

    const db = createAdminClient();
    const { data: order } = await db
      .from("orders")
      .select("order_number, customer_name, customer_phone, shop_id")
      .ilike("order_number", cleanNumber)
      .maybeSingle();

    if (!order || !order.customer_phone) {
      return { success: false, error: "Order or customer phone not found." };
    }

    const res = await sendWhatsAppReviewPrompt({
      customerPhone: order.customer_phone,
      customerName: order.customer_name,
      orderNumber: order.order_number,
      shopId: order.shop_id,
    });

    return { success: res.success, error: res.error };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to dispatch review prompt." };
  }
}

