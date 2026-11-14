// Custo ESTIMADO de cada página do experimento, a partir dos tokens que a API devolveu.
// server/admin/costs.ts só tem preço médio por USO (não por token nem por modelo), então os
// preços ficam aqui: tabela de preços públicos da Anthropic (US$ por 1 milhão de tokens),
// conferida em 2026-11. ATUALIZAR se o preço mudar. Cache: escrita = 1,25 × entrada (5 min),
// leitura = preço de leitura abaixo. O raciocínio (thinking) já vem somado em output_tokens.

type Price = { input: number; output: number; cacheRead: number };

export const FREEFORM_PRICES_PER_MTOK: Record<string, Price> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  // Possíveis substitutos do servidor quando o modelo principal recusa.
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5 },
};

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

/** Custo estimado em US$, ou null se o modelo não estiver na tabela. */
export function estimateFreeformCostUsd(model: string, usage: TokenUsage): number | null {
  const price = FREEFORM_PRICES_PER_MTOK[model];
  if (!price) return null;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const usd =
    usage.input_tokens * price.input +
    cacheWrite * price.input * 1.25 +
    cacheRead * price.cacheRead +
    usage.output_tokens * price.output;
  return usd / 1_000_000;
}
