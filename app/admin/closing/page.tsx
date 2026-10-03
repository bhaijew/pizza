import { fetchDailyClosingData } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import DailyClosingManager from "@/components/admin/DailyClosingManager";

export const dynamic = "force-dynamic";

export default async function AdminDailyClosingPage() {
  const [closingData, settings] = await Promise.all([
    fetchDailyClosingData(),
    fetchSettings(),
  ]);

  return (
    <div>
      <DailyClosingManager
        initialData={closingData}
        currencySymbol={settings.currency_symbol || "$"}
        shopName={settings.shop_name || "Pizza System"}
      />
    </div>
  );
}
