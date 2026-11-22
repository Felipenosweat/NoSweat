// Classes da landing "Straight answers". Escala: pergunta (display 700, enorme) → resposta
// (display 600) → texto (Inter 400). Só três pesos, só tokens da marca e slate.

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const shell = "mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12";

/** A pergunta: o maior texto de cada bloco. */
export const questionClass =
  "font-display font-bold text-ink text-balance break-words tracking-[-0.045em] leading-[0.98] text-[2.75rem] sm:text-[4.25rem] lg:text-[clamp(4.5rem,7.2vw,6.75rem)]";

/** A resposta: um fato, grande e direto. */
export const answerClass =
  "font-display font-semibold text-ink text-pretty tracking-[-0.025em] leading-[1.15] text-[1.625rem] lg:text-[2.125rem]";

export const bodyClass = "max-w-[46ch] text-[17px] leading-[1.6] text-pretty text-slate-600";

export const captionClass = "text-[13px] leading-normal text-slate-500";

export const primaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px motion-reduce:active:translate-y-0 ${focusRing}`;

export const textLink = `inline-flex min-h-11 items-center gap-1.5 rounded-sm font-semibold text-ink underline decoration-slate-300 underline-offset-4 transition-colors duration-150 hover:decoration-ink ${focusRing}`;

/** Moldura das provas (capturas, preço, Termos): uma borda fina, sem sombra pesada. */
export const frameClass = "rounded-xl border border-slate-200 bg-surface";
