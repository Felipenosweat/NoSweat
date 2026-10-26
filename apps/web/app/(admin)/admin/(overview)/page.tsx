import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { GlassCard } from "@/components/glass";
import { requireAdmin } from "@/server/admin";
import { estimateAiCostUsd, formatUsd, totalUses } from "@/server/admin/costs";
import {
  loadAccountsData,
  loadAiUsage,
  loadLeads7d,
  loadSiteSummaries,
  planState,
} from "@/server/admin/data";
import { PLANS } from "@/server/billing";
import { getVercelConfig } from "@/server/domains/vercel";
import { CardSkeleton, TileItemsSkeleton } from "../AdminSkeletons";
import { AdminPageHeader, StatTile, linkClass, panelText, panelTitle } from "../AdminUi";
import { dateFormat, formatCount, withoutPlanCheck } from "../admin-data";

export const metadata: Metadata = { title: "Admin" };

// Cada seção lê só o que mostra e chega sozinha (Suspense): o cabeçalho e as abas aparecem na
// hora, e os números vão entrando. As leituras são divididas no mesmo request (React cache) e
// ficam até 30 s no cache do admin (server/admin/data.ts).

/** Domínios de clientes para pôr à mão na Vercel (só sem VERCEL_TOKEN). */
async function ManualDomainsAlert() {
  const [{ accounts }, sites] = await Promise.all([loadAccountsData(), loadSiteSummaries()]);
  // Sem VERCEL_TOKEN, domínio conectado fica "Being set up" até alguém pôr à mão na Vercel.
  const manualDomains = sites.filter((site) => site.customDomain);
  if (manualDomains.length === 0) return null;
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  return (
    <section
      aria-labelledby="domains-heading"
      className="glass-edge rounded-2xl bg-amber-50/90 px-5 py-4 text-[15px] text-amber-950"
    >
      <h2 id="domains-heading" className="font-semibold">
        VERCEL_TOKEN is not set: add these customer domains by hand in Vercel → Settings → Domains
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
  );
}

/** Contas, sites, sites no ar e pedidos da semana. */
async function CoreTiles() {
  const [{ accounts, adminIds }, sites, leads7d] = await Promise.all([
    loadAccountsData(),
    loadSiteSummaries(),
    loadLeads7d(),
  ]);
  const ownedSites = sites.filter((site) => site.ownerId).length;
  const liveSites = sites.filter((site) => site.status === "published").length;
  const customDomains = sites.filter((site) => site.customDomain).length;
  const testAccounts = accounts.filter((account) => account.testAccount).length;

  return (
    <>
      <li>
        <StatTile
          href="/admin/accounts"
          label="Accounts"
          value={formatCount(accounts.length)}
          note={`${testAccounts} test · ${adminIds.size} admin`}
        />
      </li>
      <li>
        <StatTile
          href="/admin/websites"
          label="Websites"
          value={formatCount(ownedSites)}
          note={`+ ${sites.length - ownedSites} from visitors without an account`}
        />
      </li>
      <li>
        <StatTile
          href="/admin/websites?sf=live"
          label="Live sites"
          value={formatCount(liveSites)}
          note={`${customDomains} on their own domain`}
        />
      </li>
      <li>
        <StatTile
          label="Website requests"
          value={formatCount(leads7d)}
          note="Contact form · last 7 days"
        />
      </li>
    </>
  );
}

/** Usos da IA (24 h e 30 dias) com o custo estimado. */
async function AiTiles() {
  const { ai24h, ai30d } = await loadAiUsage();
  return (
    <>
      <li>
        <StatTile
          href="/admin/usage"
          label="AI uses · 24h"
          value={ai24h ? formatCount(totalUses(ai24h)) : "—"}
          note={ai24h ? `≈ ${formatUsd(estimateAiCostUsd(ai24h))} (estimate)` : undefined}
        />
      </li>
      <li>
        <StatTile
          href="/admin/usage"
          label="AI uses · 30 days"
          value={ai30d ? formatCount(totalUses(ai30d)) : "—"}
          note={ai30d ? `≈ ${formatUsd(estimateAiCostUsd(ai30d))} (estimate)` : undefined}
        />
      </li>
    </>
  );
}

