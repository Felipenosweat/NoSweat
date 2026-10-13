import { GenerateSiteRequest, GenerateSiteResponse, type SiteSpec } from "@nosweat/schema";
import { generateSiteSpec, getSiteGenerator } from "@/server/ai";
import { ensureGuestId } from "@/server/guest";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { reserveUse } from "@/server/quota";
import { getActor, type Actor } from "@/server/sites";
import { getSiteStore } from "@/server/store";

// A IA de verdade leva alguns segundos (às vezes dezenas) para montar o site.
export const maxDuration = 300;

/**
 * POST /api/sites/generate: { brief } → { siteId, spec }
 * Funciona sem login: quem não tem conta vira visitante (cookie) e o site fica guardado
 * para ele até criar a conta (ver server/guest.ts). Visitantes têm limites menores.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const input = await readJson(request, GenerateSiteRequest);
    if (!input.ok) return input.response;

    const actor: Actor = (await getActor()) ?? { kind: "guest", guestId: await ensureGuestId() };
    // Monta o gerador ANTES de gastar um crédito: erro de configuração (ex.: falta a chave da
    // IA) vira 500 sem descontar nada do cliente.
    const generator = getSiteGenerator();
    const overLimit = await reserveUse(actor, "generate");
    if (overLimit) return overLimit;

    let spec: SiteSpec;
    try {
      spec = await generateSiteSpec(input.data.brief, generator);
    } catch (error) {
      console.error("[api] site generation failed", error);
      return errorResponse(
        502,
        "generation_failed",
        "We couldn't generate your site right now. Please try again.",
      );
    }

    const site = await getSiteStore().create(
      spec,
      actor.kind === "user" ? actor.user.id : { guestId: actor.guestId },
    );
    return jsonResponse(GenerateSiteResponse, { siteId: site.id, spec: site.spec }, 201);
  });
}
