import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  CaptionResponse,
  MAX_CAPTION_LENGTH,
  SocialPlan,
  type CaptionRequest,
  type SocialPillar,
  type SocialPlanItem,
} from "@nosweat/schema";
import type { BusinessContext } from "./context";
import {
  captionRequest,
  MAX_HASHTAGS,
  PILLAR_ROTATION,
  planRequest,
  SOCIAL_CAPTION_SYSTEM_PROMPT,
  SOCIAL_PLAN_SYSTEM_PROMPT,
} from "./prompt";

// IA que monta o mês de posts e escreve legendas. A IA só sugere RASCUNHOS: quem aprova é o dono.
//
// Hashtags: a legenda devolvida já vem PRONTA para publicar, com as hashtags no fim do texto
// (`finishCaption` acrescenta as que faltarem). O array `hashtags` do item fica só como
// referência: quem salva o post usa `caption` como está e NÃO junta as hashtags de novo.
//
// Afirmações (regra 8): `planMonth` devolve só os itens; quem chama marca `claimsFlagged` com
// `hasUnverifiedClaims(item.caption, ctx.highlights)` (claims.ts).

export type PlanMonthInput = {
  /** "YYYY-MM" */
  month: string;
  postsPerWeek: 2 | 3 | 5;
  /** Fuso da empresa (IANA). As datas e horas dos itens são locais nesse fuso. */
  timezone: string;
  /** Dias da semana (0 = domingo). Vazio = dias padrão para `postsPerWeek`. */
  postDays: number[];
  /** "HH:MM" local. */
  postTime: string;
  /** Máximo de posts (o que ainda cabe no plano do mês). */
  maxPosts: number;
};

export interface PostPlanner {
  planMonth(ctx: BusinessContext, req: PlanMonthInput): Promise<SocialPlanItem[]>;
  writeCaption(ctx: BusinessContext, req: CaptionRequest): Promise<CaptionResponse>;
}

/** Falha da IA (recusa, resposta cortada ou inválida duas vezes): a rota responde 502 social_error. */
export class SocialAiError extends Error {}

// ---------- Datas ----------

/** Dias padrão quando o dono não escolheu: ter/qui, seg/qua/sex ou seg a sex. */
const DEFAULT_DAYS: Record<PlanMonthInput["postsPerWeek"], number[]> = {
  2: [2, 4],
  3: [1, 3, 5],
  5: [1, 2, 3, 4, 5],
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Datas ("YYYY-MM-DD") dos posts do mês: só nos dias escolhidos, no máximo `postsPerWeek` por
 * semana (semana de segunda a domingo) e no máximo `maxPosts` no total. Datas de calendário,
 * sem fuso: a conversão para UTC é feita por quem salva (zonedTimeToUtc).
 */
export function planDates(
  month: string,
  postDays: number[],
  postsPerWeek: PlanMonthInput["postsPerWeek"],
  maxPosts: number,
): string[] {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11 || maxPosts <= 0) return [];
  const chosen = postDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const days = new Set(chosen.length ? chosen : DEFAULT_DAYS[postsPerWeek]);
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const perWeek = new Map<number, number>();
  const dates: string[] = [];
  for (let day = 1; day <= lastDay && dates.length < maxPosts; day++) {
    const weekday = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
    if (!days.has(weekday)) continue;
    // Segunda-feira da semana desta data (pode cair no mês anterior: número negativo serve).
    const weekStart = day - ((weekday + 6) % 7);
    const used = perWeek.get(weekStart) ?? 0;
    if (used >= postsPerWeek) continue;
    perWeek.set(weekStart, used + 1);
    dates.push(`${year}-${pad(monthIndex + 1)}-${pad(day)}`);
  }
  return dates;
}

function isDateInMonth(date: string, month: string): boolean {
  if (!date.startsWith(`${month}-`)) return false;
  const day = Number(date.slice(8, 10));
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Number.isInteger(day) && day >= 1 && day <= lastDay;
}

// ---------- Pós-processamento (vale para qualquer planner) ----------

/** "#Lawn Care!" → "#LawnCare". Vazio se não sobrar nada. */
function normalizeHashtag(tag: string): string {
  const body = tag.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
  return body ? `#${body}`.slice(0, 60) : "";
}

/** Hashtags limpas, sem repetir, no máximo MAX_HASHTAGS. */
export function normalizeHashtags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const clean = normalizeHashtag(tag);
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length >= MAX_HASHTAGS) break;
  }
  return result;
}

