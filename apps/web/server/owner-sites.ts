import { cache } from "react";
import { getSiteStore, type LeadRecord, type SiteRecord } from "./store";

// Leituras de sites e pedidos com dedupe por request (`cache()` do React): a moldura do painel,
// a página e o sync dos clientes pedem a mesma lista no mesmo request, e o banco é lido uma vez só.
// Fora de um request do React (rotas da API, testes) o cache não guarda nada: cada chamada lê de
// novo, como antes. Só para LEITURA: quem acabou de gravar deve ler do store direto.
// O array devolvido é compartilhado entre quem chamou: não ordenar nem alterar no lugar.

/** Sites do dono, do mais recente para o mais antigo (igual a `getSiteStore().list`). */
export const listOwnerSites = cache(
  (ownerId: string): Promise<SiteRecord[]> => getSiteStore().list(ownerId),
);

/** Pedidos do formulário de um site (igual a `getSiteStore().listLeads`). */
export const listSiteLeads = cache(
  (siteId: string): Promise<LeadRecord[]> => getSiteStore().listLeads(siteId),
);
