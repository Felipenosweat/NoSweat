import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/DashboardUi";
import { EmptyState, GlassButton } from "@/components/glass";
import { getViewer } from "@/server/auth/viewer";
import { getSiteStore, type SiteRecord } from "@/server/store";
import { StarIcon } from "../NavIcons";
import { sectionTitle } from "../clients/ui";
import { GuideSteps } from "./GuideSteps";
import { ReviewLinkManager, type ReviewSite } from "./ReviewLinkManager";

export const metadata: Metadata = { title: "Google reviews", robots: { index: false } };

/** Sites da conta (mais recentes primeiro). `null` = erro ao ler. */
async function loadSites(ownerId: string): Promise<SiteRecord[] | null> {
  try {
    return await getSiteStore().list(ownerId);
  } catch (error) {
    console.error("[reviews] could not list sites", error);
    return null;
  }
}

function toReviewSite(site: SiteRecord): ReviewSite {
  return {
    id: site.id,
    name: site.spec.business.name.trim() || "Untitled website",
    url: site.spec.business.googleReviewUrl ?? null,
    live: site.status === "published",
  };
}

/**
 * Google reviews: o dono cola o link de avaliações do Google uma vez e o site ganha o botão
 * "Review us on Google"; depois, atalhos para pedir avaliações aos clientes (SMS, e-mail, QR).
 * Sem link ainda, o passo a passo vem primeiro; com link, o campo e o painel de pedir vêm
 * antes e o passo a passo fica no fim.
 */
export default async function ReviewsPage() {
  // Sempre na hora do request (dados do dono).
  await connection();
  // No modo "ver como" do admin, os sites da conta vista (só leitura: nada é salvo).
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/reviews");
  const readOnly = viewer.viewingAs !== null;

  const records = await loadSites(viewer.ownerId);
  const sites = records?.map(toReviewSite) ?? null;
  const hasLink = sites?.some((site) => site.url) ?? false;

  const guide = (
    <section id="how-to" aria-labelledby="how-to-heading" className="scroll-mt-24">
      <h2 id="how-to-heading" className={sectionTitle}>
        How to get your review link
      </h2>
      <p className="mt-1 text-[15px] leading-[1.6] text-slate-600">
        It takes about a minute. You only do this once.
      </p>
      <div className="mt-4">
        <GuideSteps headingId="how-to-heading" />
      </div>
    </section>
  );

  return (
    <div>
      <PageHeader
        title="Google reviews"
        description={
          <>
            Paste your Google review link once. We add a &ldquo;Review us on Google&rdquo; button
            to your website and give you easy ways to ask your clients.
          </>
        }
      />

      {sites === null ? (
        <p
          role="alert"
          className="glass-edge mt-8 rounded-2xl bg-red-50/90 px-4 py-3 text-[15px] text-red-700"
        >
          We couldn&rsquo;t load your websites. Please refresh the page.
        </p>
      ) : sites.length === 0 ? (
        <>
          <EmptyState
            className="mt-8"
            icon={<StarIcon />}
            title="Create your website first"
            description="Your review button lives on your website. Make your site, then come back to add your Google review link."
            actions={
              readOnly ? undefined : (
                <GlassButton href="/create" variant="primary">
                  Create my website
                </GlassButton>
              )
            }
          />
          <div className="mt-10">{guide}</div>
        </>
      ) : (
        <div className="mt-8 grid gap-10">
          {!hasLink && guide}
          <ReviewLinkManager initialSites={sites} readOnly={readOnly} />
          {hasLink && guide}
        </div>
      )}
    </div>
  );
}
