"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { focusRing, shareFlagKey } from "./DashboardUi";

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
 * "N de 5" do site mais recente. Os 4 primeiros passos vêm do servidor; "Share your link" é
 * PROVISÓRIO: lê uma marca no localStorage (gravada ao copiar/compartilhar no diálogo de
 * publicação) até existir um registro no servidor. Por isso o componente é de cliente.
 */
export function DashboardChecklist({
  siteId,
  siteName,
  steps,
  shareHref,
}: {
  siteId: string;
  siteName: string;
  steps: ChecklistStep[];
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
    {
      label: "Share your link",
      done: shared,
      href: shareHref,
      hint: shareHref ? "Text it or post it" : "Publish first",
    },
  ];
  const doneCount = all.filter((step) => step.done).length;
  if (doneCount === all.length) return null;

  return (
    <section
      aria-labelledby="checklist-heading"
      className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="checklist-heading"
          className="font-display text-[15px] leading-6 font-semibold text-ink"
        >
          Get {siteName} ready for customers
        </h2>
        <p className="text-[13px] font-medium text-slate-500 tabular-nums">
          {doneCount} of {all.length} done
        </p>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {all.map((step) => (
          <span
            key={step.label}
            className={`h-1 flex-1 rounded-full ${step.done ? "bg-brand" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <ol className="mt-4 grid gap-1 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
        {all.map((step) => {
          const marker = (
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                step.done ? "bg-ink text-white" : "ring-1 ring-slate-300 ring-inset"
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
            <span className="min-w-0">
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
          const rowClass = "flex min-h-11 gap-3 rounded-lg px-2 py-2 -mx-2";
          return (
            <li key={step.label}>
              {step.done || !step.href ? (
                <div className={rowClass}>
                  {marker}
                  {text}
                </div>
              ) : step.external ? (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`${rowClass} transition-colors duration-150 hover:bg-slate-50 ${focusRing}`}
                >
                  {marker}
                  {text}
                </a>
              ) : (
                <Link
                  href={step.href}
                  className={`${rowClass} transition-colors duration-150 hover:bg-slate-50 ${focusRing}`}
                >
                  {marker}
                  {text}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
