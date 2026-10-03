import { fetchSettings, fetchRestaurantTables } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import TableQRManager from "@/components/admin/TableQRManager";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  const activeShop = await getActiveShopContext();

  const [settings, tables] = await Promise.all([
    fetchSettings(activeShop.shopId),
    fetchRestaurantTables(activeShop.shopId),
  ]);

  return (
    <div>
      <TableQRManager shopName={settings.shop_name} initialTables={tables} />
    </div>
  );
}
