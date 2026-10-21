import { getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import MenuUiManager from "@/components/admin/MenuUiManager";

export const dynamic = "force-dynamic";

export default async function AdminMenuUiPage() {
  const activeShop = await getActiveShopContext();
  const settings = await fetchSettings(activeShop.shopId);

  const shopName = activeShop.shopName || settings.shop_name || "Pizza Shop";
  const shopSlug = activeShop.shopSlug || "main";

  return (
    <div>
      <MenuUiManager
        initialSettings={settings}
        shopName={shopName}
        shopSlug={shopSlug}
      />
    </div>
  );
}
