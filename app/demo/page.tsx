import type { Metadata } from "next";
import DynamicShopMenuPage, { generateMetadata as baseGenerateMetadata } from "../[shopSlug]/page";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams: Promise<{ table?: string; type?: "dine_in" | "takeaway" | "delivery" }>;
}): Promise<Metadata> {
  return baseGenerateMetadata({
    params: Promise.resolve({ shopSlug: "demo" }),
    searchParams: props.searchParams,
  });
}

export default async function DemoStorePage(props: {
  searchParams: Promise<{ table?: string; type?: "dine_in" | "takeaway" | "delivery" }>;
}) {
  return DynamicShopMenuPage({
    params: Promise.resolve({ shopSlug: "demo" }),
    searchParams: props.searchParams,
  });
}
