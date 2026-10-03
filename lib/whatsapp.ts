/**
 * Multi-Tenant WhatsApp Gateway Service
 * Connects with Railway WhatsApp Gateway:
 * POST https://solewhat-production.up.railway.app/api/messages/{sessionId}/send
 *
 * Each shop/branch can configure its own unique `whatsapp_session_id` and optional `whatsapp_api_key`.
 */

import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";

export interface SendWhatsAppAlertInput {
  phone: string;
  customerName?: string | null;
  orderId: string;
  total: string | number;
  shopId?: number | null;
  currencySymbol?: string;
  customMessage?: string;
}

/**
 * Standardize international phone number format.
 * Examples:
 * - "0300 1234567" -> "923001234567"
 * - "+92 300 1234567" -> "923001234567"
 * - "0312-3456789" -> "923123456789"
 */
export function formatWhatsAppPhone(rawPhone: string): string {
  // Strip all non-digit characters
  let digits = rawPhone.replace(/\D/g, "");

  // If local Pakistani format 03XXXXXXXXX (11 digits starting with 03)
  if (digits.startsWith("03") && digits.length === 11) {
    digits = "92" + digits.slice(1);
  } else if (digits.startsWith("3") && digits.length === 10) {
    // Missing country code and leading 0: 3001234567 -> 923001234567
    digits = "92" + digits;
  }

  return digits;
}

/**
 * Resolve WhatsApp session ID and API key for a given shop.
 * STRICT MULTI-TENANCY: Each shop MUST have its own configured `whatsapp_session_id`.
 * No global fallback is used, ensuring no cross-shop or admin personal number usage.
 */
export async function getShopWhatsAppCredentials(shopId?: number | null): Promise<{
  sessionId: string | null;
  apiKey: string;
  shopName: string;
  currencySymbol: string;
}> {
  const defaultApiKey = process.env.DEFAULT_WHATSAPP_API_KEY || "wag_qF0HVpcLGTxuqGZvBLO1I2057gJUwiV8";

  let sessionId: string | null = null;
  let apiKey = defaultApiKey;
  let shopName = "Pizza Shop";
  let currencySymbol = "Rs.";

  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();

      if (shopId) {
        // Query branch shop credentials STRICTLY for this specific shop
        const { data: shop } = await db
          .from("shops")
          .select("name, currency_symbol, whatsapp_session_id, whatsapp_api_key")
          .eq("id", shopId)
          .maybeSingle();

        if (shop) {
          if (shop.name) shopName = shop.name;
          if (shop.currency_symbol) currencySymbol = shop.currency_symbol;
          // Only use if this specific shop configured it
          if (shop.whatsapp_session_id?.trim()) {
            sessionId = shop.whatsapp_session_id.trim();
          }
          if (shop.whatsapp_api_key?.trim()) {
            apiKey = shop.whatsapp_api_key.trim();
          }
        }
      } else {
        // Query master/single shop settings ONLY
        const { data: settings } = await db
          .from("shop_settings")
          .select("shop_name, currency_symbol, whatsapp_session_id, whatsapp_api_key")
          .eq("id", "main")
          .maybeSingle();

        if (settings) {
          if (settings.shop_name) shopName = settings.shop_name;
          if (settings.currency_symbol) currencySymbol = settings.currency_symbol;
          if (settings.whatsapp_session_id?.trim()) {
            sessionId = settings.whatsapp_session_id.trim();
          }
          if (settings.whatsapp_api_key?.trim()) {
            apiKey = settings.whatsapp_api_key.trim();
          }
        }
      }
    } catch (err) {
      console.warn("[getShopWhatsAppCredentials] Error fetching shop credentials:", err);
    }
  }

  return { sessionId, apiKey, shopName, currencySymbol };
}

/**
 * Send WhatsApp order alert to customer
 */
