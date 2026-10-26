// Onde o tour guiado parou, guardado no sessionStorage da aba: se a página recarregar (ou a
// moldura do painel montar de novo numa troca de tela), o tour continua do mesmo passo. Só funções
// puras; quem lê e grava o sessionStorage é o WelcomeTour. Terminar ou pular apaga isto (e a marca
// de "visto" continua sendo a de lib/onboarding.ts, igual a antes).

import { z } from "zod";

export const TOUR_PROGRESS_KEY = "ns_tour_progress";

/** Progresso mais velho que isto é esquecido (a pessoa largou o tour no meio). */
export const TOUR_PROGRESS_TTL_MS = 30 * 60 * 1000;

const TourProgressSchema = z.object({
  v: z.literal(1),
  /** Conta que começou (outra conta na mesma aba não herda o tour). */
  accountKey: z.string().min(1),
  /** "spotlight" = apontando a tela; "finish" = folha final. */
  phase: z.enum(["spotlight", "finish"]),
  index: z.number().int().min(0),
  viewport: z.enum(["desktop", "mobile"]),
  savedAt: z.number(),
});
export type TourProgress = z.infer<typeof TourProgressSchema>;

export function serializeProgress(progress: TourProgress): string {
  return JSON.stringify(progress);
}

/** Lê o que estava guardado (qualquer coisa estranha = nada). */
export function parseProgress(raw: string | null): TourProgress | null {
  if (!raw) return null;
  try {
    const parsed = TourProgressSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Continuar o tour guardado? Só se for desta conta, recente e com um passo que existe. Não olha a
 * marca de "visto": quem pediu "Take the tour" de novo também continua depois de trocar de tela.
 */
export function shouldContinue({
  progress,
  accountKey,
  now,
  totalSteps,
}: {
  progress: TourProgress | null;
  accountKey: string;
  now: number;
  /** Quantos passos tem a lista da tela em que o tour estava (`progress.viewport`). */
  totalSteps: number;
}): boolean {
  if (!progress) return false;
  if (progress.accountKey !== accountKey) return false;
  const age = now - progress.savedAt;
  if (age < 0 || age > TOUR_PROGRESS_TTL_MS) return false;
  if (progress.phase === "spotlight" && progress.index >= totalSteps) return false;
  return true;
}
