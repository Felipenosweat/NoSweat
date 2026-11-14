import type { ReactNode } from "react";

// Molduras da cena do produto: um navegador (barra com três pontos e o endereço) e um celular.
// Só enfeite: quem usa coloca `aria-hidden` + `inert` no conteúdo. A área de dentro tem a
// proporção fixa (a caixa já existe antes do site carregar: nada pula na página).

export function BrowserFrame({
  address,
  children,
  className = "",
  aspect = "aspect-[16/10]",
}: {
  address: ReactNode;
  children?: ReactNode;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[10px] bg-white shadow-[0_1px_0_rgb(255_255_255/0.06)_inset,0_40px_80px_-40px_rgb(0_0_0/0.45)] ring-1 ring-slate-900/10 ${className}`}
    >
      <div className="flex h-9 items-center gap-3 border-b border-slate-200 bg-slate-50 px-3.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
        </span>
        <span className="mx-auto flex h-6 min-w-0 max-w-[22rem] flex-1 items-center justify-center rounded-md bg-white px-3 text-[12px] font-medium text-slate-600 ring-1 ring-slate-200">
          <span className="truncate">{address}</span>
        </span>
        <span className="w-[42px]" aria-hidden="true" />
      </div>
      <div className={`relative ${aspect} bg-slate-100`}>{children}</div>
    </div>
  );
}

export function PhoneFrame({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[34px] bg-ink p-[7px] shadow-[0_40px_80px_-30px_rgb(7_27_51/0.55)] ${className}`}
    >
      <div className="relative aspect-[390/800] overflow-hidden rounded-[28px] bg-slate-100">
        {children}
      </div>
    </div>
  );
}
