"use client";

import { useSyncExternalStore } from "react";
import { pageTitle } from "@/components/DashboardUi";

const subscribe = () => () => {};

// O servidor não sabe o fuso de quem está vendo: no HTML do servidor usamos o horário da costa
// leste dos EUA e, no navegador, o horário local (a primeira renderização no cliente repete a do
// servidor, então não há erro de hidratação).
const SERVER_TIME_ZONE = "America/New_York";

function partOfDay(hour: number): "morning" | "afternoon" | "evening" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

/** "Good morning, Maria." + a data de hoje. */
export function Greeting({ firstName, nowIso }: { firstName: string | null; nowIso: string }) {
  const onClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const now = new Date(nowIso);
  const timeZone = onClient ? undefined : SERVER_TIME_ZONE;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(now),
  );
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(now);

  // Como a tela "Hoje" do iOS: a data pequena em cima, a saudação grande embaixo.
  return (
    <div>
      <p className="text-[13px] leading-5 font-semibold tracking-[0.04em] text-slate-500 uppercase tabular-nums">
        <time dateTime={nowIso}>{date}</time>
      </p>
      <h1 className={`mt-1 ${pageTitle}`}>
        Good {partOfDay(hour)}
        {firstName ? `, ${firstName}` : ""}.
      </h1>
    </div>
  );
}
