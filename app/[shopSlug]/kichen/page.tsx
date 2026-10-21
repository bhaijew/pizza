import { redirect } from "next/navigation";

interface KichenPageProps {
  params: Promise<{ shopSlug: string }>;
}

export default async function KichenRedirectPage({ params }: KichenPageProps) {
  const { shopSlug } = await params;
  redirect(`/${shopSlug}/kitchen`);
}
