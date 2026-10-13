import type { ReactNode } from "react";
import { frameShadow } from "./styles";

/**
 * Moldura de janela de navegador em volta de uma imagem do produto.
 * Sem "bolinhas" de janela: só a barra de endereço (h-10), que mostra o endereço real.
 * A barra tem altura fixa porque as anotações do hero medem a partir dela.
 */
export function BrowserFrame({
  children,
  address,
  className = "",
}: {
  children: ReactNode;
  address: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${frameShadow} ${className}`}
    >
      <div className="flex h-10 items-center border-b border-slate-200 bg-surface px-3">
        <p className="w-full truncate rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
          {address}
        </p>
      </div>
      {children}
    </div>
  );
}
