import type { ReactNode } from "react";
import { cx } from "@/components/glass";

// Esqueletos de vidro do painel do admin: os loading.tsx de cada aba e os `fallback` das seções
// em Suspense usam estas peças, com a mesma forma da página de verdade (cabeçalho, ladrilhos,
// barra de filtros, tabela no computador e cartões no celular). Assim o clique numa aba pinta na
// hora e nada "pula" quando os dados chegam. Sem "use client".

/** Bloco cinza que pulsa (parado com "reduzir movimento"). */
export const skeletonBlock = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

function Block({ className }: { className?: string }) {
  return <div className={cx(skeletonBlock, className)} />;
}

/** Envoltório do esqueleto da página: avisa o leitor de tela uma vez e esconde as peças. */
export function SkeletonPage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid grid-cols-1 gap-6">
        {children}
      </div>
    </div>
  );
}

/** Cabeçalho da página (título, contagem e apoio), como o AdminPageHeader. */
export function HeaderSkeleton({ titleWidth = "w-48" }: { titleWidth?: string }) {
  return (
    <div>
      <Block className={cx("h-9 rounded-xl", titleWidth)} />
      <Block className="mt-3 h-5 w-[34rem] max-w-full rounded-lg" />
      <Block className="mt-2 h-5 w-[22rem] max-w-full rounded-lg" />
    </div>
  );
}

/** Um ladrilho de número (StatTile) em espera: número, rótulo e a linha de apoio. */
export function TileSkeleton() {
  return (
    <div className="glass flex h-full flex-col rounded-2xl p-4 sm:p-5">
      <Block className="h-7 w-16 rounded-lg sm:h-8" />
      <Block className="mt-2 h-4 w-24 rounded-md" />
      <Block className="mt-2 h-3.5 w-32 max-w-full rounded-md" />
    </div>
  );
}

/** `count` ladrilhos como `<li>` (para ficar dentro da grade `<ul>` da página). */
export function TileItemsSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} aria-hidden="true">
          <TileSkeleton />
        </li>
      ))}
    </>
  );
}

/** Barra de filtros/busca (GlassToolbar sem grudar). */
export function ToolbarSkeleton({ segments = 3 }: { segments?: number }) {
  return (
    <div className="glass-strong flex flex-wrap items-center gap-2 rounded-[26px] px-2 py-2 sm:px-2.5">
      <Block className="h-11 w-full rounded-full sm:h-10 sm:w-72" />
      <div className="flex w-full gap-1 sm:ml-auto sm:w-auto">
        {Array.from({ length: segments }, (_, i) => (
          <Block key={i} className="h-11 flex-1 rounded-full sm:h-9 sm:w-24 sm:flex-none" />
        ))}
      </div>
    </div>
  );
}

/** Tabela de vidro (computador) e cartões (celular), como AccountsTable e SitesTable. */
export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="grid gap-3">
      <div className="glass hidden overflow-hidden rounded-2xl md:block">
        <div className="flex gap-6 px-5 py-3.5">
          {Array.from({ length: columns }, (_, i) => (
            <Block key={i} className={cx("h-3.5 rounded-md", i === 0 ? "w-40" : "w-16")} />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="flex items-center gap-6 border-t border-(--glass-rim) px-5 py-4"
          >
            <div className="grid w-40 gap-1.5">
              <Block className="h-4 w-full rounded-md" />
              <Block className="h-3 w-24 rounded-md" />
            </div>
            {Array.from({ length: columns - 1 }, (_, i) => (
              <Block key={i} className="h-4 w-16 rounded-md" />
            ))}
          </div>
        ))}
      </div>
      <ul className="grid gap-2.5 md:hidden">
        {Array.from({ length: Math.min(rows, 4) }, (_, i) => (
          <li key={i} className="glass-inset grid gap-2 rounded-xl p-4">
            <Block className="h-5 w-2/3 rounded-md" />
            <Block className="h-6 w-28 rounded-full" />
            <Block className="h-3.5 w-1/2 rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Cartão de vidro com título e algumas linhas (painéis da visão geral e da ficha). */
export function CardSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cx("glass rounded-2xl p-5 sm:p-6", className)}>
      <Block className="h-5 w-40 rounded-md" />
      <div className="mt-4 grid gap-3">
        {Array.from({ length: lines }, (_, i) => (
          <Block key={i} className={cx("h-4 rounded-md", i % 2 === 0 ? "w-full" : "w-4/5")} />
        ))}
      </div>
    </div>
  );
}
