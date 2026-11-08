import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppBotConfig, sendMarketingWhatsAppMessage } from "@/lib/marketing-actions";
import { fetchDeals } from "@/lib/deal-actions";

export const dynamic = "force-dynamic";

/**
 * Incoming WhatsApp Webhook Handler (Sole-What / WA Gateway integration)
 * Receives incoming customer messages. If message matches keywords (e.g. "hi", "menu", "deals", "salam"),
 * it automatically replies with the interactive online menu and current active deals.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "Empty payload" }, { status: 400 });
    }

    // Extract sender phone and message text from standard gateway webhook
    const fromPhone =
      body.from ||
      body.phone ||
      body.sender ||
      body.message?.from ||
      body.data?.from;
    const incomingText = String(
      body.text ||
      body.body ||
      body.message?.text ||
      body.data?.text ||
      ""
    ).trim().toLowerCase();

    if (!fromPhone || !incomingText) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Load Bot Configuration
    const botConfig = await getWhatsAppBotConfig();
    if (!botConfig.autoReplyEnabled) {
      return NextResponse.json({ ok: true, autoReplyDisabled: true });
    }

    // Check if incoming text matches any trigger keyword
    const isTriggered = botConfig.triggerKeywords.some((kw) =>
      incomingText.includes(kw.toLowerCase())
    );

    if (!isTriggered) {
      return NextResponse.json({ ok: true, matched: false });
    }

    // Build smart response
    let replyMessage = botConfig.greetingText;

    if (botConfig.includeDeals) {
      const { data: deals } = await fetchDeals();
      const activeDeals = (deals || []).filter((d) => d.is_active).slice(0, 3);
      if (activeDeals.length > 0) {
        replyMessage += `\n\n🔥 *Today's Top Hot Deals:*\n` +
          activeDeals
            .map((d) => `• *${d.title}* — Rs. ${Number(d.deal_price).toLocaleString()} (${d.description || "Limited time offer"})`)
            .join("\n");
      }
    }

    // Send auto-reply to customer
    const sendResult = await sendMarketingWhatsAppMessage({
      phone: fromPhone,
      messageText: replyMessage,
    });

    return NextResponse.json({ ok: true, replied: sendResult.success, error: sendResult.error });
  } catch (err: any) {
    console.error("[WhatsApp Webhook Error]:", err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Sole-What Interactive WhatsApp Bot & Auto-Reply Gateway",
    endpoint: "POST /api/whatsapp/webhook",
  });
}
