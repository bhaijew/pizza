import { fetchDeliveryRiders, getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import RidersManager from "@/components/admin/RidersManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Delivery Riders Directory — Admin Panel",
  description: "Manage delivery riders, WhatsApp numbers, active duty status and order dispatch.",
};

export default async function AdminRidersPage() {
  const activeShop = await getActiveShopContext();
  const [settings, riders] = await Promise.all([
    fetchSettings(activeShop.shopId),
    fetchDeliveryRiders(activeShop.shopId),
  ]);

  return (
    <RidersManager
      initialRiders={riders}
      shopName={activeShop.shopName || settings.shop_name}
      shopId={activeShop.shopId ? Number(activeShop.shopId) : null}
    />
  );
}
