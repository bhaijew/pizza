import { getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import { getSoleWhatStatus, getRecentCustomerContacts } from "@/lib/sole-what-actions";
import SoleWhatManager from "@/components/admin/SoleWhatManager";

export const dynamic = "force-dynamic";

export default async function SoleWhatAdminPage() {
  const activeShop = await getActiveShopContext();
  const [settings, status, recentCustomers] = await Promise.all([
    fetchSettings(),
    getSoleWhatStatus(),
    getRecentCustomerContacts(),
  ]);

  const shopName = activeShop.shopName || settings.shop_name || "Pizza Shop";
  const shopSlug = activeShop.shopSlug || "main";

  return (
    <SoleWhatManager
      initialStatus={status}
      shopName={shopName}
      shopSlug={shopSlug}
      recentCustomers={recentCustomers}
    />
  );
}
