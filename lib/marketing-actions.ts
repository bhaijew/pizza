"use server";

import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { getActiveShopContext } from "@/lib/admin-actions";
import { fetchAdminCustomers, CustomerRecord } from "@/lib/customer-actions";
import { fetchDeals } from "@/lib/deal-actions";
import { getShopWhatsAppCredentials, formatWhatsAppPhone, getAppBaseUrl } from "@/lib/whatsapp";
import type { Deal } from "@/types/menu";

export interface MarketingCustomer extends CustomerRecord {
  daysSinceLastOrder: number;
  segment: "inactive" | "vip" | "regular" | "new";
}

export interface MarketingOverview {
  customers: MarketingCustomer[];
  totalCustomers: number;
  inactiveCount: number; // >= 20 days since last order
  vipCount: number; // >= 5 orders
  newCount: number; // 1 order
  totalRevenue: number;
  deals: Deal[];
  shopName: string;
  shopSlug: string | null;
  shopPhone: string;
}

export interface SendMarketingMessageInput {
  phone: string;
  customerName?: string;
  messageText: string;
  imageUrl?: string | null;
  shopId?: number | null;
}

export interface WhatsAppBotConfig {
  autoReplyEnabled: boolean;
  triggerKeywords: string[];
  greetingText: string;
  includeDeals: boolean;
  menuUrl: string;
}

/**
 * Fetch unified CRM customer directory categorized by marketing segments (Win-Back 20+ days, VIP, New, All)
 */
export async function fetchMarketingOverview(shopIdParam?: number | null): Promise<MarketingOverview> {
  const activeShop = await getActiveShopContext();
  const effectiveShopId = shopIdParam !== undefined ? shopIdParam : activeShop.shopId;
  const rawCustomers = await fetchAdminCustomers(effectiveShopId);
  const { data: dealsData } = await fetchDeals(effectiveShopId);
  const activeDeals = (dealsData || []).filter((d) => d.is_active);

  const now = Date.now();
  let totalRevenue = 0;
  let inactiveCount = 0;
  let vipCount = 0;
  let newCount = 0;

  const customers: MarketingCustomer[] = rawCustomers.map((c) => {
    totalRevenue += Number(c.totalSpent) || 0;

    let daysSinceLastOrder = 999;
    if (c.lastOrderAt) {
      const orderTs = new Date(c.lastOrderAt).getTime();
      if (!Number.isNaN(orderTs)) {
        daysSinceLastOrder = Math.max(0, Math.floor((now - orderTs) / (1000 * 60 * 60 * 24)));
      }
    }

    let segment: "inactive" | "vip" | "regular" | "new" = "regular";
    if (daysSinceLastOrder >= 20) {
      segment = "inactive";
      inactiveCount += 1;
    } else if (c.totalOrders >= 5) {
      segment = "vip";
      vipCount += 1;
    } else if (c.totalOrders <= 1) {
      segment = "new";
      newCount += 1;
    }

    return {
      ...c,
      daysSinceLastOrder,
      segment,
    };
  });

  return {
    customers,
    totalCustomers: customers.length,
    inactiveCount,
    vipCount,
    newCount,
    totalRevenue,
    deals: activeDeals,
    shopName: activeShop.shopName || "Pizza Shop",
    shopSlug: activeShop.shopSlug || null,
    shopPhone: "051 111 111 199",
  };
}

/**
 * Send an individual WhatsApp marketing message via Sole-What Gateway
 */
