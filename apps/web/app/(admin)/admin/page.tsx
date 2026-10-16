import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import {
  StatusBadge,
  focusRing,
  panelClass,
  panelText,
  panelTitle,
} from "@/components/DashboardUi";
import { accountName, canManageAccounts, requireAdmin, type ClientAccount } from "@/server/admin";
import {
  AI_COST_PER_USE_USD,
  AI_USAGE_KINDS,
  AI_USAGE_LABELS,
  estimateAiCostUsd,
  estimateKindCostUsd,
  formatUsd,
  formatUsdPerUse,
  totalUses,
} from "@/server/admin/costs";
import { loadOverview, type UsageByKind } from "@/server/admin/metrics";
import { isGrantActive, PLANS, type AccessGrant } from "@/server/billing";
import type { SiteRecord } from "@/server/store";
import { CreateTestAccount } from "./CreateTestAccount";

export const metadata: Metadata = { title: "Admin" };

type AdminPageProps = { searchParams: Promise<{ deleted?: string | string[] }> };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : "—");
const count = (value: number | null) => (value === null ? "—" : value.toLocaleString("en-US"));

const linkClass = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;
const th = "px-5 py-3 font-medium whitespace-nowrap";
const td = "px-5 py-3";

function accessLabel(grant: AccessGrant | undefined): string {
  if (!grant) return "—";
  const date = dateOnly.format(new Date(grant.expiresAt));
  return isGrantActive(grant) ? `${PLANS[grant.plan].name} until ${date}` : `Expired ${date}`;
}

/** Endereço do site no ar: domínio próprio ou /s/<slug>. `null` se não está publicado. */
function liveHref(site: SiteRecord): string | null {
  if (site.status !== "published") return null;
  if (site.customDomain) return `https://${site.customDomain}`;
  return site.slug ? `/s/${site.slug}` : null;
}

function MetricTile({ label, value, note }: { label: string; value: string; note?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4">
      <dt className="text-sm font-semibold text-slate-600">{label}</dt>
      <dd className="mt-1 font-display text-[2rem] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums">
        {value}
      </dd>
      {note && <dd className="text-[13px] text-slate-500">{note}</dd>}
    </div>
  );
}

function AccountBadges({ account, admin }: { account: ClientAccount; admin: boolean }) {
  if (!admin && !account.testAccount) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {admin && <StatusBadge tone="info">Admin</StatusBadge>}
      {account.testAccount && <StatusBadge tone="pending">Test account</StatusBadge>}
    </span>
  );
}

