// Esqueleto do guia: aparece na hora do toque em "read the full guide" ou num "See how it works".

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function GuideLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading the guide…</span>
      <div aria-hidden="true">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={`${block} h-9 w-64 max-w-full`} />
            <div className={`${block} mt-3 h-5 w-96 max-w-full`} />
          </div>
          <div className={`${block} h-11 w-40 rounded-full`} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`${block} h-9 w-24 rounded-full`} />
          ))}
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass grid gap-3 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className={`${block} size-9 rounded-lg`} />
                <div className={`${block} h-5 w-32`} />
              </div>
              <div className={`${block} h-4 w-full`} />
              <div className={`${block} h-4 w-5/6`} />
              <div className={`${block} mt-2 h-4 w-2/3`} />
              <div className={`${block} h-4 w-1/2`} />
              <div className={`${block} mt-3 h-9 w-32 rounded-full`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
