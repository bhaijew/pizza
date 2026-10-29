import { Metadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext, getShopActiveShiftBoundary } from "@/lib/admin-actions";
import OrderVerificationClient from "@/components/admin/OrderVerificationClient";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify Orders | Admin Operations Portal",
  description: "Verify incoming online customer menu orders before sending them to the live kitchen and thermal receipt printers.",
};

export default async function AdminVerifyOrdersPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();
  const shiftBoundary = await getShopActiveShiftBoundary(activeShop.shopId);

  // Query online menu orders for this shift
  let ordersQuery = db
    .from("orders")
    .select("*")
    .gte("created_at", shiftBoundary.activeShiftStartUtc)
    .order("created_at", { ascending: false });

  if (activeShop.shopId) {
    ordersQuery = ordersQuery.eq("shop_id", activeShop.shopId);
  } else {
    ordersQuery = ordersQuery.is("shop_id", null);
  }

  const [{ data: orders }, settings] = await Promise.all([
    ordersQuery,
    fetchSettings(),
  ]);

  // Filter orders that originated from online menu or await verification
  const menuOrders = (orders || []).filter((o: any) => {
    return (
      o.source === "online_menu" ||
      o.is_verified === false ||
      o.notes?.includes("[ONLINE_MENU: AWAITING_VERIFICATION]") ||
      o.notes?.includes("[DELIVERY:") ||
      o.notes?.includes("[DINE-IN:") ||
      o.notes?.includes("[TAKEAWAY:")
    );
  });

  return (
    <div className="p-2 sm:p-4">
      <OrderVerificationClient
        initialOrders={(menuOrders as Order[]) || []}
        currencySymbol={settings.currency_symbol || "Rs."}
        shopId={activeShop.shopId ? Number(activeShop.shopId) : null}
        shopSlug={activeShop.shopSlug}
        shopName={activeShop.shopName || settings.shop_name}
        shopAddress={(settings as any).shop_address || "Main Boulevard, Food Street"}
        shopPhone={(settings as any).shop_phone || "0300-1234567"}
      />
    </div>
  );
}

