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
  // dateStyle/timeStyle não podem ir junto com timeZoneName (o Intl lança TypeError e a página
  // inteira cai com erro 500); no servidor o "UTC" vai escrito à mão.
  const format = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    ...(onClient ? {} : { timeZone: "UTC" }),
  });
  const text = format.format(new Date(iso));
  return (
    <time dateTime={iso} className={className}>
      {onClient ? text : `${text} UTC`}
    </time>
  );
}
