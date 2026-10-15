// Classes compartilhadas do fluxo /create (botões e foco seguem o Design Brief v3).

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const primaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px ${focusRing}`;

export const secondaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 active:translate-y-px ${focusRing}`;

/** Campo de texto do /create (com estado de erro). */
export function inputClass(invalid: boolean): string {
  return `mt-2 block w-full rounded-xl border bg-white px-4 text-base text-ink placeholder:text-slate-500 transition-[border-color,box-shadow] duration-150 focus:ring-4 focus:outline-none ${
    invalid
      ? "border-red-500 ring-4 ring-red-100 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 hover:border-slate-400 focus:border-brand focus:ring-brand/15"
  }`;
}
