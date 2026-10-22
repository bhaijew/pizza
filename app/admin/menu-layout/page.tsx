import { getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import MenuLayoutStudio from "@/components/admin/MenuLayoutStudio";

export const dynamic = "force-dynamic";

export default async function AdminMenuLayoutPage() {
  const activeShop = await getActiveShopContext();
  const settings = await fetchSettings(activeShop.shopId);

  const shopName = activeShop.shopName || settings.shop_name || "Pizza Shop";
  const shopSlug = activeShop.shopSlug || null;

  return (
    <MenuLayoutStudio
      initialSettings={settings}
      shopName={shopName}
      shopSlug={shopSlug}
      shopId={activeShop.shopId}
    />
  );
}
