import type { Metadata } from "next";
import { headers } from "next/headers";
import { makeSlug } from "@/server/domains";
import { remainingUses } from "@/server/quota";
import { freeUrl, hasUnpublishedChanges } from "@/server/sites";
import { requireEditableSite } from "./guard";
import { SiteEditor } from "./SiteEditor";

export const metadata: Metadata = { title: "Edit website", robots: { index: false } };

type EditPageProps = { params: Promise<{ id: string }> };

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function EditSitePage({ params }: EditPageProps) {
  const { id } = await params;
  const { actor, site } = await requireEditableSite(id);
  // Quantas mudanças por IA ainda cabem hoje (`null` = sem limite, ex.: admins).
  const aiEditsLeft = await remainingUses(actor, "ai_edit");
  const origin = await requestOrigin();
  // Endereço grátis: o atual, ou o que o site vai receber ao publicar (mesmo makeSlug da API).
  // Antes da primeira publicação o editor recalcula com o nome digitado (origin + hasSlug).
  const freeAddress =
    freeUrl(site, origin) ?? `${origin}/s/${makeSlug(site.spec.business.name, site.id)}`;
  return (
    <SiteEditor
      siteId={site.id}
      initialSpec={site.spec}
      status={site.status === "published" ? "live" : "draft"}
      pendingChanges={hasUnpublishedChanges(site)}
      freeAddress={freeAddress}
      origin={origin}
      hasSlug={Boolean(site.slug)}
      updatedAt={site.updatedAt}
      hasDomain={Boolean(site.customDomain)}
      aiEditsLeft={aiEditsLeft}
      isGuest={actor.kind === "guest"}
    />
  );
}
