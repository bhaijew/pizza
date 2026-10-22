import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { fetchSettings } from "@/lib/menu-data";
import AdminLoginClient from "./AdminLoginClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soule What Management | POS Login",
  description: "Secure administrative access to Soule What Management and store POS operations.",
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token && (await verifySessionToken(token))) {
    redirect("/admin");
  }

  const settings = await fetchSettings(null).catch(() => null);
  const setupName = settings?.shop_name?.trim() || "Soule What Management";

  return <AdminLoginClient setupName={setupName} />;
}
