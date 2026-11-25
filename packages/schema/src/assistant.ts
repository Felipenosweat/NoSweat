import { z } from "zod";

// Atendente de IA no site publicado (plano Premium). O visitante conversa pelo botão do site; o
// DONO paga com os créditos dele (1 por conversa, +1 a cada 10 mensagens depois das 10 primeiras).
// Regras e limites: apps/web/server/assistant.

/** Mensagens do visitante por conversa (depois disso, a conversa acaba). */
export const ASSISTANT_MAX_MESSAGES = 30;
/** Tamanho máximo de cada mensagem do visitante. */
export const ASSISTANT_MAX_CHARS = 500;
/** Mensagens do visitante cobertas por 1 crédito. */
export const ASSISTANT_MESSAGES_PER_CREDIT = 10;

const ConversationId = z.uuid();

// ---------- POST /api/public/sites/[id]/assistant (público, o widget do site) ----------

export const AssistantChatRequest = z.object({
  /** Sem id = conversa nova (cada vez que o visitante abre o painel, uma conversa nova). */
  conversationId: ConversationId.optional(),
  message: z
    .string()
    .trim()
    .min(1, "Please type a message.")
    .max(ASSISTANT_MAX_CHARS, `Please keep it under ${ASSISTANT_MAX_CHARS} characters.`),
  /** Campo-isca contra robôs (deve vir vazio), como no formulário de contato. */
  company: z.string().max(500).optional(),
});
export type AssistantChatRequest = z.infer<typeof AssistantChatRequest>;

export const AssistantChatResponse = z.object({
  conversationId: ConversationId,
  reply: z.string(),
  /** Mostrar o botão "Book online" (só quando o agendamento do site está ligado). */
  offerBooking: z.boolean(),
  /** O pedido de contato do visitante foi salvo (vira cliente no CRM do dono). */
  leadSaved: z.boolean(),
  /** A conversa acabou (limite de mensagens ou atendente indisponível): o widget trava o campo. */
  ended: z.boolean(),
  /** Mensagens que o visitante ainda pode mandar nesta conversa. */
  remainingMessages: z.number().int().nonnegative(),
});
export type AssistantChatResponse = z.infer<typeof AssistantChatResponse>;

// ---------- GET/PUT /api/sites/[id]/assistant (dono) ----------

export const AssistantMessageRole = z.enum(["visitor", "assistant"]);
export type AssistantMessageRole = z.infer<typeof AssistantMessageRole>;

export const AssistantMessage = z.object({
  role: AssistantMessageRole,
  text: z.string(),
  createdAt: z.string(),
});
export type AssistantMessage = z.infer<typeof AssistantMessage>;

export const AssistantConversationSummary = z.object({
  id: ConversationId,
  createdAt: z.string(),
  lastMessageAt: z.string(),
  visitorMessages: z.number().int().nonnegative(),
  creditsCharged: z.number().int().nonnegative(),
  /** Primeira mensagem do visitante (para a lista). */
  preview: z.string().nullable(),
  /** O atendente salvou um pedido de contato nesta conversa. */
  leadCaptured: z.boolean(),
});
export type AssistantConversationSummary = z.infer<typeof AssistantConversationSummary>;

export const AssistantSettingsResponse = z.object({
  enabled: z.boolean(),
  /** O plano do dono inclui o atendente (Premium). */
  available: z.boolean(),
  conversations: z.array(AssistantConversationSummary),
});
export type AssistantSettingsResponse = z.infer<typeof AssistantSettingsResponse>;

export const AssistantSettingsRequest = z.object({ enabled: z.boolean() });
export type AssistantSettingsRequest = z.infer<typeof AssistantSettingsRequest>;

// ---------- GET /api/sites/[id]/assistant/conversations/[conversationId] (dono) ----------

export const AssistantTranscriptResponse = z.object({
  conversation: AssistantConversationSummary,
  messages: z.array(AssistantMessage),
});
export type AssistantTranscriptResponse = z.infer<typeof AssistantTranscriptResponse>;
