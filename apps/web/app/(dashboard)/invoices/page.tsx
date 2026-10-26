import type { Invoice } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/DashboardUi";
import { EmptyState, GlassButton, GlassCard, cx, focusRing } from "@/components/glass";
import {
  INVOICE_FILTERS,
  INVOICE_FILTER_LABELS,
  dateKeyIn,
  firstParam,
  formatCents,
  formatDateOnly,
  invoiceBalances,
  isInvoiceFilter,
  isUnpaidStatus,
  matchesInvoiceFilter,
  officeListHref,
  searchDocuments,
  type InvoiceFilter,
} from "@/lib/office";
import { getViewer } from "@/server/auth/viewer";
import { getOfficeSettings, listInvoices } from "@/server/office/service";
import { DocumentsToolbar } from "../office/_ui/DocumentsToolbar";
import { InvoiceBadge, InvoiceIcon, PlusIcon } from "../office/_ui/ui";
import { InvoiceMenu } from "./InvoiceMenu";

export const metadata: Metadata = { title: "Invoices", robots: { index: false } };

type InvoicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Faturas e "hoje" no fuso da empresa. `invoices: null` = erro ao ler. */
async function loadInvoices(ownerId: string) {
  try {
    const [invoices, settings] = await Promise.all([
      listInvoices(ownerId, {}),
      getOfficeSettings(ownerId),
    ]);
    return { invoices, today: dateKeyIn(settings.timeZone, new Date()) };
  } catch (error) {
    console.error("[invoices] could not list invoices", error);
    return { invoices: null, today: dateKeyIn("America/New_York", new Date()) };
  }
}

function NewInvoiceButton({ label = "New invoice" }: { label?: string }) {
  return (
    <GlassButton href="/invoices/new" variant="primary" icon={<PlusIcon />}>
      {label}
    </GlassButton>
  );
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  // "Ver como" do admin: só leitura.
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/invoices");
  const readOnly = viewer.viewingAs !== null;

  const raw = await searchParams;
  const statusParam = firstParam(raw.status);
  const status: InvoiceFilter = isInvoiceFilter(statusParam) ? statusParam : "all";
  const q = firstParam(raw.q).trim().slice(0, 100);

  const { invoices, today } = await loadInvoices(viewer.ownerId);
  const empty = invoices !== null && invoices.length === 0;

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Bill for the work, send the link, and keep track of who paid."
        actions={!readOnly && invoices && !empty ? <NewInvoiceButton /> : undefined}
      />

      {invoices === null ? (
        <p
          role="alert"
          className="glass-edge mt-8 rounded-2xl bg-red-50/90 px-4 py-3 text-[15px] text-red-700"
        >
          We couldn&rsquo;t load your invoices. Please refresh the page.
        </p>
      ) : empty ? (
        <EmptyState
          className="mt-8"
          icon={<InvoiceIcon />}
          title="Get paid faster"
          description="Send an invoice link by text or email, then mark it paid when the cash, check or Zelle comes in."
          actions={readOnly ? undefined : <NewInvoiceButton label="Create an invoice" />}
        />
      ) : (
        <InvoicesContent
          invoices={invoices}
          status={status}
          q={q}
          today={today}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function InvoicesContent({
  invoices,
  status,
  q,
  today,
  readOnly,
}: {
  invoices: Invoice[];
  status: InvoiceFilter;
  q: string;
  today: string;
  readOnly: boolean;
}) {
  const found = searchDocuments(invoices, q);
  const counts = Object.fromEntries(
    INVOICE_FILTERS.map((filter) => [
      filter,
      found.filter((i) => matchesInvoiceFilter(i.status, filter)).length,
    ]),
  ) as Record<InvoiceFilter, number>;
  const shown = found
    .filter((i) => matchesInvoiceFilter(i.status, status))
    .sort((a, b) => b.number - a.number);
  const balances = invoiceBalances(invoices);

  return (
    <>
      {/* "$X unpaid · $Y overdue": o número que o dono abre a tela para ver. */}
      <section
        aria-labelledby="invoices-summary"
        className="glass mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl px-5 py-4"
      >
        <h2 id="invoices-summary" className="sr-only">
          Money owed to you
        </h2>
        <Link
          href={officeListHref("/invoices", { status: "unpaid", q: "" })}
          className={cx("flex min-h-11 flex-col justify-center rounded-lg", focusRing)}
        >
          <span className="font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.02em] text-ink tabular-nums">
            {formatCents(balances.unpaidCents)}
          </span>
          <span className="text-[13px] text-slate-600">
            unpaid · {balances.unpaidCount} {balances.unpaidCount === 1 ? "invoice" : "invoices"}
          </span>
        </Link>
        <span aria-hidden="true" className="hidden h-10 w-px bg-(--glass-rim) sm:block" />
        <Link
          href={officeListHref("/invoices", { status: "overdue", q: "" })}
          className={cx("flex min-h-11 flex-col justify-center rounded-lg", focusRing)}
        >
          <span
            className={cx(
              "font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.02em] tabular-nums",
              balances.overdueCents > 0 ? "text-red-700" : "text-ink",
            )}
          >
            {formatCents(balances.overdueCents)}
          </span>
          <span className="text-[13px] text-slate-600">
            overdue · {balances.overdueCount} {balances.overdueCount === 1 ? "invoice" : "invoices"}
          </span>
        </Link>
      </section>

      <div className="mt-8">
        <h2 className="sr-only">All invoices</h2>
        <DocumentsToolbar
          status={status}
          q={q}
          filters={INVOICE_FILTERS.map((value) => ({ value, label: INVOICE_FILTER_LABELS[value] }))}
          counts={counts}
          searchLabel="Search invoices"
          placeholder="Search client, title or number"
        />
      </div>

      <GlassCard as="section" padding="none" aria-label="Invoices" className="mt-4 overflow-hidden">
        {shown.length === 0 ? (
          <EmptyState
            framed={false}
            headingLevel={3}
            title={status === "overdue" && !q ? "Nothing overdue" : "No invoices match"}
            description={
              status === "overdue" && !q
                ? "Everyone who owes you is still within their due date."
                : q
                  ? "Try another name, title or number."
                  : "Pick another filter."
            }
            actions={
              <GlassButton href="/invoices" variant="secondary">
                Show all invoices
              </GlassButton>
            }
          />
        ) : (
          <ul className="divide-y divide-(--glass-rim) p-1">
            {shown.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} today={today} readOnly={readOnly} />
            ))}
          </ul>
        )}
      </GlassCard>
    </>
  );
}

