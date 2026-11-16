import { MAX_CLAIMS_PER_PROSPECT } from "@/lib/prospects";
import { isLikelyBot } from "../bots";
import { sendProspectClaimNotification } from "../notify/prospect-email";
import type { Actor } from "../sites";
import { getSiteStore, type SiteRecord } from "../store";
import { getPublicPreview } from "./service";
import { getProspectStore } from "./store";
import type { ProspectRecord } from "./types";

// "Make it yours" da prévia pública (/p/<token>): quem clica ganha uma CÓPIA do site da prévia
// (visitante sem conta ou conta logada) e cai direto no editor. Daí em diante vale o caminho de
// qualquer site: editar, criar conta (o site passa para a conta), publicar, plano.
// O rascunho do admin (a prévia) fica como está. Copiar não usa a IA nem créditos.

export type ClaimResult =
  | { kind: "not_found" }
  /** O link já rendeu cópias demais: quem clica segue pelo /create (trava contra abuso). */
  | { kind: "limit" }
  | { kind: "claimed"; siteId: string; created: boolean };

/** Status do começo do funil: assumir a prévia leva o prospect para "replied". */
const EARLY_STATUSES = new Set<ProspectRecord["status"]>(["new", "preview_ready", "contacted"]);

/** O site é de quem está clicando? (Admin não vale: ele "acessa" todos, mas não é o dono.) */
function belongsTo(site: SiteRecord, actor: Actor): boolean {
  return actor.kind === "user"
    ? site.ownerId === actor.user.id
    : site.ownerId === null && site.guestId === actor.guestId;
}

/**
 * Assume a prévia: devolve a cópia que este visitante/conta já tem ou cria uma. A primeira cópia
 * marca o prospect (`claimedAt`; o status vira "replied" se ainda estava no começo do funil) e
 * avisa a equipe por e-mail. Registrar e avisar nunca derrubam o clique.
 */
export async function claimPreview(
  token: string,
  actor: Actor,
  appOrigin: string,
): Promise<ClaimResult> {
  const preview = await getPublicPreview(token);
  if (!preview) return { kind: "not_found" };
  const { prospect, site: source } = preview;
  const prospects = getProspectStore();
  const sites = getSiteStore();

  let claims = 0;
  try {
    const existing = await prospects.listClaims(prospect.id);
    claims = existing.length;
    for (const claim of existing) {
      const copy = await sites.get(claim.siteId);
      if (copy && belongsTo(copy, actor)) {
        return { kind: "claimed", siteId: copy.id, created: false };
      }
    }
  } catch (error) {
    // Sem a tabela (migration 0028 ainda não rodou) o clique continua valendo.
    console.error("[prospects] could not read the claims", error);
  }
  if (claims >= MAX_CLAIMS_PER_PROSPECT) return { kind: "limit" };

  const copy = await sites.create(
    source.spec,
    actor.kind === "user" ? actor.user.id : { guestId: actor.guestId },
  );

  try {
    await prospects.addClaim(prospect.id, copy.id);
    if (!prospect.claimedAt) {
      await prospects.update(prospect.id, {
        claimedAt: new Date().toISOString(),
        status: EARLY_STATUSES.has(prospect.status) ? "replied" : prospect.status,
      });
      await sendProspectClaimNotification({
        business: prospect.name,
        phone: prospect.phone,
        email: prospect.email,
        city: [prospect.city, prospect.state].filter(Boolean).join(", ") || null,
        withAccount: actor.kind === "user",
        appOrigin,
      });
    }
  } catch (error) {
    console.error("[prospects] could not record the claim", error);
  }
  return { kind: "claimed", siteId: copy.id, created: true };
}

/**
 * Conta uma abertura da prévia (quem abriu é quem vale a ligação). Robôs conhecidos ficam de
 * fora; quem chama pula o próprio admin. Leitura + gravação sem trava: duas aberturas no mesmo
 * instante podem contar uma só, o que não muda nada aqui. Nunca lança.
 */
export async function recordPreviewView(
  prospect: Pick<ProspectRecord, "id" | "previewViews">,
  userAgent: string | null | undefined,
): Promise<void> {
  if (isLikelyBot(userAgent)) return;
  try {
    await getProspectStore().update(prospect.id, {
      previewViews: prospect.previewViews + 1,
      previewLastViewedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[prospects] could not count the preview view", error);
  }
}

export { isLikelyBot };