export async function sendMarketingWhatsAppMessage(
  input: SendMarketingMessageInput
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const { phone, customerName, messageText, imageUrl, shopId } = input;

    if (!phone || !phone.trim()) {
      return { success: false, error: "Missing customer phone number." };
    }

    const formattedPhone = formatWhatsAppPhone(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      return { success: false, error: `Invalid phone format: "${phone}"` };
    }

    // Resolve shop credentials
    const credentials = await getShopWhatsAppCredentials(shopId);
    if (!credentials.sessionId) {
      return {
        success: false,
        error: `WhatsApp Session ID is not configured for ${credentials.shopName || "this shop"}. Please configure it in Admin Settings.`,
      };
    }

    const rawGatewayUrl = (process.env.WHATSAPP_GATEWAY_URL || "").trim();
    const gatewayBaseUrl = (
      rawGatewayUrl && !rawGatewayUrl.includes("solewhat-production.up.railway.app")
        ? rawGatewayUrl
        : "https://solewhat-production-33f6.up.railway.app"
    ).replace(/\/+$/, "");

    const endpoint = `${gatewayBaseUrl}/api/messages/${credentials.sessionId}/send`;

    // Personalized text replacement
    const appUrl = getAppBaseUrl();
    const resolvedText = messageText
      .replace(/{customer_name}/gi, customerName || "Valued Customer")
      .replace(/{shop_name}/gi, credentials.shopName || "Pizza Mafia")
      .replace(/{menu_url}/gi, appUrl)
      .replace(/{discount_code}/gi, "PIZZA20")
      .replace(/{phone}/gi, phone);

    // If poster image provided, attempt to send via Sole-What Media API
    if (imageUrl && imageUrl.trim()) {
      try {
        const cleanImgUrl = imageUrl.trim();
        const imgFetch = await fetch(cleanImgUrl, { signal: AbortSignal.timeout(8000) });
        if (imgFetch.ok) {
          const buffer = Buffer.from(await imgFetch.arrayBuffer());
          const contentType = imgFetch.headers.get("content-type") || "image/jpeg";
          const filename = "deal-poster.jpg";

          const jid = `${formattedPhone.replace(/\D/g, "")}@s.whatsapp.net`;
          const mediaEndpoint = `${gatewayBaseUrl}/api/messages/${credentials.sessionId}/${encodeURIComponent(jid)}/media`;

          const formData = new FormData();
          formData.append("file", new Blob([buffer], { type: contentType }), filename);
          formData.append("type", "image");
          formData.append("caption", resolvedText);

          const mediaRes = await fetch(mediaEndpoint, {
            method: "POST",
            headers: {
              "x-api-key": credentials.apiKey,
            },
            body: formData,
            signal: AbortSignal.timeout(20000),
          });

          const mediaData = await mediaRes.json().catch(() => null);
          if (mediaRes.ok && mediaData?.status !== false) {
            return {
              success: true,
              messageId: mediaData?.data?.key?.id || "media-sent",
            };
          }
          console.warn("[Sole-What Media Endpoint Failed, falling back to text /send]", mediaData);
        }
      } catch (mediaErr) {
        console.warn("[Sole-What Media Send Error, falling back to text /send]", mediaErr);
      }
    }

    // Standard text fallback (or when no image is provided)
    const textToSend = imageUrl && imageUrl.trim()
      ? `${resolvedText}\n\n🖼️ *Special Deal Poster:*\n${imageUrl.trim()}`
      : resolvedText;

    const payload = {
      to: formattedPhone,
      text: textToSend,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": credentials.apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000), // 15-second timeout
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `Gateway returned HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data?.messageId || data?.id || "sent",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Connection timeout or WhatsApp gateway error.",
    };
  }
}

/**
 * Reads Bot Interactive Menu Auto-Reply configuration from shop settings feature flags
 */
export async function getWhatsAppBotConfig(shopIdParam?: number | null): Promise<WhatsAppBotConfig> {
  const activeShop = await getActiveShopContext();
  const effectiveShopId = shopIdParam !== undefined ? shopIdParam : activeShop.shopId;
  const appUrl = getAppBaseUrl();
  const menuUrl = activeShop.shopSlug ? `${appUrl}/${activeShop.shopSlug}` : appUrl;

  const defaultConfig: WhatsAppBotConfig = {
    autoReplyEnabled: true,
    triggerKeywords: ["hi", "salam", "menu", "deals", "offer", "pizza", "order"],
    greetingText: `Salam from ${activeShop.shopName || "Pizza Mafia"}! 🍕\n\nExplore our hot artisan menu, latest discount combos, and order online with instant kitchen tracking:\n🔗 ${menuUrl}\n\n*Popular Keywords:*\n• Reply "DEALS" to view current special discount combos\n• Reply with your Order Number (e.g. #1042) to track live cooking & rider status!`,
    includeDeals: true,
    menuUrl,
  };

  if (!isServiceRoleConfigured()) return defaultConfig;

  try {
    const db = createAdminClient();
    if (effectiveShopId) {
      const { data } = await db.from("shops").select("feature_flags").eq("id", effectiveShopId).maybeSingle();
      if (data?.feature_flags?.whatsapp_bot) {
        return { ...defaultConfig, ...data.feature_flags.whatsapp_bot, menuUrl };
      }
    } else {
      const { data } = await db.from("shop_settings").select("feature_flags").eq("id", "main").maybeSingle();
      if (data?.feature_flags?.whatsapp_bot) {
        return { ...defaultConfig, ...data.feature_flags.whatsapp_bot, menuUrl };
      }
    }
  } catch (err) {
    console.warn("[getWhatsAppBotConfig] DB error:", err);
  }

  return defaultConfig;
}

/**
 * Saves Bot Interactive Menu Auto-Reply configuration to shop settings feature flags
 */
export async function saveWhatsAppBotConfig(
  config: Partial<WhatsAppBotConfig>,
  shopIdParam?: number | null
): Promise<{ success: boolean; error?: string }> {
  if (!isServiceRoleConfigured()) {
    return { success: false, error: "Database service role is not configured." };
  }

  try {
    const db = createAdminClient();
    const activeShop = await getActiveShopContext();
    const effectiveShopId = shopIdParam !== undefined ? shopIdParam : activeShop.shopId;

    if (effectiveShopId) {
      const { data } = await db.from("shops").select("feature_flags").eq("id", effectiveShopId).maybeSingle();
      const currentFlags = data?.feature_flags && typeof data.feature_flags === "object" ? { ...data.feature_flags } : {};
      currentFlags.whatsapp_bot = { ...(currentFlags.whatsapp_bot || {}), ...config };
      await db.from("shops").update({ feature_flags: currentFlags }).eq("id", effectiveShopId);
    } else {
      const { data } = await db.from("shop_settings").select("feature_flags").eq("id", "main").maybeSingle();
      const currentFlags = data?.feature_flags && typeof data.feature_flags === "object" ? { ...data.feature_flags } : {};
      currentFlags.whatsapp_bot = { ...(currentFlags.whatsapp_bot || {}), ...config };
      await db.from("shop_settings").update({ feature_flags: currentFlags }).eq("id", "main");
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to save Bot configuration" };
  }
}

