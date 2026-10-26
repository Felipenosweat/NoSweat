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

/** Desenho de cada passo (os desenhos ficam em components/onboarding/TourArt.tsx). */
export type TourArt = "welcome" | "website" | "clients" | "money" | "social" | "help";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  art: TourArt;
};

// Textos curtos e diretos, para o dono de uma pequena empresa nos EUA. Nada de promessa que o
// produto não cumpre (ex.: pagamento online ainda não existe; a IA nunca publica sozinha).
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to No Sweat",
    body: "Your website, your office and your Instagram, all in one place. Here’s a one-minute look around.",
    art: "welcome",
  },
  {
    id: "website",
    title: "Your website",
    body: "Change any text or photo, then tap Publish to put it online. You can connect your own domain, like yourbusiness.com, whenever you’re ready.",
    art: "website",
  },
  {
    id: "clients",
    title: "Clients come to you",
    body: "When someone fills out the form on your website, they show up in Clients on their own. Call or text them in one tap.",
    art: "clients",
  },
  {
    id: "money",
    title: "Book it, quote it, get paid",
    body: "Book the job in Schedule. Send an estimate your customer approves from their phone. Then send the invoice and mark it paid when the money comes in.",
    art: "money",
  },
  {
    id: "social",
    title: "Instagram and Google reviews",
    body: "AI drafts a month of Instagram posts, and nothing goes out until you approve it. Add your Google review link and your site gets a review button.",
    art: "social",
  },
  {
    id: "help",
    title: "We’re here if you need us",
    body: "Tap Help to message our team. You can replay this tour or read the full guide anytime.",
    art: "help",
  },
];

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

/** Próximo índice do passo, preso entre o primeiro e o último. */
export function clampStep(index: number, total = TOUR_STEPS.length): number {
  if (!Number.isFinite(index) || total <= 0) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), total - 1);
}

/** Atalhos do último passo. Sem site ainda, "Create my website" leva ao /create. */
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
