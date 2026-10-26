// Esqueleto da página Google reviews: aparece na hora do clique (a página lê o banco a cada
// pedido), para o toque em "Google reviews" nunca parecer que não funcionou.

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function ReviewsLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading Google reviews…</span>
      <div aria-hidden="true">
        <div className={`${block} h-9 w-56`} />
        <div className={`${block} mt-3 h-5 w-96 max-w-full`} />
        <div className={`${block} mt-10 h-7 w-64`} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="glass grid gap-3 rounded-2xl p-4">
              <div className={`${block} h-24 rounded-xl`} />
              <div className={`${block} h-4 w-2/3`} />
              <div className={`${block} h-3 w-full`} />
            </div>
          ))}
        </div>
        <div className="glass mt-10 grid gap-4 rounded-2xl p-5 sm:p-6">
          <div className={`${block} h-6 w-48`} />
          <div className={`${block} h-11 w-full rounded-xl`} />
          <div className="flex gap-2">
            <div className={`${block} h-11 w-24 rounded-full`} />
            <div className={`${block} h-11 w-28 rounded-full`} />
          </div>
        </div>
      </div>
    </div>
  );
}
