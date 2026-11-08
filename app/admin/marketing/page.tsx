import { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_SHOP_COOKIE } from "@/lib/admin-auth";
import { fetchMarketingOverview, getWhatsAppBotConfig } from "@/lib/marketing-actions";
import WhatsAppMarketingClient from "@/components/admin/WhatsAppMarketingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WhatsApp Marketing & Win-Back Hub | Admin",
  description: "Automate customer win-back offers for inactive customers, broadcast deal posters with 15s safe intervals, and configure bot menu auto-replies.",
};

export default async function AdminMarketingPage() {
  const cookieStore = await cookies();
  const shopIdStr = cookieStore.get(ADMIN_SHOP_COOKIE)?.value;
  const shopId = shopIdStr ? parseInt(shopIdStr, 10) : null;

  const [overview, botConfig] = await Promise.all([
    fetchMarketingOverview(shopId),
    getWhatsAppBotConfig(shopId),
  ]);

  return (
    <WhatsAppMarketingClient
      overview={overview}
      initialBotConfig={botConfig}
      shopId={shopId}
    />
  );
}

