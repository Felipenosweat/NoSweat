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
  ACCOUNT_SORTS,
  ACCOUNT_SORT_LABELS,
  filterAccounts,
  loginDisabled,
  parseAccountSort,
  planStatus,
  sortAccounts,
} from "@/server/admin/accounts";
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
import { leadsByOwner } from "@/server/admin/leads";
import { loadOverview, type UsageByKind } from "@/server/admin/metrics";
import {
  SITE_FILTERS,
  SITE_FILTER_LABELS,
  SITES_PAGE_SIZE,
  countSitesByFilter,
  filterSites,
  parseSiteFilter,
  parseSiteLimit,
  type SiteOwnerInfo,
} from "@/server/admin/sites";
import { PLANS } from "@/server/billing";
import { getVercelConfig } from "@/server/domains/vercel";
import type { SiteRecord } from "@/server/store";
import { CreateTestAccount } from "./CreateTestAccount";
import { GuestCleanup } from "./GuestCleanup";
import { SitesTable } from "./SitesTable";
import { toSiteRow } from "./site-rows";

export const metadata: Metadata = { title: "Admin" };

type Param = string | string[] | undefined;

type AdminPageProps = {
  searchParams: Promise<{
    deleted?: Param;
    /** Busca e ordem das contas. */
    aq?: Param;
    as?: Param;
    /** Busca, filtro e limite ("Show more") dos sites. */
    sq?: Param;
    sf?: Param;
    sl?: Param;
  }>;
};

/** O estado das listas que vai na URL (para os links de filtro não perderem o resto). */
type ListState = { aq: string; as: string; sq: string; sf: string; sl: number };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : "—");
const count = (value: number | null) => (value === null ? "—" : value.toLocaleString("en-US"));

const linkClass = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;
const th = "px-5 py-3 font-medium whitespace-nowrap";
const td = "px-5 py-3";
const fieldClass = `mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-ink sm:h-10 ${focusRing}`;
const searchButton = `inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-[15px] font-semibold text-white hover:bg-slate-800 sm:min-h-10 ${focusRing}`;

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

