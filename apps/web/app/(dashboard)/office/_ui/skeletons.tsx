import { skeletonBlock as block } from "./ui";

// Esqueletos do escritório: aparecem na hora do toque (as páginas leem o banco a cada pedido),
// para o clique nunca parecer que não funcionou.

/** Lista (orçamentos, faturas, tabela de preços): título, números, filtro e linhas. */
export function ListSkeleton({ label, tiles = 3 }: { label: string; tiles?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className={`${block} h-9 w-44`} />
        <div className={`${block} mt-3 h-5 w-72 max-w-full`} />
        {tiles > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: tiles }, (_, i) => (
              <div key={i} className={`${block} h-24 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`} />
            ))}
          </div>
        )}
        <div className={`${block} mt-8 h-11 w-full rounded-full`} />
        <div className={`${block} mt-3 h-10 w-80 max-w-full rounded-full`} />
        <div className="glass mt-4 grid gap-1 rounded-2xl p-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-3">
              <div className="grid flex-1 gap-2">
                <div className={`${block} h-4 w-1/3`} />
                <div className={`${block} h-3 w-1/2`} />
              </div>
              <div className={`${block} h-4 w-16`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Editor de orçamento/fatura: coluna de itens e lateral de totais. */
export function EditorSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className={`${block} h-9 w-28 rounded-full`} />
        <div className={`${block} mt-3 h-10 w-56`} />
        <div className="mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
          <div className="grid gap-4">
            <div className="glass grid gap-3 rounded-2xl p-5">
              <div className={`${block} h-5 w-32`} />
              <div className={`${block} h-28`} />
              <div className={`${block} h-28`} />
            </div>
            <div className={`${block} h-36`} />
          </div>
          <div className="grid gap-4">
            <div className={`${block} h-20`} />
            <div className={`${block} h-48`} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Formulário de configurações. */
export function FormSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="max-w-2xl">
        <div className={`${block} h-9 w-44`} />
        <div className={`${block} mt-3 h-5 w-72 max-w-full`} />
        <div className={`${block} mt-6 h-10 w-72 max-w-full rounded-full`} />
        <div className="glass mt-8 grid gap-5 rounded-2xl p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid gap-2">
              <div className={`${block} h-4 w-28`} />
              <div className={`${block} h-11`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
