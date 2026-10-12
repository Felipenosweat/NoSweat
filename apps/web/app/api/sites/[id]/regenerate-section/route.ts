import { notImplemented } from "@/server/http";

// TODO(back): validar RegenerateSectionRequest, pedir à IA só a seção `sectionIndex`,
// validar o SiteSpec inteiro e salvar. Resposta: RegenerateSectionResponse.
export async function POST(): Promise<Response> {
  return notImplemented("Regenerating a section");
}
