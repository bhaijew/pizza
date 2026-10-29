import { Metadata } from "next";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import CustomerPoleDisplay from "@/components/pos/CustomerPoleDisplay";

interface PageProps {
  searchParams: Promise<{
    shop?: string;
    shopId?: string;
    shopSlug?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { shop, shopSlug } = await searchParams;
  const storeIdentifier = shop || shopSlug || "Counter";
  return {
    title: `${storeIdentifier} | Live Counter Pole Display`,
    description: "Enterprise customer-facing dual-screen counter display with live cart and dynamic Pakistani QR pay.",
  };
}

export default async function CustomerPoleDisplayPage({ searchParams }: PageProps) {
  const { shop, shopId, shopSlug } = await searchParams;
  const targetSlug = (shop || shopSlug || "").trim().toLowerCase();
  const targetId = shopId ? parseInt(shopId, 10) : null;

  let initialShop: any = null;

  if (isServiceRoleConfigured()) {
    try {
      const db = createAdminClient();
      let query = db
        .from("shops")
        .select("id, name, slug, phone, owner_phone, currency_symbol, logo_url")
        .eq("status", "active");

      if (targetId) {
        query = query.eq("id", targetId);
      } else if (targetSlug) {
        query = query.ilike("slug", targetSlug);
      }

      const { data } = await query.order("id", { ascending: true }).limit(1).maybeSingle();
      if (data) {
        initialShop = data;
      }
    } catch (err) {
      console.error("[CustomerPoleDisplayPage fetch error]:", err);
    }
  }

  // Fallback if no specific shop matched
  if (!initialShop) {
    initialShop = {
      id: 1,
      name: "Pizza Mafia & Fast Food",
      slug: "pizza-mafia",
      currency_symbol: "Rs.",
      phone: "0300-1234567",
      owner_phone: "0300-1234567",
    };
  }

  return <CustomerPoleDisplay initialShop={initialShop} />;
}

