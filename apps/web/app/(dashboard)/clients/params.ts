import type { ClientStage } from "@nosweat/schema";
import { isClientSort, isClientStage, type ClientSort } from "@/lib/clients";

// Filtros da lista de clientes na URL (?q=&stage=&sort=&view=&due=). Puro: serve para a página
// (server component) e para a barra de filtros (client component).

export type ClientsView = "list" | "board";

export type ClientsParams = {
  q: string;
  stage: ClientStage | null;
  sort: ClientSort;
  view: ClientsView;
  /** Só os retornos de hoje e os vencidos. */
  due: boolean;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Primeiro valor de um parâmetro da URL (pode vir repetido). */
function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Lê os filtros da URL; valor desconhecido volta ao padrão. */
export function parseClientsParams(raw: RawSearchParams): ClientsParams {
  const stage = first(raw.stage);
  const sort = first(raw.sort);
  return {
    q: first(raw.q).trim().slice(0, 100),
    stage: isClientStage(stage) ? stage : null,
    sort: isClientSort(sort) ? sort : "recent",
    view: first(raw.view) === "board" ? "board" : "list",
    due: first(raw.due) === "1",
  };
}

/** URL da lista com os filtros (os padrões não entram, para o link ficar curto). */
export function clientsHref(params: ClientsParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.stage) search.set("stage", params.stage);
  if (params.sort !== "recent") search.set("sort", params.sort);
  if (params.view !== "list") search.set("view", params.view);
  if (params.due) search.set("due", "1");
  const query = search.toString();
  return query ? `/clients?${query}` : "/clients";
}

/** Filtros padrão (lista inteira). */
export const DEFAULT_CLIENTS_PARAMS: ClientsParams = {
  q: "",
  stage: null,
  sort: "recent",
  view: "list",
  due: false,
};
