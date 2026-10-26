// Esqueleto da agenda: aparece na hora do toque em "Schedule" (a página lê o banco a cada pedido).
// No celular imita a lista; no computador, a grade da semana.

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function ScheduleLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your schedule…</span>
      <div aria-hidden="true">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={`${block} h-9 w-40`} />
            <div className={`${block} mt-3 h-5 w-72 max-w-full`} />
          </div>
          <div className={`${block} h-11 w-32 rounded-full`} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className={`${block} h-11 w-40 rounded-full`} />
          <div className={`${block} h-6 w-44`} />
          <div className={`${block} h-11 w-full rounded-full sm:ml-auto sm:w-64`} />
        </div>
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${block} h-11 w-24 rounded-full sm:h-9`} />
          ))}
        </div>

        {/* Celular: lista. */}
        <div className="mt-4 grid gap-4 lg:hidden">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className={`${block} h-5 w-36`} />
              <div className="glass mt-2 grid gap-1 rounded-2xl p-2">
                {[0, 1].map((j) => (
                  <div key={j} className="flex items-center gap-3 px-2 py-3">
                    <div className={`${block} h-9 w-14`} />
                    <div className="grid flex-1 gap-2">
                      <div className={`${block} h-4 w-1/2`} />
                      <div className={`${block} h-3 w-1/3`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Computador: grade da semana. */}
        <div className="glass mt-4 hidden rounded-2xl p-3 lg:block">
          <div className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] gap-2">
            <span />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`${block} h-12`} />
            ))}
          </div>
          <div className={`${block} mt-3 h-[30rem]`} />
        </div>
      </div>
    </div>
  );
}
