// Tour de boas-vindas do painel: os passos, quando mostrar e onde guardar que já foi visto.
// Só dados e funções puras (sem React, sem servidor): usado pelo AccountShell (servidor), pelo
// componente do tour (cliente) e pelos testes.

import { z } from "zod";

/** Chave no `user_metadata` do Supabase com a data (ISO) em que a conta terminou/pulou o tour. */
export const TOUR_METADATA_KEY = "onboarding_tour_done_at";

/** Evento da janela que abre o tour de novo ("Take the tour" no menu e no /guide). */
export const TOUR_OPEN_EVENT = "nosweat:open-tour";

// Contrato de POST /api/me/onboarding (só o painel usa; por isso fica aqui e não em
// @nosweat/schema).
export const OnboardingRequest = z.object({ tour: z.literal("done") });
export type OnboardingRequest = z.infer<typeof OnboardingRequest>;

export const OnboardingResponse = z.object({
  /** Quando a conta terminou (ou pulou) o tour de boas-vindas. */
  doneAt: z.string(),
  /** "account" = gravado no user_metadata; "local" = dev sem Supabase (só o navegador guarda). */
  stored: z.enum(["account", "local"]),
});
export type OnboardingResponse = z.infer<typeof OnboardingResponse>;

/** Única página em que o tour abre sozinho. */
export const TOUR_AUTO_PATH = "/dashboard";

/** Chave do localStorage (por conta: duas contas no mesmo navegador veem o tour uma vez cada). */
export function tourStorageKey(accountKey: string): string {
  return `ns_tour_done:${accountKey}`;
}

/** Desenho das folhas do tour (os desenhos ficam em app/(dashboard)/TourArt.tsx). */
export type TourArt = "welcome" | "help";

/** Folha de texto do tour (a primeira e a última; o meio aponta a tela de verdade). */
export type TourSheet = {
  id: string;
  title: string;
  body: string;
  art: TourArt;
};

// Textos curtos e diretos, para o dono de uma pequena empresa nos EUA. Nada de promessa que o
// produto não cumpre (ex.: pagamento online ainda não existe; a IA nunca publica sozinha).
// Os passos que apontam cada botão ficam em app/(dashboard)/tour/steps.ts.

/** Primeira folha: "Show me around" começa o passeio pela tela; "Skip" encerra. */
export const TOUR_WELCOME: TourSheet = {
  id: "welcome",
  title: "Welcome to No Sweat",
  body: "Your website, your office and your Instagram, all in one place. Let us show you where everything is. It takes about a minute.",
  art: "welcome",
};

/** Última folha (de volta à Home), com os atalhos para começar. */
export const TOUR_FINISH: TourSheet = {
  id: "finish",
  title: "You’re all set",
  body: "Tap Help anytime to message our team. You can replay this tour or read the full guide whenever you like.",
  art: "help",
};

/** Como o tour se comporta para quem está vendo o painel (calculado no servidor). */
export type TourConfig = {
  /** Abre sozinho no /dashboard (uma vez). */
  autoShow: boolean;
  /**
   * Onde gravar que terminou: "account" = user_metadata (POST /api/me/onboarding) + localStorage;
   * "local" = só localStorage (dev sem Supabase); "none" = não grava (modo "ver como").
   */
  persist: "account" | "local" | "none";
  /** Identifica a conta na chave do localStorage. */
  accountKey: string;
};

/** Data em que o tour foi visto, lida do `user_metadata` (qualquer formato vindo do token). */
export function tourDoneAt(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw: unknown = (metadata as Record<string, unknown>)[TOUR_METADATA_KEY];
  return typeof raw === "string" && raw.trim() ? raw : null;
}

/**
 * Configuração do tour para o painel. Nunca abre sozinho no modo "ver como" (o admin olhando a
 * conta de outra pessoa) e nem grava nada nele. Visitantes não chegam aqui (não têm o painel).
 */
export function tourConfig({
  accountId,
  authEnabled,
  viewingAs,
  metadata,
}: {
  accountId: string;
  /** Login ligado (Supabase configurado). Sem ele: DEV_USER, só localStorage. */
  authEnabled: boolean;
  /** Modo "ver como" ligado. */
  viewingAs: boolean;
  /** `user_metadata` da sessão (claims do token). */
  metadata: unknown;
}): TourConfig {
  if (viewingAs) return { autoShow: false, persist: "none", accountKey: accountId };
  if (!authEnabled) return { autoShow: true, persist: "local", accountKey: accountId };
  return { autoShow: tourDoneAt(metadata) === null, persist: "account", accountKey: accountId };
}

/**
 * Abrir sozinho agora? Só no /dashboard, uma vez por carregamento da página, e nunca se o
 * navegador já tem a marca (a conta pode ter terminado e o token ainda não ter a data nova).
 */
export function shouldAutoOpen({
  config,
  pathname,
  locallyDone,
  alreadyTried,
}: {
  config: TourConfig;
  pathname: string;
  locallyDone: boolean;
  alreadyTried: boolean;
}): boolean {
  if (!config.autoShow || alreadyTried || locallyDone) return false;
  return pathname === TOUR_AUTO_PATH;
}

/** Índice do passo preso entre o primeiro e o último (`total` = quantos passos existem). */
export function clampStep(index: number, total: number): number {
  if (!Number.isFinite(index) || total <= 0) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), total - 1);
}

/** Atalhos da folha final. Sem site ainda, "Create my website" leva ao /create. */
export function tourShortcuts(
  latestSiteId: string | null,
): Array<{ key: string; label: string; href: string }> {
  return [
    latestSiteId
      ? { key: "website", label: "Finish my website", href: `/sites/${latestSiteId}` }
      : { key: "website", label: "Create my website", href: "/create" },
    { key: "client", label: "Add my first client", href: "/clients/new" },
    { key: "settings", label: "Set up business settings", href: "/office/settings" },
  ];
}