export async function sendWhatsAppOrderAlert({
  phone,
  customerName,
  orderId,
  total,
  shopId,
  currencySymbol,
  customMessage,
}: SendWhatsAppAlertInput): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!phone || !phone.trim()) {
      return { success: false, error: "No customer phone number provided." };
    }

    const formattedPhone = formatWhatsAppPhone(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      return { success: false, error: `Invalid phone number format: "${phone}"` };
    }

    // Resolve shop-specific session ID and API key
    const config = await getShopWhatsAppCredentials(shopId);
    const targetSessionId = config.sessionId;
    const targetApiKey = config.apiKey;
    const resolvedCurrency = currencySymbol || config.currencySymbol || "Rs.";
    const resolvedShopName = config.shopName || "Pizza Shop";

    // STRICT REQUIREMENT: If this shop has not configured its own session ID, do NOT send
    if (!targetSessionId) {
      console.log(
        `[WhatsApp Alert Skipped] Shop "${resolvedShopName}" (ID: ${shopId ?? "master"}) has NO WhatsApp session ID configured. Each shop must provide its own session ID.`
      );
      return {
        success: false,
        error: `WhatsApp session ID is not configured for shop "${resolvedShopName}". Please set it in Admin Settings.`,
      };
    }

    const gatewayBaseUrl = (
      process.env.WHATSAPP_GATEWAY_URL || "https://solewhat-production.up.railway.app"
    ).replace(/\/+$/, "");

    const endpoint = `${gatewayBaseUrl}/api/messages/${targetSessionId}/send`;

    const formattedTotal = String(total).includes(resolvedCurrency)
      ? String(total)
      : `${resolvedCurrency} ${total}`;

    const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
    const trackingSection = `\n📍 Live Status Tracker:\n${appBaseUrl}/track/${orderId}\n`;

    const defaultMessage = `Salam ${customerName || "Valued Customer"}! 🎉
Your order #${orderId} has been confirmed.
Total: ${formattedTotal}
${trackingSection}
Thank you for shopping with ${resolvedShopName}! We will update you with delivery details soon.`;

    const textToSend = customMessage || defaultMessage;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": targetApiKey,
      },
      body: JSON.stringify({
        to: formattedPhone,
        text: textToSend,
      }),
      signal: AbortSignal.timeout(15000), // 15-second timeout
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        responseData?.message ||
        responseData?.error ||
        `HTTP ${response.status}: Failed to send WhatsApp message`;
      console.error(`[WhatsApp API Error for session ${targetSessionId}]:`, errMsg);
      return { success: false, error: errMsg };
    }

    console.log(`[WhatsApp Success] Alert sent to ${formattedPhone} via session ${targetSessionId}:`, responseData);
    return {
      success: true,
      messageId: responseData?.messageId || responseData?.id,
    };
  } catch (error: any) {
    const errorMsg = error?.message || "Unknown WhatsApp gateway error";
    console.error(`[WhatsApp Gateway Exception]:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

export interface SendWhatsAppRiderAlertInput {
  riderPhone: string;
  riderName: string;
  orderNumber: string;
  deliveryAddress?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  total: string | number;
  shopId?: number | null;
  currencySymbol?: string;
}

/**
 * Dispatch automated WhatsApp message to Rider with complete destination & collection details
 */
export async function sendWhatsAppRiderAlert({
  riderPhone,
  riderName,
  orderNumber,
  deliveryAddress,
  customerName,
  customerPhone,
  total,
  shopId,
  currencySymbol,
}: SendWhatsAppRiderAlertInput): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const curr = currencySymbol || "Rs.";
  const formattedTotal = String(total).includes(curr) ? String(total) : `${curr} ${total}`;

  const message = `Salam ${riderName || "Rider"}! 🛵
New Delivery Order Assigned: #${orderNumber}

📍 Destination: ${deliveryAddress || "Address provided"}
👤 Customer: ${customerName || "Customer"} (${customerPhone || "N/A"})
💵 Cash to Collect: ${formattedTotal}

Please pick up hot order from the kitchen counter now!`;

  return sendWhatsAppOrderAlert({
    phone: riderPhone,
    customerName: riderName,
    orderId: orderNumber,
    total,
    shopId,
    currencySymbol: curr,
    customMessage: message,
  });
}

export interface SendWhatsAppDispatchedAlertInput {
  customerPhone: string;
  customerName?: string | null;
  orderNumber: string;
  riderName: string;
  riderPhone?: string | null;
  shopId?: number | null;
}

/**
 * Notify customer that order is on the way with assigned rider details
 */
export async function sendWhatsAppCustomerDispatchedAlert({
  customerPhone,
  customerName,
  orderNumber,
  riderName,
  riderPhone,
  shopId,
}: SendWhatsAppDispatchedAlertInput): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const message = `Salam ${customerName || "Valued Customer"}! 🍕
Your order #${orderNumber} is now ON THE WAY!

🛵 Rider: ${riderName} ${riderPhone ? `(${riderPhone})` : ""}

📍 Live Tracker:
${appBaseUrl}/track/${orderNumber}

Your hot pizza will reach your doorstep shortly!`;

  return sendWhatsAppOrderAlert({
    phone: customerPhone,
    customerName,
    orderId: orderNumber,
    total: 0,
    shopId,
    customMessage: message,
  });
}
