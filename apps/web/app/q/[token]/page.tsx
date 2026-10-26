import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { DocumentPaper } from "@/app/(dashboard)/office/_ui/DocumentPaper";
import { PrintButton } from "@/app/(dashboard)/office/_ui/PrintButton";
import { PublicShell, StatusBanner } from "@/app/(dashboard)/office/_ui/PublicShell";
import { formatCents, formatDateOnly } from "@/lib/office";
import { getPublicEstimate } from "@/server/office/service";
import { RespondPanel } from "./RespondPanel";

// Orçamento que o cliente final abre pelo link (sem conta): papel limpo com a empresa, os itens,
// os totais, a mensagem e as condições; enquanto estiver "enviado", aprovar (nome digitado) ou
// recusar. Nunca indexado pelo Google (o link é privado).

type PublicEstimatePageProps = { params: Promise<{ token: string }> };

// Uma leitura por pedido (metadata e página usam a mesma).
const load = cache(async (token: string) => {
  // Token de link: só letras, números, "-" e "_" (nada de ir ao banco com lixo).
  if (!/^[A-Za-z0-9_-]{6,200}$/.test(token)) return null;
  return getPublicEstimate(token);
});

const NO_INDEX: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};

export async function generateMetadata({ params }: PublicEstimatePageProps): Promise<Metadata> {
  const { token } = await params;
  const estimate = await load(token);
  return {
    title: estimate
      ? { absolute: `Estimate #${estimate.number} · ${estimate.company.companyName}` }
      : "Estimate",
    robots: NO_INDEX,
    // O token não vaza para outros sites pelo Referer.
    referrer: "no-referrer",
  };
}

/** "2026-10-26T15:00:00Z" → "Oct 26, 2026". */
const day = (iso: string) => formatDateOnly(iso.slice(0, 10));

export default async function PublicEstimatePage({ params }: PublicEstimatePageProps) {
  // Sempre na hora do request (o cliente pode ter acabado de aprovar).
  await connection();
  const { token } = await params;
  const estimate = await load(token);
  // Rascunho (ainda não enviado) também não abre.
  if (!estimate || estimate.status === "draft") notFound();

  const total = formatCents(estimate.totalCents);
  const facts = [
    ...(estimate.sentAt ? [{ label: "Date", value: day(estimate.sentAt) }] : []),
    ...(estimate.validUntil
      ? [{ label: "Valid until", value: formatDateOnly(estimate.validUntil) }]
      : []),
  ];

  return (
    <PublicShell company={estimate.company}>
      {estimate.status === "approved" && (
        <StatusBanner tone="emerald" title="Approved — thank you!">
          {estimate.approvedByName ? `Approved by ${estimate.approvedByName}` : "Approved"}
          {estimate.respondedAt ? ` on ${day(estimate.respondedAt)}` : ""}.{" "}
          {estimate.company.companyName} will be in touch to schedule.
        </StatusBanner>
      )}
      {estimate.status === "declined" && (
        <StatusBanner tone="slate" title="You declined this estimate">
          {estimate.respondedAt ? `On ${day(estimate.respondedAt)}. ` : ""}Changed your mind?
          Contact {estimate.company.companyName}.
        </StatusBanner>
      )}
      {estimate.status === "expired" && (
        <StatusBanner tone="amber" title="This estimate has expired">
          {estimate.validUntil ? `It was good until ${formatDateOnly(estimate.validUntil)}. ` : ""}
          Contact {estimate.company.companyName} for an updated price.
        </StatusBanner>
      )}

      <DocumentPaper
        kind="estimate"
        number={estimate.number}
        title={estimate.title}
        company={estimate.company}
        client={estimate.client}
        items={estimate.items}
        taxRateBps={estimate.taxRateBps}
        totals={estimate}
        message={estimate.message}
        facts={facts}
        notes={[{ title: "Terms", body: estimate.terms }]}
        stamp={
          estimate.status === "approved"
            ? { label: "Approved", tone: "emerald" }
            : estimate.status === "declined"
              ? { label: "Declined", tone: "slate" }
              : null
        }
        footer={
          estimate.status === "approved" && estimate.approvedByName ? (
            <section className="mt-8 border-t border-slate-200 pt-5">
              <h2 className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                Approved by
              </h2>
              <p className="mt-2 font-display text-2xl text-ink italic">
                {estimate.approvedByName}
              </p>
              {estimate.respondedAt && (
                <p className="text-sm text-slate-600">{day(estimate.respondedAt)}</p>
              )}
            </section>
          ) : null
        }
      />

      {estimate.status === "sent" && (
        <RespondPanel token={token} companyName={estimate.company.companyName} total={total} />
      )}

      <div className="flex justify-center print:hidden">
        <PrintButton />
      </div>
    </PublicShell>
  );
}
