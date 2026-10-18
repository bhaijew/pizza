"use server";

import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { getActiveShopContext } from "@/lib/admin-actions";
import { formatWhatsAppPhone } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";

export interface SoleWhatStatus {
  configured: boolean;
  sessionId: string | null;
  apiKey: string | null;
  gatewayUrl: string;
  isOnline: boolean;
  error?: string;
  latencyMs?: number;
}

/**
 * Get Sole-What configuration and check live connectivity
 */
export async function getSoleWhatStatus(): Promise<SoleWhatStatus> {
  const activeShop = await getActiveShopContext();
  const defaultGatewayUrl = process.env.WHATSAPP_GATEWAY_URL || "https://solewhat-production.up.railway.app";
  const defaultApiKey = process.env.DEFAULT_WHATSAPP_API_KEY || "wag_qF0HVpcLGTxuqGZvBLO1I2057gJUwiV8";

  let sessionId: string | null = null;
  let apiKey: string | null = defaultApiKey;

  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      if (activeShop.shopId) {
        const { data } = await db
          .from("shops")
          .select("whatsapp_session_id, whatsapp_api_key")
          .eq("id", activeShop.shopId)
          .maybeSingle();
        if (data) {
          sessionId = data.whatsapp_session_id || null;
          apiKey = data.whatsapp_api_key || defaultApiKey;
        }
      } else {
        const { data } = await db
          .from("shop_settings")
          .select("whatsapp_session_id, whatsapp_api_key")
          .eq("id", "main")
          .maybeSingle();
        if (data) {
          sessionId = data.whatsapp_session_id || null;
          apiKey = data.whatsapp_api_key || defaultApiKey;
        }
      }
    } catch (err) {
      console.warn("[getSoleWhatStatus] DB error:", err);
    }
  }

  // Ping gateway to check if alive
  let isOnline = false;
  let latencyMs: number | undefined;
  let errorMsg: string | undefined;

  try {
    const startTime = Date.now();
    const testUrl = defaultGatewayUrl.replace(/\/+$/, "") + "/health";
    const res = await fetch(testUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    }).catch(async () => {
      // Fallback ping root URL
      return fetch(defaultGatewayUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
    });

    latencyMs = Date.now() - startTime;
    if (res && res.status < 500) {
      isOnline = true;
    } else {
      isOnline = false;
      errorMsg = `Gateway returned HTTP ${res?.status || "error"}`;
    }
  } catch (err: any) {
    isOnline = false;
    errorMsg = err?.message || "Gateway unreachable";
  }

  return {
    configured: !!sessionId,
    sessionId,
    apiKey,
    gatewayUrl: defaultGatewayUrl,
    isOnline,
    error: errorMsg,
    latencyMs,
  };
}

/**
 * Save Sole-What session ID and API key
 */
export async function updateSoleWhatCredentials(formData: FormData): Promise<{ error: string | null; success: boolean }> {
  const sessionId = (formData.get("whatsapp_session_id") as string)?.trim() || null;
  const apiKey = (formData.get("whatsapp_api_key") as string)?.trim() || null;

  const activeShop = await getActiveShopContext();

  if (!isServiceRoleConfigured()) {
    return { error: "Database service role not configured in .env.local", success: false };
  }

  try {
    const db = createAdminClient();
    if (activeShop.shopId) {
      const { error } = await db
        .from("shops")
        .update({
          whatsapp_session_id: sessionId,
          whatsapp_api_key: apiKey,
        })
        .eq("id", activeShop.shopId);

      if (error) throw error;
    } else {
      const { error } = await db
        .from("shop_settings")
        .update({
          whatsapp_session_id: sessionId,
          whatsapp_api_key: apiKey,
        })
        .eq("id", "main");

      if (error) throw error;
    }

    revalidatePath("/admin/sole-what");
    revalidatePath("/admin/settings");
    return { error: null, success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to save Sole-What credentials", success: false };
  }
}

/**
 * Send a Test WhatsApp message via Sole-What Gateway
 */
export async function sendSoleWhatTestMessage(
  phone: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!phone || !phone.trim()) {
      return { success: false, error: "Please enter a valid phone number." };
    }

    const formattedPhone = formatWhatsAppPhone(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      return { success: false, error: "Invalid phone number format." };
    }

    const status = await getSoleWhatStatus();
    if (!status.sessionId) {
      return { success: false, error: "Sole-What Session ID is not configured yet. Please enter your Session ID and click Save." };
    }

    const endpoint = `${status.gatewayUrl.replace(/\/+$/, "")}/api/messages/${status.sessionId}/send`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": status.apiKey || "wag_qF0HVpcLGTxuqGZvBLO1I2057gJUwiV8",
      },
      body: JSON.stringify({
        to: formattedPhone,
        text: messageText || " Salam from Pizza System! Your Sole-What WhatsApp integration is working perfectly! ",
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `HTTP ${response.status}: Failed to dispatch WhatsApp message`,
      };
    }

    return {
      success: true,
      messageId: data?.messageId || data?.id || "msg_sent_ok",
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Connection timeout or gateway error" };
  }
}

/**
 * Fetch customer phone contacts from recent orders for WhatsApp campaigns
 */
export async function getRecentCustomerContacts(): Promise<
  { phone: string; name: string; orderCount: number; lastOrder: string }[]
> {
  if (!isServiceRoleConfigured()) return [];

  try {
    const activeShop = await getActiveShopContext();
    const db = createAdminClient();

    let query = db
      .from("orders")
      .select("customer_phone, customer_name, created_at")
      .not("customer_phone", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (activeShop.shopId) {
      query = query.eq("shop_id", activeShop.shopId);
    }

    const { data } = await query;
    if (!data) return [];

    const map = new Map<string, { phone: string; name: string; orderCount: number; lastOrder: string }>();

    for (const row of data) {
      if (!row.customer_phone) continue;
      const formatted = formatWhatsAppPhone(row.customer_phone);
      if (!formatted || formatted.length < 10) continue;

      if (!map.has(formatted)) {
        map.set(formatted, {
          phone: row.customer_phone,
          name: row.customer_name || "Valued Customer",
          orderCount: 1,
          lastOrder: new Date(row.created_at).toLocaleDateString(),
        });
      } else {
        const item = map.get(formatted)!;
        item.orderCount += 1;
      }
    }

    return Array.from(map.values()).slice(0, 25);
  } catch (err) {
    console.warn("[getRecentCustomerContacts error]:", err);
    return [];
  }
}
