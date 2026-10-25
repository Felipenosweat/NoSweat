// Esqueleto da lista de clientes: aparece na hora do clique (a página lê o banco a cada pedido),
// para o toque em "Clients" nunca parecer que não funcionou.

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function ClientsLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your clients…</span>
      <div aria-hidden="true">
        <div className={`${block} h-9 w-40`} />
        <div className={`${block} mt-3 h-5 w-72 max-w-full`} />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${block} h-32`} />
          ))}
        </div>
        <div className={`${block} mt-8 h-11 w-full rounded-full`} />
        <div className="glass mt-4 grid gap-1 rounded-2xl p-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-3">
              <div className={`${block} size-11 rounded-full`} />
              <div className="grid flex-1 gap-2">
                <div className={`${block} h-4 w-1/3`} />
                <div className={`${block} h-3 w-1/2`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
