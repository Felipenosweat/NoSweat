import { skeletonBlock as block } from "../office/_ui/ui";

// Esqueleto de Plans and billing: aparece na hora do toque (a página lê a assinatura e os
// créditos a cada pedido), para o clique em "Billing" nunca parecer que não funcionou.

export default function BillingLoading() {
  return (
    <div role="status" aria-live="polite" className="max-w-4xl">
      <span className="sr-only">Loading plans and billing…</span>
      <div aria-hidden="true">
        <div className={`${block} h-10 w-64 max-w-full rounded-xl lg:h-12`} />
        <div className={`${block} mt-2 h-5 w-[28rem] max-w-full rounded-md`} />
        {/* Créditos da IA */}
        <div className="glass mt-8 grid gap-4 rounded-2xl p-5 sm:p-6">
          <div className={`${block} h-6 w-40 rounded-md`} />
          <div className={`${block} h-4 w-72 max-w-full rounded-md`} />
          <div className={`${block} h-3 w-full rounded-full`} />
          <div className="flex gap-2">
            <div className={`${block} h-11 w-32 rounded-full`} />
            <div className={`${block} h-11 w-28 rounded-full`} />
          </div>
        </div>
        {/* Planos */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass grid gap-3 rounded-2xl p-5">
              <div className={`${block} h-5 w-24 rounded-md`} />
              <div className={`${block} h-9 w-28 rounded-lg`} />
              <div className={`${block} h-3 w-full rounded-md`} />
              <div className={`${block} h-3 w-5/6 rounded-md`} />
              <div className={`${block} h-3 w-2/3 rounded-md`} />
              <div className={`${block} mt-2 h-11 w-full rounded-full`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
