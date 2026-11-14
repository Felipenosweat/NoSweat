// Classes compartilhadas da landing: a borda da página, a escala de texto e os botões.
// Página branca, seções de ponta a ponta separadas por fios de 1 px; um só H2, alinhado à
// esquerda na mesma borda, do cabeçalho ao rodapé.

/** Borda da página: conteúdo de até 1240 px com 20 / 32 px de margem. */
export const shell = "mx-auto w-full max-w-[1240px] px-5 sm:px-8";

export const h2Class =
  "font-display text-[clamp(2.125rem,4.6vw,3.5rem)] leading-[1.04] font-extrabold tracking-[-0.035em] text-balance text-ink";

export const h3Class =
  "font-display text-xl leading-[1.25] font-bold tracking-[-0.02em] text-ink lg:text-[1.375rem]";

export const leadClass = "max-w-[26rem] text-lg leading-[1.55] text-pretty text-slate-600";

export const bodyClass = "text-[17px] leading-[1.6] text-pretty text-slate-600";

/** Cabeçalho de seção: título à esquerda e, quando há, uma frase à direita na linha de base. */
export const sectionHead = "flex flex-wrap items-end justify-between gap-x-12 gap-y-5";

/** Área de conteúdo da seção: um fio de 1 px em cima. */
export const sectionBody = "mt-10 border-t border-slate-200 pt-8 lg:mt-14 lg:pt-10";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Contorno de foco sobre o ink (o azul da marca some no fundo escuro). */
export const focusRingOnInk =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Seta dos botões: anda 2 px para a direita no hover do botão (que leva a classe `group`). */
export const arrowShift =
  "transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none";
