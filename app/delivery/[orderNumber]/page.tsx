import { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { getTrackableOrder } from "@/lib/order-actions";
import { fetchSettings } from "@/lib/menu-data";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import RiderDeliveryPortal from "@/components/delivery/RiderDeliveryPortal";

interface PageProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  const decodedNumber = decodeURIComponent(orderNumber);
  return {
    title: `Delivery Order #${decodedNumber} | Rider Portal`,
    description: `Delivery Rider confirmation portal for order #${decodedNumber}. Confirm delivery, cash or card payment collected, and get customer navigation.`,
  };
}

export default async function RiderDeliveryDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const decodedNumber = decodeURIComponent(orderNumber);

  const [orderRes, settings] = await Promise.all([
    getTrackableOrder(decodedNumber),
    fetchSettings(),
  ]);

  let shopSlug: string | null = null;
  let shopName = settings?.shop_name || "Sole What";

  // 1. Resolve from order's assigned shop
  if (orderRes.success && orderRes.order?.shop_id) {
    try {
      const supabase = isServiceRoleConfigured()
        ? createAdminClient()
        : createClient(await cookies());
      const { data: shop } = await supabase
        .from("shops")
        .select("slug, name")
        .eq("id", orderRes.order.shop_id)
        .maybeSingle();
      if (shop?.slug) shopSlug = shop.slug;
      if (shop?.name) shopName = shop.name;
    } catch {
      // non-blocking
    }
  }

  // 2. Resolve from Host subdomain if not found from shop
  if (!shopSlug) {
    try {
      const hdrs = await headers();
      const host = (hdrs.get("x-forwarded-host") || hdrs.get("host") || "").toLowerCase().split(":")[0];
      if (host.endsWith(".solewhat.store")) {
        const part = host.replace(".solewhat.store", "").trim();
        if (part && part !== "www") shopSlug = part;
      }
    } catch {
      // non-blocking
    }
  }

  // 3. Fallback default to pizza-mafia
  if (!shopSlug) {
    shopSlug = "pizza-mafia";
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <RiderDeliveryPortal
        orderNumber={decodedNumber}
        order={orderRes.success ? orderRes.order : null}
        shopName={shopName}
        shopSlug={shopSlug}
        shopPhone="0300-1234567"
        currencySymbol={settings?.currency_symbol || "Rs."}
      />
    </main>
  );
}
