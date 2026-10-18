import type { Client, ClientStage } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  IconTile,
  PageHeader,
  cardClass,
  focusRing,
  primaryButton,
  secondaryButton,
} from "@/components/DashboardUi";
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
import { getViewer } from "@/server/auth/viewer";
import { listClients } from "@/server/clients/service";
import { ClientsIcon } from "../NavIcons";
import { PlusIcon, SearchIcon, StageBadge, fieldClass, sectionTitle } from "./ui";

export const metadata: Metadata = { title: "Clients", robots: { index: false } };

type ClientsPageProps = {
  searchParams: Promise<{ stage?: string | string[]; q?: string | string[] }>;
};

/** Primeiro valor de um parâmetro da URL (pode vir repetido). */
function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Lista de clientes (fora do componente: usa o relógio). O serviço já transforma os pedidos novos
 * do formulário do site em clientes antes de listar. `clients: null` = erro ao ler.
 */
async function loadClients(ownerId: string, q: string) {
  const today = dateKeyIn(CLIENTS_TIME_ZONE, new Date());
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

// Controle segmentado (como o do iOS): trilho cinza e o filtro ativo numa cápsula branca.
const filterItem = `inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg px-1.5 text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors duration-150 hover:text-ink aria-[current=page]:bg-white aria-[current=page]:text-ink aria-[current=page]:shadow-[0_1px_2px_rgb(7_27_51/0.08),0_1px_1px_rgb(7_27_51/0.04)] sm:min-h-9 sm:w-auto sm:gap-1.5 sm:px-3 ${focusRing}`;

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
      {/* Celular: 3 colunas que nunca passam da largura da tela; computador: uma linha só. */}
      <ul className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-1 rounded-xl bg-slate-200/60 p-1 sm:flex sm:w-fit sm:flex-wrap">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={filterHref(item.stage, q)}
              aria-current={item.stage === active ? "page" : undefined}
              className={filterItem}
            >
              {item.label}
              <span className="font-normal tabular-nums">{item.count}</span>
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
      <button type="submit" className={secondaryButton}>
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

/** Letra do avatar do cliente (primeira letra do nome). */
function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function Avatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600 ${className}`}
    >
      {initialOf(name)}
    </span>
  );
}

function ClientRow({ client, today }: { client: Client; today: string }) {
  const contact = [client.phone, client.email].filter(Boolean).join(" · ");
  return (
    // Linha fina recuada até o texto no celular (depois do avatar); inteira no computador.
    <li className="relative before:absolute before:top-0 before:right-0 before:left-16 before:h-px before:bg-slate-200/70 first:before:hidden sm:before:left-0">
      <Link
        href={`/clients/${encodeURIComponent(client.id)}`}
        className={`flex items-start gap-3 px-4 py-3 text-[15px] leading-6 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5 ${columns}`}
      >
        {/* Avatar do celular; no computador ele fica dentro da coluna do nome. */}
        <Avatar name={client.name} className="grid sm:hidden" />
        <span className="min-w-0 flex-1 sm:contents">
          <span className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
            <Avatar name={client.name} className="hidden sm:grid" />
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
        </span>
      </Link>
    </li>
  );
}

function ListHeader() {
  return (
    <div
      aria-hidden="true"
      className={`hidden border-b border-slate-200/70 bg-slate-50/70 px-4 py-2.5 text-[13px] font-medium text-slate-500 sm:px-5 ${columns}`}
    >
      {/* Recuo do avatar (36px + 12px) para alinhar com os nomes. */}
      <span className="sm:pl-12">Name</span>
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
  // No modo "ver como" do admin, os clientes da conta vista (só leitura: sem "Add client").
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/clients");
  const readOnly = viewer.viewingAs !== null;

  const params = await searchParams;
  const rawStage = firstParam(params.stage);
  const stage = isClientStage(rawStage) ? rawStage : null;
  const q = firstParam(params.q).trim().slice(0, 100);

  const { today, clients } = await loadClients(viewer.ownerId, q);

  const counts: Record<ClientStage, number> = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
  for (const client of clients ?? []) counts[client.stage] += 1;
  const shown = (clients ?? []).filter((client) => !stage || client.stage === stage);
  const noClientsAtAll = clients !== null && clients.length === 0 && !q;

  return (
    <div>
      <PageHeader
        title="Clients"
        description={<>Everyone who contacted you, and everyone you&rsquo;ve worked for.</>}
        actions={!noClientsAtAll && !readOnly ? addClientLink : undefined}
      />

      {clients === null ? (
        <p role="alert" className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-700">
          We couldn&rsquo;t load your clients. Please refresh the page.
        </p>
      ) : noClientsAtAll ? (
        <section
          aria-labelledby="clients-empty"
          className={`mt-8 flex flex-col items-center px-6 py-12 text-center sm:py-16 ${cardClass}`}
        >
          <IconTile size="lg">
            <ClientsIcon className="size-6" />
          </IconTile>
          <h2 id="clients-empty" className={`mt-5 ${sectionTitle}`}>
            No clients yet
          </h2>
          <p className="mt-2 max-w-[48ch] text-[15px] leading-[1.6] text-slate-500">
            When someone sends a message through your website&rsquo;s contact form, they show up
            here on their own, with their message. You can also add people you already work with.
          </p>
          {!readOnly && <div className="mt-6">{addClientLink}</div>}
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

          <div className={`mt-4 overflow-hidden ${cardClass}`}>
            {shown.length === 0 ? (
              <p className="px-4 py-6 text-[15px] text-slate-600 sm:px-5">
                {stage && clients.length > 0
                  ? "No clients in this stage."
                  : "No clients match your search."}
              </p>
            ) : (
              <>
                <ListHeader />
                <ul>
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
