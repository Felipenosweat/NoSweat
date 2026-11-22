// Botões da landing "Live". No azul (e no ink) o botão é branco com letra ink; no branco é ink
// com letra branca. Contorno de foco: branco no azul/ink, ink no branco.

const base =
  "inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-7 text-[17px] font-semibold transition-[background-color,transform] duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px]";

export const onBlueButton = `${base} bg-white text-ink hover:bg-slate-100 focus-visible:outline-white`;

export const onWhiteButton = `${base} bg-ink text-white hover:bg-brand-dark focus-visible:outline-ink`;

export const focusOnWhite =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export const focusOnDark =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
