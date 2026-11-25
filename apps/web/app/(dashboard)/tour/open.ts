import { TOUR_OPEN_EVENT } from "@/lib/onboarding";

// "Take the tour" de qualquer lugar do painel. O tour (WelcomeTour) é carregado sob demanda, depois
// da página: se o clique vier antes de ele estar pronto, o pedido fica guardado aqui e o tour abre
// assim que montar. Sem React e sem o código do tour: o botão não puxa o tour para a página.

let pending = false;

/** Abre o tour de boas-vindas de novo, sempre do começo. */
export function openWelcomeTour(): void {
  pending = true;
  window.dispatchEvent(new Event(TOUR_OPEN_EVENT));
}

/** Havia um pedido de abrir ainda não atendido? (e o marca como atendido) */
export function takePendingOpen(): boolean {
  const was = pending;
  pending = false;
  return was;
}
