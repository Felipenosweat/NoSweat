// Módulos do painel (o "hub" do cliente). A navegação e, no futuro, a barra lateral leem daqui.
// `comingSoon` = ainda não existe: aparece como "em breve", sem link ativo.

export type HubModule = {
  key: "website" | "social" | "clients" | "reviews";
  label: string;
  href: string;
  /** Texto do link no topo do painel, quando diferente do nome do módulo. */
  navLabel?: string;
  comingSoon?: boolean;
};

export const MODULES: readonly HubModule[] = [
  { key: "website", label: "Website", href: "/dashboard", navLabel: "My sites" },
  { key: "social", label: "Social", href: "/social" },
  { key: "clients", label: "Clients", href: "/clients", comingSoon: true },
  { key: "reviews", label: "Google reviews", href: "/reviews", comingSoon: true },
];

/** Módulos que já funcionam (os que aparecem como link). */
export const LIVE_MODULES: readonly HubModule[] = MODULES.filter((hub) => !hub.comingSoon);
