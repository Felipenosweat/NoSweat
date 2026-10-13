"use client";

import type { SiteSpec } from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type Ref } from "react";
import { publishedSlug } from "./brief";
import styles from "./create.module.css";
import { primaryButton, secondaryButton } from "./ui";

/** Etapas mostradas enquanto o site é gerado. A última só fecha quando a resposta chega. */
export const BUILD_STEPS = [
  "Reading your description",
  "Choosing a template for your business",
  "Writing your headline and services",
  "Picking colors and fonts",
] as const;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Digita o texto letra por letra; com "reduzir movimento" mostra tudo de uma vez. */
function useTypedText(text: string): string {
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reduced || count >= text.length) return;
    const timer = setTimeout(() => setCount((value) => value + 1), count === 0 ? 450 : 55);
    return () => clearTimeout(timer);
  }, [count, text, reduced]);
  return reduced ? text : text.slice(0, count);
}

/** Assinatura da marca: nosweatfd.com/s/ em cinza, o slug em azul e o cursor piscando. */
function UrlLine({ slug, className }: { slug: string; className: string }) {
  return (
    <span className={`font-display font-semibold tracking-[-0.01em] ${className}`}>
      <span className="text-slate-500">nosweatfd.com/s/</span>
      <span className="text-brand">{slug}</span>
      <span
        aria-hidden="true"
        className={`ml-px inline-block h-[1.05em] w-0.5 translate-y-[0.18em] bg-brand ${styles.caret}`}
      />
    </span>
  );
}

function TypedUrlLine({ slug }: { slug: string }) {
  const typed = useTypedText(slug);
  return <UrlLine slug={typed} className="text-[15px] break-all sm:text-lg" />;
}

function StepIcon({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <span
        className={`grid size-5 place-items-center rounded-full bg-ink text-white ${styles.checkIn}`}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-3"
        >
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid size-5 place-items-center">
        <span className="size-4 rounded-full border-2 border-slate-200 border-t-brand motion-safe:animate-spin" />
      </span>
    );
  }
  return (
    <span className="grid size-5 place-items-center">
      <span className="size-1.5 rounded-full bg-slate-300" />
    </span>
  );
}

type BuildingPanelProps = {
  /** Quantas etapas já terminaram (0 a BUILD_STEPS.length). */
  progress: number;
  slug: string;
  headingRef: Ref<HTMLHeadingElement>;
};

export function BuildingPanel({ progress, slug, headingRef }: BuildingPanelProps) {
  const current = BUILD_STEPS[Math.min(progress, BUILD_STEPS.length - 1)];
  return (
    <div className="flex min-h-[calc(100svh-10rem)] items-center justify-center lg:min-h-[calc(100svh-13rem)]">
      <section
        aria-labelledby="building-heading"
        aria-busy="true"
        className="w-full max-w-[30rem] rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgb(7_27_51/.06),0_8px_24px_-8px_rgb(7_27_51/.12)] sm:p-8"
      >
        <h1
          id="building-heading"
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-2xl font-bold tracking-[-0.03em] text-ink outline-none"
        >
          Building your site
        </h1>
        {/* Decorativo: o endereço final só existe depois de publicar. */}
        <p aria-hidden="true" className="mt-2 min-h-7">
          <TypedUrlLine slug={slug} />
        </p>

        <ol className="mt-6 border-t border-slate-200 pt-3">
          {BUILD_STEPS.map((label, index) => {
            const state = index < progress ? "done" : index === progress ? "active" : "pending";
            return (
              <li key={label} className="flex items-center gap-3 py-2.5 text-[15px]">
                <StepIcon state={state} />
                <span className={state === "pending" ? "text-slate-500" : "font-medium text-ink"}>
                  {label}
                </span>
                <span className="sr-only">
                  {state === "done" ? "(done)" : state === "active" ? "(in progress)" : ""}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-4 text-[13px] text-slate-500">
          Keep this tab open. It usually takes less than a minute.
        </p>
        <p className="sr-only" aria-live="polite">
          {progress >= BUILD_STEPS.length ? "Done." : `${current}…`}
        </p>
      </section>
    </div>
  );
}

const PHONE_WIDTH = 390;
const DESKTOP_WIDTH = 1280;

/** Miniatura do site gerado: renderizado em tamanho real e reduzido; sem foco nem cliques. */
function SiteThumbnail({ spec }: { spec: SiteSpec }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ width: number; scale: number } | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      // Celular mostra o site como no celular; telas maiores, como no computador.
      const width = window.matchMedia("(min-width: 640px)").matches ? DESKTOP_WIDTH : PHONE_WIDTH;
      setLayout({ width, scale: entry.contentRect.width / width });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      aria-hidden="true"
      inert
      className="relative aspect-[4/5] overflow-hidden bg-white sm:aspect-[16/10]"
    >
      {layout && (
        <div
          className="pointer-events-none absolute top-0 left-0 origin-top-left"
          style={{ width: layout.width, transform: `scale(${layout.scale})` }}
        >
          <SiteRenderer spec={spec} />
        </div>
      )}
    </div>
  );
}

type ReadyPanelProps = {
  siteId: string;
  spec: SiteSpec;
  headingRef: Ref<HTMLHeadingElement>;
};

export function ReadyPanel({ siteId, spec, headingRef }: ReadyPanelProps) {
  const slug = publishedSlug(spec.business.name, siteId);
  return (
    <section aria-labelledby="ready-heading" className="mx-auto max-w-[55rem] pb-4">
      <div className="mx-auto max-w-[36rem] text-center">
        <h1
          id="ready-heading"
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.035em] text-balance text-ink outline-none sm:text-[2.5rem]"
        >
          Your site is ready.
        </h1>
        <p className="mt-3 text-[17px] leading-[1.55] text-pretty text-slate-600">
          Here&rsquo;s the first draft for {spec.business.name}. Change anything you like, then
          publish when it looks right.
        </p>
      </div>

      <div
        className={`mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(7_27_51/.06),0_8px_24px_-8px_rgb(7_27_51/.12),0_24px_48px_-12px_rgb(7_27_51/.25)] ${styles.reveal}`}
      >
        <div className="flex h-11 items-center gap-3 border-b border-slate-200 bg-surface px-3 sm:px-4">
          <span aria-hidden="true" className="hidden gap-1.5 sm:flex">
            <span className="size-2.5 rounded-full bg-slate-200" />
            <span className="size-2.5 rounded-full bg-slate-200" />
            <span className="size-2.5 rounded-full bg-slate-200" />
          </span>
          <p className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-1 text-center ring-1 ring-slate-200">
            <span className="sr-only">Your free address once you publish: </span>
            <UrlLine slug={slug} className="text-[13px]" />
          </p>
        </div>
        <SiteThumbnail spec={spec} />
      </div>
      <p className="mt-3 text-center text-[13px] text-slate-500">
        Your free address once you publish. You can connect your own domain later.
      </p>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <Link href={`/sites/preview/${siteId}`} className={secondaryButton}>
          See the preview
        </Link>
        <Link href={`/sites/${siteId}/edit`} className={primaryButton}>
          Open editor
        </Link>
      </div>
    </section>
  );
}
