// EXPERIMENTO "caminho A": gera o HTML inteiro de uma landing page com o Claude.
// Não é chamado por nenhuma rota; só pelo script scripts/freeform-batch.mts. Ver README.md.
// Roda também direto no Node (remoção de tipos, sem bundler): imports com extensão .ts e nada
// de enum/namespace/parameter properties.

import Anthropic from "@anthropic-ai/sdk";
import { buildFreeformUserPrompt, FREEFORM_SYSTEM_PROMPT, type FreeformBrief } from "./prompt.ts";

/** Modelos aceitos no experimento (os preços de cada um estão em pricing.ts). */
export const FREEFORM_MODELS = ["claude-sonnet-5-5", "claude-opus-5-5"] as const;
export type FreeformModel = (typeof FREEFORM_MODELS)[number];

/** Padrão: Sonnet 5.5 (custo). FREEFORM_MODEL=claude-opus-5-5 troca para o Opus. */
export const DEFAULT_FREEFORM_MODEL: FreeformModel = "claude-sonnet-5-5";

/** Folga para uma página inteira (HTML + CSS) e o raciocínio do modelo, que conta como saída. */
const MAX_TOKENS = 32_000;

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];

export function freeformModelFromEnv(value = process.env.FREEFORM_MODEL): FreeformModel {
  const model = value?.trim() || DEFAULT_FREEFORM_MODEL;
  if (!(FREEFORM_MODELS as readonly string[]).includes(model)) {
    throw new Error(
      `FREEFORM_MODEL must be one of ${FREEFORM_MODELS.join(", ")} (got "${model}").`,
    );
  }
  return model as FreeformModel;
}

/** FREEFORM_EFFORT opcional; sem ela vale o padrão do modelo (Sonnet 5.5: high, Opus 5.5: medium). */
function effortFromEnv(value = process.env.FREEFORM_EFFORT): Effort | undefined {
  const effort = value?.trim();
  if (!effort) return undefined;
  if (!(EFFORTS as readonly string[]).includes(effort)) {
    throw new Error(`FREEFORM_EFFORT must be one of ${EFFORTS.join(", ")} (got "${effort}").`);
  }
  return effort as Effort;
}

export type FreeformResult = {
  html: string;
  usage: Anthropic.Beta.BetaUsage;
  /** Modelo que de fato respondeu (pode ser o substituto se o principal recusar). */
  model: string;
  stopReason: string | null;
};

export type GenerateFreeformOptions = {
  client?: Anthropic;
  model?: FreeformModel;
  effort?: Effort;
  /** Substituto do servidor quando o modelo recusa (padrão ligado; FREEFORM_FALLBACKS=off desliga). */
  fallbacks?: boolean;
};

/**
 * Pede a página ao Claude com streaming (a resposta pode ser longa) e devolve o HTML extraído.
 * Sem `thinking` no pedido: Sonnet 5.5 e Opus 5.5 já usam raciocínio adaptativo por padrão (e
 * recusam `budget_tokens` e `disabled`). O HTML volta CRU: quem chama passa por sanitize.ts.
 */
export async function generateFreeformSite(
  brief: FreeformBrief,
  options: GenerateFreeformOptions = {},
): Promise<FreeformResult> {
  const client = options.client ?? new Anthropic({ timeout: 15 * 60_000, maxRetries: 1 });
  const model = options.model ?? freeformModelFromEnv();
  const effort = options.effort ?? effortFromEnv();
  const fallbacks = options.fallbacks ?? process.env.FREEFORM_FALLBACKS?.trim() !== "off";

  const stream = client.beta.messages.stream({
    model,
    max_tokens: MAX_TOKENS,
    // O pedido do sistema é igual em todas as chamadas: fica no cache entre os sites do lote.
    system: [{ type: "text", text: FREEFORM_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildFreeformUserPrompt(brief) }],
    ...(effort ? { output_config: { effort } } : {}),
    // Se o filtro de segurança recusar, o servidor tenta outro modelo na mesma chamada.
    ...(fallbacks
      ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
      : {}),
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    const category = message.stop_details?.category ?? "unknown";
    throw new Error(`The model declined to write this site (refusal, category: ${category}).`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error(`The page was cut off at max_tokens (${MAX_TOKENS}); nothing was saved.`);
  }

  const text = message.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
  const html = extractHtml(text);
  if (!html) throw new Error("The response did not contain a complete HTML document.");
  return { html, usage: message.usage, model: message.model, stopReason: message.stop_reason };
}

/**
 * Tira o documento HTML da resposta: aceita bloco ```html ou o texto puro, do <!doctype> (ou
 * <html>) até o último </html>. Devolve null se não houver documento completo.
 */
export function extractHtml(text: string): string | null {
  const fenced = /```(?:html)?\s*\n([\s\S]*?)```/i.exec(text);
  const source = fenced?.[1] ?? text;
  const start = source.search(/<!doctype html|<html[\s>]/i);
  const end = source.toLowerCase().lastIndexOf("</html>");
  if (start === -1 || end === -1 || end < start) return null;
  return source.slice(start, end + "</html>".length).trim() + "\n";
}
