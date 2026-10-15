import Image from "next/image";
import type { CSSProperties } from "react";
import { SparklesIcon } from "@/components/marketing/icons";

// Cena "Post": o calendário de /social. A IA preenche o mês (marcas âmbar "Needs approval"),
// o dono aprova e o post vira "Scheduled" (azul da marca). As classes `st-*` são os ganchos das
// batidas da rolagem (landing.css). Negócio, textos e datas de exemplo.

// Novembro de 2026 começa num domingo: 30 dias em 5 semanas.
const POST_DAYS = [3, 5, 7, 10, 12, 14, 17, 19, 21, 24, 26, 28];
/** Posts que o dono já aprovou na última batida. */
const APPROVED = new Set([3, 5, 7, 10, 12]);
const SELECTED = 12;
const HANDLE = "sparkleandco_cleaning";

export function SocialCalendar() {
  const days = Array.from({ length: 35 }, (_, i) => (i < 30 ? i + 1 : null));
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-lg font-bold tracking-[-0.02em]">November 2026</p>
        <span className="st-fill inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white">
          <SparklesIcon className="size-3.5" />
          Fill my month with AI
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={index}>{day}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const order = day === null ? -1 : POST_DAYS.indexOf(day);
          return (
            <span
              key={index}
              className={`relative h-[clamp(2.25rem,6.5svh,3.75rem)] rounded-md p-1 text-[11px] leading-none text-slate-600 tabular-nums ${
                day === null
                  ? ""
                  : day === SELECTED
                    ? "bg-brand/[0.06] ring-2 ring-brand"
                    : "border border-slate-200"
              }`}
            >
              {day}
              {order >= 0 && (
                <span
                  className="absolute inset-x-1 bottom-1 h-1.5"
                  style={{ "--i": order } as CSSProperties}
                >
                  <span className="st-dot absolute inset-0 rounded-full bg-amber-500" />
                  {day !== null && APPROVED.has(day) && (
                    <span className="st-dot-ok absolute inset-0 rounded-full bg-brand" />
                  )}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-amber-500" />
          Needs approval
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-brand" />
          Scheduled
        </span>
      </p>
    </div>
  );
}

/** Prévia do post do dia 12: espera aprovação e, aprovado, fica agendado. */
export function SocialPost() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-ink shadow-[0_20px_40px_-20px_rgb(7_27_51/.35)]">
      <div className="relative aspect-[16/9] w-full bg-slate-100">
        <Image
          src="/photos/cleaner.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 240px, 50vw"
          className="object-cover"
        />
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold">{HANDLE}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-600">
          Moving out this month? We’ll get your deposit back.
        </p>
        <div className="mt-2 grid items-center text-xs">
          <p className="st-status-wait col-start-1 row-start-1 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Needs approval
            </span>
            <span className="rounded-md bg-brand px-2 py-1 font-semibold text-white">Approve</span>
          </p>
          <p className="st-status-ok col-start-1 row-start-1 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
              <span className="size-1.5 rounded-full bg-brand" />
              Scheduled
            </span>
            <span className="text-slate-500 tabular-nums">Thu, Nov 12 · 10 AM</span>
          </p>
        </div>
      </div>
    </div>
  );
}
