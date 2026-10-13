"use client";

import type { CSSProperties } from "react";
import { STYLE_OPTIONS, type StyleId, type StyleOption } from "./brief";

/** Família da fonte a partir da variável do next/font (definida em app/fonts.ts). */
function font(variable: string, fallback: string): CSSProperties {
  return { fontFamily: `var(${variable}), ${fallback}` };
}

function CheckBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-2 right-2 hidden size-6 place-items-center rounded-full bg-brand text-white shadow-sm group-has-checked:grid"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5"
      >
        <path d="m3.5 8.5 3 3 6-7" />
      </svg>
    </span>
  );
}

function Dots({ colors }: { colors: readonly string[] }) {
  return (
    <span className="flex gap-1.5">
      {colors.map((color) => (
        <span
          key={color}
          className="size-3.5 rounded-full ring-1 ring-black/10 ring-inset"
          // Amostra das cores do site do cliente (conteúdo, não cor da interface).
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

/** Amostra tipográfica: o nome da fonte do título escrito nela mesma, o tom no texto e as cores. */
function Swatch({ option }: { option: StyleOption }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-lg p-3 ring-1 ring-black/5 ring-inset sm:p-4"
      style={{ backgroundColor: option.swatch.background, color: option.swatch.text }}
    >
      <span className="block">
        <span
          className="block text-[1.375rem] leading-[1.05] text-balance sm:text-[1.5rem]"
          style={font(option.headingFont.variable, "serif")}
        >
          {option.headingFont.name}
        </span>
        <span
          className="mt-1.5 line-clamp-2 block text-[12px] leading-snug opacity-75"
          style={font(option.bodyFont.variable, "sans-serif")}
        >
          {option.note}
        </span>
      </span>
      <Dots colors={option.swatch.dots} />
    </span>
  );
}

/** "Let us pick": as cinco fontes lado a lado, em tons neutros. */
function AutoSwatch() {
  return (
    <span
      aria-hidden="true"
      className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-lg bg-surface p-3 text-ink ring-1 ring-slate-200 ring-inset sm:p-4"
    >
      <span className="flex items-baseline gap-x-2 overflow-hidden text-[1.375rem] leading-none whitespace-nowrap sm:text-[1.5rem]">
        {STYLE_OPTIONS.slice(0, 3).map((option) => (
          <span key={option.id} style={font(option.headingFont.variable, "serif")}>
            Aa
          </span>
        ))}
      </span>
      <span className="text-[12px] leading-snug text-slate-600">Matched to your line of work.</span>
    </span>
  );
}

const cardClass =
  "group relative flex w-[44vw] max-w-[13rem] shrink-0 snap-start cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-1.5 transition-[border-color,box-shadow] duration-150 hover:border-slate-400 has-checked:border-brand has-checked:ring-1 has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand sm:w-auto sm:max-w-none";

type StylePickerProps = {
  value: StyleId;
  onChange: (value: StyleId) => void;
};

export function StylePicker({ value, onChange }: StylePickerProps) {
  return (
    <fieldset aria-describedby="style-help" className="min-w-0">
      <legend className="text-[13px] font-medium text-ink">
        Pick a style <span className="font-normal text-slate-500">(optional)</span>
      </legend>
      <p id="style-help" className="mt-1 text-[13px] text-slate-500">
        Sets the fonts, colors and tone of voice. You can change it later in the editor.
      </p>
      <div className="-mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pt-0.5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0.5">
        <label className={cardClass}>
          <input
            type="radio"
            name="style"
            value="auto"
            checked={value === "auto"}
            onChange={() => onChange("auto")}
            className="sr-only"
          />
          <AutoSwatch />
          <CheckBadge />
          <span className="px-1.5 pt-2.5 pb-1.5">
            <span className="block font-display text-[15px] font-semibold text-ink">
              Let us pick
            </span>
            <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">
              Based on what you do
            </span>
          </span>
        </label>

        {STYLE_OPTIONS.map((option) => (
          <label key={option.id} className={cardClass}>
            <input
              type="radio"
              name="style"
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            <Swatch option={option} />
            <CheckBadge />
            <span className="px-1.5 pt-2.5 pb-1.5">
              <span className="block font-display text-[15px] font-semibold text-ink">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">
                {option.headingFont.name} + {option.bodyFont.name}
                <span className="sr-only">. {option.note}</span>
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
