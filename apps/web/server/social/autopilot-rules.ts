import { currentMonth, localClock, nextMonth, zonedTimeToUtc } from "./service";
import type { AutopilotState, SocialPostRecord } from "./types";

// Regras puras do Piloto automático e do "Approve all drafts" (sem banco nem relógio próprio:
// tudo recebe `now`). O Piloto automático é a ÚNICA exceção à regra "a IA nunca aprova": o dono
// ligou e deu o consentimento permanente, e mesmo assim só rascunhos completos da IA, avisados
// por e-mail com pelo menos 12 h de antecedência e que o dono não editou nem pulou.

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Aprova quando faltam no máximo 2 h para a hora do post. */
export const AUTO_APPROVE_WINDOW_MS = 2 * HOUR_MS;
/** O aviso por e-mail precisa ter saído pelo menos 12 h antes da aprovação. */
export const MIN_NOTICE_MS = 12 * HOUR_MS;
/** Não aprova em cima da hora (o publicador precisa pegar o post a tempo). */
export const APPROVE_MIN_LEAD_MS = 2 * MINUTE_MS;
/**
 * Folga do cron (roda a cada 15 min): só entra no aviso o post que ainda dá para aprovar com as
 * 12 h de aviso cumpridas. Os outros ficam como rascunho (o dono aprova se quiser).
 */
export const NOTICE_SLACK_MS = 45 * MINUTE_MS;
/** O e-mail do dia sai a partir das 8 h no fuso da empresa. */
export const DIGEST_FROM_HOUR = 8;
/** A partir do dia 25, planeja o mês seguinte. */
export const PLAN_FROM_DAY = 25;
/** Sem créditos ou erro: tenta planejar de novo no dia seguinte. */
export const PLAN_RETRY_MS = 20 * HOUR_MS;

/** Por que um rascunho pode (ou não) ser aprovado agora. */
export type DraftCheck = "ready" | "incomplete" | "past" | "flagged" | "skipped";

type DraftFields = Pick<
  SocialPostRecord,
  "status" | "source" | "caption" | "media" | "scheduledAt" | "claimsFlagged" | "autopilotSkip"
> &
  Partial<Pick<SocialPostRecord, "ownerEditedAt" | "autopilotNoticeAt">>;

/**
 * Mesmas exigências de `approvePosts` (data no futuro, foto e legenda), mais duas travas das
 * aprovações em lote: "Skip" do dono e legenda com afirmação a conferir (regra 8).
 */
export function draftCheck(post: DraftFields, nowMs: number): DraftCheck {
  if (!post.scheduledAt || post.media.length === 0 || !post.caption.trim()) return "incomplete";
  if (Date.parse(post.scheduledAt) <= nowMs) return "past";
  if (post.autopilotSkip) return "skipped";
  if (post.claimsFlagged) return "flagged";
  return "ready";
}

/** Rascunho da IA, completo, que o dono não editou nem pulou (falta só a hora e o aviso). */
export function isAutopilotCandidate(post: DraftFields, nowMs: number): boolean {
  return (
    post.status === "draft" &&
    post.source === "ai" &&
    (post.ownerEditedAt ?? null) === null &&
    draftCheck(post, nowMs) === "ready"
  );
}

/**
 * Entra no e-mail de aviso desta vez: candidato, ainda não avisado, com data até `horizonMs` e
 * longe o bastante para cumprir as 12 h de aviso antes da janela de aprovação.
 */
export function needsNotice(post: DraftFields, nowMs: number, horizonMs: number): boolean {
  if (!isAutopilotCandidate(post, nowMs) || post.autopilotNoticeAt) return false;
  const at = Date.parse(post.scheduledAt ?? "");
  return at <= horizonMs && at - nowMs >= MIN_NOTICE_MS + NOTICE_SLACK_MS;
}

/**
 * Pode aprovar agora: candidato, avisado há pelo menos 12 h, dentro da janela de 2 h antes da
 * hora e ainda no futuro (post atrasado nunca é aprovado: segue as regras de "missed").
 */
export function readyToAutoApprove(post: DraftFields, nowMs: number): boolean {
  if (!isAutopilotCandidate(post, nowMs) || !post.autopilotNoticeAt) return false;
  const noticeMs = Date.parse(post.autopilotNoticeAt);
  if (!Number.isFinite(noticeMs) || nowMs - noticeMs < MIN_NOTICE_MS) return false;
  const lead = Date.parse(post.scheduledAt ?? "") - nowMs;
  return lead >= APPROVE_MIN_LEAD_MS && lead <= AUTO_APPROVE_WINDOW_MS;
}

/** O e-mail do dia pode sair agora? (a partir das 8 h locais, no máximo um por dia local) */
export function digestDue(lastDigestAt: string | null, now: Date, timeZone: string): boolean {
  const today = localClock(now, timeZone);
  if (today.hour < DIGEST_FROM_HOUR) return false;
  if (!lastDigestAt) return true;
  return localClock(new Date(lastDigestAt), timeZone).date !== today.date;
}

/** Fim do dia seguinte no fuso (os posts de hoje e de amanhã entram no aviso). */
export function noticeHorizon(now: Date, timeZone: string): string {
  const { date } = localClock(now, timeZone);
  const [y, m, d] = date.split("-").map(Number);
  const dayAfter = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + 2))
    .toISOString()
    .slice(0, 10);
  return zonedTimeToUtc(dayAfter, "00:00", timeZone);
}

/**
 * Mês ("YYYY-MM") que o Piloto automático deve planejar agora, ou `null`. Do dia 25 em diante,
 * o mês seguinte; uma vez planejado, não tenta de novo; sem créditos ou erro, tenta no dia seguinte.
 * (Quem chama ainda confere se o mês já tem posts.)
 */
export function monthToPlan(
  state: Pick<AutopilotState, "autopilotPlanMonth" | "autopilotPlanStatus" | "autopilotPlanAt">,
  now: Date,
  timeZone: string,
): string | null {
  if (localClock(now, timeZone).day < PLAN_FROM_DAY) return null;
  const month = nextMonth(currentMonth(timeZone, now));
  if (state.autopilotPlanMonth === month) {
    if (state.autopilotPlanStatus === "planned") return null;
    const last = state.autopilotPlanAt ? Date.parse(state.autopilotPlanAt) : Number.NaN;
    if (Number.isFinite(last) && now.getTime() - last < PLAN_RETRY_MS) return null;
  }
  return month;
}

/** Posts por semana do plano automático, pelos dias marcados nas preferências (2, 3 ou 5). */
export function postsPerWeekFor(postDays: readonly number[]): 2 | 3 | 5 {
  const days = new Set(postDays).size;
  if (days >= 5) return 5;
  if (days >= 3) return 3;
  return 2;
}

/**
 * Escolhe, na ordem recebida (a mais cedo primeiro), os posts que cabem no limite do plano por
 * mês. `used` = posts que já contam em cada mês. `cap` `null` = sem limite.
 */
export function pickWithinCap<T>(
  posts: readonly T[],
  cap: number | null,
  used: ReadonlyMap<string, number>,
  monthOfPost: (post: T) => string,
): { approve: T[]; overCap: T[] } {
  if (cap === null) return { approve: [...posts], overCap: [] };
  const counts = new Map(used);
  const approve: T[] = [];
  const overCap: T[] = [];
  for (const post of posts) {
    const month = monthOfPost(post);
    const count = counts.get(month) ?? 0;
    if (count < cap) {
      counts.set(month, count + 1);
      approve.push(post);
    } else {
      overCap.push(post);
    }
  }
  return { approve, overCap };
}
