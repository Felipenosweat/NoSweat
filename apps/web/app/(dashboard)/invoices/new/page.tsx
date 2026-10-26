import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { addDays, firstParam } from "@/lib/office";
import { getViewer } from "@/server/auth/viewer";
import { loadClientContact, loadOfficeContext } from "../../office/_ui/load";
import { InvoiceEditor } from "../InvoiceEditor";

export const metadata: Metadata = { title: "New invoice", robots: { index: false } };

type NewInvoicePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Fatura nova. Aceita ?clientId=... (cliente já escolhido) e ?jobId=... (fatura de um serviço da
// agenda). Nada é criado até o dono apertar "Save draft" ou "Send invoice".

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  // Sempre na hora do request (sessão do dono).
  await connection();
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/invoices/new");
  // Modo "ver como" do admin: só leitura (o proxy recusaria a criação com 403).
  if (viewer.viewingAs) notFound();

  const raw = await searchParams;
  const clientId = firstParam(raw.clientId).slice(0, 100);
  const jobId = firstParam(raw.jobId).slice(0, 100) || null;
  const [office, contact] = await Promise.all([
    loadOfficeContext(viewer.ownerId),
    clientId ? loadClientContact(viewer.ownerId, clientId) : Promise.resolve(null),
  ]);

  return (
    <InvoiceEditor
      invoice={null}
      initialClient={contact?.picked ?? null}
      party={contact?.party ?? null}
      jobId={contact ? jobId : null}
      defaults={{
        taxRateBps: office.settings.defaultTaxRateBps,
        dueOn: addDays(office.today, office.settings.invoiceDueDays),
      }}
      company={office.company}
      paymentInstructions={office.settings.paymentInstructions}
      today={office.today}
      readOnly={false}
    />
  );
}