/** Legenda final: texto + hashtags que ainda não estão no texto, dentro do limite do Instagram. */
export function finishCaption(caption: string, hashtags: string[]): string {
  const text = caption.trim();
  const lower = text.toLowerCase();
  const missing = hashtags.filter((tag) => !new RegExp(`${escapeRegExp(tag.toLowerCase())}(?![\\p{L}\\p{N}_])`, "u").test(lower));
  const full = missing.length ? `${text}\n\n${missing.join(" ")}` : text;
  return full.slice(0, MAX_CAPTION_LENGTH).trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Deixa a saída da IA dentro das regras: só datas do mês, uma por dia, na hora do dono,
 * foto só da lista (senão `null`), hashtags na legenda e no máximo `maxPosts` itens.
 */
export function postProcessPlan(
  items: SocialPlanItem[],
  ctx: BusinessContext,
  req: PlanMonthInput,
): SocialPlanItem[] {
  const byDate = new Map<string, SocialPlanItem>();
  for (const item of items) {
    if (!isDateInMonth(item.date, req.month) || byDate.has(item.date)) continue;
    const hashtags = normalizeHashtags(item.hashtags);
    const caption = finishCaption(item.caption, hashtags);
    if (!caption) continue;
    const photoIndex =
      item.photoIndex !== null && item.photoIndex >= 0 && item.photoIndex < ctx.photos.length
        ? item.photoIndex
        : null;
    byDate.set(item.date, {
      ...item,
      time: req.postTime,
      caption,
      hashtags,
      ownerNotePt: item.ownerNotePt.trim().slice(0, 300),
      photoIndex,
    });
  }
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, Math.max(0, req.maxPosts));
}

function finishCaptionResponse(result: CaptionResponse): CaptionResponse {
  return {
    caption: result.caption.trim().slice(0, MAX_CAPTION_LENGTH),
    ownerNotePt: result.ownerNotePt.trim().slice(0, 300),
  };
}

// ---------- Mock (sem chave, dev e testes) ----------

function slug(value: string): string {
  return value.replace(/[^\p{L}\p{N}]/gu, "");
}

function mockHashtags(ctx: BusinessContext, service: string | undefined): string[] {
  return normalizeHashtags([
    slug(ctx.businessName),
    ctx.city ? slug(ctx.city) : "",
    service ? slug(service) : "",
    "SmallBusiness",
    "ShopLocal",
  ]);
}

const MOCK_NOTES: Record<SocialPillar, string> = {
  tip: "Dica útil para os clientes, mostra que você entende do assunto.",
  service: "Apresenta um dos seus serviços e para quem ele serve.",
  area: "Fala da sua cidade para criar proximidade com quem mora perto.",
  behind_the_scenes: "Mostra os bastidores do seu trabalho para gerar confiança.",
  seasonal: "Aproveita a época do ano para lembrar os clientes do seu serviço.",
  cta: "Convida as pessoas a entrar em contato com você.",
};

function mockCaption(ctx: BusinessContext, pillar: SocialPillar, service: string | undefined): string {
  const name = ctx.businessName;
  const place = ctx.serviceArea ?? ctx.city ?? "our neighborhood";
  const what = service ?? "what we do";
  switch (pillar) {
    case "tip":
      return `Quick tip from ${name}: a little regular care goes a long way with ${what.toLowerCase()}. Small habits now save headaches later.`;
    case "service":
      return `Did you know ${name} offers ${what}? We'd love to help you with it.`;
    case "area":
      return `Proud to serve ${place}. Thanks for letting ${name} be part of the community.`;
    case "behind_the_scenes":
      return `A peek behind the scenes at ${name}: getting everything ready so each job goes smoothly.`;
    case "seasonal":
      return `New season, new to-do list. Thinking about ${what.toLowerCase()}? ${name} is here to help.`;
    case "cta":
      return ctx.phone
        ? `Ready when you are. Call ${name} at ${ctx.phone} to get started.`
        : `Ready when you are. Tap the link in bio to get in touch with ${name}.`;
  }
}

/** Planner sem IA: determinístico e instantâneo, usa o nome e os serviços do negócio. */
export class MockPostPlanner implements PostPlanner {
  async planMonth(ctx: BusinessContext, req: PlanMonthInput): Promise<SocialPlanItem[]> {
    const dates = planDates(req.month, req.postDays, req.postsPerWeek, req.maxPosts);
    const items: SocialPlanItem[] = dates.map((date, index) => {
      const pillar = PILLAR_ROTATION[index % PILLAR_ROTATION.length] ?? "tip";
      const service = ctx.services.length ? ctx.services[index % ctx.services.length] : undefined;
      return {
        date,
        time: req.postTime,
        pillar,
        caption: mockCaption(ctx, pillar, service),
        hashtags: mockHashtags(ctx, service),
        ownerNotePt: MOCK_NOTES[pillar],
        photoIndex: ctx.photos.length ? index % ctx.photos.length : null,
      };
    });
    return postProcessPlan(items, ctx, req);
  }

