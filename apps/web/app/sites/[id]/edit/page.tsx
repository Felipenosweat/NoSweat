import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAccessibleSite, getActor } from "@/server/sites";
import { SiteEditor } from "./SiteEditor";

export const metadata: Metadata = { title: "Edit website" };

type EditPageProps = { params: Promise<{ id: string }> };

// Conta ou visitante sem conta (o site que ele mesmo criou). Qualquer outro caso = 404.
export default async function EditSitePage({ params }: EditPageProps) {
  const { id } = await params;
  const actor = await getActor();
  const site = actor ? await getAccessibleSite(actor, id) : null;
  if (!actor || !site) {
    // Sem conta logada pode ser o dono com a sessão vencida (ou em outro aparelho): pede login.
    // O redirecionamento não revela se o site existe.
    if (actor?.kind !== "user") redirect(`/login?next=${encodeURIComponent(`/sites/${id}/edit`)}`);
    notFound();
  }
  return <SiteEditor siteId={site.id} initialSpec={site.spec} isGuest={actor.kind === "guest"} />;
}
