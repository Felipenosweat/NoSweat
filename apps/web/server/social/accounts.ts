import type { SocialAccount } from "@nosweat/schema";
import type { CurrentUser } from "@/server/auth/session";
import type { InstagramClient } from "./client";
import { canAutoPublish } from "./config";
import { decryptToken, encryptToken, socialCryptoConfigured, tokenAad } from "./crypto";
import { getSocialStore } from "./store";
import type { SocialAccountRecord, SocialPostRecord } from "./types";

// Contas conectadas: conectar (OAuth), pausar/retomar os posts e desconectar.
// O token só existe criptografado no banco; getDecryptedToken abre na hora de usar.

const PROVIDER = "instagram";
const PUBLISH_SCOPE = "instagram_business_content_publish";

// Intervalo "todas as datas" para listar posts do dono.
const ALL_FROM = "2000-01-01T00:00:00.000Z";
const ALL_TO = "9999-12-31T00:00:00.000Z";

export const MISSED_WHILE_PAUSED =
  "This post's time passed while it was paused. Pick a new time to post it.";
export const DISCONNECTED_REASON = "Instagram is disconnected. Reconnect it to keep posting.";

/** Motivos que voltam para /social?error=<code>. */
export type SocialConnectErrorCode =
  | "not_available"
  | "missing_permission"
  | "not_business"
  | "account_in_use";

export class SocialConnectError extends Error {
  constructor(
    readonly code: SocialConnectErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SocialConnectError";
  }
}

export function toPublicAccount(record: SocialAccountRecord): SocialAccount {
  return {
    id: record.id,
    provider: record.provider,
    username: record.username,
    avatarUrl: record.avatarUrl,
    accountType: record.accountType,
    status: record.status,
    tokenExpiresAt: record.tokenExpiresAt,
    connectedAt: record.createdAt,
  };
}

/** Token aberto (só no servidor, só na hora de chamar o Instagram). */
export function getDecryptedToken(account: SocialAccountRecord): string {
  if (!account.accessTokenEnc) throw new Error("This account has no access token.");
  return decryptToken(
    account.accessTokenEnc,
    tokenAad(account.ownerId, account.provider, account.externalId),
  );
}

/** Pausa os posts na fila desta conta. Devolve quantos. */
export async function pauseAccountPosts(
  ownerId: string,
  accountId: string,
  reason: string,
): Promise<number> {
  const paused = await getSocialStore().updateOwnerPosts(
    ownerId,
    ["scheduled", "needs_check"],
    { status: "paused", lastError: reason },
    accountId,
  );
  return paused.length;
}

function belongsTo(post: SocialPostRecord, accountId: string): boolean {
  return post.accountId === accountId || post.accountId === null;
}

/**
 * Volta os posts pausados para a fila (data no futuro) ou marca como perdidos (data passada:
 * o dono escolhe outra). Com `queueApproved`, aprovados com data futura também entram na fila
 * (a publicação automática acabou de ficar disponível).
 */
export async function resumeAccountPosts(
  ownerId: string,
  accountId: string,
  now: Date = new Date(),
  options: { queueApproved?: boolean } = {},
): Promise<{ resumed: number; missed: number }> {
  const store = getSocialStore();
  const posts = await store.listPosts(ownerId, ALL_FROM, ALL_TO);
  let resumed = 0;
  let missed = 0;
  for (const post of posts) {
    if (!belongsTo(post, accountId)) continue;
    const future = post.scheduledAt !== null && Date.parse(post.scheduledAt) > now.getTime();
    if (post.status === "paused") {
      const updated = future
        ? await store.updatePost(
            post.id,
            { status: "scheduled", accountId, nextAttemptAt: post.scheduledAt, lastError: null },
            ["paused"],
          )
        : await store.updatePost(
            post.id,
            { status: "missed", nextAttemptAt: null, lastError: MISSED_WHILE_PAUSED },
            ["paused"],
          );
      if (updated) {
        if (future) resumed += 1;
        else missed += 1;
      }
    } else if (post.status === "approved" && options.queueApproved && future) {
      const updated = await store.updatePost(
        post.id,
        { status: "scheduled", accountId, nextAttemptAt: post.scheduledAt, lastError: null },
        ["approved"],
      );
      if (updated) resumed += 1;
    }
  }
  return { resumed, missed };
}