function UsageTable({ ai24h, ai30d }: { ai24h: UsageByKind | null; ai30d: UsageByKind | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className={th}>AI feature</th>
            <th className={`${th} text-right`}>Last 24h</th>
            <th className={`${th} text-right`}>Last 30 days</th>
            <th className={`${th} text-right`}>Est. per use</th>
            <th className={`${th} text-right`}>Est. cost · 30 days</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {AI_USAGE_KINDS.map((kind) => (
            <tr key={kind} className="border-t border-slate-100">
              <td className={`${td} font-medium text-ink`}>{AI_USAGE_LABELS[kind]}</td>
              <td className={`${td} text-right`}>{count(ai24h?.[kind] ?? null)}</td>
              <td className={`${td} text-right`}>{count(ai30d?.[kind] ?? null)}</td>
              <td className={`${td} text-right text-slate-600`}>
                {formatUsdPerUse(AI_COST_PER_USE_USD[kind])}
              </td>
              <td className={`${td} text-right`}>
                {ai30d ? formatUsd(estimateKindCostUsd(kind, ai30d[kind])) : "—"}
              </td>
            </tr>
          ))}
          <tr className="border-t border-slate-200 font-semibold text-ink">
            <td className={td}>Total</td>
            <td className={`${td} text-right`}>{ai24h ? count(totalUses(ai24h)) : "—"}</td>
            <td className={`${td} text-right`}>{ai30d ? count(totalUses(ai30d)) : "—"}</td>
            <td className={td} />
            <td className={`${td} text-right`}>
              {ai30d ? formatUsd(estimateAiCostUsd(ai30d)) : "—"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminOverviewPage({ searchParams }: AdminPageProps) {
  await connection();
  await requireAdmin();
  const deleted = firstParam((await searchParams).deleted).slice(0, 254);
  const overview = await loadOverview();
  const { accounts, adminIds, sites, grants, leads7d, ai24h, ai30d, plans, expiringGrants } =
    overview;

  const grantByUser = new Map(grants.map((grant) => [grant.userId, grant]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const sitesByOwner = new Map<string, SiteRecord[]>();
  for (const site of sites) {
    if (!site.ownerId) continue;
    sitesByOwner.set(site.ownerId, [...(sitesByOwner.get(site.ownerId) ?? []), site]);
  }
  const ownedSites = sites.filter((site) => site.ownerId).length;
  const liveSites = sites.filter((site) => site.status === "published").length;
  const customDomains = sites.filter((site) => site.customDomain).length;
  const testAccounts = accounts.filter((account) => account.testAccount).length;
  const planNote = plans
    ? plans.byPlan
        .map((entry) => `${PLANS[entry.plan].name} ${entry.stripe + entry.manual}`)
        .join(" · ")
    : "Couldn't load subscriptions";

  return (
    <div className="grid gap-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.025em] text-ink">
          Command center
        </h1>
        <p className={`mt-1 ${panelText}`}>
          Every account and every website on No Sweat. As an admin you can see and manage all of
          them.
        </p>
      </div>

      {deleted && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900"
        >
          Deleted the test account <strong className="font-semibold">{deleted}</strong> and its
          websites.
        </p>
      )}

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile
            label="Accounts"
            value={count(accounts.length)}
            note={`${testAccounts} test · ${adminIds.size} admin`}
          />
          <MetricTile
            label="Websites"
            value={count(ownedSites)}
            note={`${sites.length - ownedSites} more from visitors without an account`}
          />
          <MetricTile
            label="Live sites"
            value={count(liveSites)}
            note={`${customDomains} on their own domain`}
          />
          <MetricTile
            label="Website requests"
            value={count(leads7d)}
            note="Contact form · last 7 days"
          />
          <MetricTile
            label="AI uses · 24h"
            value={ai24h ? count(totalUses(ai24h)) : "—"}
            note={ai24h ? `≈ ${formatUsd(estimateAiCostUsd(ai24h))} (estimate)` : undefined}
          />
          <MetricTile
            label="AI uses · 30 days"
            value={ai30d ? count(totalUses(ai30d)) : "—"}
            note={ai30d ? `≈ ${formatUsd(estimateAiCostUsd(ai30d))} (estimate)` : undefined}
          />
          <MetricTile
            label="Active plans"
            value={plans ? count(plans.accounts) : "—"}
            note={planNote}
          />
          <MetricTile
            label="Access ending soon"
            value={count(expiringGrants.length)}
            note="Manual access · next 7 days"
          />
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="plans-heading" className={panelClass}>
          <h2 id="plans-heading" className={panelTitle}>
            Active plans
          </h2>
          {plans ? (
            <table className="mt-3 w-full text-left text-sm tabular-nums">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1.5 font-medium">Plan</th>
                  <th className="py-1.5 text-right font-medium">Card (Stripe)</th>
                  <th className="py-1.5 text-right font-medium">Manual</th>
                </tr>
              </thead>
              <tbody>
                {plans.byPlan.map((entry) => (
                  <tr key={entry.plan} className="border-t border-slate-100">
                    <td className="py-1.5 font-medium text-ink">{PLANS[entry.plan].name}</td>
                    <td className="py-1.5 text-right">{entry.stripe}</td>
                    <td className="py-1.5 text-right">{entry.manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={`mt-2 ${panelText}`}>We couldn&rsquo;t load the subscriptions.</p>
          )}
        </section>

        <section aria-labelledby="expiring-heading" className={panelClass}>
          <h2 id="expiring-heading" className={panelTitle}>
            Manual access ending in 7 days
          </h2>
          {expiringGrants.length === 0 ? (
            <p className={`mt-2 ${panelText}`}>Nothing ends this week.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {expiringGrants.map((grant) => (
                <li key={grant.userId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <Link href={`/admin/clients/${grant.userId}`} className={linkClass}>
                    {accountById.get(grant.userId)?.email ?? grant.userId}
                  </Link>
                  <span className="text-slate-600">
                    {PLANS[grant.plan].name} · ends {dateFormat.format(new Date(grant.expiresAt))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CreateTestAccount enabled={canManageAccounts()} />

      <section
        id="accounts"
        aria-labelledby="accounts-heading"
        className="rounded-xl border border-slate-200 bg-white"
      >
        <h2 id="accounts-heading" className={`border-b border-slate-200 px-5 py-4 ${panelTitle}`}>
          Accounts <span className="font-normal text-slate-500">· {accounts.length}</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className={th}>Account</th>
                <th className={th}>Signed up</th>
                <th className={th}>Last login</th>
                <th className={th}>Websites</th>
                <th className={th}>Live</th>
                <th className={th}>Manual access</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const own = sitesByOwner.get(account.id) ?? [];
                const name = accountName(account);
                return (
                  <tr key={account.id} className="border-t border-slate-100 align-top">
                    <td className={td}>
                      <span className="block font-medium text-ink">
                        {account.email ?? account.id}
                      </span>
                      {name && <span className="block text-slate-500">{name}</span>}
                      <span className="mt-1 block">
                        <AccountBadges account={account} admin={adminIds.has(account.id)} />
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-600`}>
                      {formatDate(account.createdAt)}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-600`}>
                      {formatDate(account.lastSignInAt)}
                    </td>
                    <td className={`${td} tabular-nums`}>{own.length}</td>
                    <td className={`${td} tabular-nums`}>
                      {own.filter((site) => site.status === "published").length}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-600`}>
                      {accessLabel(grantByUser.get(account.id))}
                    </td>
                    <td className={`${td} text-right`}>
                      <Link
                        href={`/admin/clients/${account.id}`}
                        className={`${linkClass} whitespace-nowrap`}
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="websites"
        aria-labelledby="websites-heading"
        className="rounded-xl border border-slate-200 bg-white"
      >
        <h2 id="websites-heading" className={`border-b border-slate-200 px-5 py-4 ${panelTitle}`}>
          All websites <span className="font-normal text-slate-500">· {sites.length}</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className={th}>Business</th>
                <th className={th}>Owner</th>
                <th className={th}>Template</th>
                <th className={th}>Status</th>
                <th className={th}>Address</th>
                <th className={th}>Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => {
                const live = liveHref(site);
                const owner = site.ownerId ? accountById.get(site.ownerId) : undefined;
                return (
                  <tr key={site.id} className="border-t border-slate-100">
                    <td className={td}>
                      <Link href={`/sites/${site.id}`} className={linkClass}>
                        {site.spec.business.name}
                      </Link>
                    </td>
                    <td className={`${td} text-slate-600`}>
                      {site.ownerId ? (
                        <Link href={`/admin/clients/${site.ownerId}`} className={linkClass}>
                          {owner?.email ?? site.ownerId}
                        </Link>
                      ) : (
                        "Visitor (no account)"
                      )}
                    </td>
                    <td className={`${td} text-slate-600`}>{site.spec.template}</td>
                    <td className={td}>
                      <StatusBadge tone={site.status === "published" ? "live" : "draft"}>
                        {site.status === "published" ? "Live" : "Draft"}
                      </StatusBadge>
                    </td>
                    <td className={`${td} font-mono text-xs text-slate-600`}>
                      {live ? (
                        <a href={live} target="_blank" rel="noreferrer" className={linkClass}>
                          {site.customDomain ?? `/s/${site.slug ?? ""}`}
                        </a>
                      ) : (
                        (site.customDomain ?? (site.slug ? `/s/${site.slug}` : "—"))
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-600`}>
                      {formatDate(site.createdAt)}
                    </td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <Link href={`/sites/${site.id}/edit`} className={linkClass}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="usage"
        aria-labelledby="usage-heading"
        className="rounded-xl border border-slate-200 bg-white"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id="usage-heading" className={panelTitle}>
            AI usage and estimated cost
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Every account and every visitor without an account. Costs are an estimate from a fixed
            price per use, not your AI provider&rsquo;s bill.
          </p>
        </div>
        <UsageTable ai24h={ai24h} ai30d={ai30d} />
      </section>
    </div>
  );
}
