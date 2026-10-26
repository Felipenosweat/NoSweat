import type { ReactNode } from "react";
import { cx, focusRing } from "@/components/glass";

// Passo a passo para achar o link de avaliações no Google. Cada passo tem um desenho pequeno
// feito só com HTML/CSS (nada de imagem de fora nem captura de tela do Google): sugere a tela
// sem copiar a marca. Sem "use client".

const line = "h-1.5 rounded-full bg-slate-300/70";

/** Moldura do desenho: um "celular" de vidro deitado. */
function Sketch({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="glass-edge flex h-24 flex-col justify-center gap-2 overflow-hidden rounded-xl bg-white/70 px-3.5"
    >
      {children}
    </div>
  );
}

/** Cápsula do desenho; `on` = o botão que a pessoa deve tocar (cor da marca + anel). */
function Chip({ children, on = false }: { children: ReactNode; on?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap",
        on
          ? "bg-brand text-white ring-4 ring-brand/20"
          : "border border-slate-200 bg-white text-slate-500",
      )}
    >
      {children}
    </span>
  );
}

const SKETCHES: Record<number, ReactNode> = {
  1: (
    <Sketch>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">
          G
        </span>
        <div className="grid flex-1 gap-1.5">
          <span className={cx(line, "w-3/4")} />
          <span className={cx(line, "w-1/2")} />
        </div>
      </div>
      <Chip on>Signed in</Chip>
    </Sketch>
  ),
  2: (
    <Sketch>
      <div className="flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-600">
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 text-slate-400" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.5" />
          <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className="truncate font-medium">Your business name</span>
      </div>
      <span className={cx(line, "w-2/3")} />
    </Sketch>
  ),
  3: (
    <Sketch>
      <span className={cx(line, "w-1/2")} />
      <div className="flex gap-1.5">
        <Chip>Edit profile</Chip>
        <Chip on>Ask for reviews</Chip>
      </div>
    </Sketch>
  ),
  4: (
    <Sketch>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
        <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">
          g.page/r/…/review
        </span>
      </div>
      <Chip on>Copy link</Chip>
    </Sketch>
  ),
  5: (
    <Sketch>
      <div className="flex items-center gap-2 rounded-lg border-2 border-brand bg-white px-2.5 py-1.5">
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">
          https://g.page/r/…/review
        </span>
      </div>
      <Chip on>Save</Chip>
    </Sketch>
  ),
};

const STEPS: { title: string; body: ReactNode }[] = [
  {
    title: "Sign in to Google",
    body: "On a computer or phone, sign in to the Google account that manages your business.",
  },
  {
    title: "Find your profile",
    body: "Search your business name on Google, or open Google Maps and go to your profile.",
  },
  {
    title: "Ask for reviews",
    body: (
      <>
        In your Business Profile, tap &ldquo;Ask for reviews&rdquo; (it may say &ldquo;Get more
        reviews&rdquo;).
      </>
    ),
  },
  {
    title: "Copy the link",
    body: <>Tap &ldquo;Copy link&rdquo;. That&rsquo;s your review link.</>,
  },
  {
    title: "Paste it here",
    body: "Paste it in the review link box on this page and tap Save.",
  },
];

export function GuideSteps({ headingId }: { headingId: string }) {
  return (
    <div>
      <ol
        aria-labelledby={headingId}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        {STEPS.map((step, index) => (
          <li key={step.title} className="glass flex flex-col gap-3 rounded-2xl p-4">
            {SKETCHES[index + 1]}
            <div>
              <p className="flex items-center gap-2 text-[15px] leading-6 font-semibold text-ink">
                <span
                  aria-hidden="true"
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-brand/10 text-[13px] font-bold text-brand tabular-nums"
                >
                  {index + 1}
                </span>
                <span>
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </span>
              </p>
              <p className="mt-1 text-[14px] leading-[1.55] text-slate-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[15px] text-slate-600">
        <a
          href="https://www.google.com/business/"
          target="_blank"
          rel="noopener noreferrer"
          className={`font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
        >
          Don&rsquo;t have a Google Business Profile yet?
          <span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        Google lets you create one for free.
      </p>
    </div>
  );
}
