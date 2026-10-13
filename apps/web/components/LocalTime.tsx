"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Data e hora no fuso de quem está vendo. O servidor não sabe o fuso do cliente: no HTML do
 * servidor sai em UTC e, assim que a página carrega no navegador, troca para o horário local
 * (sem erro de hidratação, porque a primeira renderização no cliente repete a do servidor).
 */
export function LocalTime({ iso, className }: { iso: string; className?: string }) {
  const onClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const format = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    ...(onClient ? {} : { timeZone: "UTC", timeZoneName: "short" }),
  });
  return (
    <time dateTime={iso} className={className}>
      {format.format(new Date(iso))}
    </time>
  );
}
