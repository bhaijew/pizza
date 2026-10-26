import { getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const activeShop = await getActiveShopContext();
  const settings = await fetchSettings(activeShop.shopId);

  return (
    <div style={{ width: "100%" }}>
      <SettingsForm
        initialSettings={settings}
        shopSlug={activeShop.shopSlug || undefined}
        shopName={activeShop.shopName || undefined}
        shopId={activeShop.shopId ?? undefined}
      />
    </div>
  );
}
