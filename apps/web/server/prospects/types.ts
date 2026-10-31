import type { ProspectStatus, WebsiteStatus } from "@/lib/prospects";

// Tipos da prospecção (tabela public.prospects, migration 0025).

/** Empresa como o Google Places devolve (já traduzida para o nosso formato). */
export type PlaceBusiness = {
  placeId: string;
  name: string;
  /** Tipo principal do Places ("Plumber"), ou `null`. */
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  /** "Monday: 8:00 AM – 5:00 PM", ... (vazio quando o Places não tem horário). */
  hours: string[];
  /** E-mail público listado na própria fonte (o OSM às vezes tem; o Google não dá). */
  email?: string | null;
};

export type ProspectRecord = {
  id: string;
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  hours: string[];
  websiteStatus: WebsiteStatus;
  websiteNotes: string | null;
  email: string | null;
  rating: number | null;
  reviewCount: number | null;
  search: string | null;
  status: ProspectStatus;
  siteId: string | null;
  previewToken: string | null;
  notes: string | null;
  lastFetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** O que uma busca grava: os dados do Places + o resultado da conferência do site. */
export type ProspectUpsert = PlaceBusiness & {
  websiteStatus: WebsiteStatus;
  websiteNotes: string | null;
  email: string | null;
  search: string | null;
  lastFetchedAt: string;
};

/** Campos que o admin (ou o fluxo da prévia) muda depois. */
export type ProspectPatch = Partial<
  Pick<
    ProspectRecord,
    | "status"
    | "siteId"
    | "previewToken"
    | "notes"
    | "name"
    | "category"
    | "address"
    | "city"
    | "state"
    | "phone"
    | "website"
    | "hours"
    | "rating"
    | "reviewCount"
    | "lastFetchedAt"
  >
>;
