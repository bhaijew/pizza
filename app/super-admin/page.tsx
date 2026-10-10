import { requireSuperAdmin } from "@/lib/super-admin-actions";
import { fetchShops, fetchStaff, fetchSuperAdminMetrics } from "@/lib/super-admin-data";
import SuperAdminDashboard from "@/components/super-admin/SuperAdminDashboard";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const [{ shops }, { staff }, metrics] = await Promise.all([
    fetchShops(),
    fetchStaff(),
    fetchSuperAdminMetrics(),
  ]);

  return (
    <SuperAdminDashboard
      initialShops={shops}
      initialStaff={staff}
      initialMetrics={metrics}
    />
  );
}
