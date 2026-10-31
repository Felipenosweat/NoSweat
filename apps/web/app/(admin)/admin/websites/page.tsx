import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  GlassButton,
  GlassSearchField,
  GlassSegmentedLinks,
  GlassToolbar,
} from "@/components/glass";
import { requireAdmin } from "@/server/admin";
import { loadAccountsData, loadSiteSummaries, planState } from "@/server/admin/data";
import {
  SITE_FILTERS,
  SITE_FILTER_LABELS,
  SITES_PAGE_SIZE,
  countSitesByFilter,
  filterSites,
  parseSiteFilter,
  parseSiteLimit,
  type SiteFilter,
} from "@/server/admin/sites";
import { AdminPageHeader, linkClass } from "../AdminUi";
import { GuestCleanup } from "../GuestCleanup";
import { SitesTable } from "../SitesTable";
import { firstParam, ownerInfo, withoutPlanCheck, type Param } from "../admin-data";
import { toSiteRow } from "../site-rows";

export const metadata: Metadata = { title: "Websites · Admin" };

type WebsitesPageProps = {
  searchParams: Promise<{ sq?: Param; sf?: Param; sl?: Param }>;
};

type ListState = { sq: string; sf: SiteFilter; sl: number };

/** Link da lista com parte do estado trocado (valores padrão saem da URL). */
function websitesHref(state: ListState, changes: Partial<ListState>): string {
  const next = { ...state, ...changes };
  const params = new URLSearchParams();
  if (next.sq) params.set("sq", next.sq);
  if (next.sf !== "all") params.set("sf", next.sf);
  if (next.sl > SITES_PAGE_SIZE) params.set("sl", String(next.sl));
  const search = params.toString();
  return `/admin/websites${search ? `?${search}` : ""}`;
}

/** Todos os sites da No Sweat: filtros, busca, menu "⋯" por site e seleção em massa. */
export default async function AdminWebsitesPage({ searchParams }: WebsitesPageProps) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const state: ListState = {
    sq: firstParam(params.sq).trim().slice(0, 100),
    sf: parseSiteFilter(firstParam(params.sf)),
    sl: parseSiteLimit(firstParam(params.sl)),
  };

  // Linhas leves dos sites (sem os SiteSpecs) + contas e planos para o dono e o selo "sem plano".
  const [data, sites] = await Promise.all([loadAccountsData(), loadSiteSummaries()]);
  const { accounts, now } = data;
  const plan = planState(data);
  const { enforced } = plan;
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const owners = ownerInfo(data);
  const withoutPlan = withoutPlanCheck(plan);
  // Rascunhos de visitante (sem conta, nunca publicados): a faxina escolhe estes.
  const guestCreatedAt = sites
    .filter((site) => site.ownerId === null && site.guestId !== null)
    .map((site) => Date.parse(site.createdAt));

  const counts = countSitesByFilter(sites, owners);
  const matching = filterSites(sites, { filter: state.sf, query: state.sq }, owners);
  const shown = matching.slice(0, state.sl);
  const rows = shown.map((site) => {
    const owner = site.ownerId ? accountById.get(site.ownerId) : undefined;
    return toSiteRow(site, {
      owner: owner ? { label: owner.email ?? owner.id, test: owner.testAccount } : null,
      withoutPlan: withoutPlan(site),
      enforced,
    });
  });
  const narrowed = state.sq !== "" || state.sf !== "all";

  return (
    <div className="grid grid-cols-1 gap-6">
      <AdminPageHeader
        title="Websites"
        count={narrowed ? `${matching.length} of ${sites.length}` : sites.length}
        description="Every website on No Sweat, from accounts and from visitors without one. Select several to delete them at once."
      />

      <GlassToolbar sticky={false}>
        <div className="-mx-2 w-[calc(100%+1rem)] overflow-x-auto px-2 [scrollbar-width:none] lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0">
          <GlassSegmentedLinks
            aria-label="Filter websites"
            size="sm"
            fullWidth
            className="min-w-[34rem] [&_a]:min-h-11 md:[&_a]:min-h-8"
            items={SITE_FILTERS.map((filter) => ({
              href: websitesHref(state, { sf: filter, sl: SITES_PAGE_SIZE }),
              current: filter === state.sf,
              label: (
                <>
                  {SITE_FILTER_LABELS[filter]}{" "}
                  <span className="font-medium text-(--glass-fg-muted) tabular-nums">
                    {counts[filter]}
                  </span>
                </>
              ),
            }))}
          />
        </div>
        <form
          role="search"
          action="/admin/websites"
          method="get"
          className="w-full lg:ml-auto lg:w-72"
        >
          {state.sf !== "all" && <input type="hidden" name="sf" value={state.sf} />}
          <GlassSearchField
            label="Find a website"
            name="sq"
            defaultValue={state.sq}
            maxLength={100}
            autoComplete="off"
            placeholder="Business, owner, slug or domain"
          />
        </form>
      </GlassToolbar>

      {state.sq && (
        <p className="-mt-2 text-[15px] text-(--glass-fg-muted)">
          Results for &ldquo;<span className="font-semibold text-(--glass-fg)">{state.sq}</span>
          &rdquo; ·{" "}
          <Link href={websitesHref(state, { sq: "", sl: SITES_PAGE_SIZE })} className={linkClass}>
            Clear search
          </Link>
        </p>
      )}

      <SitesTable
        rows={rows}
        emptyText={narrowed ? "No websites match." : "No websites yet."}
        emptyDescription={narrowed ? "Try another filter or search." : undefined}
      />

      {matching.length > shown.length && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-(--glass-fg-muted)">
          <span>
            Showing {shown.length} of {matching.length}
          </span>
          <GlassButton
            href={websitesHref(state, { sl: state.sl + SITES_PAGE_SIZE })}
            scroll={false}
            variant="secondary"
          >
            Show more
          </GlassButton>
        </div>
      )}

      <GuestCleanup guestCreatedAt={guestCreatedAt} now={now.getTime()} />
    </div>
  );
}
