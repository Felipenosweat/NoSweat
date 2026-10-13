// Classes compartilhadas do fluxo /create (botões e foco seguem o Design Brief v3).

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const primaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px ${focusRing}`;

export const secondaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 active:translate-y-px ${focusRing}`;
