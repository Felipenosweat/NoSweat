// Esqueleto da ficha do cliente: aparece na hora do toque na lista (a ficha lê o banco).

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function ClientLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading client…</span>
      <div aria-hidden="true">
        <div className={`${block} h-9 w-24 rounded-full`} />
        <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8">
          <div className="glass grid gap-4 rounded-2xl p-5">
            <div className={`${block} size-16 rounded-full`} />
            <div className={`${block} h-7 w-2/3`} />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`${block} h-16`} />
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className={`${block} h-40`} />
            <div className={`${block} h-24`} />
            <div className={`${block} h-24`} />
          </div>
        </div>
      </div>
    </div>
  );
}
