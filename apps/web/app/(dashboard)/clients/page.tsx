import type { Client, ClientStage } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/DashboardUi";
import { EmptyState, GlassButton, cx, focusRing, glassButtonClass } from "@/components/glass";
import { dateKeyIn, sortClients } from "@/lib/clients";
import { getViewer } from "@/server/auth/viewer";
import {
  clientsTimeZone,
  getClientsSummary,
  listClients,
  searchClients,
  type ClientsSummary,
} from "@/server/clients/service";
import { ClientsIcon } from "../NavIcons";
import { AddClientButton } from "./AddClientButton";
import { ClientList, ClientsBoard } from "./ClientViews";
import { ClientsToolbar } from "./ClientsToolbar";
import {
  DEFAULT_CLIENTS_PARAMS as DEFAULTS,
  clientsHref,
  parseClientsParams,
  type ClientsParams,
  type RawSearchParams,
} from "./params";
import { ClockIcon, DownloadIcon, InboxIcon, MoneyIcon, TrophyIcon } from "./ui";
import { GuideHint } from "../GuideHint";

export const metadata: Metadata = { title: "Clients", robots: { index: false } };

type ClientsPageProps = { searchParams: Promise<RawSearchParams> };

/**
 * Clientes e o resumo do mês (fora do componente: usa o relógio). O serviço já transforma os
 * pedidos novos do formulário do site em clientes antes de listar (menos o teste do próprio dono,
 * achado pelo `ownerEmail`). "Hoje" no fuso da empresa. `clients: null` = erro ao ler; o resumo
 * some sozinho se der erro (a lista continua).
 */
async function loadClients(ownerId: string, ownerEmail: string | null) {
  const timeZone = await clientsTimeZone(ownerId);
  const today = dateKeyIn(timeZone, new Date());
  let clients: Client[] | null;
  try {
    clients = await listClients(ownerId, { ownerEmail });
  } catch (error) {
    console.error("[clients] could not list clients", error);
    return { today, clients: null, summary: null };
  }
  let summary: ClientsSummary | null = null;
  try {
    summary = await getClientsSummary(ownerId, clients, today, timeZone);
  } catch (error) {
    console.error("[clients] could not build the summary", error);
  }
  return { today, clients, summary };
}

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ---------- resumo ----------

type Tile = {
  key: string;
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: ReactNode;
  /** Cor do número quando pede atenção. */
  tone: "brand" | "red" | "amber" | "emerald" | "ink";
};

const TILE_TONES: Record<Tile["tone"], { number: string; icon: string }> = {
  brand: { number: "text-brand", icon: "bg-brand/10 text-brand" },
  red: { number: "text-red-700", icon: "bg-red-500/10 text-red-700" },
  amber: { number: "text-amber-700", icon: "bg-amber-500/15 text-amber-700" },
  emerald: { number: "text-emerald-700", icon: "bg-emerald-500/10 text-emerald-700" },
  ink: { number: "text-ink", icon: "bg-slate-500/10 text-slate-600" },
};

