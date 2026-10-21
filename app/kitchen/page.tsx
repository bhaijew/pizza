import { redirect } from "next/navigation";
import { fetchShopBySlugOrId } from "@/lib/menu-data";
import { getActiveShopContext } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

interface KitchenPageProps {
  searchParams?: Promise<{ shop?: string }>;
}

export default async function FullscreenKitchenPage({ searchParams }: KitchenPageProps) {
  const sp = searchParams ? await searchParams : {};
  const shopQuery = sp.shop?.trim();

  if (shopQuery) {
    const shop = await fetchShopBySlugOrId(shopQuery);
    if (shop?.slug) {
      redirect(`/${shop.slug}/kitchen`);
    }
  }

  const activeShop = await getActiveShopContext();
  if (activeShop.shopSlug) {
    redirect(`/${activeShop.shopSlug}/kitchen`);
  }

  // Fallback to admin kitchen
  redirect("/admin/kitchen");
}
