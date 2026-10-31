"use client";

import { useEffect, useState } from "react";
import { ALMANAC, MONTH_NAMES } from "./content";
import { Arrow } from "./ui";

// Etiqueta "agora no quintal" do topo: liga a primeira dobra à assinatura (o calendário). Lê a
// data do navegador depois da hidratação e lista as linhas do calendário que valem hoje (as
// mesmas barras de ALMANAC, sem inventar nada). Antes disso não desenha nada.

function partOfMonth(day: number) {
  if (day <= 10) return "Early";
  if (day <= 20) return "Mid";
  return "Late";
}

export function NowInYard({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<{ when: string; work: string[]; watch?: string } | null>(null);

  useEffect(() => {
    const date = new Date();
    const month = date.getMonth();
    const days = new Date(date.getFullYear(), month + 1, 0).getDate();
    const pos = month + (date.getDate() - 0.5) / days;
    const live = ALMANAC.filter((row) => row.bars.some((bar) => pos >= bar.from && pos < bar.to));
    // Fora do corpo do efeito (regra react-hooks/set-state-in-effect).
    const frame = requestAnimationFrame(() =>
      setNow({
        when: `${partOfMonth(date.getDate())} ${MONTH_NAMES[month]}`,
        work: live.filter((row) => row.tone !== "clay").map((row) => row.label),
        watch: live.find((row) => row.tone === "clay")?.label,
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!now) return null;

  return (
    <a
      href="#year"
      className={`g-now g-focus block bg-[var(--g-paper)] px-4 py-3.5 text-[var(--g-ink)] ${className}`}
    >
      <span className="g-caps block text-[10px] text-[var(--g-clay-ink)]">
        In the yard now · {now.when}
      </span>
      <span className="mt-1.5 block text-[15px] leading-snug font-semibold">
        {now.work.length ? now.work.join(" · ") : "No weekly mowing until March"}
      </span>
      {now.watch && (
        <span className="mt-1 block text-[13px] text-[var(--g-ink)]/80">
          Watch for: {now.watch.toLowerCase()}
        </span>
      )}
      <span className="mt-2 flex items-center gap-2 text-[13px] text-[var(--g-pine)]">
        The year in the yard <Arrow className="w-3.5" />
      </span>
    </a>
  );
}
