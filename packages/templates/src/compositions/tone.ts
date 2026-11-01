import type { Composition, Theme } from "@nosweat/schema";
import { luminance } from "../theme";

// Tom (claro ou escuro) do que fica por baixo do menu de vidro. O renderer marca cada seção ou
// faixa com `data-tone`; Motion.tsx olha qual está sob o menu e troca o `data-tone` do menu, e o
// CSS (styles.css, "Tom adaptativo") escolhe fumaça escura com letra clara ou vidro claro com
// letra escura. Aqui ficam só as regras puras, para testar sem navegador.

export type Tone = "light" | "dark";

/** Mesmo corte do `data-scheme` (SiteRenderer): acima disso a cor conta como clara. */
export function toneOf(hex: string): Tone {
  return luminance(hex) > 0.4 ? "light" : "dark";
}

export type Tones = {
  /** Páginas e seções no fundo do tema (`bg-ns-background`). */
  page: Tone;
  /** Faixas na cor do texto do tema (`bg-ns-text`): serviços, agendar, rodapé, topo em pôster. */
  band: Tone;
};

export function tonesOf(theme: Pick<Theme, "background" | "text">): Tones {
  return { page: toneOf(theme.background), band: toneOf(theme.text) };
}

/**
 * Tom do topo da página, igual à escolha de formato de SignatureHero: foto de ponta a ponta
 * (imersiva e de serviço, com foto) e pôster tipográfico ficam sobre a cor do texto do tema
 * (véu da foto ou fundo); editorial e modular com foto ficam sobre o fundo da página.
 */
export function heroTone(composition: Composition, hasImage: boolean, tones: Tones): Tone {
  if (hasImage && (composition === "editorial" || composition === "modular")) return tones.page;
  return tones.band;
}
