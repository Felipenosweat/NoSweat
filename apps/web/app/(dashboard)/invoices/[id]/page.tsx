import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getViewer } from "@/server/auth/viewer";
import { getInvoice } from "@/server/office/service";
import { loadClientContact, loadOfficeContext } from "../../office/_ui/load";
import { InvoiceEditor } from "../InvoiceEditor";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

type InvoicePageProps = { params: Promise<{ id: string }> };

export default async function InvoicePage({ params }: InvoicePageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  const { id } = await params;
  // "Ver como" do admin: a fatura da conta vista, só leitura.
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/invoices/${id}`)}`);
  const readOnly = viewer.viewingAs !== null;

  const [invoice, office] = await Promise.all([
    getInvoice(viewer.ownerId, id),
    loadOfficeContext(viewer.ownerId),
  ]);
  if (!invoice) notFound();
  const contact = await loadClientContact(viewer.ownerId, invoice.clientId);

  return (
    <InvoiceEditor
      invoice={invoice}
      initialClient={
        contact?.picked ?? {
          id: invoice.clientId,
          name: invoice.clientName,
          phone: null,
          email: null,
        }
      }
      party={contact?.party ?? null}
      jobId={invoice.jobId}
      defaults={{ taxRateBps: invoice.taxRateBps, dueOn: invoice.dueOn }}
      company={office.company}
      paymentInstructions={office.settings.paymentInstructions}
      today={office.today}
      readOnly={readOnly}
    />
  );
}
