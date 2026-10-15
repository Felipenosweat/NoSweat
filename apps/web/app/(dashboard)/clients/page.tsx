import type { Client, ClientStage } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { focusRing, panelClass, panelText, primaryButton } from "@/components/DashboardUi";
import { LocalTime } from "@/components/LocalTime";
import {
  CLIENTS_TIME_ZONE,
  CLIENT_STAGES,
  STAGE_LABELS,
  dateKeyIn,
  followUpState,
  formatDateOnly,
  isClientStage,
} from "@/lib/clients";
import { getCurrentUser } from "@/server/auth/session";
import { listClients, syncLeadsToClients } from "@/server/clients/service";
import { PlusIcon, SearchIcon, StageBadge, fieldClass, pageTitle, sectionTitle } from "./ui";

export const metadata: Metadata = { title: "Clients", robots: { index: false } };

type ClientsPageProps = {
  searchParams: Promise<{ stage?: string | string[]; q?: string | string[] }>;
};

/** Primeiro valor de um parâmetro da URL (pode vir repetido). */
function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Lista de clientes (fora do componente: usa o relógio). Antes de listar, os pedidos novos do
 * formulário do site viram clientes. `clients: null` = erro ao ler.
 */
async function loadClients(ownerId: string, q: string) {
  const today = dateKeyIn(CLIENTS_TIME_ZONE, new Date());
  try {
    await syncLeadsToClients(ownerId);
  } catch {
    // Falhou ao trazer os pedidos do site: mostra o que já existe.
  }
  try {
    const clients: Client[] = await listClients(ownerId, q ? { q } : undefined);
    return { today, clients };
  } catch {
    return { today, clients: null };
  }
}

