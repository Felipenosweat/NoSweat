import type { FontId, Theme } from "@nosweat/schema";

// Estilos prontos do botão "Shuffle style": um par de fontes + uma paleta, escritos direto
// nos campos que o tema já tem (theme.font, primary, secondary, background, text).
// O texto dos botões do site é calculado pelo template (readableTextOn), então qualquer
// cor principal continua legível. Os hex ficam aqui, nunca na frente do dono.

export type StylePreset = {
  id: string;
  name: string;
  /** Para quem o estilo combina, em poucas palavras. */
  hint: string;
  theme: Theme;
};

function preset(
  id: string,
  name: string,
  hint: string,
  font: FontId,
  [primary, secondary, background, text]: [string, string, string, string],
): StylePreset {
  return { id, name, hint, theme: { font, primary, secondary, background, text } };
}

export const STYLE_PRESETS: StylePreset[] = [
  preset("harbor", "Harbor", "Clear and dependable", "modern", [
    "#1D4ED8",
    "#F97316",
    "#FFFFFF",
    "#0F172A",
  ]),
  preset("workshop", "Workshop", "Strong, for trades", "bold", [
    "#9A3412",
    "#FACC15",
    "#FFFBF5",
    "#1C1917",
  ]),
  preset("evergreen", "Evergreen", "Fresh, for home care", "fresh", [
    "#166534",
    "#F59E0B",
    "#FFFFFF",
    "#14211A",
  ]),
  preset("slate", "Clean slate", "Precise, for repair and tech", "technical", [
    "#0F766E",
    "#38BDF8",
    "#F8FAFC",
    "#0B1220",
  ]),
  preset("counsel", "Counsel", "Calm, for professional firms", "refined", [
    "#1E3A5F",
    "#B08D57",
    "#FFFFFF",
    "#111827",
  ]),
  preset("bistro", "Bistro", "Warm, for food and cafes", "classic", [
    "#7F1D1D",
    "#D97706",
    "#FFFBF2",
    "#1F1A17",
  ]),
  preset("studio", "Studio", "Stylish, for salons", "editorial", [
    "#831843",
    "#F9A8D4",
    "#FFFFFF",
    "#1F1720",
  ]),
  preset("linen", "Linen", "Soft, for spas and events", "luxe", [
    "#57534E",
    "#C2A878",
    "#FAF7F2",
    "#1C1917",
  ]),
  preset("sunny", "Sunny", "Friendly, for kids and pets", "friendly", [
    "#2563EB",
    "#FBBF24",
    "#FFFFFF",
    "#172033",
  ]),
  preset("gallery", "Gallery", "Quiet, lets your work lead", "gallery", [
    "#18181B",
    "#E11D48",
    "#FFFFFF",
    "#111111",
  ]),
];

/** O estilo pronto que é exatamente o tema atual (ou `null` se o dono personalizou). */
export function matchingPreset(theme: Theme): StylePreset | null {
  return (
    STYLE_PRESETS.find(
      (p) =>
        p.theme.font === theme.font &&
        p.theme.primary.toUpperCase() === theme.primary.toUpperCase() &&
        p.theme.secondary.toUpperCase() === theme.secondary.toUpperCase() &&
        p.theme.background.toUpperCase() === theme.background.toUpperCase() &&
        p.theme.text.toUpperCase() === theme.text.toUpperCase(),
    ) ?? null
  );
}

/** Próximo estilo do ciclo do "Shuffle style" (começa do atual, se for um dos prontos). */
export function nextPreset(theme: Theme): StylePreset {
  const current = matchingPreset(theme);
  const index = current ? STYLE_PRESETS.indexOf(current) : -1;
  // Fora da lista: começa por um estilo com fonte diferente da atual, para a mudança aparecer.
  if (index < 0) {
    return STYLE_PRESETS.find((p) => p.theme.font !== theme.font) ?? STYLE_PRESETS[0]!;
  }
  return STYLE_PRESETS[(index + 1) % STYLE_PRESETS.length]!;
}
