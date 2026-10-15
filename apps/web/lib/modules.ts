// Módulos do painel (o "hub" do cliente). A barra lateral, as abas do celular e os quadros
// "Your office" da página inicial leem daqui.
// `comingSoon` = ainda não existe: aparece como "em breve", sem link ativo.

export type HubModule = {
  key: "website" | "social" | "clients" | "reviews";
  label: string;
  href: string;
  comingSoon?: boolean;
  /** Uma frase sobre o que o módulo vai fazer (só nos módulos "em breve"). */
  soonText?: string;
};

export const MODULES: readonly HubModule[] = [
  { key: "website", label: "Website", href: "/dashboard#sites" },
  { key: "clients", label: "Clients", href: "/clients" },
  { key: "social", label: "Social", href: "/social" },
  {
    key: "reviews",
    label: "Google reviews",
    href: "/reviews",
    comingSoon: true,
    soonText: "Read and answer your Google reviews from here.",
  },
];

/** Módulos que já funcionam (os que aparecem como link). */
export const LIVE_MODULES: readonly HubModule[] = MODULES.filter((hub) => !hub.comingSoon);

/** Módulos que ainda não existem (grupo "Coming soon"). */
export const SOON_MODULES: readonly HubModule[] = MODULES.filter((hub) => hub.comingSoon);
