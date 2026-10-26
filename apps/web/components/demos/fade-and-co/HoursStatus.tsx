"use client";

import { useEffect, useState } from "react";
import type { OpenHours } from "./content";

// "Open now / Closed now" pela hora de Chicago, calculado só no navegador, e marca a linha de
// hoje no quadro de horário (linhas com data-f-days="2,3,4,5"). Sem JS: o quadro continua igual
// e esta linha não aparece. É dedução do horário do dono, não um fato novo.

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function clock(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`;
}

function chicagoNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
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

export function HoursStatus({ hours }: { hours: OpenHours }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const update = () => {
      const now = chicagoNow();
      for (const row of document.querySelectorAll<HTMLElement>("[data-f-days]")) {
        const days = (row.dataset.fDays ?? "").split(",").map(Number);
        if (days.includes(now.day)) row.dataset.today = "";
        else delete row.dataset.today;
      }
      const today = hours[now.day];
      if (today && now.minutes >= today.open && now.minutes < today.close) {
        setText(`Open now in Chicago · until ${clock(today.close)}`);
        return;
      }
      for (let i = 0; i < 8; i++) {
        const day = (now.day + i) % 7;
        const open = hours[day];
        if (!open || (i === 0 && now.minutes >= open.open)) continue;
        setText(
          `Closed now · opens ${i === 0 ? "today" : i === 1 ? "tomorrow" : WEEKDAYS[day]} at ${clock(open.open)}`,
        );
        return;
      }
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [hours]);

  if (!text) return null;
  return (
    <p className="f-status" aria-live="polite">
      <span
        aria-hidden="true"
        className="f-status-dot"
        data-open={text.startsWith("Open") || undefined}
      />
      {text}
    </p>
  );
}
