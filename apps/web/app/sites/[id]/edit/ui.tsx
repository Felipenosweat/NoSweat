// Peças visuais compartilhadas pelos painéis do editor.

export const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const secondaryButton = `inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const primaryButton = `inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const textButton = `inline-flex min-h-11 items-center rounded text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline ${focusRing}`;

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