function AccountBadges({
  account,
  admin,
  now,
}: {
  account: ClientAccount;
  admin: boolean;
  now: Date;
}) {
  const disabled = loginDisabled(account, now);
  if (!admin && !account.testAccount && !disabled) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {admin && <StatusBadge tone="info">Admin</StatusBadge>}
      {account.testAccount && <StatusBadge tone="pending">Test account</StatusBadge>}
      {disabled && <StatusBadge tone="neutral">Login disabled</StatusBadge>}
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

function firstParam(value: Param): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Link do /admin com o estado das listas trocado em `changes` (valores padrão saem da URL). */
function adminHref(state: ListState, changes: Partial<ListState>, hash: string): string {
  const next = { ...state, ...changes };
  const params = new URLSearchParams();
  if (next.aq) params.set("aq", next.aq);
  if (next.as && next.as !== "signup") params.set("as", next.as);
  if (next.sq) params.set("sq", next.sq);
  if (next.sf && next.sf !== "all") params.set("sf", next.sf);
  if (next.sl > SITES_PAGE_SIZE) params.set("sl", String(next.sl));
  const query = params.toString();
  return `/admin${query ? `?${query}` : ""}#${hash}`;
}

/** Campos escondidos para um formulário GET não apagar o estado da outra lista. */
function Hidden({ values }: { values: Record<string, string> }) {
  return (
    <>
      {Object.entries(values)
        .filter(([, value]) => value !== "")
        .map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
    </>
  );
}

function SearchForm({
  label,
  name,
  value,
  placeholder,
  hidden,
  hash,
  clearHref,
  children,
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  hidden: Record<string, string>;
  hash: string;
  clearHref: string;
  children?: ReactNode;
}) {
  return (
    <form
      role="search"
      action={`/admin#${hash}`}
      method="get"
      className="flex flex-wrap items-end gap-3 border-b border-slate-200 px-5 py-4"
    >
      <Hidden values={hidden} />
      <label className="min-w-0 flex-1 basis-56 text-sm font-medium text-slate-700 sm:max-w-md">
        {label}
        <input
          type="search"
          name={name}
          defaultValue={value}
          maxLength={100}
          placeholder={placeholder}
          autoComplete="off"
          className={fieldClass}
        />
      </label>
      {children}
      <button type="submit" className={searchButton}>
        Search
      </button>
      {value && (
        <Link href={clearHref} className={`${linkClass} inline-flex min-h-11 items-center sm:min-h-10`}>
          Clear
        </Link>
      )}
    </form>
  );
}

export default async function AdminOverviewPage({ searchParams }: AdminPageProps) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const deleted = firstParam(params.deleted).slice(0, 254);
  const accountQuery = firstParam(params.aq).trim().slice(0, 100);
  const accountSort = parseAccountSort(firstParam(params.as));
  const siteQuery = firstParam(params.sq).trim().slice(0, 100);
  const siteFilter = parseSiteFilter(firstParam(params.sf));
  const siteLimit = parseSiteLimit(firstParam(params.sl));
  const state: ListState = {
    aq: accountQuery,
    as: accountSort,
    sq: siteQuery,
    sf: siteFilter,
    sl: siteLimit,
  };

  const overview = await loadOverview();
  const { accounts, adminIds, sites, grants, subscriptions, leadsBySite } = overview;
  const { leads7d, ai24h, ai30d, plans, expiringGrants, ownersWithAccess, enforced } = overview;
  const { now } = overview;

  const grantByUser = new Map(grants.map((grant) => [grant.userId, grant]));
  const subscriptionByUser = new Map((subscriptions ?? []).map((sub) => [sub.userId, sub]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const owners = new Map<string, SiteOwnerInfo>(
    accounts.map((account) => [
      account.id,
      { email: account.email, testAccount: account.testAccount },
    ]),
  );
  const sitesByOwner = new Map<string, SiteRecord[]>();
  for (const site of sites) {
    if (!site.ownerId) continue;
    sitesByOwner.set(site.ownerId, [...(sitesByOwner.get(site.ownerId) ?? []), site]);
  }
  const leadsPerOwner = leadsBySite ? leadsByOwner(sites, leadsBySite) : null;
  const ownedSites = sites.filter((site) => site.ownerId).length;
  const liveSites = sites.filter((site) => site.status === "published").length;
  const customDomains = sites.filter((site) => site.customDomain).length;
  const testAccounts = accounts.filter((account) => account.testAccount).length;
  // Site publicado de dono sem plano: com os planos valendo, o público vê "temporarily
  // unavailable" (ownerHasLiveAccess); sem eles, sairia do ar ao ligar REQUIRE_PLAN.
  const withoutPlan = (site: SiteRecord) =>
    site.status === "published" &&
    site.ownerId !== null &&
    ownersWithAccess !== null &&
    !ownersWithAccess.has(site.ownerId);
  const liveWithoutPlan = sites.filter(withoutPlan).length;
  // Sem VERCEL_TOKEN, domínio conectado fica "Being set up" até alguém pôr à mão na Vercel.
  const manualDomains = getVercelConfig() ? [] : sites.filter((site) => site.customDomain);
  // Rascunhos de visitante (sem conta, nunca publicados): a faxina escolhe estes.
  const guestCreatedAt = sites
    .filter((site) => site.ownerId === null && site.guestId !== null)
    .map((site) => Date.parse(site.createdAt));

  const shownAccounts = sortAccounts(filterAccounts(accounts, accountQuery), accountSort);
  const siteCounts = countSitesByFilter(sites, owners);
  const matchingSites = filterSites(sites, { filter: siteFilter, query: siteQuery }, owners);
  const shownSites = matchingSites.slice(0, siteLimit);
  const siteRows = shownSites.map((site) => {
    const owner = site.ownerId ? accountById.get(site.ownerId) : undefined;
    return toSiteRow(site, {
      owner: owner ? { label: owner.email ?? owner.id, test: owner.testAccount } : null,
      withoutPlan: withoutPlan(site),
      enforced,
    });
  });
  const planNote = plans
    ? plans.byPlan
        .map((entry) => `${PLANS[entry.plan].name} ${entry.stripe + entry.manual}`)
        .join(" · ")
    : "Couldn't load subscriptions";

  return (
    <div className="grid grid-cols-1 gap-10">
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
          Deleted the account <strong className="font-semibold">{deleted}</strong> and its websites.
        </p>
      )}

      {manualDomains.length > 0 && (
        <section
          aria-labelledby="domains-heading"
          className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-[15px] text-amber-950"
        >
          <h2 id="domains-heading" className="font-semibold">
            VERCEL_TOKEN is not set: these customer domains must be added by hand in Vercel →
            Settings → Domains
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Add each domain and its www version to the project. Until then the customer sees
            &ldquo;Being set up&rdquo;.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {manualDomains.map((site) => {
              const owner = site.ownerId ? accountById.get(site.ownerId) : undefined;
              return (
                <li key={site.id} className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="font-mono font-semibold">{site.customDomain}</span>
                  <Link href={`/sites/${site.id}`} className={linkClass}>
                    {site.spec.business.name}
                  </Link>
                  {site.ownerId && (
                    <Link href={`/admin/clients/${site.ownerId}`} className={linkClass}>
                      {owner?.email ?? site.ownerId}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
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
          <MetricTile
            label="Live sites without a plan"
            value={ownersWithAccess ? count(liveWithoutPlan) : "—"}
            note={
              ownersWithAccess
                ? enforced
                  ? "Offline: visitors see “temporarily unavailable”"
                  : "Go offline when plans turn on"
                : "Couldn't load subscriptions"
            }
          />
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CreateTestAccount enabled={canManageAccounts()} />
        <GuestCleanup guestCreatedAt={guestCreatedAt} now={now.getTime()} />
      </div>

      <section
        id="accounts"
        aria-labelledby="accounts-heading"
        className="scroll-mt-4 rounded-xl border border-slate-200 bg-white"
      >
        <h2 id="accounts-heading" className={`border-b border-slate-200 px-5 py-4 ${panelTitle}`}>
          Accounts{" "}
          <span className="font-normal text-slate-500">
            ·{" "}
            {accountQuery ? `${shownAccounts.length} of ${accounts.length}` : accounts.length}
          </span>
        </h2>
        <SearchForm
          label="Find an account"
          name="aq"
          value={accountQuery}
          placeholder="Email or name"
          hidden={{ sq: siteQuery, sf: siteFilter === "all" ? "" : siteFilter }}
          hash="accounts"
          clearHref={adminHref(state, { aq: "" }, "accounts")}
        >
          <label className="text-sm font-medium text-slate-700">
            Sort by
            <select name="as" defaultValue={accountSort} className={`${fieldClass} w-44`}>
              {ACCOUNT_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {ACCOUNT_SORT_LABELS[sort]}
                </option>
              ))}
            </select>
          </label>
        </SearchForm>
        {shownAccounts.length === 0 ? (
          <p className={`px-5 py-4 ${panelText}`}>No accounts match.</p>
        ) : (
          <>
            {/* Computador: tabela. */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className={th}>Account</th>
                    <th className={th}>Signed up</th>
                    <th className={th}>Last login</th>
                    <th className={th}>Plan</th>
                    <th className={`${th} text-right`}>Websites</th>
                    <th className={`${th} text-right`}>Live</th>
                    <th className={`${th} text-right`}>Requests</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {shownAccounts.map((account) => {
                    const own = sitesByOwner.get(account.id) ?? [];
                    const name = accountName(account);
                    const plan = planStatus(
                      subscriptionByUser.get(account.id),
                      grantByUser.get(account.id),
                      now,
                    );
                    return (
                      <tr key={account.id} className="border-t border-slate-100 align-top">
                        <td className={td}>
                          <Link
                            href={`/admin/clients/${account.id}`}
                            className={`${linkClass} block break-all`}
                          >
                            {account.email ?? account.id}
                          </Link>
                          {name && <span className="block text-slate-500">{name}</span>}
                          <span className="mt-1 block">
                            <AccountBadges
                              account={account}
                              admin={adminIds.has(account.id)}
                              now={now}
                            />
                          </span>
                        </td>
                        <td className={`${td} whitespace-nowrap text-slate-600`}>
                          {formatDate(account.createdAt)}
                        </td>
                        <td className={`${td} whitespace-nowrap text-slate-600`}>
                          {formatDate(account.lastSignInAt)}
                        </td>
                        <td className={td}>
                          <StatusBadge tone={plan.tone}>{plan.label}</StatusBadge>
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{own.length}</td>
                        <td className={`${td} text-right tabular-nums`}>
                          {own.filter((site) => site.status === "published").length}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>
                          {leadsPerOwner ? (leadsPerOwner.get(account.id) ?? 0) : "—"}
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

            {/* Celular: cartões. */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {shownAccounts.map((account) => {
                const own = sitesByOwner.get(account.id) ?? [];
                const name = accountName(account);
                const plan = planStatus(
                  subscriptionByUser.get(account.id),
                  grantByUser.get(account.id),
                  now,
                );
                const live = own.filter((site) => site.status === "published").length;
                const requests = leadsPerOwner ? (leadsPerOwner.get(account.id) ?? 0) : null;
                return (
                  <li key={account.id} className="px-5 py-4">
                    <Link
                      href={`/admin/clients/${account.id}`}
                      className={`${linkClass} block break-all`}
                    >
                      {account.email ?? account.id}
                    </Link>
                    {name && <span className="block text-sm text-slate-500">{name}</span>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StatusBadge tone={plan.tone}>{plan.label}</StatusBadge>
                      <AccountBadges
                        account={account}
                        admin={adminIds.has(account.id)}
                        now={now}
                      />
                    </div>
                    <p className="mt-2 text-[13px] text-slate-500">
                      {own.length} {own.length === 1 ? "website" : "websites"} · {live} live ·{" "}
                      {requests === null ? "—" : requests}{" "}
                      {requests === 1 ? "request" : "requests"}
                    </p>
                    <p className="mt-0.5 text-[13px] text-slate-500">
                      Signed up {formatDate(account.createdAt)} · Last login{" "}
                      {formatDate(account.lastSignInAt)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section
        id="websites"
        aria-labelledby="websites-heading"
        className="scroll-mt-4 rounded-xl border border-slate-200 bg-white"
      >
        <h2 id="websites-heading" className={`border-b border-slate-200 px-5 py-4 ${panelTitle}`}>
          All websites{" "}
          <span className="font-normal text-slate-500">
            ·{" "}
            {siteQuery || siteFilter !== "all"
              ? `${matchingSites.length} of ${sites.length}`
              : sites.length}
          </span>
        </h2>
        <nav aria-label="Filter websites" className="overflow-x-auto border-b border-slate-200 px-3">
          <ul className="flex gap-1 py-2">
            {SITE_FILTERS.map((filter) => {
              const active = filter === siteFilter;
              return (
                <li key={filter}>
                  <Link
                    href={adminHref(state, { sf: filter, sl: SITES_PAGE_SIZE }, "websites")}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold whitespace-nowrap ${
                      active ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                    } ${focusRing}`}
                  >
                    {SITE_FILTER_LABELS[filter]}
                    <span className={`tabular-nums ${active ? "text-white/70" : "text-slate-400"}`}>
                      {siteCounts[filter]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <SearchForm
          label="Find a website"
          name="sq"
          value={siteQuery}
          placeholder="Business, owner email, slug or domain"
          hidden={{
            sf: siteFilter === "all" ? "" : siteFilter,
            aq: accountQuery,
            as: accountSort === "signup" ? "" : accountSort,
          }}
          hash="websites"
          clearHref={adminHref(state, { sq: "", sl: SITES_PAGE_SIZE }, "websites")}
        />
        <SitesTable
          rows={siteRows}
          emptyText={
            siteQuery || siteFilter !== "all" ? "No websites match." : "No websites yet."
          }
        />
        {matchingSites.length > shownSites.length && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
            <span>
              Showing {shownSites.length} of {matchingSites.length}
            </span>
            <Link
              href={adminHref(state, { sl: siteLimit + SITES_PAGE_SIZE }, "websites")}
              scroll={false}
              className={linkClass}
            >
              Show more
            </Link>
          </div>
        )}
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
