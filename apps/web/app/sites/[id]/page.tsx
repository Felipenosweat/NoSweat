import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AccountShellForCurrentViewer } from "@/app/(dashboard)/AccountShell";
import { GlobeIcon, MessagesIcon } from "@/app/(dashboard)/NavIcons";
import {
  IconTile,
  PageHeader,
  SiteUrlLine,
  StatusBadge,
  cardClass,
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  primaryButton,
  secondaryButton,
  textButton,
  type IconTone,
} from "@/components/DashboardUi";
import { GlassBadge } from "@/components/glass";
import { LocalTime } from "@/components/LocalTime";
import { SiteThumb } from "@/components/SiteThumb";
import { getCurrentUser } from "@/server/auth/session";
import { ownerHasCustomDomainAccess, ownerHasLiveAccess, publishBlocked } from "@/server/billing";
import { getDomainState, makeSlug } from "@/server/domains";
import { freeUrl, getOwnedSite, hasUnpublishedChanges, liveSpec } from "@/server/sites";
import { getSiteStore } from "@/server/store";
import { PublishButton } from "./PublishButton";
import { SiteActionsMenu } from "./SiteActionsMenu";
import { DomainSection, VersionsSection } from "./SiteSections";
import { VersionHistory } from "./VersionHistory";

export const metadata: Metadata = { title: "Manage site" };

type ManageSitePageProps = { params: Promise<{ id: string }> };

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const linkClass = `rounded-sm font-medium text-brand underline-offset-4 hover:underline ${focusRing}`;

/** Quantos pedidos aparecem aqui; o resto fica em /clients (o CRM junta todos). */
const RECENT_LEADS = 3;

/** Título de painel com o quadradinho do ícone na frente (como os grupos dos Ajustes do iOS). */
function PanelHeading({
  id,
  icon,
  tone = "brand",
  children,
}: {
  id: string;
  icon: ReactNode;
  tone?: IconTone;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <IconTile tone={tone}>{icon}</IconTile>
      <h2 id={id} className={panelTitle}>
        {children}
      </h2>
    </div>
  );
}