  async writeCaption(ctx: BusinessContext, req: CaptionRequest): Promise<CaptionResponse> {
    const current = req.currentCaption?.trim();
    const base =
      req.action === "write" || !current
        ? `${req.idea?.trim() ? `${req.idea.trim()} ` : ""}From all of us at ${ctx.businessName}.`
        : current;
    let caption = base;
    let ownerNotePt = "Legenda nova escrita a partir da sua ideia.";
    if (req.action === "shorter") {
      caption = base.split(/(?<=[.!?])\s+/)[0] ?? base;
      ownerNotePt = "Versão mais curta da legenda.";
    } else if (req.action === "friendlier") {
      caption = `Hi neighbors! ${base}`;
      ownerNotePt = "Versão mais simpática da legenda.";
    } else if (req.action === "cta") {
      const cta = ctx.phone ? `Call us at ${ctx.phone}.` : "Tap the link in bio to get in touch.";
      caption = `${base}\n\n${cta}`;
      ownerNotePt = "Legenda com convite para entrar em contato.";
    }
    return finishCaptionResponse({ caption, ownerNotePt });
  }
}

// ---------- Anthropic ----------

/** Mês inteiro: Sonnet (ANTHROPIC_MODEL). Legenda: Haiku, bem mais barato (ANTHROPIC_EDIT_MODEL). */
const DEFAULT_MODEL = "claude-sonnet-5-5";
const DEFAULT_CAPTION_MODEL = "claude-haiku-5-5";

/** Erro de API (rede, 429, 5xx) já passou pelas novas tentativas do SDK: não repetimos. */
function isApiError(error: unknown): boolean {
  return error instanceof Anthropic.APIError;
}

type ParsedResponse<T> = {
  stop_reason: string | null;
  stop_details?: { category?: string | null } | null;
  parsed_output: T | null;
};

/**
 * Chama a IA e repete UMA vez se a resposta vier fora do formato. Recusa, resposta cortada e
 * erro de API não são repetidos. Tudo vira SocialAiError (a rota responde 502 social_error).
 */
async function parseWithRetry<T>(what: string, call: () => Promise<ParsedResponse<T>>): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: ParsedResponse<T>;
    try {
      response = await call();
    } catch (error) {
      if (isApiError(error)) {
        throw new SocialAiError(`The AI is not available right now (${what}).`, { cause: error });
      }
      // Erro ao validar a saída (JSON/Zod): tenta mais uma vez.
      lastError = error;
      continue;
    }
    if (response.stop_reason === "refusal") {
      throw new SocialAiError(
        `Claude declined to write ${what} (${response.stop_details?.category ?? "unknown"}).`,
      );
    }
    if (response.stop_reason === "max_tokens") {
      throw new SocialAiError(`Claude's response was cut off before ${what} was complete.`);
    }
    if (response.parsed_output) return response.parsed_output;
    lastError = new Error("empty parsed_output");
  }
  throw new SocialAiError(`Claude did not return valid ${what}.`, { cause: lastError });
}

export class AnthropicPostPlanner implements PostPlanner {
  constructor(
    // Mesmo cuidado do gerador de sites: tempo máximo abaixo do limite da rota e 1 nova tentativa.
    private readonly client: Anthropic = new Anthropic({ timeout: 240_000, maxRetries: 1 }),
    private readonly model: string = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    private readonly captionModel: string = process.env.ANTHROPIC_EDIT_MODEL ||
      DEFAULT_CAPTION_MODEL,
  ) {}

  async planMonth(ctx: BusinessContext, req: PlanMonthInput): Promise<SocialPlanItem[]> {
    const dates = planDates(req.month, req.postDays, req.postsPerWeek, req.maxPosts);
    if (!dates.length) return [];
    const slots = dates.map((date) => ({ date, time: req.postTime }));
    const plan = await parseWithRetry("the month plan", () =>
      this.client.messages.parse({
        model: this.model,
        max_tokens: 8000,
        output_config: { effort: "medium", format: zodOutputFormat(SocialPlan) },
        system: SOCIAL_PLAN_SYSTEM_PROMPT,
        messages: [
          { role: "user", content: planRequest(ctx, req.month, slots, req.timezone) },
        ],
      }),
    );
    // Só as datas pedidas (a IA não escolhe dias fora da agenda do dono).
    const allowed = new Set(dates);
    return postProcessPlan(
      plan.posts.filter((item) => allowed.has(item.date)),
      ctx,
      req,
    );
  }

  async writeCaption(ctx: BusinessContext, req: CaptionRequest): Promise<CaptionResponse> {
    const result = await parseWithRetry("the caption", () =>
      this.client.messages.parse({
        model: this.captionModel,
        max_tokens: 1500,
        output_config: { effort: "low", format: zodOutputFormat(CaptionResponse) },
        system: SOCIAL_CAPTION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: captionRequest(ctx, req) }],
      }),
    );
    return finishCaptionResponse(result);
  }
}

/**
 * Escolhe o planner pela variável AI_PROVIDER: "mock" (ou vazia) → mock; qualquer outro valor →
 * Anthropic (o módulo de redes sociais só tem implementação com o Claude).
 */
export function getPostPlanner(provider = process.env.AI_PROVIDER || "mock"): PostPlanner {
  return provider === "mock" ? new MockPostPlanner() : new AnthropicPostPlanner();
}
