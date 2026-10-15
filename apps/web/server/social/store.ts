import { SocialMedia, SocialPostStatus } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";
import {
  COUNTED_POST_STATUSES,
  type DataDeletionRecord,
  type NewSocialAccount,
  type NewSocialPost,
  type SocialAccountPatch,
  type SocialAccountRecord,
  type SocialEventInput,
  type SocialPostPatch,
  type SocialPostRecord,
  type SocialSettingsPatch,
  type SocialSettingsRecord,
} from "./types";

// Persistência do módulo de redes sociais (tabelas da migration 0013). Supabase em produção,
// memória no dev/testes (mesma regra do server/store e do server/billing/store).

export const DEFAULT_SOCIAL_SETTINGS = {
  timezone: "America/New_York",
  defaultSiteId: null,
  postDays: [2, 4, 6],
  postTime: "10:00",
  tester: false,
} as const;

export interface SocialStore {
  // ---------- contas ----------
  /** Conta ligada do dono (não revogada), ou `null`. No MVP: uma por rede. */
  getAccountForOwner(ownerId: string, provider: string): Promise<SocialAccountRecord | null>;
  getAccount(id: string): Promise<SocialAccountRecord | null>;
  /** Qualquer status: para reaproveitar a mesma linha ao reconectar. */
  findAccount(
    ownerId: string,
    provider: string,
    externalId: string,
  ): Promise<SocialAccountRecord | null>;
  /** Conta ligada (não revogada) com este id externo, de qualquer dono. */
  findLiveAccountByExternalId(
    provider: string,
    externalId: string,
  ): Promise<SocialAccountRecord | null>;
  findAccountsByAppScopedId(provider: string, appScopedId: string): Promise<SocialAccountRecord[]>;
  insertAccount(account: NewSocialAccount): Promise<SocialAccountRecord>;
  updateAccount(id: string, patch: SocialAccountPatch): Promise<SocialAccountRecord | null>;
  deleteAccount(id: string): Promise<void>;
  /** Contas ativas com token vencendo antes de `beforeIso` (para o cron de renovação). */
  listAccountsExpiringBefore(beforeIso: string, limit: number): Promise<SocialAccountRecord[]>;

  // ---------- preferências ----------
  getSettings(ownerId: string): Promise<SocialSettingsRecord>;
  upsertSettings(ownerId: string, patch: SocialSettingsPatch): Promise<SocialSettingsRecord>;

  // ---------- posts ----------
  createPost(post: NewSocialPost): Promise<SocialPostRecord>;
  createPosts(posts: NewSocialPost[]): Promise<SocialPostRecord[]>;
  /** Só do dono (outro dono = `null`). */
  getPost(ownerId: string, id: string): Promise<SocialPostRecord | null>;
  /** Interno (publicador): sem filtro de dono. */
  getPostById(id: string): Promise<SocialPostRecord | null>;
  /** Posts com data em [fromIso, toIso) mais os rascunhos sem data. */
  listPosts(ownerId: string, fromIso: string, toIso: string): Promise<SocialPostRecord[]>;
  /**
   * Atualiza o post. Com `onlyIfStatus`, só muda se o status atual estiver na lista (troca de
   * estado atômica); senão devolve `null`.
   */
  updatePost(
    id: string,
    patch: SocialPostPatch,
    onlyIfStatus?: SocialPostStatus[],
  ): Promise<SocialPostRecord | null>;
  /** Atualiza todos os posts do dono que estão num destes status (ex.: pausar ao desconectar). */
  updateOwnerPosts(
    ownerId: string,
    fromStatus: SocialPostStatus[],
    patch: SocialPostPatch,
    accountId?: string,
  ): Promise<SocialPostRecord[]>;
  deletePost(ownerId: string, id: string): Promise<boolean>;
  deletePostsByAccount(accountId: string): Promise<SocialPostRecord[]>;
  /** Posts que contam no limite do plano com data em [fromIso, toIso). */
  countCountedInRange(ownerId: string, fromIso: string, toIso: string): Promise<number>;
  /** Posts publicados pela conta desde `sinceIso` (limite próprio por 24h). */
  countPublishedSince(accountId: string, sinceIso: string): Promise<number>;
  /** Pega os posts na hora de publicar (atômico, ver claim_due_social_posts). */
  claimDue(limit: number): Promise<SocialPostRecord[]>;
  /** Pega UM post da fila (atômico). `null` se outro processo já pegou. */
  claimPost(id: string): Promise<SocialPostRecord | null>;

