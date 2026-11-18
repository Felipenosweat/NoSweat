// Classes compartilhadas da landing (Design Brief V3: tipografia, botões, container).
// Uma só fonte para o CTA "Build my website" ficar idêntico no header, hero, preço e CTA final.

// Cor (seção 9.5 do estudo de design, P5 "Mono + Blue"): o azul da marca (`brand`) é só da ação
// principal. Foco, links, rótulos e enfeites ficam em tinta e cinza.

/** Foco do teclado: anel duplo (branco por dentro, tinta por fora), visível em qualquer fundo claro. */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff]";

/** Foco sobre fundo escuro (bolha ink): o anel vira branco. */
export const focusRingOnDark =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Única cor da ação principal (fundo azul, texto branco). Só no `primaryButton`: header, perguntas
 * do topo, plano recomendado, CTA final e barra fixa do celular. */
export const primaryTone = "bg-brand text-white hover:bg-brand-dark";

export const primaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg ${primaryTone} px-6 font-semibold transition-colors duration-150 active:translate-y-px ${focusRing}`;

export const secondaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 font-semibold text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 active:translate-y-px ${focusRing}`;

/** Link no meio do texto: tinta com sublinhado (azul sobre o cinza dava 4,27:1). */
export const textLink = `rounded-sm font-semibold text-ink underline decoration-ink/35 underline-offset-4 transition-colors duration-150 hover:decoration-ink ${focusRing}`;

/** Container do brief: 1200px com as margens laterais de 20/32px. */
export const container = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

/** Sombra exclusiva das molduras de produto (nunca em cartões comuns). */
export const frameShadow = "shadow-[0_1px_2px_rgb(7_27_51/.06),0_8px_24px_-8px_rgb(7_27_51/.12)]";

// Escala tipográfica do brief da landing (a mesma em /pricing e nas outras páginas de marketing).
// Títulos em Plus Jakarta Sans (font-display), à esquerda, uma cor só; pesos 400/600/700.
export const h1Class =
  "max-w-[14ch] break-words font-display text-[2.25rem] leading-[1.05] font-bold tracking-[-0.035em] text-balance text-ink lg:text-[4rem] lg:leading-[1.02]";
export const h2Class =
  "max-w-[20ch] break-words font-display text-[1.75rem] leading-[1.12] font-bold tracking-[-0.03em] text-balance text-ink lg:text-[2.75rem] lg:leading-[1.08]";
export const h3Class =
  "font-display text-lg leading-snug font-semibold tracking-[-0.015em] text-ink lg:text-xl";
export const leadClass = "max-w-[48ch] text-lg leading-[1.5] text-pretty text-slate-600 lg:text-xl";
export const bodyClass =
  "max-w-[62ch] text-base leading-[1.65] text-pretty text-slate-600 lg:text-[17px]";
export const captionClass = "text-[13px] leading-normal text-(--glass-fg-muted)";
/** Número de capítulo/passo ("01"…"06"). */
export const chapterNumberClass = "text-[13px] font-semibold tabular-nums text-slate-500";
