import { addDays, isDateKey, startOfWeek } from "./time";

// Filtros da agenda na URL (?view=&date=&team=&new=1). Puro: serve para a página (server
// component) e para a barra da agenda (client component).

export type ScheduleView = "week" | "day" | "list";

export const SCHEDULE_VIEWS: readonly ScheduleView[] = ["week", "day", "list"];

/** Filtro de equipe: um membro (id) ou os serviços sem ninguém. `null` = todo mundo. */
export const UNASSIGNED = "unassigned";

export type ScheduleParams = {
  /** `null` = automático: semana no computador, lista no celular (decidido pelo CSS). */
  view: ScheduleView | null;
  /** Dia de referência ("AAAA-MM-DD"); `null` = hoje. */
  date: string | null;
  team: string | null;
  /** Abre a folha "New job" ao chegar (atalho da página inicial). */
  openNew: boolean;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseScheduleParams(raw: RawSearchParams): ScheduleParams {
  const view = first(raw.view);
  const date = first(raw.date);
  const team = first(raw.team).trim().slice(0, 64);
  return {
    view: (SCHEDULE_VIEWS as readonly string[]).includes(view) ? (view as ScheduleView) : null,
    date: isDateKey(date) ? date : null,
    team: team || null,
    openNew: first(raw.new) === "1",
  };
}

/** URL da agenda (os padrões não entram, para o link ficar curto). */
export function scheduleHref(params: Omit<ScheduleParams, "openNew"> & { openNew?: boolean }) {
  const search = new URLSearchParams();
  if (params.view) search.set("view", params.view);
  if (params.date) search.set("date", params.date);
  if (params.team) search.set("team", params.team);
  if (params.openNew) search.set("new", "1");
  const query = search.toString();
  return query ? `/schedule?${query}` : "/schedule";
}

/**
 * Dias mostrados: um na visão "Dia", a semana (domingo a sábado) nas outras. A lista do celular
 * usa a mesma semana da grade, então trocar de visão não muda o período.
 */
export function visibleRange(
  view: ScheduleView | null,
  date: string,
): { start: string; end: string } {
  if (view === "day") return { start: date, end: addDays(date, 1) };
  const start = startOfWeek(date);
  return { start, end: addDays(start, 7) };
}

/** Data do botão "‹"/"›": um dia na visão "Dia", uma semana nas outras. */
export function stepDate(view: ScheduleView | null, date: string, direction: 1 | -1): string {
  return addDays(date, view === "day" ? direction : 7 * direction);
}
