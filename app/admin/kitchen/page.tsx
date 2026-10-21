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
    .in("status", ["pending", "confirmed", "preparing"])
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

  const kdsUrl = activeShop.shopSlug
    ? `/${activeShop.shopSlug}/kitchen`
    : activeShop.shopId
    ? `/kitchen?shop=${activeShop.shopId}`
    : "/kitchen";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <span>👨‍🍳</span> Kitchen Display System (KDS)
          </h1>
          <p className="text-xs text-gray-500">
            Live tickets for cooks & chefs. Table orders highlighted with timers and checklist.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={kdsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-[5px] shadow-sm"
          >
            <span>🖥️ Open Tablet KDS Screen</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      <KitchenDisplay
        initialOrders={(orders as Order[]) || []}
        shopName={activeShop.shopName || settings.shop_name || "Pizza Kitchen"}
        shopId={activeShop.shopId ? Number(activeShop.shopId) : null}
        shopSlug={activeShop.shopSlug}
        shopInfo={{
          name: activeShop.shopName || settings.shop_name,
          address: (settings as any).shop_address || "Main Boulevard, Food Street",
          phone: (settings as any).shop_phone || "0300-1234567",
          currencySymbol: settings.currency_symbol || "Rs.",
          slug: activeShop.shopSlug,
        }}

      />
    </div>
  );
}

