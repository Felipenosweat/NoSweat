import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardChecklist, type ChecklistStep } from "@/components/DashboardChecklist";
import { SitesGrid } from "@/components/SitesGrid";
import { getCurrentUser } from "@/server/auth/session";
import { getSiteStore, type SiteRecord } from "@/server/store";

export const metadata: Metadata = { title: "My sites" };

/** O rascunho tem foto no topo ou alguma foto na galeria? */
function hasPhotos(site: SiteRecord): boolean {
  return site.spec.sections.some(
    (section) =>
      (section.type === "hero" && Boolean(section.image)) ||
      (section.type === "gallery" && section.images.length > 0),
  );
}

/** Os 4 passos do checklist que o servidor sabe responder (o 5º fica no cliente). */
function checklistSteps(site: SiteRecord, leads: number): ChecklistStep[] {
  const live = site.status === "published";
  const liveHref = site.slug ? `/s/${site.slug}#contact` : null;
  return [
    { label: "Publish", done: live, href: `/sites/${site.id}#publish`, hint: "Put it online" },
    {
      label: "Connect domain",
      done: Boolean(site.customDomain),
      href: `/sites/${site.id}#domain`,
      hint: "Use yourbusiness.com",
    },
    {
      label: "Add photos",
      done: hasPhotos(site),
      href: `/sites/${site.id}/edit`,
      hint: "Your work, your team",
    },
    {
      label: "Send a test request",
      done: leads > 0,
      href: live ? liveHref : null,
      external: true,
      hint: live ? "Use your contact form" : "Publish first",
    },
  ];
}

export default async function DashboardPage() {
  // Sempre renderiza na hora do request (os dados mudam a cada site gerado).
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const store = getSiteStore();
  const sites = await store.list(user.id);
  const leadLists = await Promise.all(sites.map((site) => store.listLeads(site.id)));
  const leadCounts = Object.fromEntries(
    sites.map((site, i) => [site.id, leadLists[i]?.length ?? 0]),
  );
  // `list` já vem do mais recente para o mais antigo.
  const latest = sites[0];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h1 className="font-display text-3xl leading-tight font-bold tracking-[-0.03em] text-ink lg:text-[2.5rem]">
          My sites
        </h1>
        {sites.length > 0 && (
          <p className="text-[15px] text-slate-500 tabular-nums">
            {sites.length} site{sites.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {latest && (
        <DashboardChecklist
          siteId={latest.id}
          siteName={latest.spec.business.name}
          steps={checklistSteps(latest, leadCounts[latest.id] ?? 0)}
          shareHref={latest.status === "published" ? `/sites/${latest.id}#publish` : null}
        />
      )}

      <SitesGrid sites={sites} leadCounts={leadCounts} />
    </div>
  );
}
