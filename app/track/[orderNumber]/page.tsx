import { Metadata } from "next";
import { getTrackableOrder } from "@/lib/order-actions";
import OrderTrackingClient from "@/components/track/OrderTrackingClient";

interface PageProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Track Order ${orderNumber} | Live Status`,
    description: `Real-time live kitchen and delivery status tracker for order ${orderNumber}.`,
  };
}

export default async function OrderTrackDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const decodedNumber = decodeURIComponent(orderNumber);

  const initialRes = await getTrackableOrder(decodedNumber);

  return (
    <OrderTrackingClient
      initialOrderNumber={decodedNumber}
      initialOrder={initialRes.success ? initialRes.order : null}
    />
  );
}
