"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  LAYOUT_OPTIONS,
  STYLE_OPTIONS,
  type LayoutChoice,
  type StyleId,
  type StyleOption,
} from "./brief";
import { PHOTO_PLAN_NOTE, photoPlan } from "./photos";

// Passos 2 (layout) e 3 (cores) do assistente do /create: cartões de rádio com miniatura.
// "No Sweat chooses" é sempre o primeiro e o padrão.

const cardClass =
  "group relative flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-1.5 transition-[border-color,box-shadow] duration-150 hover:border-slate-300 has-checked:border-brand has-checked:ring-1 has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand motion-reduce:transition-none";

const thumbClass =
  "relative block aspect-[16/10] overflow-hidden rounded-lg ring-1 ring-black/5 ring-inset";

/** Família da fonte a partir da variável do next/font (definida em app/fonts.ts). */
function font(variable: string, fallback: string): CSSProperties {
  return { fontFamily: `var(${variable}), ${fallback}` };
}

function CheckBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-2.5 right-2.5 z-10 hidden size-6 place-items-center rounded-full bg-brand text-white shadow-sm group-has-checked:grid"
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

export function SparkIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10 2.5c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5 3.6-.5 5-1.9 5.5-5.5Z" />
      <path d="M15.5 13c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z" />
    </svg>
  );
}

type OptionCardProps = {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  thumb: ReactNode;
  label: string;
  note: string;
  /** Linha extra embaixo da nota (ex.: quantas fotos o layout pede). */
  extra?: string;
};

function OptionCard({
  name,
  value,
  checked,
  onSelect,
  thumb,
  label,
  note,
  extra,
}: OptionCardProps) {
  return (
    <label className={cardClass}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {thumb}
      <CheckBadge />
      <span className="px-1.5 pt-2.5 pb-1.5">
        <span className="block font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {label}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-(--glass-fg-muted)">
          {note}
        </span>
        {extra && (
          <span className="mt-1.5 block text-[12px] font-semibold text-slate-600">{extra}</span>
        )}
      </span>
    </label>
  );
}

/** Miniatura do "No Sweat chooses": fundo neutro com a faísca da marca. */
function AutoThumb() {
  return (
    <span aria-hidden="true" className={`${thumbClass} grid place-items-center bg-surface`}>
      <SparkIcon className="size-6 text-brand" />
    </span>
  );
}

export function LayoutPicker({
  value,
  onChange,
  labelledBy,
}: {
  value: LayoutChoice;
  onChange: (value: LayoutChoice) => void;
  labelledBy: string;
}) {
  return (
    <>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <OptionCard
          name="layout"
          value="auto"
          checked={value === "auto"}
          onSelect={() => onChange("auto")}
          thumb={<AutoThumb />}
          label="No Sweat chooses"
          note="Picked for your kind of business."
          extra={photoPlan("auto").total}
        />
        {LAYOUT_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            name="layout"
            value={option.id}
            checked={value === option.id}
            onSelect={() => onChange(option.id)}
            thumb={
              <span aria-hidden="true" className={`${thumbClass} bg-slate-100`}>
                <Image
                  src={option.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 180px, 45vw"
                  className="object-cover object-top"
                />
              </span>
            }
            label={option.label}
            note={option.note}
            extra={photoPlan(option.id).total}
          />
        ))}
      </div>
      <PhotoPlanBox layout={value} />
    </>
  );
}

/** Quantas fotos mandar para o layout escolhido (muda junto com a escolha). */
export function PhotoPlanBox({ layout }: { layout: LayoutChoice }) {
  const plan = photoPlan(layout);
  return (
    <section
      aria-labelledby="photo-plan-title"
      aria-live="polite"
      className="mt-5 rounded-xl border border-slate-200 bg-surface p-4 sm:p-5"
    >
      <h3 id="photo-plan-title" className="font-display text-[15px] font-semibold text-ink">
        Photos to send: {plan.total}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {plan.needs.map((need) => (
          <li key={need.label} className="flex gap-3 text-[14px] leading-snug">
            <span className="w-14 shrink-0 font-semibold text-ink tabular-nums">{need.count}</span>
            <span className="text-slate-600">
              <span className="font-semibold text-ink">{need.label}.</span> {need.tip}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] leading-snug text-(--glass-fg-muted)">{PHOTO_PLAN_NOTE}</p>
    </section>
  );
}

/** Amostra de cores do site do cliente (conteúdo, não cor da interface) com a fonte do título. */
function PaletteThumb({ option }: { option: StyleOption }) {
  return (
    <span
      aria-hidden="true"
      className={`${thumbClass} flex flex-col justify-between p-3`}
      style={{ backgroundColor: option.swatch.background, color: option.swatch.text }}
    >
      <span
        className="text-[1.375rem] leading-none"
        style={font(option.headingFont.variable, "serif")}
      >
        Aa
      </span>
      <span className="flex gap-1.5">
        {option.swatch.dots.map((color) => (
          <span
            key={color}
            className="size-5 rounded-full ring-1 ring-black/10 ring-inset"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
    </span>
  );
}

export function ColorPicker({
  value,
  onChange,
  labelledBy,
}: {
  value: StyleId;
  onChange: (value: StyleId) => void;
  labelledBy: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <OptionCard
        name="colors"
        value="auto"
        checked={value === "auto"}
        onSelect={() => onChange("auto")}
        thumb={<AutoThumb />}
        label="No Sweat chooses"
        note="Matched to your line of work."
      />
      {STYLE_OPTIONS.map((option) => (
        <OptionCard
          key={option.id}
          name="colors"
          value={option.id}
          checked={value === option.id}
          onSelect={() => onChange(option.id)}
          thumb={<PaletteThumb option={option} />}
          label={option.label}
          note={`${option.note} ${option.headingFont.name} headings.`}
        />
      ))}
    </div>
  );
}
