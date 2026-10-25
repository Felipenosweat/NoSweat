import type { SocialPostStatus } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import {
  StatusBadge,
  panelClass,
  panelText,
  panelTitle,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";
import { accountName, canManageAccounts, getAccount, isAdmin, requireAdmin } from "@/server/admin";
import { loginDisabled, planStatus } from "@/server/admin/accounts";
import {
  AI_USAGE_KINDS,
  AI_USAGE_LABELS,
  estimateAiCostUsd,
  estimateKindCostUsd,
  formatUsd,
  totalUses,
} from "@/server/admin/costs";
import { loadAccountActivity, type UsageByKind } from "@/server/admin/metrics";
import { billingEnforced, getGrantStore, isActiveStatus, isGrantActive } from "@/server/billing";
import { getBillingStore } from "@/server/billing/store";
import { getSocialStore } from "@/server/social/store";
import { getSiteStore } from "@/server/store";
import { SitesTable } from "../../SitesTable";
import { toSiteRow } from "../../site-rows";
import { AccessPanel } from "./AccessPanel";
import { DeleteTestAccount } from "./DeleteTestAccount";
import { LoginAccessPanel } from "./LoginAccessPanel";
import { SocialPanel } from "./SocialPanel";
import { setLoginDisabledAction, startViewAs } from "./actions";

export const metadata: Metadata = { title: "Account" };

type ClientPageProps = { params: Promise<{ userId: string }> };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : "—");

/** Tudo o que a página mostra (fora do componente: usa o relógio). `null` = conta não existe. */
async function loadAccountPage(userId: string) {
  const account = await getAccount(userId);
  if (!account) return null;
  const social = getSocialStore();
  const [
    sites,
    grant,
    subscription,
    socialAccount,
    socialSettings,
    socialPosts,
    targetIsAdmin,
    activity,
  ] = await Promise.all([
    getSiteStore().list(account.id),
    getGrantStore().get(account.id),
    getBillingStore().get(account.id),
    social.getAccountForOwner(account.id, "instagram"),
    social.getSettings(account.id),
    // Todos os posts (intervalo largo + rascunhos sem data), só para contar por status.
    social.listPosts(account.id, "2000-01-01T00:00:00.000Z", "2100-01-01T00:00:00.000Z"),
    isAdmin(account.id),
    loadAccountActivity(account.id),
  ]);
  const postCounts: Partial<Record<SocialPostStatus, number>> = {};
  for (const post of socialPosts) postCounts[post.status] = (postCounts[post.status] ?? 0) + 1;
  return {
    account,
    sites,
    grant,
    subscription,
    socialAccount,
    socialSettings,
    postCounts,
    targetIsAdmin,
    activity,
  };
}

function StatTile({ label, value, note }: { label: string; value: string; note: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4">
      <dt className="text-sm font-semibold text-slate-600">{label}</dt>
      <dd className="mt-1 font-display text-[2rem] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums">
        {value}
      </dd>
      <dd className="text-[13px] text-slate-500">{note}</dd>
    </div>
  );
}

