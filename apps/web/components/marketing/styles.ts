// Classes compartilhadas da landing (Design Brief V3: tipografia, botões, container).
// Uma só fonte para o CTA "Build my website" ficar idêntico no header, hero, preço e CTA final.

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const primaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px ${focusRing}`;

export const secondaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 font-semibold text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 active:translate-y-px ${focusRing}`;

export const textLink = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;

/** Container do brief: 1200px com as margens laterais de 20/32px. */
export const container = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

/** Sombra exclusiva das molduras de produto (nunca em cartões comuns). */
export const frameShadow = "shadow-[0_1px_2px_rgb(7_27_51/.06),0_8px_24px_-8px_rgb(7_27_51/.12)]";

// Escala tipográfica do brief.
export const h1Class =
  "max-w-[13ch] font-display text-[2.625rem] leading-[1.02] font-bold tracking-[-0.035em] text-balance text-ink lg:text-[clamp(3rem,5.2vw,4.5rem)]";
export const h2Class =
  "max-w-[18ch] font-display text-[1.875rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-ink lg:text-[2.75rem]";
export const h3Class = "font-display text-lg font-semibold tracking-[-0.015em] text-ink lg:text-xl";
export const leadClass =
  "max-w-[52ch] text-lg leading-[1.55] text-pretty text-slate-600 lg:text-xl";
export const bodyClass =
  "max-w-[65ch] text-base leading-[1.65] text-pretty text-slate-600 lg:text-[17px]";
export const eyebrowClass = "text-[13px] font-semibold tracking-[0.02em] text-slate-500";
export const captionClass = "text-[13px] leading-normal text-slate-500";

/** Título de painel do app (15px Jakarta 600), usado nos mini-UIs do bento. */
export const panelTitleClass = "font-display text-[15px] font-semibold tracking-[-0.01em] text-ink";

/** Seções abaixo da dobra: o navegador só desenha quando chegam perto da tela. */
export const belowFold = "[content-visibility:auto] [contain-intrinsic-size:auto_800px]";
