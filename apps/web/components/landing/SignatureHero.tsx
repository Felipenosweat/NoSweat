"use client";

import type { SiteSpec } from "@nosweat/schema";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { Arrow } from "./Arrow";
import { dropIn } from "./assemble";
import { BrowserFrame } from "./Frames";
import { TRADES, tradeOf, tradeStore, type TradeSlug } from "./trades";
import { arrowShift, focusRingOnInk, shell } from "./type";

// Topo da landing ("o site se monta sozinho"): bloco ink da altura da tela com UMA frase grande
// que o visitante completa, "I run a [ramo ▾] in [cidade]." (um <select> e um <input> de
// verdade, com rótulo, no tamanho do texto e sublinhados). "Build my website" monta o brief e vai
// para /create?brief=…&start=1, como o antigo HeroStepper (o texto também fica no sessionStorage
// `ns-brief`). Sem JavaScript, o <noscript> leva para o /create.
// Embaixo, deslocada para a direita (grade assimétrica), a moldura de navegador com um site de
// exemplo de verdade (<SiteRenderer>, via ScaledSite) para o ramo escolhido: ao trocar o ramo, o
// site se monta de novo bloco a bloco (dropIn), não um cross-fade. A moldura só monta o site
// depois da primeira pintura (o LCP é a frase) e a caixa já tem a proporção (sem pulo).

const ScaledSite = dynamic(() => import("./ScaledSite"), { ssr: false });

const STORAGE_KEY = "ns-brief";

// Texto da frase: Plus Jakarta em escala editorial (até 120 px), entrelinha e tracking justos.
const sentence =
  "font-display text-[clamp(1.75rem,7.9vw,2.5rem)] sm:text-[clamp(2.5rem,6.8vw,7.5rem)] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance";

// Campo dentro da frase: mesma fonte e tamanho, fundo transparente e um sublinhado grosso. O
// tamanho vem do texto "fantasma" no mesmo lugar da grade (funciona em qualquer navegador).
const fieldBox = "relative inline-grid align-baseline max-sm:grid max-sm:w-full";
const fieldText = `col-start-1 row-start-1 min-w-0 appearance-none rounded-none border-0 border-b-[0.07em] border-slate-500 bg-transparent p-0 pb-[0.02em] font-[inherit] leading-[inherit] tracking-[inherit] text-white outline-none transition-colors duration-200 hover:border-white focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none`;

