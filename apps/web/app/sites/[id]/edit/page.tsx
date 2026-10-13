import type { Metadata } from "next";
import { remainingUses } from "@/server/quota";
import { requireEditableSite } from "./guard";
import { SiteEditor } from "./SiteEditor";

export const metadata: Metadata = { title: "Edit website", robots: { index: false } };

type EditPageProps = { params: Promise<{ id: string }> };

export default async function EditSitePage({ params }: EditPageProps) {
  const { id } = await params;
  const { actor, site } = await requireEditableSite(id);
  // Quantas mudanças por IA ainda cabem hoje (`null` = sem limite, ex.: admins).
  const aiEditsLeft = await remainingUses(actor, "ai_edit");
  return (
    <SiteEditor
      siteId={site.id}
      initialSpec={site.spec}
      status={site.status === "published" ? "live" : "draft"}
      aiEditsLeft={aiEditsLeft}
      isGuest={actor.kind === "guest"}
    />
  );
}
