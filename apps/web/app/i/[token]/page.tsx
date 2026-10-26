import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { DocumentPaper } from "@/app/(dashboard)/office/_ui/DocumentPaper";
import { PrintButton } from "@/app/(dashboard)/office/_ui/PrintButton";
import { PublicShell, StatusBanner } from "@/app/(dashboard)/office/_ui/PublicShell";
import { formatCents, formatDateOnly } from "@/lib/office";
import { getPublicInvoice } from "@/server/office/service";

// Fatura que o cliente final abre pelo link (sem conta): itens, totais, quanto já pagou, saldo,
// vencimento e como pagar (texto do dono). Carimbo "PAID" quando quitada. Botão de imprimir /
// salvar em PDF. Nunca indexada pelo Google (o link é privado).

type PublicInvoicePageProps = { params: Promise<{ token: string }> };

// Uma leitura por pedido (metadata e página usam a mesma).
const load = cache(async (token: string) => {
  // Token de link: só letras, números, "-" e "_" (nada de ir ao banco com lixo).
  if (!/^[A-Za-z0-9_-]{6,200}$/.test(token)) return null;
  return getPublicInvoice(token);
});

export async function generateMetadata({ params }: PublicInvoicePageProps): Promise<Metadata> {
  const { token } = await params;
  const invoice = await load(token);
  return {
    title: invoice
      ? { absolute: `Invoice #${invoice.number} · ${invoice.company.companyName}` }
      : "Invoice",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
    // O token não vaza para outros sites pelo Referer.
    referrer: "no-referrer",
  };
}

/** "2026-10-26T15:00:00Z" → "Oct 26, 2026". */
const day = (iso: string) => formatDateOnly(iso.slice(0, 10));

export default async function PublicInvoicePage({ params }: PublicInvoicePageProps) {
  // Sempre na hora do request (um pagamento pode ter acabado de entrar).
  await connection();
  const { token } = await params;
  const invoice = await load(token);
  // Rascunho (ainda não enviado) também não abre.
  if (!invoice || invoice.status === "draft") notFound();

  const balance = Math.max(0, invoice.balanceCents);
  const open =
    invoice.status === "sent" || invoice.status === "partial" || invoice.status === "overdue";

  return (
    <PublicShell company={invoice.company}>
      {invoice.status === "paid" && (
        <StatusBanner tone="emerald" title="Paid in full — thank you!">
          {invoice.paidAt ? `Paid on ${day(invoice.paidAt)}. ` : ""}Keep this page as your receipt.
        </StatusBanner>
      )}
      {invoice.status === "overdue" && (
        <StatusBanner tone="red" title={`${formatCents(balance)} is past due`}>
          {invoice.dueOn ? `It was due ${formatDateOnly(invoice.dueOn)}. ` : ""}See how to pay
          below.
        </StatusBanner>
      )}
      {invoice.status === "partial" && (
        <StatusBanner tone="amber" title={`${formatCents(balance)} left to pay`}>
          {formatCents(invoice.amountPaidCents)} received so far
          {invoice.dueOn ? ` · due ${formatDateOnly(invoice.dueOn)}` : ""}.
        </StatusBanner>
      )}
      {invoice.status === "sent" && (
        <StatusBanner tone="blue" title={`${formatCents(balance)} due`}>
          {invoice.dueOn ? `Due ${formatDateOnly(invoice.dueOn)}.` : "Due on receipt."} See how to
          pay below.
        </StatusBanner>
      )}
      {invoice.status === "void" && (
        <StatusBanner tone="slate" title="This invoice was canceled">
          You don&rsquo;t owe anything on it.
        </StatusBanner>
      )}

      <DocumentPaper
        kind="invoice"
        number={invoice.number}
        title={invoice.title}
        company={invoice.company}
        client={invoice.client}
        items={invoice.items}
        taxRateBps={invoice.taxRateBps}
        totals={invoice}
        amountPaidCents={invoice.amountPaidCents}
        balanceCents={invoice.status === "void" ? undefined : balance}
        message={invoice.message}
        facts={[
          { label: "Date", value: formatDateOnly(invoice.issuedOn) },
          {
            label: "Due",
            value: invoice.dueOn ? formatDateOnly(invoice.dueOn) : "On receipt",
          },
        ]}
        notes={open ? [{ title: "How to pay", body: invoice.paymentInstructions }] : []}
        stamp={
          invoice.status === "paid"
            ? { label: "Paid", tone: "emerald" }
            : invoice.status === "void"
              ? { label: "Void", tone: "slate" }
              : invoice.status === "overdue"
                ? { label: "Past due", tone: "red" }
                : null
        }
      />

      <div className="flex justify-center print:hidden">
        <PrintButton />
      </div>
    </PublicShell>
  );
}
