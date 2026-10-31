import type { Metadata } from "next";
import { connection } from "next/server";
import { GlassButton, GlassSegmentedLinks, GlassToolbar, cx, focusRing } from "@/components/glass";
import {
  PROSPECT_STATUS_LABELS,
  ProspectStatus,
  WEBSITE_STATUS_LABELS,
  WebsiteStatus,
  type ProspectView,
} from "@/lib/prospects";
import { requireAdmin } from "@/server/admin";
import { getPlacesClient, toView } from "@/server/prospects/service";
import { getProspectStore } from "@/server/prospects/store";
import { AdminPageHeader, fieldClass, labelClass, linkClass } from "../AdminUi";
import { firstParam, type Param } from "../admin-data";
import { CallList } from "./CallList";
import { ProspectSearch } from "./ProspectSearch";
import { ProspectsTable } from "./ProspectsTable";

export const metadata: Metadata = { title: "Prospects · Admin" };

// Prospecção: achar pequenas empresas sem site (ou com site fraco), criar uma prévia para cada
// uma e exportar a lista para a ferramenta de e-mail (ou ligar). Regras em server/prospects.

type ProspectsPageProps = {
  searchParams: Promise<{ view?: Param; ws?: Param; em?: Param; st?: Param }>;
};

type WsFilter = "all" | WebsiteStatus;
type EmFilter = "all" | "yes" | "no";
type StFilter = "all" | ProspectStatus;
type State = { view: "list" | "calls"; ws: WsFilter; em: EmFilter; st: StFilter };

const WS_FILTERS: WsFilter[] = ["all", "none", "weak", "ok", "unknown"];

function parseState(params: Awaited<ProspectsPageProps["searchParams"]>): State {
  const ws = WebsiteStatus.safeParse(firstParam(params.ws));
  const st = ProspectStatus.safeParse(firstParam(params.st));
  const em = firstParam(params.em);
  return {
    view: firstParam(params.view) === "calls" ? "calls" : "list",
    ws: ws.success ? ws.data : "all",
    em: em === "yes" || em === "no" ? em : "all",
    st: st.success ? st.data : "all",
  };
}

function href(state: State, changes: Partial<State>): string {
  const next = { ...state, ...changes };
  const params = new URLSearchParams();
  if (next.view !== "list") params.set("view", next.view);
  if (next.ws !== "all") params.set("ws", next.ws);
  if (next.em !== "all") params.set("em", next.em);
  if (next.st !== "all") params.set("st", next.st);
  const search = params.toString();
  return `/admin/prospects${search ? `?${search}` : ""}`;
}

function matches(prospect: ProspectView, state: State): boolean {
  if (state.ws !== "all" && prospect.websiteStatus !== state.ws) return false;
  if (state.em === "yes" && !prospect.email) return false;
  if (state.em === "no" && prospect.email) return false;
  if (state.st !== "all" && prospect.status !== state.st) return false;
  return true;
}

