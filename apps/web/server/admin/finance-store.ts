import { ExpenseCategory, ExpenseFrequency, type CompanyExpense } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Custos da própria No Sweat (tabela public.company_expenses, migration 0024). Supabase em
// produção, memória no dev/testes (mesma regra do server/store). Só o painel do admin usa: quem
// chama já conferiu que é admin. A memória começa vazia (o fundador lança os custos de verdade).

export type NewExpense = Pick<
  CompanyExpense,
  "name" | "category" | "amountCents" | "frequency" | "startsOn" | "endsOn" | "notes"
>;

export type ExpensePatch = Partial<NewExpense>;

export interface ExpenseStore {
  /** Todos os custos, do começo mais antigo para o mais novo. */
  list(): Promise<CompanyExpense[]>;
  get(id: string): Promise<CompanyExpense | null>;
  insert(expense: NewExpense): Promise<CompanyExpense>;
  /** `null` se o custo não existir. */
  update(id: string, patch: ExpensePatch): Promise<CompanyExpense | null>;
  /** `false` se o custo não existir. */
  remove(id: string): Promise<boolean>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ordem da lista: começo mais antigo primeiro; empate pelo nome. */
export function byStartAsc(a: CompanyExpense, b: CompanyExpense): number {
  if (a.startsOn !== b.startsOn) return a.startsOn < b.startsOn ? -1 : 1;
  return a.name.localeCompare(b.name);
}

// ---------- Supabase ----------

const Row = z.object({
  id: z.string(),
  name: z.string(),
  category: ExpenseCategory,
  amount_cents: z.coerce.number(),
  frequency: ExpenseFrequency,
  starts_on: z.string(),
  ends_on: z.string().nullable(),
  notes: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

function toExpense(row: z.infer<typeof Row>): CompanyExpense {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    amountCents: row.amount_cents,
    frequency: row.frequency,
    // O Postgres devolve `date` como "AAAA-MM-DD"; o slice protege de um formato com hora.
    startsOn: row.starts_on.slice(0, 10),
    endsOn: row.ends_on ? row.ends_on.slice(0, 10) : null,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLUMNS: Record<keyof ExpensePatch, string> = {
  name: "name",
  category: "category",
  amountCents: "amount_cents",
  frequency: "frequency",
  startsOn: "starts_on",
  endsOn: "ends_on",
  notes: "notes",
};

function patchToRow(patch: ExpensePatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const key of Object.keys(COLUMNS) as (keyof ExpensePatch)[]) {
    const value = patch[key];
    if (value !== undefined) row[COLUMNS[key]] = value;
  }
  return row;
}

export class SupabaseExpenseStore implements ExpenseStore {
  private readonly endpoint: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.endpoint = `${normalizeSupabaseUrl(config.url)}/rest/v1/company_expenses`;
  }

  private async rows(query: string, init: RequestInit = {}): Promise<CompanyExpense[]> {
    const res = await this.fetchImpl(`${this.endpoint}${query}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    const text = await res.text();
    return z
      .array(Row)
      .parse(text ? JSON.parse(text) : [])
      .map(toExpense);
  }

  async list(): Promise<CompanyExpense[]> {
    // Poucos custos (dezenas): uma página basta. O teto evita uma resposta sem fim.
    return this.rows("?select=*&order=starts_on.asc,name.asc&limit=1000");
  }

  async get(id: string): Promise<CompanyExpense | null> {
    if (!UUID.test(id)) return null;
    const [row] = await this.rows(`?id=eq.${id}&select=*&limit=1`);
    return row ?? null;
  }

  async insert(expense: NewExpense): Promise<CompanyExpense> {
    const [row] = await this.rows("", {
      method: "POST",
      body: JSON.stringify(patchToRow(expense)),
    });
    if (!row) throw new Error("Supabase did not return the new expense.");
    return row;
  }

  async update(id: string, patch: ExpensePatch): Promise<CompanyExpense | null> {
    if (!UUID.test(id)) return null;
    const [row] = await this.rows(`?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...patchToRow(patch), updated_at: new Date().toISOString() }),
    });
    return row ?? null;
  }

  async remove(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const deleted = await this.rows(`?id=eq.${id}`, { method: "DELETE" });
    return deleted.length > 0;
  }
}

// ---------- memória (dev e testes) ----------

const globalForExpenses = globalThis as typeof globalThis & {
  __nosweatCompanyExpenses?: Map<string, CompanyExpense>;
};

export class MemoryExpenseStore implements ExpenseStore {
  private get rows(): Map<string, CompanyExpense> {
    globalForExpenses.__nosweatCompanyExpenses ??= new Map();
    return globalForExpenses.__nosweatCompanyExpenses;
  }

  async list(): Promise<CompanyExpense[]> {
    return [...this.rows.values()].map((row) => ({ ...row })).sort(byStartAsc);
  }

  async get(id: string): Promise<CompanyExpense | null> {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async insert(expense: NewExpense): Promise<CompanyExpense> {
    const now = new Date().toISOString();
    const row: CompanyExpense = { ...expense, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    this.rows.set(row.id, row);
    return { ...row };
  }

  async update(id: string, patch: ExpensePatch): Promise<CompanyExpense | null> {
    const current = this.rows.get(id);
    if (!current) return null;
    const defined = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as ExpensePatch;
    const row: CompanyExpense = { ...current, ...defined, updatedAt: new Date().toISOString() };
    this.rows.set(id, row);
    return { ...row };
  }

  async remove(id: string): Promise<boolean> {
    return this.rows.delete(id);
  }
}

let store: ExpenseStore | undefined;

export function getExpenseStore(): ExpenseStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como em getSiteStore: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  store =
    url && serviceKey ? new SupabaseExpenseStore({ url, serviceKey }) : new MemoryExpenseStore();
  return store;
}

/** Só para testes: limpa a memória entre um teste e outro. */
export function resetMemoryExpenseStore(): void {
  globalForExpenses.__nosweatCompanyExpenses = undefined;
}
