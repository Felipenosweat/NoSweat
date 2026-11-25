// Medição do uso de tokens de cada chamada da IA que escreve ou edita site. Uma linha por chamada
// no log da Vercel (`[ai] usage`), sem banco nem preço: dá para somar depois e calcular o custo
// REAL por site com a tabela de preços do dia (hoje o /admin usa um valor fixo estimado, em
// server/admin/costs.ts). Nunca lança erro: medir não pode derrubar a geração do site.

export type AiCallLabel = "generate" | "generate_model_first" | "ai_edit" | "assistant_chat";

const count = (value: unknown): number => (typeof value === "number" ? value : 0);

export function logAiUsage(
  label: AiCallLabel,
  model: string,
  response: { usage: object; stop_reason?: string | null },
  extra: Record<string, unknown> = {},
): void {
  try {
    const usage = response.usage as Record<string, unknown>;
    const details = (usage.output_tokens_details ?? {}) as Record<string, unknown>;
    console.info("[ai] usage", {
      label,
      model,
      stop: response.stop_reason ?? null,
      // Entrada comum, escrita no cache, leitura do cache, saída (já com o pensamento dentro).
      input: count(usage.input_tokens),
      cacheWrite: count(usage.cache_creation_input_tokens),
      cacheRead: count(usage.cache_read_input_tokens),
      output: count(usage.output_tokens),
      thinking: count(details.thinking_tokens),
      ...extra,
    });
  } catch {
    // Sem medição desta vez; o site continua.
  }
}
