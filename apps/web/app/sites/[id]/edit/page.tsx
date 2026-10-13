import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccessibleSite, getActor } from "@/server/sites";
import { SiteEditor } from "./SiteEditor";

export const metadata: Metadata = { title: "Edit website" };

type EditPageProps = { params: Promise<{ id: string }> };

// Conta ou visitante sem conta (o site que ele mesmo criou). Qualquer outro caso = 404.
export default async function EditSitePage({ params }: EditPageProps) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) notFound();
  const site = await getAccessibleSite(actor, id);
  if (!site) notFound();
  return <SiteEditor siteId={site.id} initialSpec={site.spec} isGuest={actor.kind === "guest"} />;
}