export default async function AdminProspectsPage({ searchParams }: ProspectsPageProps) {
  await connection();
  await requireAdmin();
  const state = parseState(await searchParams);
  const all = (await getProspectStore().list()).map(toView);
  const googleOn = Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());

  const wsCounts = Object.fromEntries(
    WS_FILTERS.map((filter) => [
      filter,
      filter === "all" ? all.length : all.filter((p) => p.websiteStatus === filter).length,
    ]),
  ) as Record<WsFilter, number>;
  const shown = all.filter((prospect) => matches(prospect, state));
  // Lista de ligações: quem não tem e-mail, tem telefone e não pediu para não ser contatado.
  const calls = all.filter((p) => !p.email && p.phone && p.status !== "do_not_contact");
  const emailable = all.filter((p) => p.email && p.status !== "do_not_contact").length;
  const narrowed = state.ws !== "all" || state.em !== "all" || state.st !== "all";

  return (
    <div className="grid grid-cols-1 gap-6">
      <AdminPageHeader
        title="Prospects"
        count={narrowed && state.view === "list" ? `${shown.length} of ${all.length}` : all.length}
        description="Find small businesses without a good website, make each one a preview site, and export the list for your email tool or call sheet."
        actions={
          <>
            <GlassButton
              href="/api/admin/prospects/export?kind=email"
              prefetch={false}
              variant="secondary"
              download
            >
              Export for email tool <span className="tabular-nums">({emailable})</span>
            </GlassButton>
            <GlassButton
              href="/api/admin/prospects/export?kind=calls"
              prefetch={false}
              variant="secondary"
              download
            >
              Call list CSV <span className="tabular-nums">({calls.length})</span>
            </GlassButton>
          </>
        }
      />

      <ProspectSearch source={getPlacesClient().source} />

      <GlassToolbar sticky={false}>
        <GlassSegmentedLinks
          aria-label="View"
          size="sm"
          className="[&_a]:min-h-11 md:[&_a]:min-h-8"
          items={[
            {
              href: href(state, { view: "list" }),
              current: state.view === "list",
              label: "Prospects",
            },
            {
              href: href(state, { view: "calls" }),
              current: state.view === "calls",
              label: (
                <>
                  Call list{" "}
                  <span className="font-medium text-(--glass-fg-muted) tabular-nums">
                    {calls.length}
                  </span>
                </>
              ),
            },
          ]}
        />
        {state.view === "list" && (
          <div className="-mx-2 w-[calc(100%+1rem)] overflow-x-auto px-2 [scrollbar-width:none] lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0">
            <GlassSegmentedLinks
              aria-label="Filter by website"
              size="sm"
              fullWidth
              className="min-w-[34rem] [&_a]:min-h-11 md:[&_a]:min-h-8"
              items={WS_FILTERS.map((filter) => ({
                href: href(state, { ws: filter }),
                current: filter === state.ws,
                label: (
                  <>
                    {filter === "all" ? "All" : WEBSITE_STATUS_LABELS[filter]}{" "}
                    <span className="font-medium text-(--glass-fg-muted) tabular-nums">
                      {wsCounts[filter]}
                    </span>
                  </>
                ),
              }))}
            />
          </div>
        )}
      </GlassToolbar>

      {state.view === "list" ? (
        <>
          <form
            action="/admin/prospects"
            method="get"
            className="flex flex-wrap items-end gap-3"
            aria-label="More filters"
          >
            {state.ws !== "all" && <input type="hidden" name="ws" value={state.ws} />}
            <label className="w-44">
              <span className={labelClass}>Email</span>
              <select name="em" defaultValue={state.em} className={fieldClass}>
                <option value="all">Any</option>
                <option value="yes">Has email</option>
                <option value="no">No email</option>
              </select>
            </label>
            <label className="w-48">
              <span className={labelClass}>Status</span>
              <select name="st" defaultValue={state.st} className={fieldClass}>
                <option value="all">Any status</option>
                {ProspectStatus.options.map((status) => (
                  <option key={status} value={status}>
                    {PROSPECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <GlassButton type="submit" variant="secondary">
              Apply
            </GlassButton>
            {narrowed && (
              <a
                href={href(state, { ws: "all", em: "all", st: "all" })}
                className={cx(linkClass, "pb-2.5 text-[15px]")}
              >
                Clear filters
              </a>
            )}
          </form>
          <ProspectsTable
            rows={shown}
            emptyText={narrowed ? "No prospects match." : "No prospects yet."}
            emptyDescription={
              narrowed
                ? "Try another filter."
                : "Click Find leads above. Businesses without a website come first in line for a preview."
            }
          />
        </>
      ) : (
        <CallList rows={calls} />
      )}

      <p className="text-[13px] leading-5 text-(--glass-fg-muted)">
        Business data ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className={cx("underline underline-offset-2", focusRing)}
        >
          OpenStreetMap contributors (ODbL)
        </a>
        {googleOn ? " and Google." : "."} Emails come only from each business&rsquo;s own website or
        public listing. Respect “Do not contact” and every unsubscribe.
      </p>
    </div>
  );
}
