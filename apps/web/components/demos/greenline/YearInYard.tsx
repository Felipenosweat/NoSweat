"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ALMANAC, MONTHS, MONTH_NAMES, SEASONS, type SeasonId } from "./content";
import { Photo } from "./ui";

// "O ano no quintal": a assinatura da Greenline. Um calendário de 12 meses (como o almanaque de
// um jardineiro) com o que a equipe faz em cada época, tirado do brief, e quatro abas de
// estação. A estação escolhida pinta as colunas dos seus meses, troca a foto (dissolve) e a
// lista de tarefas. Ao abrir, a aba vai para a estação de hoje e uma linha marca o dia no
// calendário (calculado no navegador, depois da hidratação, para não divergir do servidor).

function seasonOf(month: number): SeasonId {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export function YearInYard() {
  const id = useId();
  const [active, setActive] = useState<SeasonId>("spring");
  const [today, setToday] = useState<{ pos: number; label: string } | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth();
    const days = new Date(now.getFullYear(), month + 1, 0).getDate();
    // Abre na estação de hoje (uma vez, depois da hidratação). Fora do corpo do efeito
    // (regra react-hooks/set-state-in-effect).
    const frame = requestAnimationFrame(() => {
      setActive(seasonOf(month));
      setToday({
        pos: ((month + (now.getDate() - 0.5) / days) / 12) * 100,
        label: `${MONTH_NAMES[month]} ${now.getDate()}`,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const season = SEASONS.find((item) => item.id === active) ?? SEASONS[0]!;

  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    let next = index + delta;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = SEASONS.length - 1;
    else if (!delta) return;
    event.preventDefault();
    next = (next + SEASONS.length) % SEASONS.length;
    setActive(SEASONS[next]!.id);
    tabs.current[next]?.focus();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Abas de estação */}
      <div
        role="tablist"
        aria-label="Seasons"
        className="grid grid-cols-4 border-y border-[var(--g-ink)]/15 lg:col-span-12"
      >
        {SEASONS.map((item, index) => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${item.id}`}
              aria-selected={on}
              aria-controls={`${id}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(event) => onKey(event, index)}
              data-on={on || undefined}
              className="g-season-tab g-focus relative flex min-h-[64px] flex-col items-start justify-center gap-1 px-2 py-3 text-left sm:px-4 lg:py-5"
            >
              <span className="g-display text-[19px] leading-none sm:text-[28px] lg:text-[34px]">
                {item.name}
              </span>
              <span className="hidden text-[13px] text-[var(--g-ink)]/75 tabular-nums sm:block">
                {item.months}
              </span>
            </button>
          );
        })}
      </div>

      {/* Foto e tarefas da estação */}
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="grid gap-10 lg:col-span-12 lg:grid-cols-12 lg:gap-12"
      >
        <div className="relative grid self-start lg:sticky lg:top-28 lg:col-span-5">
          <div className="g-season-frame relative col-start-1 row-start-1 aspect-[4/3] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
            {SEASONS.map((item) => (
              <Photo
                key={item.id}
                photo={item.photo}
                sizes="(min-width: 1024px) 36vw, 100vw"
                ratio={0.8}
                alt={item.id === active ? item.photo.alt : ""}
                className="g-season-img absolute inset-0 size-full object-cover"
                style={{ opacity: item.id === active ? 1 : 0 }}
              />
            ))}
          </div>
          <p
            aria-hidden="true"
            className="g-caps absolute top-4 left-4 bg-[var(--g-paper)] px-3 py-1.5 text-[11px] text-[var(--g-ink)]"
          >
            {season.months}
          </p>
        </div>
        <div className="lg:col-span-7">
          {/* O calendário */}
          <figure aria-labelledby={`${id}-cap`}>
            <figcaption id={`${id}-cap`} className="sr-only">
              What Greenline does in each month of the year.
            </figcaption>
            <div className="g-almanac relative">
              {/* Cabeçalho dos meses */}
              <div className="g-almanac-row" aria-hidden="true">
                <span className="g-almanac-label" />
                <div className="g-almanac-track grid grid-cols-12">
                  {MONTHS.map((month, index) => (
                    <span
                      key={`${month}-${index}`}
                      data-on={season.span.includes(index) || undefined}
                      className="g-month g-caps text-center text-[11px] tabular-nums"
                    >
                      {month}
                    </span>
                  ))}
                </div>
              </div>

              <ul data-g-bars className="relative">
                {/* Colunas da estação ativa, atrás das barras */}
                <li aria-hidden="true" className="g-almanac-row g-almanac-cols pointer-events-none">
                  <span className="g-almanac-label" />
                  <div className="g-almanac-track grid h-full grid-cols-12">
                    {MONTHS.map((month, index) => (
                      <span
                        key={`${month}-col-${index}`}
                        data-on={season.span.includes(index) || undefined}
                        className="g-col"
                      />
                    ))}
                  </div>
                </li>
                {ALMANAC.map((row) => (
                  <li key={row.label} className="g-almanac-row g-almanac-item">
                    <span className="g-almanac-label">
                      <span
                        className={`block text-[15px] leading-tight font-semibold ${row.tone === "clay" ? "text-[var(--g-clay-ink)]" : "text-[var(--g-ink)]"}`}
                      >
                        {row.label}
                      </span>
                      <span className="block text-[13px] leading-snug text-[var(--g-ink)]/75">
                        {row.bars.map((bar) => bar.note).join(" · ")}
                      </span>
                    </span>
                    <span className="g-almanac-track relative block h-3" aria-hidden="true">
                      {row.bars.map((bar) => (
                        <span
                          key={bar.note}
                          data-g-bar
                          data-tone={row.tone ?? "pine"}
                          className="g-bar-fill absolute inset-y-0 rounded-full"
                          style={{
                            left: `${(bar.from / 12) * 100}%`,
                            width: `${((bar.to - bar.from) / 12) * 100}%`,
                          }}
                        />
                      ))}
                    </span>
                  </li>
                ))}
                {today && (
                  <li
                    aria-hidden="true"
                    className="g-almanac-row g-almanac-today pointer-events-none"
                  >
                    <span className="g-almanac-label" />
                    <span className="g-almanac-track relative block h-full">
                      <span className="g-today" style={{ left: `${today.pos}%` }}>
                        <span className="g-caps">Today</span>
                      </span>
                    </span>
                  </li>
                )}
              </ul>
            </div>
            <p className="mt-5 text-[13px] leading-relaxed text-[var(--g-ink)]/75">
              {today ? `Today is ${today.label}. ` : ""}Bars follow the seasons Greenline names, so
              the months are approximate. Weekly mowing runs March through November.
            </p>
          </figure>
          <p
            key={`${active}-line`}
            className="g-display g-fade mt-14 text-[clamp(1.7rem,2.6vw,2.4rem)] leading-[1.08] text-[var(--g-ink)] italic"
          >
            {season.line}
          </p>
          <ul key={`${active}-tasks`} className="g-fade mt-5 space-y-3">
            {season.tasks.map((task) => (
              <li
                key={task}
                className="flex gap-3 text-[17px] leading-[1.55] text-[var(--g-ink)]/85"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.7em] h-px w-4 shrink-0 bg-[var(--g-clay)]"
                />
                {task}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
