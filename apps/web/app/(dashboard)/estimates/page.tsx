import type { Estimate } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/DashboardUi";
import { EmptyState, GlassButton, GlassCard, cx, focusRing } from "@/components/glass";
import {
  ESTIMATE_FILTERS,
  ESTIMATE_FILTER_LABELS,
  dateKeyIn,
  firstParam,
  formatCents,
  formatDateOnly,
  isEstimateFilter,
  matchesEstimateFilter,
  officeListHref,
  searchDocuments,
  sumTotals,
  type EstimateFilter,
} from "@/lib/office";
import { getViewer } from "@/server/auth/viewer";
import { getOfficeSettings, listEstimates } from "@/server/office/service";
import { DocumentsToolbar } from "../office/_ui/DocumentsToolbar";
import { EstimateBadge, EstimateIcon, PlusIcon } from "../office/_ui/ui";
import { EstimateMenu } from "./EstimateMenu";

export const metadata: Metadata = { title: "Estimates", robots: { index: false } };

type EstimatesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Orçamentos e "hoje" no fuso da empresa. `estimates: null` = erro ao ler. */
async function loadEstimates(ownerId: string) {
  try {
    const [estimates, settings] = await Promise.all([
      listEstimates(ownerId, {}),
      getOfficeSettings(ownerId),
    ]);
    return { estimates, today: dateKeyIn(settings.timeZone, new Date()) };
  } catch (error) {
    console.error("[estimates] could not list estimates", error);
    return { estimates: null, today: dateKeyIn("America/New_York", new Date()) };
  }
}

function NewEstimateButton({ label = "New estimate" }: { label?: string }) {
  return (
    <GlassButton href="/estimates/new" variant="primary" icon={<PlusIcon />}>
      {label}
    </GlassButton>
  );
}