  // ---------- histórico e exclusão ----------
  logEvent(event: SocialEventInput): Promise<void>;
  countEventsSince(ownerId: string, action: string, sinceIso: string): Promise<number>;
  createDeletionRequest(request: Omit<DataDeletionRecord, "createdAt">): Promise<void>;
  getDeletionRequest(code: string): Promise<DataDeletionRecord | null>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID.test(value);
const nowIso = () => new Date().toISOString();

// ---------- linhas do banco ----------

const AccountRow = z.object({
  id: z.string(),
  owner_id: z.string(),
  provider: z.enum(["instagram"]),
  external_id: z.string(),
  app_scoped_id: z.string().nullable(),
  username: z.string(),
  account_type: z.string().nullable(),
  avatar_url: z.string().nullable(),
  access_token_enc: z.string().nullable().optional(),
  token_key_version: z.string().nullable(),
  token_expires_at: z.string().nullable(),
  token_refreshed_at: z.string().nullable(),
  scopes: z.array(z.string()).nullable(),
  status: z.enum(["active", "needs_reconnect", "revoked"]),
  last_error: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  revoked_at: z.string().nullable(),
});

function toAccount(row: z.infer<typeof AccountRow>): SocialAccountRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    provider: row.provider,
    externalId: row.external_id,
    appScopedId: row.app_scoped_id,
    username: row.username,
    accountType: row.account_type,
    avatarUrl: row.avatar_url,
    accessTokenEnc: row.access_token_enc ?? null,
    tokenKeyVersion: row.token_key_version,
    tokenExpiresAt: row.token_expires_at,
    tokenRefreshedAt: row.token_refreshed_at,
    scopes: row.scopes ?? [],
    status: row.status,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
  };
}

const ACCOUNT_COLUMNS: Record<keyof SocialAccountPatch, string> = {
  appScopedId: "app_scoped_id",
  username: "username",
  accountType: "account_type",
  avatarUrl: "avatar_url",
  accessTokenEnc: "access_token_enc",
  tokenKeyVersion: "token_key_version",
  tokenExpiresAt: "token_expires_at",
  tokenRefreshedAt: "token_refreshed_at",
  scopes: "scopes",
  status: "status",
  lastError: "last_error",
  revokedAt: "revoked_at",
};

const SettingsRow = z.object({
  owner_id: z.string(),
  timezone: z.string(),
  default_site_id: z.string().nullable(),
  post_days: z.array(z.number()).nullable(),
  post_time: z.string(),
  tester: z.boolean(),
});

const PostRow = z.object({
  id: z.string(),
  owner_id: z.string(),
  account_id: z.string().nullable(),
  site_id: z.string().nullable(),
  post_type: z.enum(["image", "carousel"]),
  caption: z.string(),
  owner_note_pt: z.string().nullable(),
  media: z.array(SocialMedia).catch([]),
  scheduled_at: z.string().nullable(),
  status: SocialPostStatus,
  source: z.enum(["manual", "ai"]),
  claims_flagged: z.boolean(),
  approved_at: z.string().nullable(),
  approved_by: z.string().nullable(),
  attempts: z.number(),
  next_attempt_at: z.string().nullable(),
  locked_at: z.string().nullable(),
  ig_container_id: z.string().nullable(),
  ig_media_id: z.string().nullable(),
  permalink: z.string().nullable(),
  last_error: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

function toPost(row: z.infer<typeof PostRow>): SocialPostRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    accountId: row.account_id,
    siteId: row.site_id,
    postType: row.post_type,
    caption: row.caption,
    ownerNotePt: row.owner_note_pt,
    media: row.media,
    scheduledAt: row.scheduled_at,
    status: row.status,
    source: row.source,
    claimsFlagged: row.claims_flagged,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    attempts: row.attempts,
    nextAttemptAt: row.next_attempt_at,
    lockedAt: row.locked_at,
    igContainerId: row.ig_container_id,
    igMediaId: row.ig_media_id,
    permalink: row.permalink,
    lastError: row.last_error,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const POST_COLUMNS: Record<keyof SocialPostPatch, string> = {
  accountId: "account_id",
  siteId: "site_id",
  caption: "caption",
  ownerNotePt: "owner_note_pt",
  media: "media",
  scheduledAt: "scheduled_at",
  status: "status",
  source: "source",
  claimsFlagged: "claims_flagged",
  approvedAt: "approved_at",
  approvedBy: "approved_by",
  attempts: "attempts",
  nextAttemptAt: "next_attempt_at",
  lockedAt: "locked_at",
  igContainerId: "ig_container_id",
  igMediaId: "ig_media_id",
  permalink: "permalink",
  lastError: "last_error",
  publishedAt: "published_at",
};

function patchToRow<K extends string>(
  patch: Partial<Record<K, unknown>>,
  columns: Record<K, string>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch) as [K, unknown][]) {
    if (value !== undefined && columns[key]) row[columns[key]] = value;
  }
  return row;
}

