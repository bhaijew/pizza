import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import type { Shop, PosStaff } from "@/types/menu";

async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

export interface SuperAdminMetrics {
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  totalOrders: number;
  totalRevenue: number;
  totalStaff: number;
  activeStaff: number;
  isDatabaseConfigured: boolean;
}

export async function fetchShops(): Promise<{ shops: Shop[]; isDatabaseConfigured: boolean }> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // PGRST205 indicates table does not exist yet
      return { shops: [], isDatabaseConfigured: false };
    }

    return {
      shops: (data || []) as Shop[],
      isDatabaseConfigured: true,
    };
  } catch {
    return { shops: [], isDatabaseConfigured: false };
  }
}

export async function fetchStaff(): Promise<{ staff: PosStaff[] }> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("pos_staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { staff: [] };
    }

    return {
      staff: (data || []) as PosStaff[],
    };
  } catch {
    return { staff: [] };
  }
}

export async function fetchSuperAdminMetrics(): Promise<SuperAdminMetrics> {
  const [{ shops, isDatabaseConfigured }, { staff }] = await Promise.all([
    fetchShops(),
    fetchStaff(),
  ]);

  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.status === "active").length;
  const suspendedShops = shops.filter((s) => s.status === "suspended").length;

  const totalStaff = staff.length;
  const activeStaff = staff.filter((st) => st.is_active && st.has_pos_access !== false).length;

  let totalOrders = 0;
  let totalRevenue = 0;

  for (const s of shops) {
    totalOrders += Number(s.total_orders_count) || 0;
    totalRevenue += Number(s.total_revenue) || 0;
  }

  // Also query real orders table to aggregate platform revenue if possible
  try {
    const supabase = await getSupabase();
    const { data: orders } = await supabase
      .from("orders")
      .select("total, status");

    if (orders && orders.length > 0) {
      const valid = (orders as Array<{ total: number; status: string }>).filter(
        (o) => o.status !== "cancelled"
      );
      totalOrders = Math.max(totalOrders, valid.length);
      const ordersRevenue = valid.reduce(
        (sum: number, o: { total: number }) => sum + (Number(o.total) || 0),
        0
      );
      totalRevenue = Math.max(totalRevenue, ordersRevenue);
    }
  } catch {
    // Ignore if orders query fails
  }

  return {
    totalShops,
    activeShops,
    suspendedShops,
    totalOrders,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalStaff,
    activeStaff,
    isDatabaseConfigured,
  };
}