export default async function EstimatesPage({ searchParams }: EstimatesPageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  // "Ver como" do admin: só leitura (sem criar, marcar nem apagar).
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/estimates");
  const readOnly = viewer.viewingAs !== null;

  const raw = await searchParams;
  const statusParam = firstParam(raw.status);
  const status: EstimateFilter = isEstimateFilter(statusParam) ? statusParam : "all";
  const q = firstParam(raw.q).trim().slice(0, 100);

  const { estimates, today } = await loadEstimates(viewer.ownerId);
  const empty = estimates !== null && estimates.length === 0;

  return (
    <div>
      <PageHeader
        title="Estimates"
        description="Price out a job, send the link, and get a yes in writing."
        actions={!readOnly && estimates && !empty ? <NewEstimateButton /> : undefined}
      />

      {estimates === null ? (
        <p
          role="alert"
          className="glass-edge mt-8 rounded-2xl bg-red-50/90 px-4 py-3 text-[15px] text-red-700"
        >
          We couldn&rsquo;t load your estimates. Please refresh the page.
        </p>
      ) : empty ? (
        <EmptyState
          className="mt-8"
          icon={<EstimateIcon />}
          title="Send your first estimate"
          description="Pick a client, add your services and prices, and text them a link. They can approve it from their phone."
          actions={readOnly ? undefined : <NewEstimateButton label="Create an estimate" />}
        />
      ) : (
        <EstimatesContent
          estimates={estimates}
          status={status}
          q={q}
          today={today}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function EstimatesContent({
  estimates,
  status,
  q,
  today,
  readOnly,
}: {
  estimates: Estimate[];
  status: EstimateFilter;
  q: string;
  today: string;
  readOnly: boolean;
}) {
  const found = searchDocuments(estimates, q);
  const counts = Object.fromEntries(
    ESTIMATE_FILTERS.map((filter) => [
      filter,
      found.filter((e) => matchesEstimateFilter(e.status, filter)).length,
    ]),
  ) as Record<EstimateFilter, number>;
  const shown = found
    .filter((e) => matchesEstimateFilter(e.status, status))
    .sort((a, b) => b.number - a.number);

  const waiting = estimates.filter((e) => e.status === "sent");
  const approved = estimates.filter((e) => e.status === "approved");
  const drafts = estimates.filter((e) => e.status === "draft");
  const tiles = [
    {
      key: "waiting",
      label: "Waiting on customers",
      value: formatCents(sumTotals(waiting)),
      hint: `${waiting.length} ${waiting.length === 1 ? "estimate" : "estimates"}`,
      href: officeListHref("/estimates", { status: "waiting", q: "" }),
      tone: waiting.length > 0 ? "text-brand" : "text-ink",
    },
    {
      key: "approved",
      label: "Approved",
      value: formatCents(sumTotals(approved)),
      hint: `${approved.length} ${approved.length === 1 ? "estimate" : "estimates"}`,
      href: officeListHref("/estimates", { status: "approved", q: "" }),
      tone: approved.length > 0 ? "text-emerald-700" : "text-ink",
    },
    {
      key: "draft",
      label: "Drafts",
      value: String(drafts.length),
      hint: drafts.length > 0 ? "Not sent yet" : "All sent",
      href: officeListHref("/estimates", { status: "draft", q: "" }),
      tone: "text-ink",
    },
  ];

  return (
    <>
      <section aria-labelledby="estimates-summary" className="mt-8">
        <h2 id="estimates-summary" className="sr-only">
          Estimates at a glance
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map((tile, index) => (
            <li key={tile.key} className={index === 2 ? "col-span-2 sm:col-span-1" : undefined}>
              <Link
                href={tile.href}
                className={cx(
                  "glass glass-interactive flex h-full flex-col rounded-2xl p-4 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:glass-raised sm:p-5",
                  focusRing,
                )}
              >
                <span className="text-[13px] font-medium text-slate-600">{tile.label}</span>
                <span
                  className={cx(
                    "mt-1 font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.02em] tabular-nums",
                    tile.tone,
                  )}
                >
                  {tile.value}
                </span>
                <span className="text-[13px] text-slate-500">{tile.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <h2 className="sr-only">All estimates</h2>
        <DocumentsToolbar
          status={status}
          q={q}
          filters={ESTIMATE_FILTERS.map((value) => ({
            value,
            label: ESTIMATE_FILTER_LABELS[value],
          }))}
          counts={counts}
          searchLabel="Search estimates"
          placeholder="Search client, title or number"
        />
      </div>

      <GlassCard as="section" padding="none" aria-label="Estimates" className="mt-4 overflow-hidden">
        {shown.length === 0 ? (
          <EmptyState
            framed={false}
            headingLevel={3}
            title="No estimates match"
            description={q ? "Try another name, title or number." : "Pick another filter."}
            actions={
              <GlassButton href="/estimates" variant="secondary">
                Show all estimates
              </GlassButton>
            }
          />
        ) : (
          <ul className="divide-y divide-(--glass-rim) p-1">
            {shown.map((estimate) => (
              <EstimateRow
                key={estimate.id}
                estimate={estimate}
                today={today}
                readOnly={readOnly}
              />
            ))}
          </ul>
        )}
      </GlassCard>
    </>
  );
}

function EstimateRow({
  estimate,
  today,
  readOnly,
}: {
  estimate: Estimate;
  today: string;
  readOnly: boolean;
}) {
  const detail = [
    `#${estimate.number}`,
    estimate.title || null,
    estimate.status === "sent" && estimate.validUntil
      ? `Valid until ${formatDateOnly(estimate.validUntil, today)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="flex items-center gap-1 pr-2 sm:pr-3">
      <Link
        href={`/estimates/${encodeURIComponent(estimate.id)}`}
        className="flex min-h-[4.5rem] min-w-0 flex-1 items-center gap-3 rounded-2xl py-3 pl-4 transition-colors duration-150 hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:pl-5"
      >
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] leading-6 font-semibold text-ink">
              {estimate.clientName}
            </span>
            <EstimateBadge status={estimate.status} size="sm" />
          </span>
          <span className="block truncate text-[13px] leading-5 text-slate-600">{detail}</span>
        </span>
        <span className="shrink-0 text-right text-[15px] font-semibold text-ink tabular-nums">
          {formatCents(estimate.totalCents)}
        </span>
      </Link>
      <EstimateMenu
        readOnly={readOnly}
        estimate={{
          id: estimate.id,
          number: estimate.number,
          clientName: estimate.clientName,
          status: estimate.status,
          publicToken: estimate.publicToken,
        }}
      />
    </li>
  );
}
