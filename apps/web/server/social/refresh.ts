import { getDecryptedToken, pauseAccountPosts } from "./accounts";
import { InstagramError, type InstagramClient } from "./client";
import { getInstagramClient } from "./config";
import { currentKeyVersion, encryptToken, tokenAad } from "./crypto";
import { sendReconnectEmail } from "./notify";
import { getSocialStore, type SocialStore } from "./store";
import type { SocialAccountRecord } from "./types";

// Renovação dos tokens do Instagram (cron diário /api/cron/social-refresh).
// O token de longa duração dura ~60 dias e pode ser renovado depois de 24 h de vida: renovamos
// os que vencem em até 15 dias. Na mesma passada recriptografamos os tokens salvos com uma
// chave antiga (troca de chave em SOCIAL_TOKEN_KEYS).

const DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_WINDOW_MS = 15 * DAY_MS;
/** Para achar contas com chave antiga: "vence antes de daqui a 10 anos" = todas com validade. */
const REKEY_HORIZON_MS = 3650 * DAY_MS;
const REKEY_SCAN_LIMIT = 500;

export const RECONNECT_MESSAGE =
  "Instagram needs you to reconnect your account. Your scheduled posts are paused until then.";

export type RefreshDeps = {
  client?: InstagramClient | null;
  store?: SocialStore;
  getToken?: (account: SocialAccountRecord) => string;
  pauseAccountPosts?: (ownerId: string, accountId: string, reason: string) => Promise<number>;
  sendReconnectEmail?: (ownerId: string) => Promise<void>;
};

export type RefreshSummary = {
  checked: number;
  refreshed: number;
  rekeyed: number;
  needsReconnect: number;
  failed: number;
};

/**
 * Conta perdeu o acesso: status needs_reconnect, apaga o token, pausa os posts na fila e manda
 * UM e-mail (sendReconnectEmail já evita repetir em menos de 3 dias).
 */
export async function markAccountNeedsReconnect(
  account: SocialAccountRecord,
  reason: string,
  deps: Pick<RefreshDeps, "store" | "pauseAccountPosts" | "sendReconnectEmail"> = {},
): Promise<void> {
  const store = deps.store ?? getSocialStore();
  await store.updateAccount(account.id, {
    status: "needs_reconnect",
    accessTokenEnc: null,
    tokenKeyVersion: null,
    lastError: reason,
  });
  await (deps.pauseAccountPosts ?? pauseAccountPosts)(account.ownerId, account.id, reason);
  await store.logEvent({
    ownerId: account.ownerId,
    accountId: account.id,
    action: "token_invalid",
  });
  await (deps.sendReconnectEmail ?? ((ownerId: string) => sendReconnectEmail(ownerId, { store })))(
    account.ownerId,
  );
}

function isAuthProblem(error: unknown): boolean {
  // Erro de auth do Instagram, ou token que não abre mais (chave removida, linha corrompida).
  if (error instanceof InstagramError) return error.kind === "auth";
  return true;
}

export async function refreshExpiringTokens(
  options: { now?: Date } = {},
  deps: RefreshDeps = {},
): Promise<RefreshSummary> {
  const summary: RefreshSummary = {
    checked: 0,
    refreshed: 0,
    rekeyed: 0,
    needsReconnect: 0,
    failed: 0,
  };
  const client = deps.client === undefined ? getInstagramClient() : deps.client;
  if (!client) return summary;
  const store = deps.store ?? getSocialStore();
  const getToken = deps.getToken ?? getDecryptedToken;
  const now = options.now ?? new Date();
  const keyVersion = currentKeyVersion();
  const done = new Set<string>();

  const fail = async (account: SocialAccountRecord, error: unknown, action: string) => {
    if (isAuthProblem(error)) {
      await markAccountNeedsReconnect(account, RECONNECT_MESSAGE, { ...deps, store });
      summary.needsReconnect += 1;
    } else {
      summary.failed += 1;
      await store.logEvent({
        ownerId: account.ownerId,
        accountId: account.id,
        action,
        detail: { error: error instanceof Error ? error.message.slice(0, 300) : "unknown" },
      });
    }
  };

  // 1) Renovar quem vence em até 15 dias (e não foi renovado nas últimas 24 h).
  const refreshBefore = new Date(now.getTime() - DAY_MS).toISOString();
  const expiring = await store.listAccountsExpiringBefore(
    new Date(now.getTime() + REFRESH_WINDOW_MS).toISOString(),
    100,
  );
  for (const account of expiring) {
    const lastRefresh = account.tokenRefreshedAt ?? account.createdAt;
    if (lastRefresh >= refreshBefore) continue;
    summary.checked += 1;
    done.add(account.id);
    try {
      const token = getToken(account);
      const fresh = await client.refresh(token);
      const enc = encryptToken(
        fresh.accessToken,
        tokenAad(account.ownerId, "instagram", account.externalId),
      );
      await store.updateAccount(account.id, {
        accessTokenEnc: enc.value,
        tokenKeyVersion: enc.version,
        tokenExpiresAt: new Date(now.getTime() + fresh.expiresIn * 1000).toISOString(),
        tokenRefreshedAt: now.toISOString(),
        lastError: null,
      });
      await store.logEvent({
        ownerId: account.ownerId,
        accountId: account.id,
        action: "token_refresh",
      });
      summary.refreshed += 1;
    } catch (error) {
      await fail(account, error, "token_refresh_failed");
    }
  }

  // 2) Recriptografar com a chave atual quem ainda usa uma chave antiga (sem chamar o Instagram).
  // O store não tem busca por versão de chave: listamos as contas ativas com validade.
  if (keyVersion) {
    const all = await store.listAccountsExpiringBefore(
      new Date(now.getTime() + REKEY_HORIZON_MS).toISOString(),
      REKEY_SCAN_LIMIT,
    );
    for (const account of all) {
      if (done.has(account.id) || !account.accessTokenEnc) continue;
      if (account.tokenKeyVersion === keyVersion) continue;
      summary.checked += 1;
      try {
        const token = getToken(account);
        const enc = encryptToken(token, tokenAad(account.ownerId, "instagram", account.externalId));
        await store.updateAccount(account.id, {
          accessTokenEnc: enc.value,
          tokenKeyVersion: enc.version,
        });
        await store.logEvent({
          ownerId: account.ownerId,
          accountId: account.id,
          action: "token_rekey",
          detail: { from: account.tokenKeyVersion, to: enc.version },
        });
        summary.rekeyed += 1;
      } catch (error) {
        await fail(account, error, "token_rekey_failed");
      }
    }
  }

  return summary;
}