function postType(media: unknown[]): "image" | "carousel" {
  return media.length > 1 ? "carousel" : "image";
}

function newPostRow(post: NewSocialPost): Record<string, unknown> {
  return {
    owner_id: post.ownerId,
    account_id: post.accountId ?? null,
    site_id: post.siteId ?? null,
    post_type: postType(post.media),
    caption: post.caption,
    owner_note_pt: post.ownerNotePt ?? null,
    media: post.media,
    scheduled_at: post.scheduledAt ?? null,
    status: post.status ?? "draft",
    source: post.source ?? "manual",
    claims_flagged: post.claimsFlagged ?? false,
    approved_at: post.approvedAt ?? null,
    approved_by: post.approvedBy ?? null,
    next_attempt_at: post.nextAttemptAt ?? null,
  };
}

/** Lista de status para o filtro `in.(...)` do PostgREST. */
const inList = (values: readonly string[]) => `in.(${values.map((v) => `"${v}"`).join(",")})`;

// Colunas de conta sem o token (listagens nunca trazem access_token_enc).
const ACCOUNT_PUBLIC_SELECT =
  "id,owner_id,provider,external_id,app_scoped_id,username,account_type,avatar_url,token_key_version,token_expires_at,token_refreshed_at,scopes,status,last_error,created_at,updated_at,revoked_at";

