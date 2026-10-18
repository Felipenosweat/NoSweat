"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  ChevronRightIcon,
  cardClass,
  focusRing,
  sectionTitle,
  shareFlagKey,
} from "./DashboardUi";

export type ChecklistStep = {
  label: string;
  done: boolean;
  /** Para onde levar quem ainda não fez o passo. `null` = ainda não dá (ex.: precisa publicar). */
  href: string | null;
  hint?: string;
  external?: boolean;
};

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("ns-shared", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("ns-shared", onChange);
  };
}

/**
 * "N de M" do site mais recente. Os passos do site vêm do servidor, depois os `extraSteps`
 * (ex.: Instagram, também do servidor); "Share your link" (sempre o último) é
 * PROVISÓRIO: lê uma marca no localStorage (gravada ao copiar/compartilhar no diálogo de
 * publicação) até existir um registro no servidor. Por isso o componente é de cliente.
 */
export function DashboardChecklist({
  siteId,
  siteName,
  steps,
  extraSteps = [],
  shareHref,
}: {
  siteId: string;
  siteName: string;
  steps: ChecklistStep[];
  /** Passos de outros módulos (ex.: "Connect Instagram"), antes de "Share your link". */
  extraSteps?: ChecklistStep[];
  shareHref: string | null;
}) {
  const shared = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(shareFlagKey(siteId)) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  const all: ChecklistStep[] = [
    ...steps,
    ...extraSteps,
    {
      label: "Share your link",
      done: shared,
      href: shareHref,
      hint: shareHref ? "Text it or post it" : "Publish first",
    },
  ];
  const doneCount = all.filter((step) => step.done).length;
  if (doneCount === all.length) return null;
  const percent = Math.round((doneCount / all.length) * 100);

  return (
    <section aria-labelledby="checklist-heading" className={`${cardClass} p-5 sm:p-6`}>
      <div className="flex items-center gap-4">
        <ProgressRing percent={percent} />
        <div className="min-w-0">
          <h2 id="checklist-heading" className={`${sectionTitle} text-balance`}>
            Get {siteName} ready for customers
          </h2>
          <p className="mt-0.5 text-[13px] leading-5 text-slate-500 tabular-nums">
            {doneCount} of {all.length} done
          </p>
        </div>
      </div>

      <ol className="mt-5 grid gap-1 border-t border-slate-200/70 pt-4 sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-4">
        {all.map((step) => {
          const marker = (
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full ${
                step.done ? "bg-brand text-white" : "ring-[1.5px] ring-slate-300 ring-inset"
              }`}
            >
              {step.done && (
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor">
                  <path
                    d="m4.5 12.75 6 6 9-13.5"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          );
          const text = (
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[15px] leading-6 font-medium ${
                  step.done ? "text-slate-500" : "text-ink"
                }`}
              >
                {step.label}
                <span className="sr-only">{step.done ? " (done)" : " (to do)"}</span>
              </span>
              {!step.done && step.hint && (
                <span className="block text-[13px] leading-5 text-slate-500">{step.hint}</span>
              )}
            </span>
          );
          const rowClass = "flex min-h-12 items-start gap-3 rounded-xl px-2.5 py-2.5 -mx-2.5";
          const linkClass = `group ${rowClass} transition-colors duration-150 hover:bg-slate-50 ${focusRing}`;
          const chevron = (
            <ChevronRightIcon className="mt-1 size-4 shrink-0 text-slate-300 transition-colors duration-150 group-hover:text-slate-500" />
          );
          return (
            <li key={step.label}>
              {step.done || !step.href ? (
                <div className={rowClass}>
                  {marker}
                  {text}
                </div>
              ) : step.external ? (
                <a href={step.href} target="_blank" rel="noreferrer" className={linkClass}>
                  {marker}
                  {text}
                  <span className="sr-only"> (opens in a new tab)</span>
                  {chevron}
                </a>
              ) : (
                <Link href={step.href} className={linkClass}>
                  {marker}
                  {text}
                  {chevron}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Anel de progresso (como os do Fitness): trilho cinza e arco azul com o percentual no meio. */
function ProgressRing({ percent }: { percent: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  return (
    <span aria-hidden="true" className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 size-14 -rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth={5} className="stroke-slate-200" />
        {percent > 0 && (
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
            className="stroke-brand"
          />
        )}
      </svg>
      <span className="text-[13px] font-semibold text-ink tabular-nums">{percent}%</span>
    </span>
  );
}
