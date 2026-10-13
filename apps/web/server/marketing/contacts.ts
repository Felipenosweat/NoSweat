import { normalizeSupabaseUrl } from "../store/supabase";

// Lista de marketing (tabela marketing_contacts, migration 0010). Supabase se configurado,
// senão memória (dev local e testes).

export type NewContact = { email: string; userId: string | null; firstName: string | null };

export interface ContactStore {
  /** Adiciona à lista. `true` se é novo; `false` se o e-mail já estava (mesmo que tenha saído). */
  add(contact: NewContact): Promise<boolean>;
  markWelcomeSent(email: string): Promise<void>;
  /** Tira da lista (idempotente). */
  unsubscribe(email: string): Promise<void>;
  isUnsubscribed(email: string): Promise<boolean>;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export class MemoryContactStore implements ContactStore {
  readonly rows = new Map<
    string,
    NewContact & { welcomeSentAt: string | null; unsubscribedAt: string | null }
  >();

  async add(contact: NewContact): Promise<boolean> {
    const email = normalizeEmail(contact.email);
    if (this.rows.has(email)) return false;
    this.rows.set(email, { ...contact, email, welcomeSentAt: null, unsubscribedAt: null });
    return true;
  }

  async markWelcomeSent(email: string): Promise<void> {
    const row = this.rows.get(normalizeEmail(email));
    if (row) row.welcomeSentAt = new Date().toISOString();
  }

  async unsubscribe(email: string): Promise<void> {
    const key = normalizeEmail(email);
    const row = this.rows.get(key);
    const now = new Date().toISOString();
    // Quem sai sem estar na lista também fica marcado: nunca entra de novo sem pedir.
    if (row) row.unsubscribedAt ??= now;
    else
      this.rows.set(key, {
        email: key,
        userId: null,
        firstName: null,
        welcomeSentAt: null,
        unsubscribedAt: now,
      });
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    return Boolean(this.rows.get(normalizeEmail(email))?.unsubscribedAt);
  }
}

export class SupabaseContactStore implements ContactStore {
  private readonly endpoint: string;

  constructor(private readonly config: { url: string; serviceKey: string; fetch?: typeof fetch }) {
    this.endpoint = `${normalizeSupabaseUrl(config.url)}/rest/v1/marketing_contacts`;
  }

  private async call(query: string, init: RequestInit & { prefer?: string }): Promise<unknown> {
    const res = await (this.config.fetch ?? fetch)(`${this.endpoint}${query}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        ...(init.prefer ? { Prefer: init.prefer } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`marketing_contacts ${res.status}: ${await res.text()}`);
    const body = await res.text();
    return body ? (JSON.parse(body) as unknown) : null;
  }

  async add(contact: NewContact): Promise<boolean> {
    const rows = await this.call("?on_conflict=email", {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=representation",
      body: JSON.stringify({
        email: normalizeEmail(contact.email),
        user_id: contact.userId,
        first_name: contact.firstName,
      }),
    });
    return Array.isArray(rows) && rows.length > 0;
  }

  async markWelcomeSent(email: string): Promise<void> {
    await this.call(`?email=eq.${encodeURIComponent(normalizeEmail(email))}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ welcome_sent_at: new Date().toISOString() }),
    });
  }

  async unsubscribe(email: string): Promise<void> {
    // Upsert: quem não estava na lista também fica marcado como "saiu".
    await this.call("?on_conflict=email", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({
        email: normalizeEmail(email),
        unsubscribed_at: new Date().toISOString(),
      }),
    });
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    const rows = await this.call(
      `?email=eq.${encodeURIComponent(normalizeEmail(email))}&select=unsubscribed_at`,
      { method: "GET" },
    );
    return (
      Array.isArray(rows) &&
      rows.some((row) => Boolean((row as { unsubscribed_at?: unknown }).unsubscribed_at))
    );
  }
}

let store: ContactStore | undefined;

export function getContactStore(): ContactStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store =
    url && serviceKey ? new SupabaseContactStore({ url, serviceKey }) : new MemoryContactStore();
  return store;
}