export class SupabaseSocialStore implements SocialStore {
  private readonly base: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = `${normalizeSupabaseUrl(config.url)}/rest/v1`;
  }

  private async call(path: string, init: RequestInit & { prefer?: string } = {}): Promise<unknown> {
    const { prefer, ...rest } = init;
    const res = await this.fetchImpl(`${this.base}${path}`, {
      ...rest,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: prefer ?? "return=representation",
      },
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  private async accounts(query: string): Promise<SocialAccountRecord[]> {
    return z
      .array(AccountRow)
      .parse(await this.call(`/social_accounts${query}`))
      .map(toAccount);
  }

  private async posts(path: string, init?: RequestInit): Promise<SocialPostRecord[]> {
    return z
      .array(PostRow)
      .parse((await this.call(path, init)) ?? [])
      .map(toPost);
  }

  private async count(path: string): Promise<number> {
    const res = await this.fetchImpl(`${this.base}${path}`, {
      method: "HEAD",
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        Prefer: "count=exact",
      },
    });
    if (!res.ok) throw new Error(`Supabase count failed (${res.status})`);
    const range = res.headers.get("content-range") ?? "";
    const total = Number(range.split("/")[1]);
    return Number.isFinite(total) ? total : 0;
  }

  async getAccountForOwner(ownerId: string, provider: string) {
    if (!isUuid(ownerId)) return null;
    const [row] = await this.accounts(
      `?owner_id=eq.${ownerId}&provider=eq.${encodeURIComponent(provider)}&status=neq.revoked&select=*&order=updated_at.desc&limit=1`,
    );
    return row ?? null;
  }

  async getAccount(id: string) {
    if (!isUuid(id)) return null;
    const [row] = await this.accounts(`?id=eq.${id}&select=*&limit=1`);
    return row ?? null;
  }

  async findAccount(ownerId: string, provider: string, externalId: string) {
    if (!isUuid(ownerId)) return null;
    const [row] = await this.accounts(
      `?owner_id=eq.${ownerId}&provider=eq.${encodeURIComponent(provider)}&external_id=eq.${encodeURIComponent(externalId)}&select=*&limit=1`,
    );
    return row ?? null;
  }

  async findLiveAccountByExternalId(provider: string, externalId: string) {
    const [row] = await this.accounts(
      `?provider=eq.${encodeURIComponent(provider)}&external_id=eq.${encodeURIComponent(externalId)}&status=neq.revoked&select=${ACCOUNT_PUBLIC_SELECT}&limit=1`,
    );
    return row ?? null;
  }

  async findAccountsByAppScopedId(provider: string, appScopedId: string) {
    return this.accounts(
      `?provider=eq.${encodeURIComponent(provider)}&app_scoped_id=eq.${encodeURIComponent(appScopedId)}&select=${ACCOUNT_PUBLIC_SELECT}`,
    );
  }

  async insertAccount(account: NewSocialAccount) {
    if (!isUuid(account.id) || !isUuid(account.ownerId)) throw new Error("Invalid id.");
    const rows = z.array(AccountRow).parse(
      await this.call("/social_accounts", {
        method: "POST",
        body: JSON.stringify({
          id: account.id,
          owner_id: account.ownerId,
          provider: account.provider,
          external_id: account.externalId,
          app_scoped_id: account.appScopedId,
          username: account.username,
          account_type: account.accountType,
          avatar_url: account.avatarUrl,
          access_token_enc: account.accessTokenEnc,
          token_key_version: account.tokenKeyVersion,
          token_expires_at: account.tokenExpiresAt,
          token_refreshed_at: account.tokenRefreshedAt,
          scopes: account.scopes,
          status: account.status,
          last_error: account.lastError,
          revoked_at: account.revokedAt,
        }),
      }),
    );
    const row = rows[0];
    if (!row) throw new Error("Supabase did not return the new account.");
    return toAccount(row);
  }

  async updateAccount(id: string, patch: SocialAccountPatch) {
    if (!isUuid(id)) return null;
    const rows = z.array(AccountRow).parse(
      await this.call(`/social_accounts?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...patchToRow(patch, ACCOUNT_COLUMNS), updated_at: nowIso() }),
      }),
    );
    return rows[0] ? toAccount(rows[0]) : null;
  }

  async deleteAccount(id: string) {
    if (!isUuid(id)) return;
    await this.call(`/social_accounts?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
  }

  async listAccountsExpiringBefore(beforeIso: string, limit: number) {
    return this.accounts(
      `?status=eq.active&token_expires_at=lt.${encodeURIComponent(beforeIso)}&select=*&order=token_expires_at.asc&limit=${Math.max(1, Math.floor(limit))}`,
    );
  }

  async getSettings(ownerId: string) {
    if (isUuid(ownerId)) {
      const [row] = z
        .array(SettingsRow)
        .parse(await this.call(`/social_settings?owner_id=eq.${ownerId}&select=*&limit=1`));
      if (row) return toSettings(row);
    }
    return { ownerId, ...DEFAULT_SOCIAL_SETTINGS, postDays: [...DEFAULT_SOCIAL_SETTINGS.postDays] };
  }

  async upsertSettings(ownerId: string, patch: SocialSettingsPatch) {
    if (!isUuid(ownerId)) throw new Error(`Invalid user id: ${ownerId}`);
    const merged = { ...(await this.getSettings(ownerId)), ...stripUndefined(patch) };
    const rows = z.array(SettingsRow).parse(
      await this.call("/social_settings?on_conflict=owner_id", {
        method: "POST",
        prefer: "return=representation,resolution=merge-duplicates",
        body: JSON.stringify({
          owner_id: ownerId,
          timezone: merged.timezone,
          default_site_id: merged.defaultSiteId,
          post_days: merged.postDays,
          post_time: merged.postTime,
          tester: merged.tester,
          updated_at: nowIso(),
        }),
      }),
    );
    return rows[0] ? toSettings(rows[0]) : merged;
  }

  async createPost(post: NewSocialPost) {
    const [created] = await this.createPosts([post]);
    if (!created) throw new Error("Supabase did not return the new post.");
    return created;
  }

  async createPosts(posts: NewSocialPost[]) {
    if (posts.length === 0) return [];
    if (posts.some((p) => !isUuid(p.ownerId))) throw new Error("Invalid user id.");
    return this.posts("/social_posts", {
      method: "POST",
      body: JSON.stringify(posts.map(newPostRow)),
    });
  }

  async getPost(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    const [row] = await this.posts(`/social_posts?id=eq.${id}&owner_id=eq.${ownerId}&limit=1`);
    return row ?? null;
  }

  async getPostById(id: string) {
    if (!isUuid(id)) return null;
    const [row] = await this.posts(`/social_posts?id=eq.${id}&limit=1`);
    return row ?? null;
  }

  async listPosts(ownerId: string, fromIso: string, toIso: string) {
    if (!isUuid(ownerId)) return [];
    const range = `and(scheduled_at.gte.${fromIso},scheduled_at.lt.${toIso})`;
    return this.posts(
      `/social_posts?owner_id=eq.${ownerId}&or=(${encodeURIComponent(range)},scheduled_at.is.null)&status=neq.canceled&order=scheduled_at.asc.nullslast,created_at.asc&limit=500`,
    );
  }

  async updatePost(id: string, patch: SocialPostPatch, onlyIfStatus?: SocialPostStatus[]) {
    if (!isUuid(id)) return null;
    const row = patchToRow(patch, POST_COLUMNS);
    if (patch.media) row.post_type = postType(patch.media);
    const filter = onlyIfStatus?.length ? `&status=${inList(onlyIfStatus)}` : "";
    const [updated] = await this.posts(`/social_posts?id=eq.${id}${filter}`, {
      method: "PATCH",
      body: JSON.stringify({ ...row, updated_at: nowIso() }),
    });
    return updated ?? null;
  }

  async updateOwnerPosts(
    ownerId: string,
    fromStatus: SocialPostStatus[],
    patch: SocialPostPatch,
    accountId?: string,
  ) {
    if (!isUuid(ownerId) || fromStatus.length === 0) return [];
    const account = accountId && isUuid(accountId) ? `&account_id=eq.${accountId}` : "";
    return this.posts(
      `/social_posts?owner_id=eq.${ownerId}&status=${inList(fromStatus)}${account}`,
      {
        method: "PATCH",
        body: JSON.stringify({ ...patchToRow(patch, POST_COLUMNS), updated_at: nowIso() }),
      },
    );
  }

  async deletePost(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return false;
    const rows = await this.posts(`/social_posts?id=eq.${id}&owner_id=eq.${ownerId}`, {
      method: "DELETE",
    });
    return rows.length > 0;
  }

  async deletePostsByAccount(accountId: string) {
    if (!isUuid(accountId)) return [];
    return this.posts(`/social_posts?account_id=eq.${accountId}`, { method: "DELETE" });
  }

  async countCountedInRange(ownerId: string, fromIso: string, toIso: string) {
    if (!isUuid(ownerId)) return 0;
    return this.count(
      `/social_posts?owner_id=eq.${ownerId}&status=${inList(COUNTED_POST_STATUSES)}&scheduled_at=gte.${encodeURIComponent(fromIso)}&scheduled_at=lt.${encodeURIComponent(toIso)}&select=id`,
    );
  }

  async countPublishedSince(accountId: string, sinceIso: string) {
    if (!isUuid(accountId)) return 0;
    return this.count(
      `/social_posts?account_id=eq.${accountId}&status=eq.published&published_at=gte.${encodeURIComponent(sinceIso)}&select=id`,
    );
  }

  async claimDue(limit: number) {
    return this.posts("/rpc/claim_due_social_posts", {
      method: "POST",
      body: JSON.stringify({ p_limit: Math.max(0, Math.floor(limit)) }),
    });
  }

  async claimPost(id: string) {
    if (!isUuid(id)) return null;
    const [row] = await this.posts("/rpc/claim_social_post", {
      method: "POST",
      body: JSON.stringify({ p_id: id }),
    });
    return row ?? null;
  }

  async logEvent(event: SocialEventInput) {
    await this.call("/social_events", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        owner_id: event.ownerId && isUuid(event.ownerId) ? event.ownerId : null,
        account_id: event.accountId && isUuid(event.accountId) ? event.accountId : null,
        post_id: event.postId && isUuid(event.postId) ? event.postId : null,
        actor_id: event.actorId && isUuid(event.actorId) ? event.actorId : null,
        action: event.action,
        detail: event.detail ?? {},
      }),
    });
  }

  async countEventsSince(ownerId: string, action: string, sinceIso: string) {
    if (!isUuid(ownerId)) return 0;
    return this.count(
      `/social_events?owner_id=eq.${ownerId}&action=eq.${encodeURIComponent(action)}&created_at=gte.${encodeURIComponent(sinceIso)}&select=id`,
    );
  }

  async createDeletionRequest(request: Omit<DataDeletionRecord, "createdAt">) {
    await this.call("/data_deletion_requests", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        provider: request.provider,
        external_user_id: request.externalUserId,
        confirmation_code: request.confirmationCode,
        status: request.status,
        completed_at: request.completedAt,
      }),
    });
  }

  async getDeletionRequest(code: string) {
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(code)) return null;
    const rows = z
      .array(
        z.object({
          provider: z.string(),
          external_user_id: z.string(),
          confirmation_code: z.string(),
          status: z.enum(["received", "completed"]),
          created_at: z.string(),
          completed_at: z.string().nullable(),
        }),
      )
      .parse(
        await this.call(
          `/data_deletion_requests?confirmation_code=eq.${encodeURIComponent(code)}&limit=1`,
        ),
      );
    const row = rows[0];
    return row
      ? {
          provider: row.provider,
          externalUserId: row.external_user_id,
          confirmationCode: row.confirmation_code,
          status: row.status,
          createdAt: row.created_at,
          completedAt: row.completed_at,
        }
      : null;
  }
}

