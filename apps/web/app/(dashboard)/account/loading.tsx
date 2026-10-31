import { skeletonBlock as block } from "../office/_ui/ui";

// Esqueleto da página Account: aparece na hora do toque (a página lê a sessão a cada pedido),
// com os mesmos painéis (e-mail, nome, senha, apagar conta) para nada pular quando ela chega.

export default function AccountLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your account…</span>
      <div aria-hidden="true">
        <div className={`${block} h-10 w-40 rounded-xl lg:h-12`} />
        <div className={`${block} mt-2 h-5 w-72 max-w-full rounded-md`} />
        <div className="mt-8 grid gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass grid gap-3 rounded-2xl p-5 sm:p-6">
              <div className={`${block} h-6 w-36 rounded-md`} />
              <div className={`${block} h-4 w-64 max-w-full rounded-md`} />
              {i > 0 && <div className={`${block} h-12 w-full rounded-xl`} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
