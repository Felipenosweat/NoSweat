import type { CSSProperties, ReactNode } from "react";
import { ExampleTag } from "./Frames";

// Cena "Your day": cópia pequena e fiel do /dashboard. Mesmos títulos ("Needs you", "Your
// office") e as mesmas frases das linhas (app/(dashboard)/dashboard/page.tsx), com os números da
// história do tour: 12 posts, 5 aprovados → 7 esperando; a Maria Chen com retorno para hoje
// (quinta, 22 de outubro); um pedido novo durante a noite. Negócio e pessoas fictícios.

/** Número em destaque dentro da frase (como `Count` no painel). */
function Count({ value }: { value: number }) {
  return <span className="font-semibold text-brand tabular-nums">{value}</span>;
}

const ROWS: { key: string; text: ReactNode; action: string }[] = [
  {
    key: "drafts",
    text: (
      <>
        <Count value={7} /> posts are waiting for your approval.
      </>
    ),
    action: "Review",
  },
  {
    key: "follow-up",
    text: (
      <>
        Follow up with <span className="font-medium">Maria Chen</span> (due today).
      </>
    ),
    action: "Open",
  },
  {
    key: "new-clients",
    text: (
      <>
        <Count value={1} /> new client is waiting for a reply.
      </>
    ),
    action: "Reply",
  },
  {
    key: "next-post",
    text: (
      <>
        Your next post goes out <span className="font-medium tabular-nums">Tue, Nov 3, 10:00 AM</span>
        .
      </>
    ),
    action: "Calendar",
  },
];

const TILES = [
  { label: "Website", value: 1, unit: "live of 1 site" },
  { label: "Clients", value: 5, unit: "clients · 1 new" },
  { label: "Social", value: 5, unit: "scheduled · next 30 days" },
];

export function DashboardHome() {
  return (
    <div className="text-ink">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg leading-tight font-bold tracking-[-0.03em] sm:text-2xl">
            Good morning, Dana.
          </p>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums max-sm:hidden">
            Thursday, October 22
          </p>
        </div>
        <ExampleTag />
      </div>

      <p className="mt-3 font-display text-[15px] leading-6 font-semibold tracking-[-0.015em] sm:mt-4">
        Needs you
      </p>
      <ul className="mt-1.5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {ROWS.map((row, index) => (
          <li
            key={row.key}
            className={`st-d-row st-d-row-${row.key} flex min-h-11 items-center gap-3 px-3 py-1.5 text-[13px] leading-5 sm:text-sm ${
              index === ROWS.length - 1 ? "max-sm:hidden" : ""
            }`}
            style={{ "--i": index } as CSSProperties}
          >
            <span className="min-w-0 flex-1">{row.text}</span>
            <span className="shrink-0 text-xs font-semibold whitespace-nowrap text-slate-600">
              <span className="max-sm:hidden">{row.action} </span>›
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 font-display text-[15px] leading-6 font-semibold tracking-[-0.015em] sm:mt-4">
        Your office
      </p>
      <ul className="mt-1.5 grid grid-cols-3 gap-2">
        {TILES.map((tile, index) => (
          <li
            key={tile.label}
            className="st-d-tile flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3"
            style={{ "--i": index } as CSSProperties}
          >
            <span className="text-[11px] font-semibold text-slate-600 sm:text-xs">
              {tile.label}
            </span>
            <span className="font-display text-xl leading-none font-bold tracking-[-0.02em] tabular-nums sm:text-[1.75rem]">
              {tile.value}
            </span>
            <span className="truncate text-[11px] text-slate-500">{tile.unit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