/** Planos ativos e sites no ar de dono sem plano. */
async function PlanTiles() {
  const [data, sites] = await Promise.all([loadAccountsData(), loadSiteSummaries()]);
  const state = planState(data);
  const { plans, ownersWithAccess, enforced } = state;
  const liveWithoutPlan = sites.filter(withoutPlanCheck(state)).length;
  const planNote = plans
    ? plans.byPlan
        .map((entry) => `${PLANS[entry.plan].name} ${entry.stripe + entry.manual}`)
        .join(" · ")
    : "Couldn't load subscriptions";

  return (
    <>
      <li>
        <StatTile
          label="Active plans"
          value={plans ? formatCount(plans.accounts) : "—"}
          note={planNote}
        />
      </li>
      <li>
        <StatTile
          label="Live without a plan"
          value={ownersWithAccess ? formatCount(liveWithoutPlan) : "—"}
          note={
            ownersWithAccess
              ? enforced
                ? "Offline: visitors see “temporarily unavailable”"
                : "Go offline when plans turn on"
              : "Couldn't load subscriptions"
          }
        />
      </li>
    </>
  );
}

/** Cartões de planos ativos e acessos manuais vencendo. */
async function PlanCards() {
  const data = await loadAccountsData();
  const { plans, expiringGrants } = planState(data);
  const accountById = new Map(data.accounts.map((account) => [account.id, account]));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GlassCard as="section" aria-labelledby="plans-heading">
        <h2 id="plans-heading" className={panelTitle}>
          Active plans
        </h2>
        {plans ? (
          <table className="mt-3 w-full text-left text-sm tabular-nums">
            <thead className="text-[13px] text-(--glass-fg-muted)">
              <tr>
                <th className="py-2 font-semibold">Plan</th>
                <th className="py-2 text-right font-semibold">Card (Stripe)</th>
                <th className="py-2 text-right font-semibold">Manual</th>
              </tr>
            </thead>
            <tbody>
              {plans.byPlan.map((entry) => (
                <tr key={entry.plan} className="border-t border-(--glass-rim)">
                  <td className="py-2.5 font-medium text-(--glass-fg)">{PLANS[entry.plan].name}</td>
                  <td className="py-2.5 text-right">{entry.stripe}</td>
                  <td className="py-2.5 text-right">{entry.manual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={`mt-2 ${panelText}`}>We couldn&rsquo;t load the subscriptions.</p>
        )}
      </GlassCard>

      <GlassCard as="section" aria-labelledby="expiring-heading">
        <h2 id="expiring-heading" className={panelTitle}>
          Manual access ending in 7 days
        </h2>
        {expiringGrants.length === 0 ? (
          <p className={`mt-2 ${panelText}`}>Nothing ends this week.</p>
        ) : (
          <ul className="mt-3 text-sm">
            {expiringGrants.map((grant) => (
              <li
                key={grant.userId}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-(--glass-rim) py-2.5 first:border-t-0"
              >
                <Link href={`/admin/clients/${grant.userId}`} className={linkClass}>
                  {accountById.get(grant.userId)?.email ?? grant.userId}
                </Link>
                <span className="text-(--glass-fg-muted)">
                  {PLANS[grant.plan].name} · ends {dateFormat.format(new Date(grant.expiresAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

/**
 * Visão geral do painel: os números da No Sweat, planos, acessos vencendo e alertas. As listas
 * ficam nas próprias abas (/admin/accounts, /admin/websites, /admin/usage).
 */
export default async function AdminOverviewPage() {
  await connection();
  await requireAdmin();

  return (
    <div className="grid grid-cols-1 gap-8">
      <AdminPageHeader
        title="Command center"
        description="Every account and every website on No Sweat. As an admin you can see and manage all of them."
      />

      {!getVercelConfig() && (
        <Suspense fallback={null}>
          <ManualDomainsAlert />
        </Suspense>
      )}

      <section aria-labelledby="numbers-heading">
        <h2 id="numbers-heading" className="sr-only">
          Numbers
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Suspense fallback={<TileItemsSkeleton count={4} />}>
            <CoreTiles />
          </Suspense>
          <Suspense fallback={<TileItemsSkeleton count={2} />}>
            <AiTiles />
          </Suspense>
          <Suspense fallback={<TileItemsSkeleton count={2} />}>
            <PlanTiles />
          </Suspense>
        </ul>
      </section>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden="true">
            <CardSkeleton lines={4} />
            <CardSkeleton lines={2} />
          </div>
        }
      >
        <PlanCards />
      </Suspense>
    </div>
  );
}
