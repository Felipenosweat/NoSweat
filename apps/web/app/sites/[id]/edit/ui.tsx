// Peças visuais compartilhadas pelos painéis do editor.
// Regras do brief: dois raios (rounded-xl para campos, botões e chips; rounded-2xl para cartões
// e molduras), bordas finas, texto do app em 15px e campos com 16px no celular (o iOS não dá zoom).

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const inputClass =
  "mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-ink placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150 hover:border-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none motion-reduce:transition-none lg:py-2 lg:text-[15px]";

/** Área de texto que cresce com o conteúdo (onde o navegador permite; senão usa `rows`). */
export const textareaClass = `${inputClass} min-h-20 resize-y field-sizing-content`;

export const labelClass = "block text-[13px] font-medium text-slate-700";

const buttonBase = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3.5 text-[15px] font-semibold transition-colors duration-150 motion-reduce:transition-none ${focusRing}`;

/** Ação principal: azul da marca; desabilitado fica cinza (nunca azul apagado). */
export const primaryButton = `${buttonBase} bg-brand text-white hover:bg-brand-dark active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:active:translate-y-0`;

export const secondaryButton = `${buttonBase} border border-slate-300 bg-white text-ink hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white disabled:text-slate-400`;

export const textButton = `inline-flex min-h-11 items-center gap-1.5 rounded-lg text-[13px] font-medium hover:underline underline-offset-2 disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline ${focusRing}`;

/** Título de painel: 15px, Jakarta 600, frase normal (sem caixa alta). */
export const panelTitle = "font-display text-[15px] font-semibold tracking-[-0.01em] text-ink";

/** Miniatura de foto. Usa <img> porque as fotos vêm de hosts externos (bancos e storage). */
export function Thumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- miniatura de host externo; next/image exigiria remotePatterns de cada provedor
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`block bg-slate-100 object-cover ${className ?? ""}`}
    />
  );
}
