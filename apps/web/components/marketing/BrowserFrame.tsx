import type { ReactNode } from "react";

/**
 * Moldura de janela de navegador em volta de uma miniatura de site.
 * Sem "bolinhas" de janela: só a barra de endereço, que mostra o endereço real de publicação.
 */
export function BrowserFrame({
  children,
  address,
  className = "",
}: {
  children: ReactNode;
  address: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
      <div className="border-b border-slate-200 bg-surface px-3 py-2">
        <p className="truncate rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
          {address}
        </p>
      </div>
      {children}
    </div>
  );
}
