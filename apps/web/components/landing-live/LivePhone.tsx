"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { TRADES, demoHref } from "./content";

// O site de exemplo AO VIVO do herói: uma página /demos/<slug> de verdade num iframe do mesmo
// domínio (o next.config manda frame-ancestors 'self', então pode). Não é captura de tela.
// - Moldura de celular de 390×780 reduzida por escala (--live-scale, medida aqui).
// - Fila de abas (Barber, Electrician…): trocar monta o iframe novo por baixo e, quando ele
//   carrega, os dois trocam de opacidade em 250ms. No máximo 3 iframes montados.
// - Em tela de toque, uma camada "Tap to try it" cobre o celular: o dedo rola a PÁGINA e só o
//   primeiro toque libera o exemplo (assim o celular não prende a rolagem).

const PANEL_ID = "live-panel";
const tabId = (slug: string) => `live-tab-${slug}`;
const MAX_MOUNTED = 3;

export function LivePhone() {
  const first = TRADES[0];
  const [selected, setSelected] = useState(first.slug);
  // O que está 100% visível agora (troca quando o iframe novo termina de carregar).
  const [shown, setShown] = useState(first.slug);
  const [mounted, setMounted] = useState<string[]>([first.slug]);
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const [awake, setAwake] = useState(false);

  const phoneRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const selectedRef = useRef(selected);

  // Escala do iframe = largura útil da moldura ÷ 390 (sem estado: escreve direto no estilo).
  useEffect(() => {
    const phone = phoneRef.current;
    if (!phone) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      phone.style.setProperty("--live-scale", String(entry.contentRect.width / 390));
    });
    observer.observe(phone);
    return () => observer.disconnect();
  }, []);

  // Sublinhado que desliza até a aba escolhida.
  useEffect(() => {
    const place = () => {
      const tab = tabRefs.current.get(selected);
      const bar = indicatorRef.current;
      if (!tab || !bar) return;
      bar.style.setProperty("--live-ind-x", `${tab.offsetLeft + 12}px`);
      bar.style.setProperty("--live-ind-w", `${Math.max(tab.offsetWidth - 24, 0)}px`);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [selected]);

  const select = (slug: string) => {
    if (slug === selectedRef.current) return;
    selectedRef.current = slug;
    setSelected(slug);
    if (loaded.has(slug)) setShown(slug);
    setMounted((list) => {
      if (list.includes(slug)) return list;
      // Descarta o mais antigo, mas nunca o que está na tela (ele é a metade do cruzamento).
      const next = [...list, slug];
      while (next.length > MAX_MOUNTED) {
        const drop = next.findIndex((item) => item !== shown);
        next.splice(drop, 1);
      }
      return next;
    });
    tabRefs.current
      .get(slug)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  };

  const onLoad = (slug: string) => {
    setLoaded((set) => new Set(set).add(slug));
    if (slug === selectedRef.current) setShown(slug);
  };

  // Setas, Home e End trocam de aba (padrão WAI-ARIA de abas com ativação automática).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TRADES.findIndex((trade) => trade.slug === selected);
    const keys: Record<string, number> = {
      ArrowRight: (index + 1) % TRADES.length,
      ArrowLeft: (index - 1 + TRADES.length) % TRADES.length,
      Home: 0,
      End: TRADES.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const slug = TRADES[next]?.slug;
    if (!slug) return;
    select(slug);
    tabRefs.current.get(slug)?.focus();
  };

  const current = TRADES.find((trade) => trade.slug === selected) ?? first;

  return (
    <div className="flex w-full flex-col items-center">
      <p className="flex items-center gap-2.5 text-[15px] font-medium text-white">
        <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
        Live example. Scroll it.
      </p>

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId(selected)}
        ref={phoneRef}
        className="live-phone mt-4"
      >
        {mounted.map((slug) => {
          const trade = TRADES.find((item) => item.slug === slug) ?? first;
          const visible = slug === shown;
          return (
            <iframe
              key={slug}
              src={demoHref(slug)}
              title={`${trade.business}, a made-up example website built with No Sweat`}
              sandbox="allow-scripts allow-same-origin"
              loading={slug === first.slug ? "eager" : "lazy"}
              onLoad={() => onLoad(slug)}
              tabIndex={visible ? 0 : -1}
              aria-hidden={!visible}
              inert={!visible}
              className={`transition-opacity duration-[250ms] ease-out motion-reduce:transition-none ${
                visible ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
            />
          );
        })}

        {!awake && (
          <button
            type="button"
            onClick={() => setAwake(true)}
            className="live-tap group absolute inset-0 z-20 flex items-end justify-center pb-6 focus-visible:outline-none"
          >
            <span className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-[15px] font-semibold text-white group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-white">
              Tap to try it
            </span>
            <span className="sr-only">: {current.business}, a made-up example website</span>
          </button>
        )}
      </div>

      <p className="mt-3 text-[15px] text-white">Made-up business. A No Sweat design example.</p>
      <p aria-live="polite" className="sr-only">
        Showing {current.business}.
      </p>

      {/* Fila de abas: no celular, fichas que rolam de lado; no computador, texto com o
          sublinhado ciano deslizando. */}
      <div
        ref={scrollerRef}
        className="live-scroller relative -mx-5 mt-5 w-[calc(100%+2.5rem)] overflow-x-auto px-5 sm:mx-0 sm:w-full sm:px-0"
      >
        <div
          role="tablist"
          aria-label="Example trade"
          onKeyDown={onKeyDown}
          className="relative mx-auto flex w-max gap-2 lg:gap-0"
        >
          {TRADES.map((trade) => {
            const active = trade.slug === selected;
            return (
              <button
                key={trade.slug}
                id={tabId(trade.slug)}
                ref={(node) => {
                  if (node) tabRefs.current.set(trade.slug, node);
                  else tabRefs.current.delete(trade.slug);
                }}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={PANEL_ID}
                tabIndex={active ? 0 : -1}
                onClick={() => select(trade.slug)}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-base whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:rounded-md lg:border-transparent lg:px-3 ${
                  active
                    ? "border-white bg-white font-semibold text-ink lg:bg-transparent lg:text-white"
                    : "border-white/45 font-medium text-white hover:border-white lg:hover:border-transparent lg:hover:underline lg:hover:underline-offset-8"
                }`}
              >
                {trade.label}
              </button>
            );
          })}
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="live-indicator hidden rounded-full bg-accent lg:block"
          />
        </div>
      </div>
    </div>
  );
}
