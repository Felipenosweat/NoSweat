import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  SiteUrlLine,
  StatusBadge,
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  primaryButton,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";
import { Logo } from "@/components/Logo";
import { SiteThumb } from "@/components/SiteThumb";
import { getCurrentUser } from "@/server/auth/session";
import { getDomainState } from "@/server/domains";
import { freeUrl, getOwnedSite, hasUnpublishedChanges, liveSpec, publicUrl } from "@/server/sites";
import { getSiteStore } from "@/server/store";
import { DomainPanel } from "./DomainPanel";
import { PublishButton } from "./PublishButton";
import { VersionHistory } from "./VersionHistory";

export const metadata: Metadata = { title: "Manage site" };

const leadDate = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

type ManageSitePageProps = { params: Promise<{ id: string }> };

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const linkClass = `rounded-sm font-medium text-brand underline-offset-4 hover:underline ${focusRing}`;

export default async function ManageSitePage({ params }: ManageSitePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/sites/${encodeURIComponent(id)}`);
  const site = await getOwnedSite(user, id);
  if (!site) notFound();

  const origin = await requestOrigin();
  const live = publicUrl(site, origin);
  const free = freeUrl(site, origin);
  const [domain, leads] = await Promise.all([
    getDomainState(site),
    getSiteStore().listLeads(site.id),
  ]);
  const versions = (await getSiteStore().listVersions(site.id)).slice(0, 10);
  const pendingChanges = hasUnpublishedChanges(site);
  const isPublished = site.status === "published";
  // Publicar é a única ação azul da tela; sem nada para publicar, "Edit site" vira a principal.
  const publishLabel = !isPublished
    ? "Publish my website"
    : pendingChanges
      ? "Publish changes"
      : null;
  const { business } = site.spec;
  const where = [business.city, business.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-svh bg-surface">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-5 sm:px-8">
          <Logo />
          <Link
            href="/dashboard"
            className={`inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`}
          >
            <span aria-hidden="true">&larr;&nbsp;</span>My sites
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 pt-8 pb-16 sm:px-8 lg:pt-12 lg:pb-24">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-3xl leading-tight font-bold tracking-[-0.03em] break-words text-ink lg:text-[2.5rem]">
            {business.name}
          </h1>
          <StatusBadge tone={isPublished ? "live" : "draft"}>
            {isPublished ? "Live" : "Draft"}
          </StatusBadge>
        </div>
        {where && <p className="mt-1 text-[15px] text-slate-500">{where}</p>}

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-x-8">
          {/* Coluna da direita (miniatura): vem primeiro no HTML para aparecer no topo no celular. */}
          <aside
            aria-label="Your site"
            className="lg:sticky lg:top-24 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:self-start"
          >
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200">
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
              <h2 id="publish-title" className={panelTitle}>
                Publish
              </h2>
              <p className={`mt-1 max-w-[60ch] ${panelText}`}>
                {pendingChanges
                  ? "You have saved changes that aren’t live yet. Publish them when you’re ready."
                  : isPublished
                    ? "Your website is live. Anyone with the link can see it."
                    : "Happy with the preview? Put your website online in one click."}
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
                  liveUrl={isPublished ? free : null}
                  hasDomain={Boolean(domain.domain)}
                />
              </div>
            </section>

            <section
              id="messages"
              aria-labelledby="messages-title"
              className={`${panelClass} scroll-mt-24`}
            >
              <div className="flex items-center justify-between gap-4">
                <h2 id="messages-title" className={panelTitle}>
                  Messages from your website
                </h2>
                <StatusBadge tone="neutral">
                  <span className="tabular-nums">{leads.length}</span>
                  <span className="sr-only"> messages</span>
                </StatusBadge>
              </div>
              {leads.length === 0 ? (
                <p className={`mt-1 max-w-[60ch] ${panelText}`}>
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
                <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
                  {leads.map((lead) => (
                    <li key={lead.id} className="py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="text-[15px] font-semibold text-ink">{lead.name}</p>
                        <p className="text-[13px] text-slate-500 tabular-nums">
                          {leadDate.format(new Date(lead.createdAt))}
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
            </section>

            <section
              id="domain"
              tabIndex={-1}
              aria-labelledby="domain-title"
              className={`${panelClass} scroll-mt-24 focus:outline-none`}
            >
              <h2 id="domain-title" className={panelTitle}>
                Your own domain
              </h2>
              <p className={`mt-1 max-w-[60ch] ${panelText}`}>
                Already own a domain like{" "}
                <span className="font-medium text-ink">yourbusiness.com</span>? Connect it here.
                Don&rsquo;t have one yet? Buy it at any registrar (GoDaddy, Namecheap,
                Hostinger&hellip;) and come back.
              </p>
              <DomainPanel siteId={site.id} initial={domain} isPublished={isPublished} />
            </section>

            <section
              id="versions"
              aria-labelledby="versions-title"
              className={`${panelClass} scroll-mt-24`}
            >
              <h2 id="versions-title" className={panelTitle}>
                Version history
              </h2>
              <p className={`mt-1 max-w-[60ch] ${panelText}`}>
                Every time you save, we keep a copy. Restore an older one if you change your mind.
              </p>
              <VersionHistory
                siteId={site.id}
                versions={versions.map(({ id: versionId, source, createdAt }) => ({
                  id: versionId,
                  source,
                  createdAt,
                }))}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
