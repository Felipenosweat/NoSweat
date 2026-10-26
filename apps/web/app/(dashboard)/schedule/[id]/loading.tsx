// Esqueleto da ficha do serviço: aparece na hora do toque na agenda (a ficha lê o banco).

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function JobLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading job…</span>
      <div aria-hidden="true">
        <div className={`${block} h-9 w-28 rounded-full`} />
        <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-8">
          <div className="glass grid gap-4 rounded-2xl p-5">
            <div className={`${block} h-6 w-24 rounded-full`} />
            <div className={`${block} h-8 w-2/3`} />
            <div className={`${block} h-14`} />
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${block} h-16`} />
              ))}
            </div>
            <div className={`${block} h-11 rounded-full`} />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${block} h-16`} />
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className={`${block} h-28`} />
            <div className={`${block} h-24`} />
            <div className={`${block} h-36`} />
          </div>
        </div>
      </div>
    </div>
  );
}
