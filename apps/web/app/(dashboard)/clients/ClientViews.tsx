import type { Client } from "@nosweat/schema";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocalTime } from "@/components/LocalTime";
import { GlassCard, cx, focusRing } from "@/components/glass";
import { CLIENT_STAGES, STAGE_LABELS, formatCents } from "@/lib/clients";
import { ClientMenu, type ClientMenuClient } from "./ClientMenu";
import { Avatar, FollowUpBadge, StageBadge, TagList } from "./ui";

// Lista e quadro (Kanban por etapa) dos clientes. Server components; o menu "⋯" de cada cliente
// é o único pedaço de cliente (mudar de etapa, apagar).

/** O que o menu precisa (não manda o cliente inteiro para o navegador). */
function menuClient(client: Client): ClientMenuClient {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address,
    stage: client.stage,
  };
}

function contactLine(client: Client): ReactNode {
  const contact = [client.phone, client.email].filter(Boolean).join(" · ");
  return contact || <span className="text-(--glass-fg-muted)">No contact info</span>;
}

/** Retorno marcado (só para quem ainda está no funil). */
function openFollowUp(client: Client): string | null {
  return client.followUpOn && client.stage !== "won" && client.stage !== "lost"
    ? client.followUpOn
    : null;
}

const clientHref = (client: Client) => `/clients/${encodeURIComponent(client.id)}`;

// ---------- lista ----------

function ClientRow({
  client,
  today,
  readOnly,
}: {
  client: Client;
  today: string;
  readOnly: boolean;
}) {
  const followUp = openFollowUp(client);
  const tags = client.tags.slice(0, 3);
  return (
    <li className="flex items-center gap-1 pr-2 sm:pr-3">
      <Link
        href={clientHref(client)}
        className="group flex min-h-[4.5rem] min-w-0 flex-1 items-center gap-3 rounded-2xl py-3 pl-4 transition-colors duration-150 hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:pl-5"
      >
        <Avatar name={client.name} size="md" />
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] leading-6 font-semibold text-ink">
              {client.name}
            </span>
            <StageBadge stage={client.stage} size="sm" />
          </span>
          <span className="block truncate text-[13px] leading-5 text-slate-600">
            {contactLine(client)}
          </span>
          {(followUp || tags.length > 0) && (
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {followUp && <FollowUpBadge date={followUp} today={today} size="sm" />}
              <TagList tags={tags} />
            </span>
          )}
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          {client.totalJobsCents > 0 ? (
            <span className="block text-[15px] font-semibold text-ink tabular-nums">
              {formatCents(client.totalJobsCents)}
            </span>
          ) : client.jobsCount > 0 ? (
            <span className="block text-[13px] text-slate-600">
              {client.jobsCount} {client.jobsCount === 1 ? "job" : "jobs"}
            </span>
          ) : null}
          <span className="block text-[13px] text-(--glass-fg-muted)">
            <span className="sr-only">Last activity </span>
            <LocalTime iso={client.lastActivityAt} className="tabular-nums" />
          </span>
        </span>
      </Link>
      <ClientMenu client={menuClient(client)} readOnly={readOnly} />
    </li>
  );
}

export function ClientList({
  clients,
  today,
  readOnly,
  empty,
}: {
  clients: readonly Client[];
  today: string;
  readOnly: boolean;
  /** O que mostrar quando o filtro não acha ninguém. */
  empty: ReactNode;
}) {
  return (
    <GlassCard as="section" padding="none" aria-label="Clients" className="overflow-hidden">
      {clients.length === 0 ? (
        empty
      ) : (
        <ul className="divide-y divide-(--glass-rim) p-1">
          {clients.map((client) => (
            <ClientRow key={client.id} client={client} today={today} readOnly={readOnly} />
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

// ---------- quadro ----------

function BoardCard({
  client,
  today,
  readOnly,
}: {
  client: Client;
  today: string;
  readOnly: boolean;
}) {
  const followUp = openFollowUp(client);
  return (
    <li className="glass flex items-start gap-1 rounded-2xl p-1">
      <Link
        href={clientHref(client)}
        className={cx(
          "flex min-h-11 min-w-0 flex-1 flex-col gap-1 rounded-xl p-2.5 transition-colors duration-150 hover:bg-(--glass-ghost-hover)",
          focusRing,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={client.name} />
          <span className="truncate text-[15px] leading-5 font-semibold text-ink">
            {client.name}
          </span>
        </span>
        <span className="truncate text-[13px] leading-5 text-slate-600">{contactLine(client)}</span>
        {(followUp || client.totalJobsCents > 0) && (
          <span className="flex flex-wrap items-center gap-1.5">
            {followUp && <FollowUpBadge date={followUp} today={today} size="sm" />}
            {client.totalJobsCents > 0 && (
              <span className="text-[13px] font-semibold text-ink tabular-nums">
                {formatCents(client.totalJobsCents)}
              </span>
            )}
          </span>
        )}
        <TagList tags={client.tags.slice(0, 3)} />
      </Link>
      <ClientMenu client={menuClient(client)} readOnly={readOnly} context="board" />
    </li>
  );
}

export function ClientsBoard({
  clients,
  today,
  readOnly,
}: {
  clients: readonly Client[];
  today: string;
  readOnly: boolean;
}) {
  return (
    // No celular as colunas rolam de lado, uma de cada vez (como o quadro do Trello no iPhone).
    <div className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:snap-none sm:px-0">
      <ol aria-label="Clients by stage" className="flex w-max gap-3">
        {CLIENT_STAGES.map((stage) => {
          const column = clients.filter((client) => client.stage === stage);
          const value = column.reduce((sum, client) => sum + client.totalJobsCents, 0);
          const headingId = `board-${stage}`;
          return (
            <li
              key={stage}
              aria-labelledby={headingId}
              className="w-[min(18rem,calc(100vw-3.5rem))] shrink-0 snap-start rounded-3xl bg-(--glass-groove) p-2 sm:w-[16.5rem]"
            >
              <div className="flex min-h-10 items-center justify-between gap-2 px-2">
                <h2 id={headingId} className="flex items-center gap-2">
                  <StageBadge stage={stage} />
                  <span className="text-[13px] text-slate-600 tabular-nums">
                    {column.length}
                    <span className="sr-only"> {column.length === 1 ? "client" : "clients"}</span>
                  </span>
                </h2>
                {value > 0 && (
                  <span className="text-[13px] font-semibold text-slate-600 tabular-nums">
                    {formatCents(value)}
                  </span>
                )}
              </div>
              {column.length === 0 ? (
                <p className="mt-1 rounded-2xl border border-dashed border-slate-300/80 px-3 py-6 text-center text-[13px] text-(--glass-fg-muted)">
                  No {STAGE_LABELS[stage].toLowerCase()} clients
                </p>
              ) : (
                <ul className="mt-1 grid gap-2">
                  {column.map((client) => (
                    <BoardCard key={client.id} client={client} today={today} readOnly={readOnly} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
