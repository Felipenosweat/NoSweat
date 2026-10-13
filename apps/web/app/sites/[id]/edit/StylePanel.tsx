"use client";

import { TemplateId, type SiteSpec, type Theme } from "@nosweat/schema";
import type { ReactNode } from "react";
import { FONT_OPTIONS, FontPicker } from "./FontPicker";
import { ChevronDownIcon, ShuffleIcon, UndoIcon } from "./icons";
import { matchingPreset, nextPreset, STYLE_PRESETS } from "./presets";
import { Field } from "./fields";
import { focusRing, inputClass, labelClass, panelTitle, secondaryButton, textButton } from "./ui";

type Update = (change: (draft: SiteSpec) => void) => void;

const COLORS: { key: "primary" | "secondary" | "background" | "text"; label: string }[] = [
  { key: "primary", label: "Main color" },
  { key: "secondary", label: "Accent color" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
];

const TEMPLATE_LABELS: Record<TemplateId, string> = {
  "home-services": "Home services",
  beauty: "Beauty",
  restaurant: "Restaurant",
  professional: "Professional",
  portfolio: "Portfolio",
};

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-b border-slate-200 px-5 py-6 last:border-b-0">
      <div>
        <h2 className={panelTitle}>{title}</h2>
        {note && <p className="mt-1 text-[13px] leading-snug text-slate-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** Amostra das 4 cores de um tema (só visual; o nome do estilo vem ao lado). */
function Swatches({ theme }: { theme: Theme }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 -space-x-1">
      {[theme.primary, theme.secondary, theme.text, theme.background].map((color, index) => (
        <span
          key={index}
          className="size-5 rounded-full ring-2 ring-white outline outline-1 -outline-offset-1 outline-black/10"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

/**
 * Aba "Style": "Shuffle style" com estilos prontos (fonte + paleta), modelo, fontes e, por
 * último, as cores em hex dentro de "Custom colors".
 */
export function StylePanel({
  spec,
  update,
  themeBeforeShuffle,
  onShuffle,
  onUndoShuffle,
}: {
  spec: SiteSpec;
  update: Update;
  themeBeforeShuffle: Theme | null;
  onShuffle: (theme: Theme) => void;
  onUndoShuffle: () => void;
}) {
  const current = matchingPreset(spec.theme);
  const fontPair = FONT_OPTIONS.find((f) => f.id === spec.theme.font)?.pair;

  return (
    <div>
      <Group
        title="Style"
        note="Try a ready-made look: a font pairing and colors that work together."
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => onShuffle(nextPreset(spec.theme).theme)}
            className={secondaryButton}
          >
            <ShuffleIcon className="size-4" />
            Shuffle style
          </button>
          {themeBeforeShuffle && (
            <button
              type="button"
              onClick={onUndoShuffle}
              className={`${textButton} px-1 text-slate-700`}
            >
              <UndoIcon className="size-4" />
              Undo
            </button>
          )}
        </div>
        <p aria-live="polite" className="text-[13px] text-slate-600">
          {current ? (
            <>
              <span className="font-medium text-ink">{current.name}</span> · {fontPair}
            </>
          ) : (
            <>Your own colors · {fontPair}</>
          )}
        </p>

        <fieldset>
          <legend className={labelClass}>Ready-made styles</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map((preset) => (
              <label
                key={preset.id}
                className="flex min-h-11 cursor-pointer flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 transition-colors duration-150 hover:border-slate-300 has-[:checked]:border-brand has-[:checked]:ring-1 has-[:checked]:ring-brand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand motion-reduce:transition-none"
              >
                <input
                  type="radio"
                  name="style-preset"
                  value={preset.id}
                  checked={current?.id === preset.id}
                  onChange={() => onShuffle(preset.theme)}
                  className="sr-only"
                />
                <Swatches theme={preset.theme} />
                <span className="w-full min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {preset.name}
                  </span>
                  <span className="block truncate text-[12px] text-slate-500">{preset.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Group>

      <Group title="Layout">
        <Field label="Template">
          <select
            className={inputClass}
            value={spec.template}
            onChange={(e) => update((d) => void (d.template = TemplateId.parse(e.target.value)))}
          >
            {TemplateId.options.map((template) => (
              <option key={template} value={template}>
                {TEMPLATE_LABELS[template]}
              </option>
            ))}
          </select>
        </Field>
      </Group>

      <Group title="Fonts">
        <FontPicker
          value={spec.theme.font}
          onChange={(font) => update((d) => void (d.theme.font = font))}
        />
      </Group>

      <section className="px-5 py-6">
        <details className="group">
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            <span>
              <span className={`block ${panelTitle}`}>Custom colors</span>
              <span className="block text-[13px] text-slate-500">
                Fine-tune each color by hand.
              </span>
            </span>
            <ChevronDownIcon className="size-4 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {COLORS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <span className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-2">
                  <input
                    type="color"
                    value={spec.theme[key]}
                    onChange={(e) =>
                      update((d) => void (d.theme[key] = e.target.value.toUpperCase()))
                    }
                    className={`h-8 w-10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0 ${focusRing}`}
                  />
                  <span className="font-mono text-[13px] text-slate-600">{spec.theme[key]}</span>
                </span>
              </Field>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}
