import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { addDays, firstParam } from "@/lib/office";
import { getViewer } from "@/server/auth/viewer";
import { loadClientContact, loadOfficeContext } from "../../office/_ui/load";
import { EstimateEditor } from "../EstimateEditor";

export const metadata: Metadata = { title: "New estimate", robots: { index: false } };

type NewEstimatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Orçamento novo. Aceita ?clientId=... (atalho da ficha do cliente): o cliente já vem escolhido.
// Nada é criado até o dono apertar "Save draft" ou "Send estimate".

export default async function NewEstimatePage({ searchParams }: NewEstimatePageProps) {
  // Sempre na hora do request (sessão do dono).
  await connection();
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/estimates/new");
  // Modo "ver como" do admin: só leitura (o proxy recusaria a criação com 403).
  if (viewer.viewingAs) notFound();

  const clientId = firstParam((await searchParams).clientId).slice(0, 100);
  const [office, contact] = await Promise.all([
    loadOfficeContext(viewer.ownerId),
    clientId ? loadClientContact(viewer.ownerId, clientId) : Promise.resolve(null),
  ]);

  return (
    <EstimateEditor
      estimate={null}
      initialClient={contact?.picked ?? null}
      party={contact?.party ?? null}
      defaults={{
        taxRateBps: office.settings.defaultTaxRateBps,
        validUntil: addDays(office.today, office.settings.estimateValidDays),
      }}
      company={office.company}
      terms={office.settings.estimateTerms}
      today={office.today}
      readOnly={false}
    />
  );
}
