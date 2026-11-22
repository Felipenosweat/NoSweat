"use client";

import type { Composition, SiteSpec } from "@nosweat/schema";
import dynamic from "next/dynamic";
import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { slugOf, withName } from "./personalize";
import { useYourName } from "./YourNameContext";

// Molduras da prévia: o site de verdade (<SiteRenderer>) desenhado no tamanho real (1280 de
// largura no computador, 390 no celular) e reduzido até caber. As molduras são decorativas
// (aria-hidden + inert): a legenda embaixo diz o que é.

const SiteCanvas = dynamic(() => import("./SiteCanvas"), { ssr: false, loading: () => null });

/** Tamanho "real" de cada janela desenhada. */
export const DESKTOP = { width: 1280, height: 800 } as const;
export const PHONE = { width: 390, height: 780 } as const;

/** O exemplo com o nome digitado (versão com atraso), na composição pedida. */
function usePersonalSpec(base: SiteSpec, composition: Composition): SiteSpec {
  const { settled } = useYourName();
  return useMemo(() => withName(base, settled, composition), [base, settled, composition]);
}

/**
 * Caixa na proporção da janela que reduz o site até a largura disponível. A escala vai para a
 * variável `--yn-scale` direto no estilo (sem estado do React: redimensionar não redesenha o site).
 */
function ScaledViewport({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const apply = () => box.style.setProperty("--yn-scale", String(box.clientWidth / width));
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={ref}
      className="yn-viewport relative w-full overflow-hidden bg-slate-100"
      style={{ aspectRatio: `${width} / ${height}`, "--yn-h": `${height}px` } as CSSProperties}
    >
      <div
        className="absolute top-0 left-0 origin-top-left overflow-hidden"
        style={{ width, height, transform: "scale(var(--yn-scale, 0.3))" }}
      >
        {children}
      </div>
    </div>
  );
}

/** O site só aparece depois que a página fica ociosa (o renderer vem num pedaço de JS à parte). */
function LazySite({ spec }: { spec: SiteSpec }) {
  const { rendererReady } = useYourName();
  return rendererReady ? <SiteCanvas spec={spec} /> : null;
}

/** Janela de navegador com a barra de endereço no formato real do endereço grátis. */
export function BrowserFrame({
  base,
  composition,
  className = "",
}: {
  base: SiteSpec;
  composition: Composition;
  className?: string;
}) {
  const spec = usePersonalSpec(base, composition);
  const { settled } = useYourName();
  return (
    <div
      aria-hidden="true"
      inert
      className={`pointer-events-none overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgb(7_27_51/.06),0_24px_48px_-24px_rgb(7_27_51/.28)] ring-1 ring-slate-200 select-none ${className}`}
    >
      <div className="flex h-9 items-center gap-3 border-b border-slate-200 bg-white px-3 lg:h-10">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-200" />
          <span className="size-2.5 rounded-full bg-slate-200" />
          <span className="size-2.5 rounded-full bg-slate-200" />
        </span>
        <span className="mx-auto flex h-6 max-w-[70%] min-w-0 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs text-slate-600 lg:h-7 lg:text-[13px]">
          <LockIcon />
          <span className="truncate tabular-nums">
            nosweatfd.com/s/<span className="text-ink">{slugOf(settled.name)}</span>
          </span>
        </span>
        <span className="w-[42px]" />
      </div>
      <ScaledViewport width={DESKTOP.width} height={DESKTOP.height}>
        <LazySite spec={spec} />
      </ScaledViewport>
    </div>
  );
}

/** O mesmo site na largura de um celular (sem desenhar um aparelho). */
export function PhoneFrame({
  base,
  composition,
  height = PHONE.height,
  className = "",
}: {
  base: SiteSpec;
  composition: Composition;
  /** Altura da janela desenhada (o topo do site ocupa toda a altura). */
  height?: number;
  className?: string;
}) {
  const spec = usePersonalSpec(base, composition);
  return (
    <div
      aria-hidden="true"
      inert
      className={`pointer-events-none overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgb(7_27_51/.06),0_24px_48px_-24px_rgb(7_27_51/.28)] ring-1 ring-slate-200 select-none ${className}`}
    >
      <ScaledViewport width={PHONE.width} height={height}>
        <LazySite spec={spec} />
      </ScaledViewport>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className="size-3 shrink-0"
    >
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
