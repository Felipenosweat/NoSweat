// Esqueleto da equipe: aparece na hora do toque em "Team" (a página lê o banco a cada pedido).

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function TeamLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your team…</span>
      <div aria-hidden="true">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={`${block} h-9 w-28`} />
            <div className={`${block} mt-3 h-5 w-80 max-w-full`} />
          </div>
          <div className={`${block} h-11 w-44 rounded-full`} />
        </div>
        <div className={`${block} mt-8 h-7 w-32`} />
        <div className="glass mt-3 grid gap-1 rounded-2xl p-2">
          {[0, 1, 2].map((i) => (
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
