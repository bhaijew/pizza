import { requireSuperAdmin } from "@/lib/super-admin-actions";
import { fetchShops, fetchSuperAdminMetrics } from "@/lib/super-admin-data";
import SuperAdminDashboard from "@/components/super-admin/SuperAdminDashboard";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const [{ shops }, metrics] = await Promise.all([
    fetchShops(),
    fetchSuperAdminMetrics(),
  ]);

  return <SuperAdminDashboard initialShops={shops} initialMetrics={metrics} />;
}
