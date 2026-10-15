import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

// Molduras das demonstrações da landing: navegador, celular e o selo "Example".
// Tudo que aparece dentro delas é de um negócio fictício, por isso o selo em cada uma.

/** Selo pequeno que marca a interface como exemplo (negócio e dados inventados). */
export function ExampleTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] leading-4 font-semibold text-slate-500 ${className}`}
    >
      Example
    </span>
  );
}

/**
 * Janela de navegador com barra de endereço. `ratio` = largura/altura da área da página
 * (o CSS `.st-frame` limita a largura para caber na altura do palco).
 */
export function BrowserFrame({
  url,
  ratio,
  badge,
  className = "",
  children,
}: {
  url: ReactNode;
  ratio: number;
  /** Selo à direita da barra (ex.: "Published"). */
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`st-frame relative flex flex-col overflow-hidden rounded-2xl bg-white text-ink shadow-[0_40px_100px_-30px_rgb(0_0_0/.7)] ${className}`}
      style={{ "--ar": ratio } as CSSProperties}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-slate-200 bg-surface px-3">
        <span className="flex gap-1.5">
          <span className="size-2 rounded-full bg-slate-300" />
          <span className="size-2 rounded-full bg-slate-300" />
          <span className="size-2 rounded-full bg-slate-300" />
        </span>
        <span className="ml-1 grid min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs leading-5 text-slate-600">
          {url}
        </span>
        {badge}
        <ExampleTag />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ aspectRatio: ratio }}>
        {children}
      </div>
    </div>
  );
}

/** Celular com a captura de um site de exemplo (520×1125). */
export function PhoneFrame({
  src,
  alt = "",
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] bg-slate-950 p-1.5 shadow-[0_30px_80px_-20px_rgb(0_0_0/.8)] ring-1 ring-white/15 sm:p-2 ${className}`}
    >
      <div className="overflow-hidden rounded-[1.6rem] bg-white">
        <Image
          src={src}
          alt={alt}
          width={520}
          height={1125}
          sizes={sizes}
          priority={priority}
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}