/** Link do filtro preservando a busca. */
function filterHref(stage: ClientStage | null, q: string): string {
  const params = new URLSearchParams();
  if (stage) params.set("stage", stage);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/clients?${query}` : "/clients";
}

const filterItem = `inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-white sm:min-h-9 ${focusRing}`;

function StageFilter({
  active,
  counts,
  total,
  q,
}: {
  active: ClientStage | null;
  counts: Record<ClientStage, number>;
  total: number;
  q: string;
}) {
  const items: { stage: ClientStage | null; label: string; count: number }[] = [
    { stage: null, label: "All", count: total },
    ...CLIENT_STAGES.map((stage) => ({ stage, label: STAGE_LABELS[stage], count: counts[stage] })),
  ];
  return (
    <nav aria-label="Filter by stage">
      <ul className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={filterHref(item.stage, q)}
              aria-current={item.stage === active ? "page" : undefined}
              className={filterItem}
            >
              {item.label}
              <span className="font-normal tabular-nums opacity-70">{item.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SearchForm({ q, stage }: { q: string; stage: ClientStage | null }) {
  return (
    <form action="/clients" method="get" role="search" className="flex w-full gap-2 sm:max-w-sm">
      {stage && <input type="hidden" name="stage" value={stage} />}
      <label htmlFor="clients-search" className="sr-only">
        Search clients
      </label>
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
        <input
          id="clients-search"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Name, phone or email"
          className={`${fieldClass} h-11 pl-9 sm:h-10`}
        />
      </div>
      <button
        type="submit"
        className={`inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-[15px] font-semibold text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 sm:min-h-10 ${focusRing}`}
      >
        Search
      </button>
    </form>
  );
}

function FollowUp({ date, today }: { date: string; today: string }) {
  const state = followUpState(date, today);
  const label = state === "today" ? "Today" : formatDateOnly(date, today);
  if (state === "upcoming") return <span className="text-slate-600 tabular-nums">{label}</span>;
  return (
    <span
      className={`font-semibold tabular-nums ${state === "overdue" ? "text-red-700" : "text-amber-800"}`}
    >
      {label}
      {state === "overdue" && <span className="font-normal"> · overdue</span>}
    </span>
  );
}

// Colunas da lista no computador: nome, contato, etapa, retorno, último contato.
const columns =
  "sm:grid sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_7.5rem_8rem] sm:items-center sm:gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_7.5rem_8rem_11rem]";

function ClientRow({ client, today }: { client: Client; today: string }) {
  const contact = [client.phone, client.email].filter(Boolean).join(" · ");
  return (
    <li>
      <Link
        href={`/clients/${encodeURIComponent(client.id)}`}
        className={`block px-4 py-3 text-[15px] leading-6 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5 ${columns}`}
      >
        <span className="flex min-w-0 items-center justify-between gap-3 sm:block">
          <span className="truncate font-semibold text-ink">{client.name}</span>
          <span className="sm:hidden">
            <StageBadge stage={client.stage} />
          </span>
        </span>
        <span className="block truncate text-slate-600">
          {contact || <span className="text-slate-500">No contact info</span>}
        </span>
        <span className="hidden sm:block">
          <StageBadge stage={client.stage} />
        </span>
        <span className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-slate-500 sm:mt-0 sm:block sm:text-[15px]">
          {client.followUpOn ? (
            <span>
              <span className="sm:sr-only">Follow up </span>
              <FollowUp date={client.followUpOn} today={today} />
            </span>
          ) : (
            <span className="max-sm:hidden" aria-hidden="true">
              —
            </span>
          )}
          <span className="sm:hidden">
            Last activity <LocalTime iso={client.lastActivityAt} className="tabular-nums" />
          </span>
        </span>
        <span className="hidden text-[13px] text-slate-500 lg:block">
          <span className="sr-only">Last activity </span>
          <LocalTime iso={client.lastActivityAt} className="tabular-nums" />
        </span>
      </Link>
    </li>
  );
}

function ListHeader() {
  return (
    <div
      aria-hidden="true"
      className={`hidden border-b border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-500 sm:px-5 ${columns}`}
    >
      <span>Name</span>
      <span>Contact</span>
      <span>Stage</span>
      <span>Follow up</span>
      <span className="hidden lg:block">Last activity</span>
    </div>
  );
}

const addClientLink = (
  <Link href="/clients/new" className={primaryButton}>
    <PlusIcon className="size-4" />
    Add client
  </Link>
);

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/clients");

  const params = await searchParams;
  const rawStage = firstParam(params.stage);
  const stage = isClientStage(rawStage) ? rawStage : null;
  const q = firstParam(params.q).trim().slice(0, 100);

  const { today, clients } = await loadClients(user.id, q);

  const counts: Record<ClientStage, number> = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
  for (const client of clients ?? []) counts[client.stage] += 1;
  const shown = (clients ?? []).filter((client) => !stage || client.stage === stage);
  const noClientsAtAll = clients !== null && clients.length === 0 && !q;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Clients</h1>
          <p className={`mt-2 max-w-[60ch] ${panelText}`}>
            Everyone who contacted you, and everyone you&rsquo;ve worked for.
          </p>
        </div>
        {!noClientsAtAll && addClientLink}
      </div>

      {clients === null ? (
        <p role="alert" className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-[15px] text-red-700">
          We couldn&rsquo;t load your clients. Please refresh the page.
        </p>
      ) : noClientsAtAll ? (
        <section aria-labelledby="clients-empty" className={`mt-8 max-w-2xl ${panelClass}`}>
          <h2 id="clients-empty" className={sectionTitle}>
            No clients yet
          </h2>
          <p className={`mt-2 ${panelText}`}>
            When someone sends a message through your website&rsquo;s contact form, they show up
            here on their own, with their message. You can also add people you already work with.
          </p>
          <div className="mt-5">{addClientLink}</div>
        </section>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <StageFilter active={stage} counts={counts} total={clients.length} q={q} />
            <SearchForm q={q} stage={stage} />
          </div>

          {q && (
            <p className="mt-4 text-[15px] text-slate-600">
              Showing results for &ldquo;<span className="font-semibold text-ink">{q}</span>
              &rdquo;.{" "}
              <Link
                href={filterHref(stage, "")}
                className={`font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
              >
                Clear search
              </Link>
            </p>
          )}

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {shown.length === 0 ? (
              <p className="px-4 py-6 text-[15px] text-slate-600 sm:px-5">
                {stage && clients.length > 0
                  ? "No clients in this stage."
                  : "No clients match your search."}
              </p>
            ) : (
              <>
                <ListHeader />
                <ul className="divide-y divide-slate-200">
                  {shown.map((client) => (
                    <ClientRow key={client.id} client={client} today={today} />
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