/** Desconecta: apaga o token, marca revogada, pausa os posts e registra no histórico. */
export async function disconnectAccount(
  account: SocialAccountRecord,
  actorId: string | null,
  action: "disconnect" | "deauthorize",
): Promise<void> {
  const store = getSocialStore();
  await store.updateAccount(account.id, {
    accessTokenEnc: null,
    tokenKeyVersion: null,
    status: "revoked",
    revokedAt: new Date().toISOString(),
    lastError: null,
  });
  const paused = await pauseAccountPosts(account.ownerId, account.id, DISCONNECTED_REASON);
  await store.logEvent({
    ownerId: account.ownerId,
    accountId: account.id,
    actorId,
    action,
    detail: { provider: account.provider, pausedPosts: paused },
  });
}

/**
 * Volta do OAuth: troca o código, confere permissão e tipo da conta e salva (ou reaproveita) a
 * linha da conta com o token criptografado. Erros esperados viram SocialConnectError; erros do
 * Instagram chegam como InstagramError.
 */
export async function connectInstagramAccount(input: {
  user: CurrentUser;
  client: InstagramClient;
  code: string;
  now?: Date;
}): Promise<SocialAccountRecord> {
  const { user, client, code } = input;
  const now = input.now ?? new Date();
  if (!socialCryptoConfigured()) {
    throw new SocialConnectError("not_available", "Instagram connection is not available yet.");
  }
  const store = getSocialStore();

  const token = await client.exchangeCode(code);
  if (!token.scopes.includes(PUBLISH_SCOPE)) {
    throw new SocialConnectError(
      "missing_permission",
      "Please allow No Sweat to publish posts when Instagram asks.",
    );
  }
  const profile = await client.getProfile(token.accessToken);
  if ((profile.accountType ?? "").toUpperCase() === "PERSONAL") {
    throw new SocialConnectError(
      "not_business",
      "Switch your Instagram to a Business or Creator account first.",
    );
  }
  const live = await store.findLiveAccountByExternalId(PROVIDER, profile.id);
  if (live && live.ownerId !== user.id) {
    throw new SocialConnectError(
      "account_in_use",
      "This Instagram account is already connected to another No Sweat account.",
    );
  }

  const nowIso = now.toISOString();
  const encrypted = encryptToken(token.accessToken, tokenAad(user.id, PROVIDER, profile.id));
  const fields = {
    username: profile.username,
    accountType: profile.accountType,
    avatarUrl: profile.avatarUrl,
    accessTokenEnc: encrypted.value,
    tokenKeyVersion: encrypted.version,
    tokenExpiresAt: new Date(now.getTime() + token.expiresIn * 1000).toISOString(),
    tokenRefreshedAt: nowIso,
    scopes: token.scopes,
    status: "active" as const,
    lastError: null,
    revokedAt: null,
  };

  const existing = await store.findAccount(user.id, PROVIDER, profile.id);
  let account: SocialAccountRecord | null;
  if (existing) {
    account = await store.updateAccount(existing.id, {
      ...fields,
      appScopedId: token.appScopedId ?? existing.appScopedId,
    });
  } else {
    account = await store.insertAccount({
      id: crypto.randomUUID(),
      ownerId: user.id,
      provider: PROVIDER,
      externalId: profile.id,
      appScopedId: token.appScopedId,
      ...fields,
    });
  }
  if (!account) throw new Error("Could not save the Instagram account.");

  await store.logEvent({
    ownerId: user.id,
    accountId: account.id,
    actorId: user.id,
    action: "connect",
    detail: { provider: PROVIDER, username: profile.username, reconnect: Boolean(existing) },
  });

  const settings = await store.getSettings(user.id);
  const queueApproved = await canAutoPublish(user, settings);
  await resumeAccountPosts(user.id, account.id, now, { queueApproved });
  return account;
}