export function SignatureHero({ specs }: { specs: Record<string, SiteSpec> }) {
  const router = useRouter();
  const slug = useSyncExternalStore(tradeStore.subscribe, tradeStore.get, tradeStore.getServer);
  const trade = tradeOf(slug);
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const changed = useRef(false);
  const cityRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // O site da moldura só entra depois da primeira pintura (fora do caminho do LCP).
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const handle = idle(() => setMounted(true));
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  // Só monta bloco a bloco quando o visitante troca o ramo (a primeira aparição é discreta).
  const onReady = useCallback((root: HTMLElement) => {
    if (changed.current) dropIn(root);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const where = city.trim();
    if (where.length < 2) {
      setError("Add your city, like Austin, TX.");
      cityRef.current?.focus();
      return;
    }
    setError("");
    const brief = `${trade.phrase} in ${where}.`;
    try {
      sessionStorage.setItem(STORAGE_KEY, brief);
    } catch {
      // Modo privado: o parâmetro da URL já basta.
    }
    router.push(`/create?brief=${encodeURIComponent(brief)}&start=1`);
  };

  const spec = specs[trade.slug];

  return (
    <section
      id="start"
      aria-labelledby="hero-title"
      data-hide-mobile-cta
      className="overflow-x-clip bg-ink text-white"
    >
      <div className={`${shell} pt-[clamp(3.5rem,11vh,7.5rem)] pb-14 lg:pb-20`}>
        <h1
          id="hero-title"
          className="lp-rise text-base font-medium text-slate-300 sm:text-lg"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          Websites for local businesses, built from one sentence.
        </h1>

        <form
          onSubmit={submit}
          noValidate
          aria-describedby={`${id}-note`}
          className="mt-8 sm:mt-10"
        >
          <p className={`${sentence} lp-rise-solid`}>
            I run a{" "}
            <span className={fieldBox}>
              <label htmlFor={`${id}-trade`} className="sr-only">
                Type of business
              </label>
              {/* Texto fantasma: dá a largura do campo (o select não encolhe sozinho). */}
              <span
                aria-hidden="true"
                className="invisible col-start-1 row-start-1 pr-[0.5em] whitespace-nowrap max-sm:hidden"
              >
                {trade.label}
              </span>
              <select
                id={`${id}-trade`}
                value={trade.slug}
                onChange={(e) => {
                  changed.current = true;
                  tradeStore.set(e.target.value as TradeSlug);
                }}
                className={`${fieldText} w-full cursor-pointer pr-[0.5em] max-sm:min-h-14`}
              >
                {TRADES.map((t) => (
                  <option key={t.slug} value={t.slug} className="bg-white text-base text-ink">
                    {t.label}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="pointer-events-none col-start-1 row-start-1 mb-[0.22em] size-[0.38em] self-end justify-self-end text-slate-400"
              >
                <path
                  d="M3 6l5 5 5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>{" "}
            in{" "}
            <span className="whitespace-nowrap max-sm:block max-sm:whitespace-normal">
              <span className={fieldBox}>
                <label htmlFor={`${id}-city`} className="sr-only">
                  City and state
                </label>
                <span
                  aria-hidden="true"
                  className="invisible col-start-1 row-start-1 pr-[0.05em] whitespace-pre max-sm:hidden"
                >
                  {city || "your city"}
                </span>
                <input
                  ref={cityRef}
                  id={`${id}-city`}
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (error) setError("");
                  }}
                  size={1}
                  autoComplete="address-level2"
                  enterKeyHint="go"
                  placeholder="your city"
                  aria-invalid={error ? true : undefined}
                  aria-errormessage={error ? `${id}-error` : undefined}
                  className={`${fieldText} w-full placeholder:text-slate-500 max-sm:min-h-14`}
                />
              </span>
              <span className="ml-[-0.04em] max-sm:hidden">.</span>
            </span>
          </p>

          <p id={`${id}-error`} role="alert" className="mt-4 min-h-6 text-base text-white">
            {error}
          </p>

          <div
            className="lp-rise mt-4 flex flex-col items-stretch gap-x-8 gap-y-4 sm:flex-row sm:items-center"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <button
              type="submit"
              className={`group inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-brand px-8 text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px ${focusRingOnInk}`}
            >
              Build my website
              <Arrow className={arrowShift} />
            </button>
            <p id={`${id}-note`} className="text-[15px] leading-snug text-slate-400">
              Free to create. No account or credit card.
              <br className="max-sm:hidden" />{" "}
              <a
                href="/create"
                className={`rounded-sm text-slate-200 underline decoration-slate-500 underline-offset-4 transition-colors hover:text-white hover:decoration-white ${focusRingOnInk}`}
              >
                Something else? Describe it in your words
              </a>
            </p>
          </div>
        </form>
        <noscript>
          <p className="mt-6">
            <a href="/create" className="text-lg font-semibold text-white underline">
              Describe your business and build your site
            </a>
          </p>
        </noscript>
      </div>

      {/* A moldura: colunas 4–12 no computador (assimétrica), largura toda no celular. */}
      <div className={`${shell} pb-20 lg:pb-28`}>
        <figure className="lp-show lg:ml-[25%]" style={{ "--i": 0 } as React.CSSProperties}>
          <BrowserFrame address={`${trade.host}.nosweatfd.com`}>
            <div aria-hidden="true" inert className="pointer-events-none absolute inset-0">
              {mounted && spec && (
                <ScaledSite key={trade.slug} spec={spec} width={1440} onReady={onReady} />
              )}
            </div>
          </BrowserFrame>
          <figcaption className="mt-4 flex justify-between gap-4 text-sm text-slate-400">
            <span>Example site. The business is made up.</span>
            <a
              href={`/examples/${trade.slug}`}
              className={`rounded-sm text-slate-200 underline-offset-4 hover:underline ${focusRingOnInk}`}
            >
              Open the full example
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
