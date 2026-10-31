"use client";

import { useEffect, useState } from "react";

// "Open now / Closed now" pela hora de Phoenix (America/Phoenix, sem horário de verão),
// calculado só no navegador a partir do horário do dono (seg–sex 7–17, sáb 8–12). Sem JS, a
// linha não aparece e o quadro de horário continua igual. É dedução do horário, não fato novo.
// Também marca a linha de hoje no quadro (elementos com data-bs-days="1,2,3,4,5").

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// minutos desde a meia-noite, por dia da semana (0 = domingo); domingo não está na fixture.
const OPEN: Record<number, { open: number; close: number }> = {
  1: { open: 420, close: 1020 },
  2: { open: 420, close: 1020 },
  3: { open: 420, close: 1020 },
  4: { open: 420, close: 1020 },
  5: { open: 420, close: 1020 },
  6: { open: 480, close: 720 },
};

function clock(minutes: number) {
  const h = Math.floor(minutes / 60);
  return `${((h + 11) % 12) + 1} ${h >= 12 ? "PM" : "AM"}`;
}

function phoenixNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Phoenix",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: WEEKDAYS.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function statusText(): { text: string; open: boolean } {
  const now = phoenixNow();
  const today = OPEN[now.day];
  if (today && now.minutes >= today.open && now.minutes < today.close)
    return { text: `Open now · until ${clock(today.close)}`, open: true };
  for (let i = 0; i < 8; i++) {
    const day = (now.day + i) % 7;
    const hours = OPEN[day];
    if (!hours || (i === 0 && now.minutes >= hours.open)) continue;
    const when = i === 0 ? "today" : i === 1 ? "tomorrow" : WEEKDAYS[day];
    return { text: `Closed now · opens ${when} ${clock(hours.open)}`, open: false };
  }
  return { text: "", open: false };
}

export function OpenStatus({
  className = "",
  markToday = false,
}: {
  className?: string;
  markToday?: boolean;
}) {
  const [status, setStatus] = useState<{ text: string; open: boolean } | null>(null);

  useEffect(() => {
    const update = () => {
      setStatus(statusText());
      if (!markToday) return;
      const day = phoenixNow().day;
      for (const row of document.querySelectorAll<HTMLElement>("[data-bs-days]")) {
        const days = (row.dataset.bsDays ?? "").split(",").map(Number);
        if (days.includes(day)) row.dataset.today = "";
        else delete row.dataset.today;
      }
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [markToday]);

  if (!status?.text) return null;
  return (
    <span className={`bs-status ${className}`} data-open={status.open || undefined}>
      <span aria-hidden="true" className="bs-status-dot" />
      {status.text}
      <span className="sr-only"> (Phoenix time)</span>
    </span>
  );
}
