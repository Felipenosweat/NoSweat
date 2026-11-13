// Classes compartilhadas da landing: a borda da página e a escala de texto (Screen Spec, seção 2).
// Um só H2 para todas as seções, alinhado à esquerda na mesma borda, do cabeçalho ao rodapé.

/** Borda da página, camada de fora (a de dentro é `edgeInner` ou a própria bolha branca). */
export const edgeOuter = "px-3 sm:px-5";

/** Borda da página, camada de dentro: conteúdo a 32 / 60 / 144 px em 390 / 768 / 1440. */
export const edgeInner = "mx-auto w-full max-w-[1280px] px-5 sm:px-10 lg:px-16";

/** H2 sem cor (para a bolha escura, onde o texto é branco). */
export const h2Base =
  "font-display text-[1.875rem] leading-[1.1] font-bold tracking-[-0.03em] text-balance lg:text-[2.75rem]";

export const h2Class = `${h2Base} text-ink`;

export const h3Class =
  "font-display text-xl leading-[1.3] font-semibold tracking-[-0.02em] text-ink lg:text-[1.375rem]";

export const leadClass =
  "max-w-[46ch] text-lg leading-normal tracking-[-0.01em] text-pretty text-slate-600 lg:text-xl";

export const bodyClass =
  "max-w-[60ch] text-base leading-[1.6] text-pretty text-slate-600 lg:text-[17px]";

export const smallClass = "text-sm leading-normal text-slate-600";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
