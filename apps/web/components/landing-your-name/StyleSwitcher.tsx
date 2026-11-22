"use client";

import type { Composition, SiteSpec } from "@nosweat/schema";
import { useState, useSyncExternalStore } from "react";
import { BrowserFrame, PhoneFrame } from "./PreviewFrames";
import { STYLE_OPTIONS } from "./personalize";

// "Switch the style": o mesmo nome em três composições do renderer. Radios nativos (setas do
// teclado e estado acessível de graça). Uma moldura só: a do computador a partir de lg, a do
// celular abaixo (desenhar as duas e esconder uma dobraria o trabalho do renderer).

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

export function StyleSwitcher({ base }: { base: SiteSpec }) {
  const [style, setStyle] = useState<Composition>(STYLE_OPTIONS[0]!.id);
  const desktop = useIsDesktop();
  const current = STYLE_OPTIONS.find((option) => option.id === style) ?? STYLE_OPTIONS[0]!;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10">
      <fieldset className="lg:col-span-4">
        <legend className="sr-only">Website style</legend>
        <ul className="grid gap-2">
          {STYLE_OPTIONS.map((option) => (
            <li key={option.id}>
              <label className="group block cursor-pointer">
                <input
                  type="radio"
                  name="yn-style"
                  value={option.id}
                  checked={style === option.id}
                  onChange={() => setStyle(option.id)}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 flex-col rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors duration-150 group-hover:border-slate-400 peer-checked:border-ink peer-checked:ring-1 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand motion-reduce:transition-none">
                  <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">
                    {option.label}
                  </span>
                  <span className="mt-1 text-[15px] leading-snug text-pretty text-slate-600">
                    {option.description}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="sr-only">
          Showing the {current.label} style.
        </p>
      </fieldset>
      <div className="lg:col-span-8">
        {desktop ? (
          <BrowserFrame base={base} composition={style} />
        ) : (
          <PhoneFrame base={base} composition={style} className="mx-auto max-w-[24rem]" />
        )}
      </div>
    </div>
  );
}