export default async function ManageSitePage({ params }: ManageSitePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/sites/${encodeURIComponent(id)}`);
  const site = await getOwnedSite(user, id);
  if (!site) notFound();

  const origin = await requestOrigin();
  const free = freeUrl(site, origin);
  const [domain, leads] = await Promise.all([
    getDomainState(site),
    getSiteStore().listLeads(site.id),
  ]);
  const versions = (await getSiteStore().listVersions(site.id)).slice(0, 10);
  const pendingChanges = hasUnpublishedChanges(site);
  const isPublished = site.status === "published";
  // No ar, mas o plano do dono acabou: o público vê "temporarily unavailable" (ownerHasLiveAccess).
  const offline = isPublished && !(await ownerHasLiveAccess(site.ownerId));
  // Domínio próprio só vira o link principal quando JÁ funciona (DNS pronto e plano com domínio;
  // sem isso o d/[host] manda de volta para o endereço grátis). Antes, o link é o grátis.
  const domainUrl =
    domain.status === "active" && domain.domain && (await ownerHasCustomDomainAccess(site.ownerId))
      ? `https://${domain.domain}`
      : null;
  const live = isPublished ? (domainUrl ?? free) : null;
  // Com os planos valendo e sem plano ativo, publicar leva para /billing: avisamos antes.
  // (Quem está vendo é quem publicaria: admin nunca precisa de plano.)
  const needsPlan = (!isPublished || offline) && (await publishBlocked(user)) !== null;
  // Os pedidos também chegam por e-mail (server/notify) só com a Resend configurada.
  const emailAlerts = Boolean(process.env.RESEND_API_KEY);
  // Publicar é a única ação azul da tela; sem nada para publicar, "Edit site" vira a principal.
  const publishLabel = !isPublished
    ? "Publish my website"
    : pendingChanges
      ? "Publish changes"
      : null;
  // Endereço grátis: o atual, ou o que o site vai receber ao publicar (mesmo makeSlug da API).
  const address = free ?? `${origin}/s/${makeSlug(site.spec.business.name, site.id)}`;
  const publishState = !isPublished ? "draft" : pendingChanges ? "outdated" : "current";
  const { business } = site.spec;
  const where = [business.city, business.state].filter(Boolean).join(", ");

  return (
    <AccountShellForCurrentViewer>
      <div>
        <PageHeader
          back={
            <Link href="/dashboard#sites" className={`${textButton} -ml-1`}>
              <span aria-hidden="true">‹</span> My sites
            </Link>
          }
          title={business.name}
          badge={
            // Mesmas cores do cartão em "My sites" (SitesGrid): fora do ar = âmbar, não cinza.
            <GlassBadge tone={isPublished ? (offline ? "pending" : "live") : "draft"}>
              {isPublished ? (offline ? "Offline" : "Live") : "Draft"}
            </GlassBadge>
          }
          description={where || undefined}
          actions={
            // Ações secundárias e as que tiram do ar/apagam ficam no menu "⋯" (com confirmação).
            <SiteActionsMenu
              siteId={site.id}
              siteName={business.name}
              liveUrl={live}
              place="page"
              hasPendingChanges={pendingChanges}
              redirectAfterDelete="/dashboard"
            />
          }
        />

        {offline && (
          <p
            role="status"
            className="glass-edge mt-6 rounded-2xl bg-amber-50/85 px-4 py-3 text-[15px] text-amber-900"
          >
            Your plan has ended, so visitors see a &ldquo;temporarily unavailable&rdquo; page.{" "}
            <Link
              href={`/billing?site=${encodeURIComponent(site.id)}`}
              className="font-semibold underline"
            >
              Choose a plan to bring it back →
            </Link>
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-12 lg:gap-x-8">
          {/* Coluna da direita (miniatura): vem primeiro no HTML para aparecer no topo no celular. */}
          <aside
            aria-label="Your site"
            className="lg:sticky lg:top-24 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:self-start"
          >
            <div className={`overflow-hidden ${cardClass}`}>
              <div className="m-2 mb-0 overflow-hidden rounded-xl ring-1 ring-(--glass-rim)">
                <SiteThumb spec={liveSpec(site)} />
              </div>
              <div className="p-5">
                {live ? (
                  <a
                    href={live}
                    target="_blank"
                    rel="noreferrer"
                    className={`block rounded-sm text-[15px] leading-6 hover:underline hover:decoration-slate-300 hover:underline-offset-4 ${focusRing}`}
                  >
                    <SiteUrlLine url={live} />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <p className="text-[15px] leading-6 text-slate-500">
                    Not online yet. Publish to get your free address.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/sites/${site.id}/edit`}
                    className={publishLabel ? secondaryButton : primaryButton}
                  >
                    Edit site
                  </Link>
                  <Link href={`/sites/preview/${site.id}`} className={textButton}>
                    {pendingChanges ? "Preview draft" : "Preview"}
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6 lg:col-span-8 lg:col-start-1 lg:row-start-1">
            <section
              id="publish"
              aria-labelledby="publish-title"
              className={`${panelClass} scroll-mt-24`}
            >
              <PanelHeading id="publish-title" icon={<GlobeIcon className="size-[18px]" />}>
                Publish
              </PanelHeading>
              <p className={`mt-3 max-w-[60ch] ${panelText}`}>
                {offline ? (
                  <>
                    Your website is offline because your plan ended.{" "}
                    <Link
                      href={`/billing?site=${encodeURIComponent(site.id)}`}
                      className={linkClass}
                    >
                      Choose a plan to bring it back
                    </Link>
                    .
                  </>
                ) : pendingChanges ? (
                  "You have saved changes that aren’t live yet. Publish them when you’re ready."
                ) : isPublished ? (
                  "Your website is live. Anyone with the link can see it."
                ) : needsPlan ? (
                  "Pick a plan to put it online. Building and previewing stay free."
                ) : (
                  "Happy with the preview? Put your website online in one click."
                )}
              </p>
              {live && free && live !== free && (
                <p className="mt-3 text-[13px] text-slate-500">
                  Also available at{" "}
                  <a href={free} target="_blank" rel="noreferrer" className={linkClass}>
                    {free.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
              <div className="mt-5">
                <PublishButton
                  siteId={site.id}
                  siteName={business.name}
                  label={publishLabel}
                  liveUrl={isPublished && !offline ? free : null}
                  address={address}
                  state={publishState}
                  hasDomain={Boolean(domain.domain)}
                  domainUrl={offline ? null : domainUrl}
                  needsPlan={needsPlan}
                />
              </div>
              {isPublished && (
                <p className="mt-4 border-t border-(--glass-rim) pt-3 text-[13px] text-slate-500">
                  Need to pause it? Use the{" "}
                  <span className="font-semibold text-slate-600">&ldquo;⋯&rdquo;</span> menu at the
                  top to take it offline. Nothing is deleted.
                </p>
              )}
            </section>

            <section
              id="messages"
              aria-labelledby="messages-title"
              className={`${panelClass} scroll-mt-24`}
            >
              <div className="flex items-center justify-between gap-4">
                <PanelHeading id="messages-title" icon={<MessagesIcon className="size-[18px]" />}>
                  Messages from your website
                </PanelHeading>
                <StatusBadge tone="neutral">
                  <span className="tabular-nums">{leads.length}</span>
                  <span className="sr-only"> messages</span>
                </StatusBadge>
              </div>
              {leads.length === 0 ? (
                <p className={`mt-3 max-w-[60ch] ${panelText}`}>
                  When visitors fill out the contact form on your website, their messages show up
                  here.
                  {free && isPublished && (
                    <>
                      {" "}
                      <a
                        href={`${free}#contact`}
                        target="_blank"
                        rel="noreferrer"
                        className={linkClass}
                      >
                        Send yourself a test request
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      .
                    </>
                  )}
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-(--glass-rim) border-t border-(--glass-rim)">
                  {leads.slice(0, RECENT_LEADS).map((lead) => (
                    <li key={lead.id} className="py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="text-[15px] font-semibold text-ink">{lead.name}</p>
                        <p className="text-[13px] text-slate-500 tabular-nums">
                          <LocalTime iso={lead.createdAt} />
                        </p>
                      </div>
                      {(lead.phone || lead.email) && (
                        <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className={linkClass}>
                              {lead.phone}
                            </a>
                          )}
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className={`${linkClass} break-all`}>
                              {lead.email}
                            </a>
                          )}
                        </p>
                      )}
                      <p className="mt-2 max-w-[65ch] text-[15px] leading-[1.6] whitespace-pre-line text-slate-700">
                        {lead.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {leads.length > 0 && (
                <p className="mt-1 border-t border-(--glass-rim) pt-3 text-[15px]">
                  <Link href="/clients" className={linkClass}>
                    See all in Clients <span aria-hidden="true">→</span>
                  </Link>
                </p>
              )}
              {emailAlerts && (
                <p className="mt-3 text-[13px] text-slate-500">
                  We also email you every new message.
                </p>
              )}
            </section>

            {/* Domínio e versões ficam recolhidos (uma linha cada); #domain e #versions abrem. */}
            <DomainSection siteId={site.id} initial={domain} isPublished={isPublished} />

            <VersionsSection>
              <VersionHistory
                siteId={site.id}
                versions={versions.map(({ id: versionId, source, createdAt }) => ({
                  id: versionId,
                  source,
                  createdAt,
                }))}
              />
            </VersionsSection>
          </div>
        </div>
      </div>
    </AccountShellForCurrentViewer>
  );
}
