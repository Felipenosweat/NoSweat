import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteSiteButton } from "@/components/DeleteSiteButton";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/server/auth/session";
import { getDomainState } from "@/server/domains";
import { freeUrl, getOwnedSite, hasUnpublishedChanges, publicUrl } from "@/server/sites";
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; My sites
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase">
            Your website
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            {site.spec.business.name}
          </h1>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">1. Publish</h2>
              <p className="mt-1 text-slate-600">
                {pendingChanges
                  ? "You have saved changes that are not live yet. Publish them when you're ready."
                  : isPublished
                    ? "Your website is live. Anyone with the link can see it."
                    : "Happy with the preview? Put your website online in one click."}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPublished ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {isPublished ? "Live" : "Draft"}
            </span>
          </div>

          {live && (
            <a
              href={live}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block truncate rounded-xl bg-slate-50 px-4 py-3 font-mono text-sm text-sky-700 hover:underline"
            >
              {live}
            </a>
          )}
          {live && free && live !== free && (
            <p className="mt-2 text-sm text-slate-500">
              Also available at{" "}
              <a
                href={free}
                target="_blank"
                rel="noreferrer"
                className="text-sky-700 hover:underline"
              >
                {free}
              </a>
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {!isPublished && <PublishButton siteId={site.id} />}
            {pendingChanges && <PublishButton siteId={site.id} label="Publish changes" />}
            <Link
              href={`/sites/${site.id}/edit`}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Edit website or ask AI
            </Link>
            <Link
              href={`/sites/preview/${site.id}`}
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Open preview
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-bold">2. Use your own domain</h2>
          <p className="mt-1 text-slate-600">
            Already own a domain like <span className="font-medium">yourbusiness.com</span>? Connect
            it here. Don&rsquo;t have one yet? Buy it at any registrar (GoDaddy, Namecheap,
            Hostinger…) and come back.
          </p>
          <DomainPanel siteId={site.id} initial={domain} isPublished={isPublished} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-bold">Version history</h2>
          <p className="mt-1 text-slate-600">
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold">3. Messages from your website</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {leads.length}
            </span>
          </div>
          {leads.length === 0 ? (
            <p className="mt-2 text-slate-600">
              When visitors fill out the contact form on your website, their messages show up here.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {leads.map((lead) => (
                <li key={lead.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{lead.name}</p>
                    <p className="text-xs text-slate-400">
                      {leadDate.format(new Date(lead.createdAt))}
                    </p>
                  </div>
                  <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="text-sky-700 hover:underline">
                        {lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="text-sky-700 hover:underline">
                        {lead.email}
                      </a>
                    )}
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-line text-slate-700">{lead.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-bold">Delete website</h2>
          <p className="mt-1 mb-4 text-slate-600">
            Remove this website from your account. Deleting doesn&rsquo;t give back AI credits.
          </p>
          <DeleteSiteButton
            siteId={site.id}
            siteName={site.spec.business.name}
            redirectTo="/dashboard"
          />
        </section>
      </main>
    </div>
  );
}
