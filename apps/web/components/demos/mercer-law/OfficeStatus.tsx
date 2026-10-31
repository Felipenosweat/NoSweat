"use client";

import { useEffect, useState } from "react";
import { OPEN_BY_WEEKDAY } from "./content";

// "Open now · until 5 PM" calculado no fuso de Columbus (America/New_York). No servidor (e
// antes de hidratar) mostra o horário fixo, para não haver diferença entre servidor e cliente.

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hourLabel(hour: number) {
  const h = hour % 12 || 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}

export function officeStatus(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const day = DAYS.indexOf(get("weekday"));
  const time = Number(get("hour")) + Number(get("minute")) / 60;
  const today = OPEN_BY_WEEKDAY[day];
  if (today && time >= today.open && time < today.close)
    return `Open now, until ${hourLabel(today.close)}`;
  if (today && time < today.open) return `Closed now, opens at ${hourLabel(today.open)}`;
  for (let step = 1; step <= 7; step++) {
    const next = (day + step) % 7;
    const hours = OPEN_BY_WEEKDAY[next];
    if (hours)
      return `Closed now, opens ${step === 1 ? "tomorrow" : DAYS[next]} at ${hourLabel(hours.open)}`;
  }
  return "Mon–Thu 9 AM – 5 PM · Fri 9 AM – 1 PM";
}

export function OfficeStatus({ className = "" }: { className?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(officeStatus());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className={className}>
      <span
        aria-hidden="true"
        className={`mr-2 inline-block size-1.5 rounded-full align-middle ${label?.startsWith("Open") ? "bg-current" : "border border-current"}`}
      />
      {label ?? "Mon–Thu 9 AM – 5 PM · Fri 9 AM – 1 PM"}
    </span>
  );
}
