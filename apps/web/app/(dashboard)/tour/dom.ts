// Acha na página o elemento de um passo do tour (`data-tour="..."`). Só roda no navegador.

import type { Rect } from "./placement";
import type { TourTarget } from "./steps";

/** Quanto esperar o alvo aparecer (troca de página, partes da Home que chegam em streaming). */
export const TARGET_WAIT_MS = 4000;

function selector(id: string): string {
  // Os ids são nossos (letras e hífen), mas CSS.escape evita surpresa.
  return `[data-tour="${CSS.escape(id)}"]`;
}

/** Visível de verdade: com caixa na tela (não `display: none`, nem dentro de algo escondido). */
export function isVisible(element: Element): boolean {
  if (!element.isConnected || element.getClientRects().length === 0) return false;
  const rect = element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== "hidden" && style.visibility !== "collapse";
}

export type FoundTarget = { element: HTMLElement; target: TourTarget };

/** O primeiro alvo visível, na ordem de preferência do passo. */
export function findTarget(targets: readonly TourTarget[]): FoundTarget | null {
  for (const target of targets) {
    for (const element of document.querySelectorAll<HTMLElement>(selector(target.id))) {
      if (isVisible(element)) return { element, target };
    }
  }
  return null;
}

/**
 * Espera um dos alvos aparecer (MutationObserver + uma conferida por quadro, para mudanças de
 * CSS que o observer não vê). `null` se passar do tempo ou se `signal` cancelar.
 */
export function waitForTarget(
  targets: readonly TourTarget[],
  signal: AbortSignal,
  timeoutMs = TARGET_WAIT_MS,
): Promise<FoundTarget | null> {
  return new Promise((resolve) => {
    const now = findTarget(targets);
    if (now || signal.aborted) {
      resolve(signal.aborted ? null : now);
      return;
    }
    let frame = 0;
    let checkQueued = false;
    let done = false;
    const finish = (found: FoundTarget | null) => {
      if (done) return;
      done = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve(found);
    };
    const check = () => {
      checkQueued = false;
      if (done) return;
      const found = findTarget(targets);
      if (found) finish(found);
    };
    const observer = new MutationObserver(() => {
      if (checkQueued) return;
      checkQueued = true;
      window.requestAnimationFrame(check);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-tour", "class", "style", "hidden", "open"],
    });
    const poll = () => {
      check();
      if (!done) frame = window.requestAnimationFrame(poll);
    };
    frame = window.requestAnimationFrame(poll);
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    const onAbort = () => finish(null);
    signal.addEventListener("abort", onAbort);
  });
}

export function rectOf(element: Element): Rect {
  const r = element.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}
