import { SiteSetupRequest, SiteSetupResponse } from "@nosweat/schema";
import { applySetup, partialMessage, SetupPartialError } from "@/server/booking/setup";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { OfficeError } from "@/server/office/types";
import { savesExceeded } from "@/server/quota";
import { requireOwnedSite } from "@/server/sites";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/[id]/setup: o assistente de configuração grava tudo de uma vez (horários,
 * serviços com duração e preço, equipe e regras) e liga o agendamento. Só o DONO do site (admin
 * não grava dados de agenda de outra conta). Valida tudo antes de gravar e pode rodar de novo
 * sem duplicar. Muda só o rascunho do site (nunca publica). Se uma parte falha no meio, o erro
 * diz o que já foi salvo.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    // Site de outra pessoa (inclusive para um admin) responde 404.
    if (!site || site.ownerId !== user.id) return notFound();

    const input = await readJson(request, SiteSetupRequest);
    if (!input.ok) return input.response;

    const tooFast = await savesExceeded(site.id);
    if (tooFast) return tooFast;

    try {
      const result = await applySetup(user.id, site, input.data);
      return jsonResponse(SiteSetupResponse, result);
    } catch (error) {
      if (error instanceof SetupPartialError) {
        console.error("[setup] a part failed", error.part, error.reason);
        const status = error.reason instanceof OfficeError ? error.reason.status : 500;
        const code = error.reason instanceof OfficeError ? error.reason.code : "internal_error";
        return errorResponse(status, code, partialMessage(error));
      }
      if (error instanceof OfficeError) {
        return errorResponse(error.status, error.code, error.message);
      }
      throw error;
    }
  }, "/api/sites/[id]/setup");
}
