"use client";

import type { FontId } from "@nosweat/schema";
import type { CSSProperties } from "react";

/** Nome, par de fontes e para quem combina, na ordem em que aparecem no editor. */
export const FONT_OPTIONS: { id: FontId; name: string; pair: string; hint: string }[] = [
  { id: "modern", name: "Modern", pair: "Plus Jakarta Sans + Inter", hint: "clean and versatile" },
  {
    id: "fresh",
    name: "Fresh",
    pair: "Fraunces + Hanken Grotesk",
    hint: "great for cleaning and home services",
  },
  {
    id: "bold",
    name: "Bold",
    pair: "Bricolage Grotesque + Inter",
    hint: "strong for contractors and trades",
  },
  {
    id: "technical",
    name: "Technical",
    pair: "Space Grotesk + IBM Plex Sans",
    hint: "fits auto, repair and tech",
  },
  {
    id: "classic",
    name: "Classic",
    pair: "Playfair Display + Lora",
    hint: "timeless for restaurants and established shops",
  },
  {
    id: "refined",
    name: "Refined",
    pair: "DM Serif Display + DM Sans",
    hint: "suits law, accounting and professional firms",
  },
  {
    id: "editorial",
    name: "Editorial",
    pair: "Instrument Serif + Instrument Sans",
    hint: "stylish for beauty and salons",
  },
  {
    id: "luxe",
    name: "Luxe",
    pair: "Cormorant Garamond + Manrope",
    hint: "elegant for spas, weddings and luxury",
  },
  {
    id: "friendly",
    name: "Friendly",
    pair: "Fredoka + Nunito",
    hint: "warm for kids, pets and cafes",
  },
  {
    id: "gallery",
    name: "Gallery",
    pair: "Funnel Display + Funnel Sans",
    hint: "made for portfolios and creatives",
  },
];

/** Mostra o nome na própria fonte de título; sem a variável CSS, usa a fonte do app. */
function headingFont(id: FontId): CSSProperties {
  return { fontFamily: `var(--ns-font-${id}-heading, inherit)` };
}

export function FontPicker({ value, onChange }: { value: FontId; onChange: (id: FontId) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-medium text-slate-600">Fonts</legend>
      {/* Rádios nativos: setas do teclado trocam a opção, Tab entra e sai do grupo. */}
      <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {FONT_OPTIONS.map((font) => (
          <label
            key={font.id}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-slate-300 has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand"
          >
            <input
              type="radio"
              name="theme-font"
              value={font.id}
              checked={value === font.id}
              onChange={() => onChange(font.id)}
              className="mt-1.5 size-4 shrink-0 accent-brand focus:outline-none"
            />
            <span className="min-w-0">
              <span className="block text-lg leading-tight text-ink" style={headingFont(font.id)}>
                {font.name}
              </span>
              <span className="block text-xs text-slate-500">
                {font.pair} · {font.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
