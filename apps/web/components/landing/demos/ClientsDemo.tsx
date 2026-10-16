import type { ClientStage } from "@nosweat/schema";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/DashboardUi";
import { ChatIcon, EnvelopeIcon, PencilIcon, PhoneIcon } from "@/components/marketing/icons";
import { CLIENT_STAGES, STAGE_LABELS, STAGE_TONES } from "@/lib/clients";

// Cena "Get the call": o pedido do formulário chega por e-mail (mesmos campos de server/notify),
// entra sozinho na lista de Clientes e vira a ficha da cliente, como em /clients.
// Negócio (Sparkle & Co. Cleaning) e cliente (Maria Chen) são fictícios.

/** Selo da etapa do cliente, o mesmo do painel (/clients). */
function StageBadge({ stage }: { stage: ClientStage }) {
  return <StatusBadge tone={STAGE_TONES[stage]}>{STAGE_LABELS[stage]}</StatusBadge>;
}

/** O e-mail de aviso como o dono recebe. */
export function RequestEmail() {
  return (
    <div className="text-[15px]">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
          NS
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">No Sweat</p>
          <p className="truncate text-xs text-slate-500">to hello@sparkleco.example.com</p>
        </div>
        <span className="text-xs text-slate-500 tabular-nums">9:41 AM</span>
      </div>
      <p className="mt-4 font-display text-lg leading-snug font-bold tracking-[-0.02em] sm:text-xl">
        New request from Maria Chen
      </p>
      <p className="mt-1 text-sm text-slate-600">From your website · Sparkle &amp; Co. Cleaning</p>
      <dl className="mt-4 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-slate-500">Phone</dt>
        <dd className="tabular-nums">(508) 555-0187</dd>
        <dt className="text-slate-500">Email</dt>
        <dd className="truncate">maria.chen@example.com</dd>
        <dt className="text-slate-500">Message</dt>
        <dd>Move-out clean for a 3-bedroom on Oct 30. Can you send a quote?</dd>
      </dl>
    </div>
  );
}

const CLIENTS: { name: string; stage: ClientStage; detail: string }[] = [
  { name: "Maria Chen", stage: "new", detail: "Move-out clean · just now" },
  { name: "Tom Alvarez", stage: "won", detail: "Weekly clean · Oct 12" },
  { name: "Priya Shah", stage: "quoted", detail: "Deep clean · Oct 9" },
  { name: "Dan Ruiz", stage: "contacted", detail: "Weekly clean · Oct 3" },
];

/** A lista de Clientes com o pedido novo no topo. */
export function ClientList() {
  return (
    <div>
      <p className="font-display text-lg font-bold tracking-[-0.02em] sm:text-xl">Clients</p>
      <ul className="mt-3 divide-y divide-slate-200">
        {CLIENTS.map((client, index) => (
          <li
            key={client.name}
            className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 sm:py-3 ${
              index === 0 ? "bg-brand/[0.06]" : ""
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{client.name}</span>
              <span className="block truncate text-xs text-slate-500 tabular-nums">
                {client.detail}
              </span>
            </span>
            <StageBadge stage={client.stage} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Botão de contato da ficha (Call / Text / Email), só visual. */
function ContactButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold">
      {icon}
      {label}
    </span>
  );
}

/** A ficha da Maria: ações, etapas, retorno e histórico. */
export function ClientCard() {
  const current: ClientStage = "quoted";
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display text-lg font-bold tracking-[-0.02em] sm:text-xl">Maria Chen</p>
        <StageBadge stage={current} />
      </div>
      <p className="mt-0.5 text-xs text-slate-500">Came from your website · since Oct 14</p>
      <p className="mt-3 flex flex-wrap gap-2">
        <ContactButton icon={<PhoneIcon className="size-4" />} label="Call" />
        <ContactButton icon={<ChatIcon className="size-4" />} label="Text" />
        <ContactButton icon={<EnvelopeIcon className="size-4" />} label="Email" />
      </p>
      <p className="mt-3 grid grid-cols-5 gap-1">
        {CLIENT_STAGES.map((stage) => (
          <span
            key={stage}
            className={`truncate rounded-md px-1 py-1.5 text-center text-xs font-semibold ${
              stage === current ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {STAGE_LABELS[stage]}
          </span>
        ))}
      </p>
      <dl className="mt-3 flex gap-6 text-sm">
        <div>
          <dt className="text-xs font-medium text-slate-500">Follow-up</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">Thu, Oct 22</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Phone</dt>
          <dd className="mt-0.5 tabular-nums">(508) 555-0187</dd>
        </div>
      </dl>
      <ol className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
        <li className="flex gap-3 p-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
            <PencilIcon className="size-3.5" />
          </span>
          <span className="min-w-0 leading-snug">
            <span className="block font-semibold">Note</span>
            <span className="text-slate-600">Quoted $240 for the move-out clean.</span>
          </span>
        </li>
        <li className="flex gap-3 p-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
            <EnvelopeIcon className="size-3.5" />
          </span>
          <span className="min-w-0 leading-snug">
            <span className="block font-semibold">Message from your website</span>
            <span className="line-clamp-1 text-slate-600">
              Move-out clean for a 3-bedroom on Oct 30.
            </span>
          </span>
        </li>
      </ol>
    </div>
  );
}
