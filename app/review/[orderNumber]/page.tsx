import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReviewOrderDetails } from "@/lib/review-actions";
import CustomerReviewClient from "@/components/review/CustomerReviewClient";

interface PageProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Rate Your Order #${orderNumber} | Customer Feedback`,
    description: "Share your rating and feedback for your recent meal experience.",
  };
}

export default async function CustomerReviewPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const decodedNumber = decodeURIComponent(orderNumber).trim();

  const res = await getReviewOrderDetails(decodedNumber);

  if (!res.success || !res.data) {
    notFound();
  }

  return <CustomerReviewClient initialOrder={res.data} />;
}

