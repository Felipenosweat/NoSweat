import { TemplateId } from "@nosweat/schema";
import { z } from "zod";

// Contrato do estúdio de modelos (/admin/models e /api/admin/models/*). Sem nada do servidor:
// serve para as rotas, as Server Actions e os componentes de cliente.

/** Slug de um modelo: kebab-case, até 64 caracteres (mesma regra da migration 0020). */
export const MODEL_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export const ModelSlug = z
  .string()
  .regex(MODEL_SLUG, "Use lowercase letters, numbers and dashes (up to 64 characters).");

export const ModelStatus = z.enum(["draft", "approved"]);
export type ModelStatus = z.infer<typeof ModelStatus>;

/** Ordem e nomes das categorias na tela. */
export const CATEGORY_LABELS: Record<TemplateId, string> = {
  "home-services": "Home services",
  beauty: "Beauty",
  restaurant: "Restaurants",
  professional: "Professional services",
  portfolio: "Portfolio",
};

/** Palavras do ramo: minúsculas, sem repetir; até 30, cada uma com 2 a 40 caracteres. */
export const ModelKeywords = z
  .array(
    z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "Each keyword needs at least 2 characters.")
      .max(40, "Keep each keyword under 40 characters."),
  )
  .max(30, "Use up to 30 keywords.")
  .transform((words) => [...new Set(words)]);

/** "plumb, drain, water heater" → ["plumb", "drain", "water heater"]. */
export function parseKeywordList(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export const SetModelStatusRequest = z.object({ status: ModelStatus });
export type SetModelStatusRequest = z.infer<typeof SetModelStatusRequest>;

export const CreateModelRequest = z.object({
  category: TemplateId,
  fromSlug: ModelSlug,
  /** Slug do modelo novo; sem ele, "<fromSlug>-copy" (ou -copy-2, -copy-3...). */
  slug: ModelSlug.optional(),
});
export type CreateModelRequest = z.infer<typeof CreateModelRequest>;

export const UpdateModelKeywordsRequest = z.object({ keywords: ModelKeywords });

/** Um modelo como o estúdio mostra (sem o spec). */
export const ModelSummary = z.object({
  slug: z.string(),
  name: z.string(),
  category: TemplateId,
  status: ModelStatus,
  /** "code": existe em packages/fixtures; "studio": criado no estúdio. */
  source: z.enum(["code", "studio"]),
  /** Tem versão salva no estúdio diferente da do código (sempre true em modelos do estúdio). */
  edited: z.boolean(),
  /** A geração usa este modelo hoje (código: sempre; estúdio: só aprovado). */
  inUse: z.boolean(),
  /** A geração usa a versão do estúdio (aprovada) em vez da do código. */
  usesStudioVersion: z.boolean(),
  keywords: z.array(z.string()),
  updatedAt: z.string().nullable(),
});
export type ModelSummary = z.infer<typeof ModelSummary>;

export const ModelResponse = z.object({ model: ModelSummary });
export const ModelListResponse = z.object({ models: z.array(ModelSummary) });