function SummaryTiles({ summary }: { summary: ClientsSummary }) {
  const due = summary.followUpsToday + summary.followUpsOverdue;
  const tiles: Tile[] = [
    {
      key: "new",
      label: "New requests",
      value: String(summary.newCount),
      hint: summary.newCount > 0 ? "Waiting to hear back" : "All caught up",
      href: clientsHref({ ...DEFAULTS, stage: "new" }),
      icon: <InboxIcon />,
      tone: summary.newCount > 0 ? "brand" : "ink",
    },
    {
      key: "due",
      label: "Follow-ups due",
      value: String(due),
      hint:
        due === 0
          ? "Nothing due today"
          : [
              summary.followUpsOverdue > 0 ? `${summary.followUpsOverdue} overdue` : "",
              summary.followUpsToday > 0 ? `${summary.followUpsToday} today` : "",
            ]
              .filter(Boolean)
              .join(" · "),
      href: clientsHref({ ...DEFAULTS, due: true }),
      icon: <ClockIcon />,
      tone: summary.followUpsOverdue > 0 ? "red" : summary.followUpsToday > 0 ? "amber" : "ink",
    },
    {
      key: "won",
      label: "Won this month",
      value: String(summary.wonThisMonth),
      hint: monthName(summary.month),
      href: clientsHref({ ...DEFAULTS, stage: "won" }),
      icon: <TrophyIcon />,
      tone: summary.wonThisMonth > 0 ? "emerald" : "ink",
    },
    {
      key: "revenue",
      label: "Revenue logged",
      value: money(summary.revenueThisMonthCents),
      hint: `${plural(summary.jobsThisMonth, "job", "jobs")} in ${monthName(summary.month)}`,
      href: clientsHref({ ...DEFAULTS, sort: "value" }),
      icon: <MoneyIcon />,
      tone: summary.revenueThisMonthCents > 0 ? "emerald" : "ink",
    },
  ];
  return (
    <section aria-labelledby="clients-summary">
      <h2 id="clients-summary" className="sr-only">
        This month at a glance
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.key}>
            <Link
              href={tile.href}
              className={cx(
                "glass glass-interactive flex h-full min-h-32 flex-col rounded-2xl p-4 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:glass-raised sm:p-5",
                focusRing,
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "glass-edge grid size-9 place-items-center rounded-xl [&>svg]:size-[18px]",
                  TILE_TONES[tile.tone].icon,
                )}
              >
                {tile.icon}
              </span>
              {/* Rótulo antes do número para o leitor de tela; na tela o número fica em cima. */}
              <span className="mt-auto flex flex-col pt-3">
                <span className="order-2 text-[15px] leading-5 font-semibold text-ink">
                  {tile.label}
                </span>
                <span
                  className={cx(
                    "order-1 mb-1 font-display text-[1.75rem] leading-none font-semibold tracking-[-0.02em] tabular-nums",
                    TILE_TONES[tile.tone].number,
                  )}
                >
                  {tile.value}
                </span>
                <span className="order-3 mt-0.5 text-[13px] leading-5 text-slate-500">
                  {tile.hint}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "2026-10" → "October". */
function monthName(month: string): string {
  const [y = 2000, m = 1] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

/** Link "Export CSV" com os mesmos filtros da tela (é um download: <a> comum, não <Link>). */
function ExportLink({ params }: { params: ClientsParams }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.stage && params.view === "list") search.set("stage", params.stage);
  if (params.sort !== "recent") search.set("sort", params.sort);
  const query = search.toString();
  return (
    <a
      href={`/api/clients/export${query ? `?${query}` : ""}`}
      download
      className={glassButtonClass({ variant: "secondary" })}
    >
      <span aria-hidden="true" className="-ml-0.5 inline-flex [&>svg]:size-[1.15em]">
        <DownloadIcon />
      </span>
      Export CSV
    </a>
  );
}

// ---------- página ----------

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  // No modo "ver como" do admin, os clientes da conta vista (só leitura: sem cadastrar, mudar de
  // etapa, apagar nem exportar).
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/clients");
  const readOnly = viewer.viewingAs !== null;
  const params = parseClientsParams(await searchParams);

  // E-mail da conta mostrada (no "ver como", a conta vista; nunca o do admin).
  const ownerEmail = viewer.viewingAs ? viewer.viewingAs.email : viewer.user.email;
  const { today, clients, summary } = await loadClients(viewer.ownerId, ownerEmail);

  const noClientsAtAll = clients !== null && clients.length === 0;

  return (
    <div>
      <PageHeader
        title="Clients"
        description={<>Everyone who contacted you, and everyone you&rsquo;ve worked for.</>}
        actions={
          !readOnly && clients && !noClientsAtAll ? (
            <>
              <ExportLink params={params} />
              <AddClientButton />
            </>
          ) : undefined
        }
      />

      {clients === null ? (
        <p
          role="alert"
          className="glass-edge mt-8 rounded-2xl bg-red-50/90 px-4 py-3 text-[15px] text-red-700"
        >
          We couldn&rsquo;t load your clients. Please refresh the page.
        </p>
      ) : noClientsAtAll ? (
        <EmptyState
          className="mt-8"
          icon={<ClientsIcon />}
          title="Your client list starts here"
          description={
            <>
              Everyone who fills out your website&rsquo;s contact form shows up here on their own.
              Add the people you already work with to track follow-ups, quotes and jobs.
            </>
          }
          actions={readOnly ? undefined : <AddClientButton label="Add your first client" />}
          footnote={<GuideHint section="clients" />}
        />
      ) : (
        <ClientsContent
          clients={clients}
          summary={summary}
          params={params}
          today={today}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function ClientsContent({
  clients,
  summary,
  params,
  today,
  readOnly,
}: {
  clients: Client[];
  summary: ClientsSummary | null;
  params: ClientsParams;
  today: string;
  readOnly: boolean;
}) {
  // Busca e "retornos vencidos" valem para a lista e para o quadro; a etapa, só para a lista.
  let found = params.q ? searchClients(clients, params.q) : clients;
  if (params.due) {
    found = found.filter(
      (c) =>
        c.followUpOn !== null && c.followUpOn <= today && c.stage !== "won" && c.stage !== "lost",
    );
  }
  const counts: Record<ClientStage, number> = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
  for (const client of found) counts[client.stage] += 1;
  const shown = sortClients(
    params.view === "list" && params.stage ? found.filter((c) => c.stage === params.stage) : found,
    params.sort,
  );

  const clearSearch = clientsHref({ ...params, q: "" });
  const clearAll = clientsHref({ ...DEFAULTS, view: params.view, sort: params.sort });

  return (
    <>
      {summary && (
        <div className="mt-8">
          <SummaryTiles summary={summary} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="sr-only">All clients</h2>
        <ClientsToolbar params={params} counts={counts} total={found.length} />
      </div>

      {(params.q || params.due) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-slate-600">
          <p aria-live="polite">
            {params.due ? "Follow-ups due today or overdue" : "Results"}
            {params.q && (
              <>
                {" "}
                for &ldquo;<span className="font-semibold text-ink">{params.q}</span>&rdquo;
              </>
            )}
            : <span className="tabular-nums">{plural(found.length, "client", "clients")}</span>
          </p>
          <GlassButton href={clearAll} variant="ghost" size="sm">
            Show everyone
          </GlassButton>
        </div>
      )}

      <div className="mt-4">
        {params.view === "board" ? (
          found.length === 0 ? (
            <NoMatch clearHref={params.q ? clearSearch : clearAll} />
          ) : (
            <ClientsBoard clients={shown} today={today} readOnly={readOnly} />
          )
        ) : (
          <ClientList
            clients={shown}
            today={today}
            readOnly={readOnly}
            empty={
              params.stage && found.length > 0 ? (
                <EmptyState
                  framed={false}
                  headingLevel={3}
                  title="No clients in this stage"
                  description="Move a client here from its ⋯ menu, or pick another stage."
                />
              ) : (
                <NoMatch clearHref={params.q ? clearSearch : clearAll} framed={false} />
              )
            }
          />
        )}
      </div>
    </>
  );
}

function NoMatch({ clearHref, framed = true }: { clearHref: string; framed?: boolean }) {
  return (
    <EmptyState
      framed={framed}
      headingLevel={3}
      title="No clients match"
      description="Try another name, phone number, email or tag."
      actions={
        <GlassButton href={clearHref} variant="secondary">
          Clear filters
        </GlassButton>
      }
    />
  );
}
