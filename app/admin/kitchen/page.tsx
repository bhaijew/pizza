import { createAdminClient } from "@/utils/supabase/admin";
import { fetchSettings } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";
import KitchenDisplay from "@/components/admin/KitchenDisplay";
import type { Order } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminKitchenPage() {
  const db = createAdminClient();
  const activeShop = await getActiveShopContext();

  let ordersQuery = db
    .from("orders")
    .select("*")
    .in("status", ["received", "preparing"])
    .order("created_at", { ascending: true });

  if (activeShop.shopId) {
    ordersQuery = ordersQuery.eq("shop_id", activeShop.shopId);
  } else {
    ordersQuery = ordersQuery.is("shop_id", null);
  }

  const [{ data: orders }, settings] = await Promise.all([
    ordersQuery,
    fetchSettings(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <span>👨‍🍳</span> Kitchen Display System (KDS)
          </h1>
          <p className="text-xs text-gray-500">
            Live tickets for cooks & chefs. Table orders highlighted with timers and checklist.
          </p>
        </div>
        <a
          href="/kitchen"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded"
        >
          <span>🖥️ Fullscreen Kitchen Tablet Mode</span>
          <span>↗</span>
        </a>
      </div>

      <KitchenDisplay
        initialOrders={(orders as Order[]) || []}
        shopName={settings.shop_name || "Pizza Kitchen"}
      />
    </div>
  );
}
