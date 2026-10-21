import { Metadata } from "next";
import { getTrackableOrder } from "@/lib/order-actions";
import { fetchSettings } from "@/lib/menu-data";
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
    description: `Delivery Rider confirmation portal for order #${decodedNumber}. Confirm delivery, cash collected, and get customer navigation.`,
  };
}

export default async function RiderDeliveryDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const decodedNumber = decodeURIComponent(orderNumber);

  const [orderRes, settings] = await Promise.all([
    getTrackableOrder(decodedNumber),
    fetchSettings(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950">
      <RiderDeliveryPortal
        orderNumber={decodedNumber}
        order={orderRes.success ? orderRes.order : null}
        shopName={settings?.shop_name || "Sole What"}
        shopPhone="0300-1234567"
        currencySymbol={settings?.currency_symbol || "Rs."}
      />
    </main>
  );
}
