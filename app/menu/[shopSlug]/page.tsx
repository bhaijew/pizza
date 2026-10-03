import { redirect } from "next/navigation";

interface MenuRedirectProps {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<{ table?: string; type?: string }>;
}

export default async function MenuRedirectPage({
  params,
  searchParams,
}: MenuRedirectProps) {
  const { shopSlug } = await params;
  const sParams = await searchParams;

  const query = new URLSearchParams();
  if (sParams.table) query.set("table", sParams.table);
  if (sParams.type) query.set("type", sParams.type);

  const qs = query.toString() ? `?${query.toString()}` : "";
  redirect(`/${shopSlug}${qs}`);
}
