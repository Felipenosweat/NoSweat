import { CreditsResponse } from "@nosweat/schema";
import type { CreditsEventDetail } from "./credits-ui";

// Barramento minúsculo do navegador: quando uma ação da IA termina, quem a executou avisa e o
// "pill" de créditos (app/(dashboard)/CreditsPill.tsx) atualiza sem recarregar a página.

export const CREDITS_EVENT = "ns:credits";

/** Avisa o saldo novo (`left`) ou o que acabou de ser gasto (`spent`). Só no navegador. */
export function announceCredits(detail: CreditsEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CreditsEventDetail>(CREDITS_EVENT, { detail }));
}

/** Lê o `detail` de um evento `ns:credits` (valores estranhos viram `null`). */
export function readCreditsEvent(event: Event): CreditsEventDetail | null {
  if (!(event instanceof CustomEvent)) return null;
  const detail: unknown = event.detail;
  if (typeof detail !== "object" || detail === null) return null;
  const { left, spent } = detail as { left?: unknown; spent?: unknown };
  const out: CreditsEventDetail = {};
  if (typeof left === "number") out.left = left;
  if (typeof spent === "number") out.spent = spent;
  return out;
}

/**
 * Busca o saldo de verdade (GET /api/me/credits) e avisa. Nunca lança erro: se falhar, o valor
 * que o pill já mostra (descontado do custo) continua. Visitante e admin: nada a avisar.
 */
export async function refreshCredits(): Promise<void> {
  try {
    const res = await fetch("/api/me/credits", { cache: "no-store" });
    if (!res.ok) return;
    const parsed = CreditsResponse.safeParse(await res.json().catch(() => null));
    const credits = parsed.success ? parsed.data.credits : null;
    if (credits && !credits.unlimited) announceCredits({ left: credits.total });
  } catch {
    // Sem rede: fica com o valor estimado.
  }
}

/** Ação da IA concluída: desconta o custo na hora e confere com o servidor logo depois. */
export function announceCreditsSpent(cost: number): void {
  announceCredits({ spent: cost });
  void refreshCredits();
}