function InvoiceRow({
  invoice,
  today,
  readOnly,
}: {
  invoice: Invoice;
  today: string;
  readOnly: boolean;
}) {
  const unpaid = isUnpaidStatus(invoice.status);
  const due =
    unpaid && invoice.dueOn
      ? `${invoice.status === "overdue" ? "Was due" : "Due"} ${formatDateOnly(invoice.dueOn, today)}`
      : null;
  const detail = [`#${invoice.number}`, invoice.title || null, due].filter(Boolean).join(" · ");
  return (
    <li className="flex items-center gap-1 pr-2 sm:pr-3">
      <Link
        href={`/invoices/${encodeURIComponent(invoice.id)}`}
        className="flex min-h-[4.5rem] min-w-0 flex-1 items-center gap-3 rounded-2xl py-3 pl-4 transition-colors duration-150 hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:pl-5"
      >
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] leading-6 font-semibold text-ink">
              {invoice.clientName}
            </span>
            <InvoiceBadge status={invoice.status} size="sm" />
          </span>
          <span
            className={cx(
              "block truncate text-[13px] leading-5",
              invoice.status === "overdue" ? "text-red-700" : "text-slate-600",
            )}
          >
            {detail}
          </span>
        </span>
        <span className="shrink-0 text-right tabular-nums">
          <span
            className={cx(
              "block text-[15px] font-semibold",
              invoice.status === "void" ? "text-slate-400 line-through" : "text-ink",
            )}
          >
            {formatCents(unpaid ? Math.max(0, invoice.balanceCents) : invoice.totalCents)}
          </span>
          {invoice.status === "partial" && (
            <span className="block text-[12px] text-slate-500">
              of {formatCents(invoice.totalCents)}
            </span>
          )}
        </span>
      </Link>
      <InvoiceMenu
        readOnly={readOnly}
        invoice={{
          id: invoice.id,
          number: invoice.number,
          clientName: invoice.clientName,
          status: invoice.status,
          publicToken: invoice.publicToken,
          paymentsCount: invoice.payments.length,
        }}
      />
    </li>
  );
}
