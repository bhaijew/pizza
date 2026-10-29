import { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_SHOP_COOKIE, ADMIN_SHOP_NAME_COOKIE } from "@/lib/admin-auth";
import { fetchAdminCustomers } from "@/lib/customer-actions";
import CustomerManager from "@/components/admin/CustomerManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Info & CRM | Admin",
  description: "View and manage customer names, phone numbers, delivery addresses, and order history.",
};

export default async function AdminCustomersPage() {
  const cookieStore = await cookies();
  const shopIdStr = cookieStore.get(ADMIN_SHOP_COOKIE)?.value;
  const shopId = shopIdStr ? parseInt(shopIdStr, 10) : null;
  const shopName = cookieStore.get(ADMIN_SHOP_NAME_COOKIE)?.value || "Store";

  const customers = await fetchAdminCustomers(shopId);

  return (
    <CustomerManager
      initialCustomers={customers}
      shopId={shopId}
      shopName={shopName}
    />
  );
}

