import { fetchDailyClosingData, getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import { createAdminClient } from "@/utils/supabase/admin";
import DailyClosingManager from "@/components/admin/DailyClosingManager";

export const dynamic = "force-dynamic";

export default async function AdminDailyClosingPage() {
  const activeShop = await getActiveShopContext();
  const db = createAdminClient();

  let ownerPhone = "";
  if (activeShop.shopId) {
    const { data: sData } = await db
      .from("shops")
      .select("owner_phone, phone")
      .eq("id", activeShop.shopId)
      .maybeSingle();
    ownerPhone = sData?.owner_phone || sData?.phone || "";
  } else {
    ownerPhone = process.env.ADMIN_WHATSAPP_PHONE || "";
  }

  const [closingData, settings] = await Promise.all([
    fetchDailyClosingData(),
    fetchSettings(activeShop.shopId),
  ]);

  return (
    <div>
      <DailyClosingManager
        initialData={closingData}
        currencySymbol={settings.currency_symbol || "Rs."}
        shopName={activeShop.shopName || settings.shop_name || "Pizza System"}
        userRole={activeShop.role}
        staffName={activeShop.staffName}
        ownerPhone={ownerPhone}
        shopId={activeShop.shopId}
      />
    </div>
  );
}
