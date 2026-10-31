import { GenerateSiteRequest, GenerateSiteResponse, type SiteSpec } from "@nosweat/schema";
import { generateSiteSpec, getSiteGenerator } from "@/server/ai";
import { ensureGuestId } from "@/server/guest";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { fitDesignToPhoto } from "@/server/design";
import { hasImageProvider, resolveSiteImages } from "@/server/images";
import { RateLimiter, clientIp } from "@/server/notify";
import { refundUse, reserveUse } from "@/server/quota";
import { getActor, type Actor } from "@/server/sites";
import { getSiteStore } from "@/server/store";
import type { Composition } from "@nosweat/schema";

// A IA de verdade leva alguns segundos (às vezes dezenas) para montar o site.
export const maxDuration = 300;

// Modo modelo (sem IA): até 20 sites por hora por IP (melhor esforço, em memória por instância).
const templateLimiter = new RateLimiter(20, 60 * 60 * 1000);

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
    // Modo modelo (sem IA de verdade): não desconta créditos nem conta no ai_usage (o custo
    // do /admin e o limite diário são da IA).
    if (generator.usesAi) {
      const overLimit = await reserveUse(actor, "generate");
      if (overLimit) return overLimit;
    } else if (!templateLimiter.take(clientIp(request))) {
      // Sem IA não custa crédito, mas cada site é uma linha no banco: trava contra robôs.
      return errorResponse(
        429,
        "quota_exceeded",
        "You've created a lot of sites in a short time. Please try again in a little while.",
      );
    }

    let spec: SiteSpec;
    try {
      spec = await generateSiteSpec(input.data.brief, generator, {
        recent: await recentCompositions(actor),
        photos: hasImageProvider(),
      });
    } catch (error) {
      console.error("[api] site generation failed", error);
      // A IA falhou: os créditos voltam para a conta.
      if (generator.usesAi) await refundUse(actor, "generate");
      return errorResponse(
        502,
        "generation_failed",
        "We couldn't generate your site right now. Please try again.",
      );
    }

    // Fotos do topo e dos serviços a partir dos imageQuery (sem chave, erro ou demora: segue
    // sem foto).
    spec = fitDesignToPhoto(await resolveSiteImages(spec));

    const site = await getSiteStore().create(
      spec,
      actor.kind === "user" ? actor.user.id : { guestId: actor.guestId },
    );
    return jsonResponse(GenerateSiteResponse, { siteId: site.id, spec: site.spec }, 201);
  }, "/api/sites/generate");
}

/**
 * Composições dos 3 sites mais recentes da conta: o plano de design evita repetir o mesmo
 * layout para a mesma pessoa. Visitantes (sem conta) e falhas de leitura = lista vazia.
 */
async function recentCompositions(actor: Actor): Promise<Composition[]> {
  if (actor.kind !== "user") return [];
  try {
    const sites = await getSiteStore().list(actor.user.id);
    return sites
      .slice(0, 3)
      .flatMap((site) => (site.spec.design ? [site.spec.design.composition] : []));
  } catch {
    return [];
  }
}
