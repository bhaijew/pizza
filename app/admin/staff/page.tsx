import { getActiveShopContext, getShopStaffMembers } from "@/lib/admin-actions";
import StaffManager from "@/components/admin/StaffManager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff & Sub-Admins Management | Pizza Admin",
  description: "Manage branch sub-admins, cashiers, chefs, and staff access control.",
};

export default async function AdminStaffPage() {
  const activeShop = await getActiveShopContext();
  const staff = await getShopStaffMembers();

  return (
    <StaffManager
      initialStaff={staff}
      shopName={activeShop.shopName}
      shopId={activeShop.shopId}
      currentRole={activeShop.role}
      currentStaffName={activeShop.staffName}
    />
  );
}
