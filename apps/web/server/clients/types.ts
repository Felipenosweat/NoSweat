import type {
  Client,
  ClientActivity,
  ClientActivityKind,
  ClientSource,
  ClientStage,
} from "@nosweat/schema";

// Tipos internos do módulo de clientes (tabelas da migration 0017). O que sai para o navegador é
// `Client` / `ClientActivity` de @nosweat/schema; aqui só se acrescenta o dono.

export type ClientRecord = Client & { ownerId: string };

export type ClientActivityRecord = ClientActivity & {
  ownerId: string;
  /** Só em `payment`: o pagamento do escritório que gerou o item (coluna da migration 0023). */
  paymentId?: string | null;
};

export type NewClient = {
  ownerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  stage: ClientStage;
  source: ClientSource;
  siteId: string | null;
  notes: string;
  followUpOn: string | null;
  /** Etiquetas do dono (padrão: nenhuma). */
  tags?: string[];
  /** Padrão: agora. */
  lastActivityAt?: string;
};

/** Campos que podem mudar depois de criar o cliente (`undefined` = não mexe). */
export type ClientPatch = Partial<
  Pick<
    Client,
    | "name"
    | "email"
    | "phone"
    | "address"
    | "stage"
    | "notes"
    | "followUpOn"
    | "lastActivityAt"
    | "totalJobsCents"
    | "jobsCount"
    | "tags"
  >
>;

export type NewClientActivity = {
  ownerId: string;
  clientId: string;
  kind: ClientActivityKind;
  body: string;
  amountCents: number | null;
  leadId: string | null;
  siteId: string | null;
  /** Só em `payment`: o id do pagamento (para apagar o item junto com ele). */
  paymentId?: string | null;
  /** Padrão: agora. */
  occurredAt?: string;
};

/** E-mail para comparar: minúsculas, sem espaços nas pontas. `null` se vazio. */
export function normalizeEmail(email: string | null | undefined): string | null {
  const value = (email ?? "").trim().toLowerCase();
  return value || null;
}

/** Telefone para comparar: só dígitos, sem o "1" do país em números dos EUA com 11 dígitos. */
export function normalizePhone(phone: string | null | undefined): string | null {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits || null;
}

/**
 * Etiquetas como o dono digitou, limpas: sem espaços nas pontas, sem vazias e sem repetidas
 * (sem diferença de maiúsculas; fica a primeira grafia). No máximo 10.
 */
export function normalizeTags(tags: readonly string[] | null | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags ?? []) {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, 30);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length === 10) break;
  }
  return out;
}
