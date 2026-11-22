"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { OFFICE_TABS } from "./content";
import { focusOnWhite } from "./styles";

// Abas do escritório com capturas REAIS (public/landing/real). A captura troca por opacidade e o
// sublinhado ink desliza até a aba. As duas imagens ficam empilhadas na mesma célula da grade,
// então trocar de aba não mexe na altura da página.

const panelId = (id: string) => `office-panel-${id}`;
const tabId = (id: string) => `office-tab-${id}`;

export function OfficeTabs() {
  const [selected, setSelected] = useState(OFFICE_TABS[0].id);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const place = () => {
      const tab = tabRefs.current.get(selected);
      const bar = indicatorRef.current;
      if (!tab || !bar) return;
      bar.style.setProperty("--live-ind-x", `${tab.offsetLeft}px`);
      bar.style.setProperty("--live-ind-w", `${tab.offsetWidth}px`);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [selected]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = OFFICE_TABS.findIndex((tab) => tab.id === selected);
    const keys: Record<string, number> = {
      ArrowRight: (index + 1) % OFFICE_TABS.length,
      ArrowLeft: (index - 1 + OFFICE_TABS.length) % OFFICE_TABS.length,
      Home: 0,
      End: OFFICE_TABS.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const id = OFFICE_TABS[next]?.id;
    if (!id) return;
    setSelected(id);
    tabRefs.current.get(id)?.focus();
  };

  return (
    <div>
      <div
        id="social"
        role="tablist"
        aria-label="Office screens"
        onKeyDown={onKeyDown}
        className="relative flex scroll-mt-8 gap-6 border-b border-slate-200 px-5 sm:gap-10 sm:px-0"
      >
        {OFFICE_TABS.map((tab) => {
          const active = tab.id === selected;
          return (
            <button
              key={tab.id}
              id={tabId(tab.id)}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.id, node);
                else tabRefs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId(tab.id)}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(tab.id)}
              className={`live-d inline-flex min-h-14 items-center rounded-sm text-[clamp(1.375rem,2.6vw,2rem)] tracking-[-0.02em] transition-colors duration-150 ${focusOnWhite} ${
                active ? "font-extrabold text-ink" : "font-medium text-slate-600 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <span ref={indicatorRef} aria-hidden="true" className="live-indicator -mb-px bg-ink" />
      </div>

      <div className="mt-6 grid sm:mt-8">
        {OFFICE_TABS.map((tab) => {
          const active = tab.id === selected;
          return (
            <div
              key={tab.id}
              id={panelId(tab.id)}
              role="tabpanel"
              aria-labelledby={tabId(tab.id)}
              aria-hidden={!active}
              inert={!active}
              className={`[grid-area:1/1] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <figure>
                <Image
                  src={tab.src}
                  alt={tab.alt}
                  width={tab.width}
                  height={tab.height}
                  sizes="(min-width: 1440px) 1344px, (min-width: 640px) calc(100vw - 4rem), 100vw"
                  className="block h-auto w-full border-y border-slate-200 bg-surface sm:border-x"
                />
                <figcaption className="mt-5 grid gap-x-10 gap-y-2 px-5 sm:px-0 lg:grid-cols-12">
                  <span className="text-lg leading-[1.5] text-pretty text-ink lg:col-span-8 lg:text-xl">
                    {tab.text}
                  </span>
                  <span className="text-[15px] text-slate-600 lg:col-span-4 lg:pt-1 lg:text-right">
                    Real No Sweat screen. The data is made up.
                  </span>
                </figcaption>
              </figure>
            </div>
          );
        })}
      </div>
    </div>
  );
}