function AiUsagePanel({ usage }: { usage: UsageByKind | null }) {
  return (
    <section aria-labelledby="ai-heading" className={panelClass}>
      <h2 id="ai-heading" className={panelTitle}>
        AI usage · last 30 days
      </h2>
      {usage ? (
        <table className="mt-3 w-full text-left text-sm tabular-nums">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1.5 font-medium">Feature</th>
              <th className="py-1.5 text-right font-medium">Uses</th>
              <th className="py-1.5 text-right font-medium">Est. cost</th>
            </tr>
          </thead>
          <tbody>
            {AI_USAGE_KINDS.map((kind) => (
              <tr key={kind} className="border-t border-slate-100">
                <td className="py-1.5 text-ink">{AI_USAGE_LABELS[kind]}</td>
                <td className="py-1.5 text-right">{usage[kind]}</td>
                <td className="py-1.5 text-right">
                  {formatUsd(estimateKindCostUsd(kind, usage[kind]))}
                </td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 font-semibold text-ink">
              <td className="py-1.5">Total</td>
              <td className="py-1.5 text-right">{totalUses(usage)}</td>
              <td className="py-1.5 text-right">{formatUsd(estimateAiCostUsd(usage))}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className={`mt-2 ${panelText}`}>We couldn&rsquo;t load the AI usage.</p>
      )}
      <p className="mt-3 text-[13px] text-slate-500">
        Cost is an estimate (fixed price per use), not the AI provider&rsquo;s bill.
      </p>
    </section>
  );
}

/** Ficha da conta no painel do admin: quem é, plano, sites, números e as ações do admin. */
export default async function AdminClientPage({ params }: ClientPageProps) {
  await connection();
  const admin = await requireAdmin();
  const { userId } = await params;
  const data = await loadAccountPage(userId);
  if (!data) notFound();
  const { account, sites, grant, subscription, socialAccount, socialSettings, postCounts } = data;
  const { targetIsAdmin, activity } = data;
  // Registro de que um admin abriu os dados sociais da conta (sem detalhes sensíveis).
  await getSocialStore().logEvent({
    ownerId: account.id,
    actorId: admin.id,
    action: "admin_view",
  });

  const name = accountName(account);
  const plan = planStatus(subscription, grant);
  const loginOff = loginDisabled(account);
  const isSelf = account.id === admin.id;
  const liveCount = sites.filter((site) => site.status === "published").length;
  // Qualquer conta que não seja admin nem a própria pode ser apagada (teste: DELETE; cliente de
  // verdade: digitar o e-mail). O servidor confere tudo de novo.
  const canDelete = !targetIsAdmin && !isSelf;
  const enforced = billingEnforced();
  // Mesmo critério do site público (ownerHasLiveAccess): admin, cartão ativo ou acesso manual.
  const ownerHasPlan =
    targetIsAdmin ||
    (Boolean(subscription?.plan) && isActiveStatus(subscription?.status ?? null)) ||
    isGrantActive(grant);

  return (
    <div className="grid grid-cols-1 gap-6">
      <Link href="/admin#accounts" className={`${textButton} -ml-1 w-fit`}>
        <span aria-hidden="true">&larr;</span> All accounts
      </Link>

      <section aria-labelledby="account-name" className={panelClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1
              id="account-name"
              className="font-display text-2xl leading-tight font-bold tracking-[-0.025em] break-words text-ink"
            >
              {name ?? account.email ?? account.id}
            </h1>
            {name && account.email && (
              <p className="mt-1 text-[15px] break-all text-slate-600">{account.email}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {targetIsAdmin && <StatusBadge tone="info">Admin</StatusBadge>}
              {account.testAccount && <StatusBadge tone="pending">Test account</StatusBadge>}
              {loginOff && <StatusBadge tone="neutral">Login disabled</StatusBadge>}
              <StatusBadge tone={plan.tone}>{plan.label}</StatusBadge>
            </div>
            <p className="mt-3 text-[13px] text-slate-500">
              Signed up {formatDate(account.createdAt)} · Last login{" "}
              {formatDate(account.lastSignInAt)}
            </p>
            <p className="mt-1 font-mono text-xs break-all text-slate-400">{account.id}</p>
          </div>
          {!isSelf && (
            <form action={startViewAs.bind(null, account.id)} className="grid gap-1.5">
              <button type="submit" className={secondaryButton}>
                View as this account
              </button>
              <span className="max-w-[16rem] text-[13px] text-slate-500">
                Opens their dashboard with their data. Read-only for 1 hour.
              </span>
            </form>
          )}
        </div>
      </section>

      <dl className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Websites" value={String(sites.length)} note={`${liveCount} live`} />
        <StatTile
          label="Clients"
          value={activity.clients ? String(activity.clients.total) : "—"}
          note={activity.clients ? `${activity.clients.newCount} new` : "Couldn't load the clients"}
        />
        <StatTile
          label="Social"
          value={socialAccount ? `@${socialAccount.username}` : "Not connected"}
          note={
            activity.social
              ? `${activity.social.scheduledThisMonth} scheduled · ${activity.social.publishedThisMonth} published this month`
              : "Couldn't load the posts"
          }
        />
      </dl>

      <section
        aria-labelledby="websites-heading"
        className="rounded-xl border border-slate-200 bg-white"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id="websites-heading" className={panelTitle}>
            Websites <span className="font-normal text-slate-500">· {sites.length}</span>
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            The editor opens their real website: changes you save there are theirs.
          </p>
        </div>
        <SitesTable
          rows={sites.map((site) =>
            toSiteRow(site, {
              owner: { label: account.email ?? account.id, test: account.testAccount },
              withoutPlan: !ownerHasPlan,
              enforced,
            }),
          )}
          showOwner={false}
          emptyText="No websites yet."
        />
      </section>

      <AiUsagePanel usage={activity.ai30d} />

      {/* Os dois painéis já trazem a margem de cima (mt-6); o primeiro dispensa, por causa do gap. */}
      <div className="[&>section:first-child]:mt-0">
        <AccessPanel
          userId={account.id}
          grant={grant}
          subscription={subscription}
          enforced={enforced}
        />

        <SocialPanel
          userId={account.id}
          account={socialAccount}
          settings={socialSettings}
          counts={postCounts}
        />
      </div>

      {canDelete && (
        <LoginAccessPanel
          action={setLoginDisabledAction.bind(null, account.id)}
          disabled={loginOff}
          email={account.email}
          enabled={canManageAccounts()}
        />
      )}

      {canDelete && (
        <DeleteTestAccount
          userId={account.id}
          sites={sites.length}
          testAccount={account.testAccount}
          email={account.email}
        />
      )}
    </div>
  );
}
