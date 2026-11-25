import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { logAiUsage } from "../ai/usage-log";
import { assistantSystemPrompt, type AssistantContext } from "./prompt";
import { toModelTurns, type Turn } from "./rules";

// IA do atendente do site. A IA não tem ferramentas: só devolve um JSON (resposta + pedido de
// contato opcional), validado pelo Zod. Quem salva o pedido é o servidor, depois de conferir
// o contato contra o que o visitante digitou (rules.ts, verifiedLead).

/** Resposta da IA. Sem limites de tamanho aqui (o servidor corta depois); só o formato. */
export const AssistantModelOutput = z.object({
  reply: z.string(),
  lead: z
    .object({
      name: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      message: z.string(),
    })
    .optional(),
  offerBooking: z.boolean().optional(),
});
export type AssistantModelOutput = z.infer<typeof AssistantModelOutput>;

export interface AssistantResponder {
  /** `history`: a conversa inteira até agora, terminando na mensagem nova do visitante. */
  reply(ctx: AssistantContext, history: Turn[]): Promise<AssistantModelOutput>;
}

/** Falha da IA (recusa, resposta cortada ou inválida): a rota devolve os créditos. */
export class AssistantAiError extends Error {}

// ---------- Mock (dev e testes, sem chave) ----------

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /\(?\+?\d[\d\s().-]{6,}\d/;

/** Respostas simples por palavra-chave, só com os fatos do site (nunca inventa). */
export class MockAssistantResponder implements AssistantResponder {
  async reply(ctx: AssistantContext, history: Turn[]): Promise<AssistantModelOutput> {
    const visitor = history.filter((turn) => turn.role === "visitor").map((turn) => turn.text);
    const last = (visitor[visitor.length - 1] ?? "").toLowerCase();
    const { business } = ctx.spec;
    const email = visitor.join(" ").match(EMAIL)?.[0];
    const phone = visitor.join(" ").match(PHONE)?.[0];
    if (email || phone) {
      return {
        reply: `Thanks! I've passed your details to ${business.name}. They'll get back to you soon.`,
        lead: {
          name: "Website visitor",
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          message: visitor.join(" ").slice(0, 300),
        },
      };
    }
    if (/\b(book|appointment|schedule)\b/.test(last) && ctx.bookingAvailable) {
      return {
        reply: 'You can pick a time that works for you with the "Book online" button.',
        offerBooking: true,
      };
    }
    if (/\b(hour|open|close)/.test(last) && business.hours?.length) {
      const hours = business.hours.map((row) => `${row.days} ${row.time}`).join(", ");
      return { reply: `We're open ${hours}.` };
    }
    if (/\b(phone|call|number)\b/.test(last) && business.phone) {
      return { reply: `You can call us at ${business.phone}.` };
    }
    return {
      reply: `(Test reply) I'm the assistant for ${business.name}. I'm not sure about that one: leave your name and a phone number or email and the owner will follow up.`,
    };
  }
}

// ---------- Anthropic ----------

/** O modelo mais barato do projeto (o mesmo das legendas do Instagram). */
const DEFAULT_ASSISTANT_MODEL = "claude-haiku-5-5";

export class AnthropicAssistantResponder implements AssistantResponder {
  constructor(
    // Resposta curta: tempo bem menor que o das rotas de site, e 1 nova tentativa do SDK.
    private readonly client: Anthropic = new Anthropic({ timeout: 25_000, maxRetries: 1 }),
    private readonly model: string = process.env.ANTHROPIC_ASSISTANT_MODEL ||
      DEFAULT_ASSISTANT_MODEL,
  ) {}

  async reply(ctx: AssistantContext, history: Turn[]): Promise<AssistantModelOutput> {
    const messages = toModelTurns(history);
    if (messages.length === 0) throw new AssistantAiError("Nothing to answer.");
    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 700,
      // No Haiku o pensamento estendido fica desligado (como no caminho barato de anthropic.ts).
      ...(this.model.startsWith("claude-haiku") ? { thinking: { type: "disabled" as const } } : {}),
      output_config: { effort: "low", format: zodOutputFormat(AssistantModelOutput) },
      // O prompt do site é igual em toda conversa do site: fica em cache.
      system: [
        { type: "text", text: assistantSystemPrompt(ctx), cache_control: { type: "ephemeral" } },
      ],
      messages,
    });
    logAiUsage("assistant_chat", this.model, response, { turns: messages.length });
    if (response.stop_reason === "refusal")
      throw new AssistantAiError("Claude declined to answer.");
    if (response.stop_reason === "max_tokens")
      throw new AssistantAiError("The answer was cut off.");
    const parsed = AssistantModelOutput.safeParse(response.parsed_output);
    if (!parsed.success || !parsed.data.reply.trim()) {
      throw new AssistantAiError("Claude did not return a valid answer.");
    }
    return parsed.data;
  }
}

/**
 * Há IA para os visitantes? `false` na produção sem chave da Anthropic e no mock na produção
 * (resposta de teste para um cliente de verdade, não): aí o widget nem aparece.
 */
export function assistantAiReady(
  provider = process.env.AI_PROVIDER || "mock",
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (provider === "mock") return env.VERCEL_ENV !== "production";
  return Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN);
}

/** Atendente da configuração atual (mock no dev/testes), ou `null` sem IA (ver acima). */
export function getAssistantResponder(
  provider = process.env.AI_PROVIDER || "mock",
  env: Record<string, string | undefined> = process.env,
): AssistantResponder | null {
  if (!assistantAiReady(provider, env)) return null;
  return provider === "mock" ? new MockAssistantResponder() : new AnthropicAssistantResponder();
}
