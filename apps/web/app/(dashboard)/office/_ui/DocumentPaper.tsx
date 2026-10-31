import type { DocumentParty, DocumentTotals, LineItem } from "@nosweat/schema";
import type { ReactNode } from "react";
import { formatCents, formatQuantity, formatTaxRate, lineTotalCents } from "@/lib/office";

// O documento "em papel" (orçamento ou fatura) que o cliente final vê no link público e que sai na
// impressão / PDF do painel. Visual de fatura premium (Stripe/Square): branco, tipografia calma,
// nada de vidro. Sem "use client" e sem imports do servidor.

type PaperItem = Pick<LineItem, "name" | "description" | "quantity" | "unitPriceCents" | "taxable">;

export type DocumentFact = { label: string; value: ReactNode };

export type DocumentPaperProps = {
  kind: "estimate" | "invoice";
  number: number;
  title: string;
  company: {
    companyName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  client: DocumentParty;
  items: readonly PaperItem[];
  taxRateBps: number;
  totals: DocumentTotals;
  /** Só na fatura. */
  amountPaidCents?: number;
  balanceCents?: number;
  message: string;
  /** Datas à direita do cabeçalho ("Date", "Valid until", "Due"). */
  facts: readonly DocumentFact[];
  /** Blocos de texto do dono no fim ("Terms", "How to pay"). */
  notes?: readonly { title: string; body: string }[];
  /** Carimbo sobre o documento. */
  stamp?: { label: string; tone: "emerald" | "red" | "slate" } | null;
  /** Conteúdo extra no fim (ex.: assinatura da aprovação). */
  footer?: ReactNode;
  className?: string;
};

const STAMP_TONES = {
  emerald: "border-emerald-600 text-emerald-700",
  red: "border-red-600 text-red-700",
  slate: "border-slate-500 text-slate-600",
} as const;

function PartyBlock({ heading, party }: { heading: string; party: DocumentParty }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-(--glass-fg-muted) uppercase">
        {heading}
      </p>
      <p className="mt-1.5 text-[15px] font-semibold break-words text-ink">{party.name}</p>
      {party.address && (
        <p className="text-sm leading-6 break-words whitespace-pre-line text-slate-600">
          {party.address}
        </p>
      )}
      {party.phone && <p className="text-sm leading-6 text-slate-600">{party.phone}</p>}
      {party.email && <p className="text-sm leading-6 break-all text-slate-600">{party.email}</p>}
    </div>
  );
}

