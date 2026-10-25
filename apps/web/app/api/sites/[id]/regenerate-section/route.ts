import { notImplemented } from "@/server/http";

// TODO(back): validar RegenerateSectionRequest, pedir à IA só a seção `sectionIndex`,
// validar o SiteSpec inteiro e salvar. Resposta: RegenerateSectionResponse.
// Créditos: cobrar `spendCredits(actor, "regenerate_section", site.id)` antes da IA (preço em
// server/credits/pricing.ts) e `refundCredits` se ela falhar.
export async function POST(): Promise<Response> {
  return notImplemented("Regenerating a section");
}
