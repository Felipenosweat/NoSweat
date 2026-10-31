import type { SocialPostStatus } from "@nosweat/schema";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BackLink, StatTile } from "@/components/DashboardUi";
import { GlassBadge, GlassButton, GlassCard, Notice } from "@/components/glass";
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
import { getBalance } from "@/server/credits";
import { getSocialStore } from "@/server/social/store";
import { getSiteStore } from "@/server/store";
import { AccountMenu } from "../../AccountActions";
import { panelText, panelTitle } from "../../AdminUi";
import { SitesTable } from "../../SitesTable";
import { formatDate } from "../../admin-data";
import { toSiteRow } from "../../site-rows";
import { AccessPanel } from "./AccessPanel";
import { CreditsPanel } from "./CreditsPanel";
import { SocialPanel } from "./SocialPanel";
import { adjustCreditsAction, startViewAs } from "./actions";

export const metadata: Metadata = { title: "Account · Admin" };

type ClientPageProps = { params: Promise<{ userId: string }> };

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
    credits,
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
    // Saldo de créditos: um erro (ex.: migration 0019 ainda não rodou) não derruba a página.
    getBalance({ id: account.id }).catch((error: unknown) => {
      console.error("[admin] could not load the credit balance", error);
      return null;
    }),
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
    credits,
  };
}

function AiUsagePanel({ usage }: { usage: UsageByKind | null }) {
  return (
    <GlassCard as="section" aria-labelledby="ai-heading">
      <h2 id="ai-heading" className={panelTitle}>
        AI usage · last 30 days
      </h2>
      {usage ? (
        <table className="mt-3 w-full text-left text-sm tabular-nums">
          <thead className="text-[13px] text-(--glass-fg-muted)">
            <tr>
              <th className="py-2 font-semibold">Feature</th>
              <th className="py-2 text-right font-semibold">Uses</th>
              <th className="py-2 text-right font-semibold">Est. cost</th>
            </tr>
          </thead>
          <tbody>
            {AI_USAGE_KINDS.map((kind) => (
              <tr key={kind} className="border-t border-(--glass-rim)">
                <td className="py-2 text-(--glass-fg)">{AI_USAGE_LABELS[kind]}</td>
                <td className="py-2 text-right">{usage[kind]}</td>
                <td className="py-2 text-right">
                  {formatUsd(estimateKindCostUsd(kind, usage[kind]))}
                </td>
              </tr>
            ))}
            <tr className="border-t border-(--glass-rim) font-semibold text-(--glass-fg)">
              <td className="py-2">Total</td>
              <td className="py-2 text-right">{totalUses(usage)}</td>
              <td className="py-2 text-right">{formatUsd(estimateAiCostUsd(usage))}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className={`mt-2 ${panelText}`}>We couldn&rsquo;t load the AI usage.</p>
      )}
      <p className="mt-3 text-[13px] text-(--glass-fg-muted)">
        Cost is an estimate (fixed price per use), not the AI provider&rsquo;s bill.
      </p>
    </GlassCard>
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
  const { targetIsAdmin, activity, credits } = data;
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
  const manageEnabled = canManageAccounts();
  const enforced = billingEnforced();
  // Mesmo critério do site público (ownerHasLiveAccess): admin, cartão ativo ou acesso manual.
  const ownerHasPlan =
    targetIsAdmin ||
    (Boolean(subscription?.plan) && isActiveStatus(subscription?.status ?? null)) ||
    isGrantActive(grant);

  return (
    <div className="grid grid-cols-1 gap-6">
      <BackLink href="/admin/accounts">All accounts</BackLink>

      <GlassCard as="section" aria-labelledby="account-name" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1
              id="account-name"
              className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.022em] break-words text-(--glass-fg)"
            >
              {name ?? account.email ?? account.id}
            </h1>
            {name && account.email && (
              <p className="mt-1 text-[15px] break-all text-(--glass-fg-muted)">{account.email}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <GlassBadge tone={plan.tone}>{plan.label}</GlassBadge>
              {targetIsAdmin && <GlassBadge tone="info">Admin</GlassBadge>}
              {account.testAccount && <GlassBadge tone="pending">Test account</GlassBadge>}
              {loginOff && <GlassBadge tone="danger">Login disabled</GlassBadge>}
            </div>
            <p className="mt-3 text-[13px] text-(--glass-fg-muted)">
              Signed up {formatDate(account.createdAt)} · Last login{" "}
              {formatDate(account.lastSignInAt)}
            </p>
            <p className="mt-1 font-mono text-xs break-all text-(--glass-fg-muted)">{account.id}</p>
          </div>

          <div className="flex max-w-sm flex-wrap items-center justify-end gap-2">
            {!isSelf && (
              <form action={startViewAs.bind(null, account.id)}>
                <GlassButton type="submit" variant="primary">
                  View as this account
                </GlassButton>
              </form>
            )}
            <AccountMenu
              manageEnabled={manageEnabled}
              target={{
                id: account.id,
                email: account.email,
                label: name ?? account.email ?? account.id,
                testAccount: account.testAccount,
                loginDisabled: loginOff,
                canModify: !targetIsAdmin && !isSelf,
                self: isSelf,
                websites: sites.length,
              }}
            />
          </div>
        </div>
        {!isSelf && (
          <p className="mt-4 text-[13px] text-(--glass-fg-muted)">
            &ldquo;View as&rdquo; opens their dashboard with their data, read-only for 1 hour.
            {loginOff && " Login is disabled: they can't log in. Re-enable it from the ⋯ menu."}
          </p>
        )}
        {!targetIsAdmin && !isSelf && !manageEnabled && (
          <Notice tone="warning" size="sm" className="mt-4">
            Disabling login and deleting need Supabase: set NEXT_PUBLIC_SUPABASE_URL and
            SUPABASE_SERVICE_ROLE_KEY, then reload.
          </Notice>
        )}
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Websites" value={String(sites.length)} hint={`${liveCount} live`} />
        <StatTile
          label="Clients"
          value={activity.clients ? String(activity.clients.total) : "—"}
          hint={activity.clients ? `${activity.clients.newCount} new` : "Couldn't load the clients"}
        />
        <StatTile
          label="Social"
          value={socialAccount ? `@${socialAccount.username}` : "Not connected"}
          hint={
            activity.social
              ? `${activity.social.scheduledThisMonth} scheduled · ${activity.social.publishedThisMonth} published this month`
              : "Couldn't load the posts"
          }
        />
      </div>

      <section aria-labelledby="websites-heading" className="grid gap-3">
        <div>
          <h2 id="websites-heading" className={panelTitle}>
            Websites{" "}
            <span className="font-medium text-(--glass-fg-muted) tabular-nums">
              · {sites.length}
            </span>
          </h2>
          <p className="mt-1 text-[13px] text-(--glass-fg-muted)">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CreditsPanel balance={credits} action={adjustCreditsAction.bind(null, account.id)} />
        <AiUsagePanel usage={activity.ai30d} />
      </div>

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
  );
}