export function DocumentPaper({
  kind,
  number,
  title,
  company,
  client,
  items,
  taxRateBps,
  totals,
  amountPaidCents,
  balanceCents,
  message,
  facts,
  notes = [],
  stamp,
  footer,
  className = "",
}: DocumentPaperProps) {
  const kindLabel = kind === "estimate" ? "Estimate" : "Invoice";
  const showTaxNote = taxRateBps > 0 && items.some((item) => !item.taxable);
  const contact = [company.phone, company.email].filter(Boolean);
  return (
    <article
      aria-label={`${kindLabel} #${number}`}
      className={`relative overflow-hidden rounded-2xl bg-white text-ink shadow-[0_1px_2px_rgb(7_27_51/0.06),0_12px_40px_-16px_rgb(7_27_51/0.18)] ring-1 ring-slate-200/80 print:rounded-none print:shadow-none print:ring-0 ${className}`}
    >
      {stamp && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-6 right-4 rotate-[-12deg] rounded-lg border-[3px] px-3 py-1 font-display text-2xl font-bold tracking-[0.12em] uppercase opacity-80 sm:top-10 sm:right-10 sm:text-3xl ${STAMP_TONES[stamp.tone]}`}
        >
          {stamp.label}
        </div>
      )}

      <div className="px-5 pt-7 pb-6 sm:px-10 sm:pt-10">
        {/* ---------- cabeçalho: empresa à esquerda, número e datas à direita ---------- */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 pr-24 sm:pr-0">
            <p className="font-display text-xl leading-7 font-semibold tracking-[-0.015em] break-words sm:text-2xl">
              {company.companyName}
            </p>
            {company.address && (
              <p className="mt-1 text-sm leading-6 whitespace-pre-line text-slate-600">
                {company.address}
              </p>
            )}
            {contact.length > 0 && (
              <p className="text-sm leading-6 break-words text-slate-600">{contact.join(" · ")}</p>
            )}
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-(--glass-fg-muted) uppercase">
              {kindLabel}
            </p>
            <p className="font-display text-2xl leading-8 font-semibold tabular-nums">#{number}</p>
            {facts.length > 0 && (
              <dl className="mt-2 grid grid-cols-[auto_auto] justify-start gap-x-4 gap-y-0.5 text-sm sm:justify-end">
                {facts.map((fact) => (
                  <div key={fact.label} className="contents">
                    <dt className="text-(--glass-fg-muted)">{fact.label}</dt>
                    <dd className="font-medium text-ink tabular-nums sm:text-right">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </header>

        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <PartyBlock heading={kind === "estimate" ? "Prepared for" : "Bill to"} party={client} />
          {title && (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-(--glass-fg-muted) uppercase">
                {kind === "estimate" ? "Project" : "For"}
              </p>
              <p className="mt-1.5 text-[15px] font-semibold break-words text-ink">{title}</p>
            </div>
          )}
        </div>

        {message.trim() && (
          <p className="mt-6 max-w-[65ch] text-[15px] leading-[1.65] break-words whitespace-pre-line text-slate-700">
            {message}
          </p>
        )}

        {/* ---------- itens ---------- */}
        <table className="mt-8 w-full border-collapse text-left text-[15px]">
          <caption className="sr-only">Items</caption>
          <thead>
            <tr className="border-b border-slate-300 text-[11px] font-semibold tracking-[0.08em] text-(--glass-fg-muted) uppercase">
              <th scope="col" className="pb-2 font-semibold">
                Item
              </th>
              <th scope="col" className="hidden pb-2 text-right font-semibold sm:table-cell">
                Qty
              </th>
              <th scope="col" className="hidden pb-2 text-right font-semibold sm:table-cell">
                Price
              </th>
              <th scope="col" className="pb-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-(--glass-fg-muted)">
                  No items yet
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="border-b border-slate-200 align-top">
                  <td className="py-3 pr-3">
                    <span className="block font-medium break-words text-ink">{item.name}</span>
                    {item.description && (
                      <span className="mt-0.5 block text-sm leading-6 break-words whitespace-pre-line text-slate-600">
                        {item.description}
                      </span>
                    )}
                    <span className="mt-0.5 block text-sm text-(--glass-fg-muted) tabular-nums sm:hidden">
                      {formatQuantity(item.quantity)} × {formatCents(item.unitPriceCents)}
                    </span>
                    {showTaxNote && !item.taxable && (
                      <span className="mt-0.5 block text-xs text-(--glass-fg-muted)">
                        Not taxed
                      </span>
                    )}
                  </td>
                  <td className="hidden py-3 pr-3 text-right text-slate-600 tabular-nums sm:table-cell">
                    {formatQuantity(item.quantity)}
                  </td>
                  <td className="hidden py-3 pr-3 text-right text-slate-600 tabular-nums sm:table-cell">
                    {formatCents(item.unitPriceCents)}
                  </td>
                  <td className="py-3 text-right font-medium text-ink tabular-nums">
                    {formatCents(lineTotalCents(item))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ---------- totais ---------- */}
        <dl className="mt-5 ml-auto grid w-full max-w-xs gap-1.5 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Subtotal</dt>
            <dd className="tabular-nums">{formatCents(totals.subtotalCents)}</dd>
          </div>
          {totals.discountCents > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Discount</dt>
              <dd className="tabular-nums">−{formatCents(totals.discountCents)}</dd>
            </div>
          )}
          {(taxRateBps > 0 || totals.taxCents > 0) && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Tax ({formatTaxRate(taxRateBps)})</dt>
              <dd className="tabular-nums">{formatCents(totals.taxCents)}</dd>
            </div>
          )}
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-slate-300 pt-2.5">
            <dt className="font-semibold">Total</dt>
            <dd className="font-display text-lg font-semibold tabular-nums">
              {formatCents(totals.totalCents)}
            </dd>
          </div>
          {amountPaidCents !== undefined && amountPaidCents > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Paid</dt>
              <dd className="text-emerald-700 tabular-nums">−{formatCents(amountPaidCents)}</dd>
            </div>
          )}
          {balanceCents !== undefined && (
            <div className="mt-1 flex items-baseline justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5 print:bg-transparent print:px-0">
              <dt className="font-semibold">Balance due</dt>
              <dd className="font-display text-xl font-bold tabular-nums">
                {formatCents(Math.max(0, balanceCents))}
              </dd>
            </div>
          )}
        </dl>

        {notes
          .filter((note) => note.body.trim())
          .map((note) => (
            <section key={note.title} className="mt-8 border-t border-slate-200 pt-5">
              <h2 className="text-[11px] font-semibold tracking-[0.08em] text-(--glass-fg-muted) uppercase">
                {note.title}
              </h2>
              <p className="mt-2 max-w-[70ch] text-sm leading-[1.65] break-words whitespace-pre-line text-slate-700">
                {note.body}
              </p>
            </section>
          ))}

        {footer}
      </div>
    </article>
  );
}