function toSettings(row: z.infer<typeof SettingsRow>): SocialSettingsRecord {
  return {
    ownerId: row.owner_id,
    timezone: row.timezone,
    defaultSiteId: row.default_site_id,
    postDays: row.post_days ?? [...DEFAULT_SOCIAL_SETTINGS.postDays],
    postTime: row.post_time,
    tester: row.tester,
  };
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// ---------- memória (dev local e testes) ----------

type MemoryState = {
  accounts: Map<string, SocialAccountRecord>;
  settings: Map<string, SocialSettingsRecord>;
  posts: Map<string, SocialPostRecord>;
  events: (SocialEventInput & { createdAt: string })[];
  deletions: Map<string, DataDeletionRecord>;
};

const globalForSocial = globalThis as typeof globalThis & { __nosweatSocial?: MemoryState };

const DUE_STATUSES: SocialPostStatus[] = ["scheduled", "needs_check"];

export class MemorySocialStore implements SocialStore {
  private get state(): MemoryState {
    globalForSocial.__nosweatSocial ??= {
      accounts: new Map(),
      settings: new Map(),
      posts: new Map(),
      events: [],
      deletions: new Map(),
    };
    return globalForSocial.__nosweatSocial;
  }

  async getAccountForOwner(ownerId: string, provider: string) {
    const list = [...this.state.accounts.values()]
      .filter((a) => a.ownerId === ownerId && a.provider === provider && a.status !== "revoked")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return list[0] ? { ...list[0] } : null;
  }

  async getAccount(id: string) {
    const account = this.state.accounts.get(id);
    return account ? { ...account } : null;
  }

  async findAccount(ownerId: string, provider: string, externalId: string) {
    const found = [...this.state.accounts.values()].find(
      (a) => a.ownerId === ownerId && a.provider === provider && a.externalId === externalId,
    );
    return found ? { ...found } : null;
  }

  async findLiveAccountByExternalId(provider: string, externalId: string) {
    const found = [...this.state.accounts.values()].find(
      (a) => a.provider === provider && a.externalId === externalId && a.status !== "revoked",
    );
    return found ? { ...found, accessTokenEnc: null } : null;
  }

  async findAccountsByAppScopedId(provider: string, appScopedId: string) {
    return [...this.state.accounts.values()]
      .filter((a) => a.provider === provider && a.appScopedId === appScopedId)
      .map((a) => ({ ...a, accessTokenEnc: null }));
  }

  async insertAccount(account: NewSocialAccount) {
    if (this.state.accounts.has(account.id)) throw new Error("Duplicate account id.");
    const now = nowIso();
    const record: SocialAccountRecord = { ...account, createdAt: now, updatedAt: now };
    this.state.accounts.set(record.id, record);
    return { ...record };
  }

  async updateAccount(id: string, patch: SocialAccountPatch) {
    const current = this.state.accounts.get(id);
    if (!current) return null;
    const next = { ...current, ...stripUndefined(patch), updatedAt: nowIso() };
    this.state.accounts.set(id, next);
    return { ...next };
  }

  async deleteAccount(id: string) {
    this.state.accounts.delete(id);
    for (const post of this.state.posts.values()) {
      if (post.accountId === id) post.accountId = null;
    }
  }

  async listAccountsExpiringBefore(beforeIso: string, limit: number) {
    return [...this.state.accounts.values()]
      .filter(
        (a) => a.status === "active" && a.tokenExpiresAt !== null && a.tokenExpiresAt < beforeIso,
      )
      .sort((a, b) => (a.tokenExpiresAt ?? "").localeCompare(b.tokenExpiresAt ?? ""))
      .slice(0, limit)
      .map((a) => ({ ...a }));
  }

  async getSettings(ownerId: string) {
    const found = this.state.settings.get(ownerId);
    return found
      ? { ...found, postDays: [...found.postDays] }
      : { ownerId, ...DEFAULT_SOCIAL_SETTINGS, postDays: [...DEFAULT_SOCIAL_SETTINGS.postDays] };
  }

  async upsertSettings(ownerId: string, patch: SocialSettingsPatch) {
    const next = { ...(await this.getSettings(ownerId)), ...stripUndefined(patch), ownerId };
    this.state.settings.set(ownerId, next);
    return { ...next, postDays: [...next.postDays] };
  }

  async createPost(post: NewSocialPost) {
    const now = nowIso();
    const record: SocialPostRecord = {
      id: crypto.randomUUID(),
      ownerId: post.ownerId,
      accountId: post.accountId ?? null,
      siteId: post.siteId ?? null,
      postType: postType(post.media),
      caption: post.caption,
      ownerNotePt: post.ownerNotePt ?? null,
      media: post.media,
      scheduledAt: post.scheduledAt ?? null,
      status: post.status ?? "draft",
      source: post.source ?? "manual",
      claimsFlagged: post.claimsFlagged ?? false,
      approvedAt: post.approvedAt ?? null,
      approvedBy: post.approvedBy ?? null,
      attempts: 0,
      nextAttemptAt: post.nextAttemptAt ?? null,
      lockedAt: null,
      igContainerId: null,
      igMediaId: null,
      permalink: null,
      lastError: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.state.posts.set(record.id, record);
    return structuredClone(record);
  }

  async createPosts(posts: NewSocialPost[]) {
    const created: SocialPostRecord[] = [];
    for (const post of posts) created.push(await this.createPost(post));
    return created;
  }

  async getPost(ownerId: string, id: string) {
    const post = this.state.posts.get(id);
    return post && post.ownerId === ownerId ? structuredClone(post) : null;
  }

  async getPostById(id: string) {
    const post = this.state.posts.get(id);
    return post ? structuredClone(post) : null;
  }

  async listPosts(ownerId: string, fromIso: string, toIso: string) {
    const from = Date.parse(fromIso);
    const to = Date.parse(toIso);
    return [...this.state.posts.values()]
      .filter((p) => p.ownerId === ownerId && p.status !== "canceled")
      .filter((p) => {
        if (p.scheduledAt === null) return true;
        const at = Date.parse(p.scheduledAt);
        return at >= from && at < to;
      })
      .sort((a, b) => (a.scheduledAt ?? "￿").localeCompare(b.scheduledAt ?? "￿"))
      .map((p) => structuredClone(p));
  }

  async updatePost(id: string, patch: SocialPostPatch, onlyIfStatus?: SocialPostStatus[]) {
    const current = this.state.posts.get(id);
    if (!current) return null;
    if (onlyIfStatus?.length && !onlyIfStatus.includes(current.status)) return null;
    const next: SocialPostRecord = { ...current, ...stripUndefined(patch), updatedAt: nowIso() };
    if (patch.media) next.postType = postType(patch.media);
    this.state.posts.set(id, next);
    return structuredClone(next);
  }

  async updateOwnerPosts(
    ownerId: string,
    fromStatus: SocialPostStatus[],
    patch: SocialPostPatch,
    accountId?: string,
  ) {
    const updated: SocialPostRecord[] = [];
    for (const post of this.state.posts.values()) {
      if (post.ownerId !== ownerId || !fromStatus.includes(post.status)) continue;
      if (accountId && post.accountId !== accountId) continue;
      const next = await this.updatePost(post.id, patch);
      if (next) updated.push(next);
    }
    return updated;
  }

  async deletePost(ownerId: string, id: string) {
    const post = this.state.posts.get(id);
    if (!post || post.ownerId !== ownerId) return false;
    this.state.posts.delete(id);
    return true;
  }

  async deletePostsByAccount(accountId: string) {
    const removed: SocialPostRecord[] = [];
    for (const [id, post] of this.state.posts) {
      if (post.accountId === accountId) {
        removed.push(structuredClone(post));
        this.state.posts.delete(id);
      }
    }
    return removed;
  }

  async countCountedInRange(ownerId: string, fromIso: string, toIso: string) {
    const from = Date.parse(fromIso);
    const to = Date.parse(toIso);
    return [...this.state.posts.values()].filter((p) => {
      if (p.ownerId !== ownerId || !COUNTED_POST_STATUSES.includes(p.status) || !p.scheduledAt) {
        return false;
      }
      const at = Date.parse(p.scheduledAt);
      return at >= from && at < to;
    }).length;
  }

  async countPublishedSince(accountId: string, sinceIso: string) {
    return [...this.state.posts.values()].filter(
      (p) =>
        p.accountId === accountId &&
        p.status === "published" &&
        p.publishedAt !== null &&
        p.publishedAt >= sinceIso,
    ).length;
  }

  async claimDue(limit: number) {
    const now = Date.now();
    const nowStr = nowIso();
    // Mesma regra da função do banco: post preso em "publishing" há 10 min volta para conferência.
    for (const post of this.state.posts.values()) {
      if (
        post.status === "publishing" &&
        post.lockedAt &&
        now - Date.parse(post.lockedAt) > 600_000
      ) {
        Object.assign(post, {
          status: "needs_check",
          nextAttemptAt: nowStr,
          lockedAt: null,
          updatedAt: nowStr,
        });
      }
    }
    const due = [...this.state.posts.values()]
      .filter(
        (p) =>
          DUE_STATUSES.includes(p.status) && p.nextAttemptAt && Date.parse(p.nextAttemptAt) <= now,
      )
      .sort((a, b) => (a.nextAttemptAt ?? "").localeCompare(b.nextAttemptAt ?? ""))
      .slice(0, Math.max(0, limit));
    for (const post of due) {
      Object.assign(post, {
        status: "publishing",
        lockedAt: nowStr,
        attempts: post.attempts + 1,
        updatedAt: nowStr,
      });
    }
    return due.map((p) => structuredClone(p));
  }

  async claimPost(id: string) {
    const post = this.state.posts.get(id);
    if (!post || !DUE_STATUSES.includes(post.status)) return null;
    const nowStr = nowIso();
    Object.assign(post, {
      status: "publishing",
      lockedAt: nowStr,
      attempts: post.attempts + 1,
      updatedAt: nowStr,
    });
    return structuredClone(post);
  }

  async logEvent(event: SocialEventInput) {
    this.state.events.push({ ...event, createdAt: nowIso() });
  }

  async countEventsSince(ownerId: string, action: string, sinceIso: string) {
    return this.state.events.filter(
      (e) => e.ownerId === ownerId && e.action === action && e.createdAt >= sinceIso,
    ).length;
  }

  async createDeletionRequest(request: Omit<DataDeletionRecord, "createdAt">) {
    this.state.deletions.set(request.confirmationCode, { ...request, createdAt: nowIso() });
  }

  async getDeletionRequest(code: string) {
    const found = this.state.deletions.get(code);
    return found ? { ...found } : null;
  }
}

let store: SocialStore | undefined;

export function getSocialStore(): SocialStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store =
    url && serviceKey ? new SupabaseSocialStore({ url, serviceKey }) : new MemorySocialStore();
  return store;
}

/** Só para testes: limpa a memória entre um teste e outro. */
export function resetMemorySocialStore(): void {
  globalForSocial.__nosweatSocial = undefined;
}
