import { Metadata } from "next";
import { fetchAdminPromoCodes } from "@/lib/promo-actions";
import { cookies } from "next/headers";
import { ADMIN_SHOP_COOKIE } from "@/lib/admin-auth";
import AdminPromosClient from "@/components/admin/AdminPromosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promo Codes & Loyalty Rewards | Admin",
  description: "Manage discount coupons, promo codes, and customer loyalty rewards points.",
};

export default async function AdminPromosPage() {
  const cookieStore = await cookies();
  const shopIdStr = cookieStore.get(ADMIN_SHOP_COOKIE)?.value;
  const shopId = shopIdStr ? parseInt(shopIdStr, 10) : null;

  const promos = await fetchAdminPromoCodes(shopId);

  return <AdminPromosClient initialPromos={promos} shopId={shopId} />;
}
