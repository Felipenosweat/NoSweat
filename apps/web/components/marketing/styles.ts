// Classes compartilhadas dos botões e links da landing (Design Brief §4).
// Uma só fonte para o CTA "Build my website" ficar idêntico no header, hero, preço e CTA final.

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const primaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-dark active:translate-y-px ${focusRing}`;

export const secondaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 font-semibold text-ink transition-colors hover:border-slate-400 hover:bg-surface active:translate-y-px ${focusRing}`;

export const textLink = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;

/** Container padrão: max-w-6xl com as margens laterais do brief. */
export const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
