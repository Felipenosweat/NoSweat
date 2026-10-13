import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getOwnedSite } from "@/server/sites";
import { SiteEditor } from "./SiteEditor";

export const metadata: Metadata = { title: "Edit website" };

type EditPageProps = { params: Promise<{ id: string }> };

export default async function EditSitePage({ params }: EditPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/sites/${encodeURIComponent(id)}/edit`);
  const site = await getOwnedSite(user, id);
  if (!site) notFound();
  return <SiteEditor siteId={site.id} initialSpec={site.spec} />;
}
