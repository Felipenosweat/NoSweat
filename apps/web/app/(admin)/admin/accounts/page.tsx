import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { GlassSearchField, GlassSegmentedLinks, GlassToolbar } from "@/components/glass";
import { accountName, canManageAccounts, requireAdmin } from "@/server/admin";
import {
  ACCOUNT_SORTS,
  ACCOUNT_SORT_LABELS,
  filterAccounts,
  loginDisabled,
  parseAccountSort,
  planStatus,
  sortAccounts,
  type AccountSort,
} from "@/server/admin/accounts";
import { leadsByOwner } from "@/server/admin/leads";
import { loadOverview } from "@/server/admin/metrics";
import { AccountsTable, type AdminAccountRow } from "../AccountsTable";
import { AdminPageHeader, Notice, linkClass } from "../AdminUi";
import { CreateTestAccount } from "../CreateTestAccount";
import { firstParam, formatDate, sitesByOwner, type Param } from "../admin-data";

export const metadata: Metadata = { title: "Accounts · Admin" };

type AccountsPageProps = {
  searchParams: Promise<{ aq?: Param; as?: Param; deleted?: Param }>;
};

function accountsHref(query: string, sort: AccountSort): string {
  const params = new URLSearchParams();
  if (query) params.set("aq", query);
  if (sort !== "signup") params.set("as", sort);
  const search = params.toString();
  return `/admin/accounts${search ? `?${search}` : ""}`;
}

/** Todas as contas da No Sweat: busca, ordem e o menu "⋯" de cada uma. */
export default async function AdminAccountsPage({ searchParams }: AccountsPageProps) {
  await connection();
  const admin = await requireAdmin();
  const params = await searchParams;
  const deleted = firstParam(params.deleted).slice(0, 254);
  const query = firstParam(params.aq).trim().slice(0, 100);
  const sort = parseAccountSort(firstParam(params.as));

  const overview = await loadOverview();
  const { accounts, adminIds, sites, grants, subscriptions, leadsBySite, now } = overview;
  const grantByUser = new Map(grants.map((grant) => [grant.userId, grant]));
  const subscriptionByUser = new Map((subscriptions ?? []).map((sub) => [sub.userId, sub]));
  const ownSites = sitesByOwner(sites);
  const leadsPerOwner = leadsBySite ? leadsByOwner(sites, leadsBySite) : null;
  const manageEnabled = canManageAccounts();

  const shown = sortAccounts(filterAccounts(accounts, query), sort);
  const rows: AdminAccountRow[] = shown.map((account) => {
    const own = ownSites.get(account.id) ?? [];
    const name = accountName(account);
    const isAdmin = adminIds.has(account.id);
    const self = account.id === admin.id;
    return {
      id: account.id,
      email: account.email,
      label: name ?? account.email ?? account.id,
      name,
      admin: isAdmin,
      self,
      testAccount: account.testAccount,
      loginDisabled: loginDisabled(account, now),
      canModify: !isAdmin && !self,
      websites: own.length,
      live: own.filter((site) => site.status === "published").length,
      requests: leadsPerOwner ? (leadsPerOwner.get(account.id) ?? 0) : null,
      signedUp: formatDate(account.createdAt),
      lastLogin: formatDate(account.lastSignInAt),
      plan: planStatus(subscriptionByUser.get(account.id), grantByUser.get(account.id), now),
    };
  });

  return (
    <div className="grid grid-cols-1 gap-6">
      <AdminPageHeader
        title="Accounts"
        count={query ? `${shown.length} of ${accounts.length}` : accounts.length}
        description="Everyone with a No Sweat account. Open the ⋯ menu on a row to view as them, manage, disable login or delete a test account."
      />

      {deleted && (
        <Notice tone="success">
          Deleted the account <strong className="font-semibold">{deleted}</strong> and its websites.
        </Notice>
      )}

      <GlassToolbar sticky={false}>
        <form role="search" action="/admin/accounts" method="get" className="w-full sm:w-80">
          {sort !== "signup" && <input type="hidden" name="as" value={sort} />}
          <GlassSearchField
            label="Find an account"
            name="aq"
            defaultValue={query}
            maxLength={100}
            autoComplete="off"
            placeholder="Email or name"
          />
        </form>
        {query && (
          <Link
            href={accountsHref("", sort)}
            className={`${linkClass} inline-flex min-h-11 items-center px-2 text-[15px] sm:min-h-10`}
          >
            Clear search
          </Link>
        )}
        <div className="w-full sm:ml-auto sm:w-auto">
          <GlassSegmentedLinks
            aria-label="Sort accounts"
            fullWidth
            className="sm:w-80 [&_a]:min-h-11 sm:[&_a]:min-h-9"
            items={ACCOUNT_SORTS.map((option) => ({
              href: accountsHref(query, option),
              label: ACCOUNT_SORT_LABELS[option],
              current: option === sort,
            }))}
          />
        </div>
      </GlassToolbar>

      <AccountsTable
        rows={rows}
        manageEnabled={manageEnabled}
        emptyText={query ? "No accounts match." : "No accounts yet."}
        emptyDescription={query ? "Try another name or email." : undefined}
      />

      <CreateTestAccount enabled={manageEnabled} />
    </div>
  );
}
