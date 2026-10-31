import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getViewer } from "@/server/auth/viewer";
import { getEstimate } from "@/server/office/service";
import { loadClientContact, loadOfficeContext } from "../../office/_ui/load";
import { EstimateEditor } from "../EstimateEditor";

export const metadata: Metadata = { title: "Estimate", robots: { index: false } };

type EstimatePageProps = { params: Promise<{ id: string }> };

export default async function EstimatePage({ params }: EstimatePageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  const { id } = await params;
  // "Ver como" do admin: o orçamento da conta vista, só leitura.
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/estimates/${id}`)}`);
  const readOnly = viewer.viewingAs !== null;

  const [estimate, office] = await Promise.all([
    getEstimate(viewer.ownerId, id),
    loadOfficeContext(viewer.ownerId),
  ]);
  if (!estimate) notFound();
  const contact = await loadClientContact(viewer.ownerId, estimate.clientId);

  return (
    <EstimateEditor
      estimate={estimate}
      initialClient={
        contact?.picked ?? {
          id: estimate.clientId,
          name: estimate.clientName,
          phone: null,
          email: null,
        }
      }
      party={contact?.party ?? null}
      defaults={{ taxRateBps: estimate.taxRateBps, validUntil: estimate.validUntil }}
      company={office.company}
      terms={office.settings.estimateTerms}
      today={office.today}
      timeZone={office.settings.timeZone}
      readOnly={readOnly}
    />
  );
}
