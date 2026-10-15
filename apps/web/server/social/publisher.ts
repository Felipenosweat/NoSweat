import { ownerHasSocialAccess } from "@/server/billing";
import { getDecryptedToken, pauseAccountPosts } from "./accounts";
import { InstagramError, type InstagramClient } from "./client";
import { getInstagramClient } from "./config";
import { sendPostFailedEmail, sendReconnectEmail } from "./notify";
import { markAccountNeedsReconnect, RECONNECT_MESSAGE } from "./refresh";
import { getSocialStore, type SocialStore } from "./store";
import type { SocialAccountRecord, SocialPostPatch, SocialPostRecord } from "./types";

// Publicador do Instagram (cron /api/cron/social-publish a cada minuto e "Publish now").
// Regras principais:
// - só publica post pego de forma atômica (claimDue / claimPost: status "publishing");
// - NUNCA publica duas vezes: o id do container é salvo antes de chamar `publish`; se o post
//   volta com container, primeiro conferimos o status dele no Instagram;
// - post muito atrasado vira "missed" (o dono escolhe outra data);
// - toda mudança de estado só vale se o post ainda estiver em "publishing" (um post preso que o
//   banco já devolveu para conferência não é sobrescrito).

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
/** Esperas entre tentativas (pela tentativa 1, 2, 3, 4). */
const BACKOFF_MS = [1 * MINUTE_MS, 5 * MINUTE_MS, 15 * MINUTE_MS, 60 * MINUTE_MS];
export const MAX_ATTEMPTS = 5;
/** Conferência do container logo depois de criar: ~10 s no total. */
const POLL_TRIES = 5;
const POLL_SLEEP_MS = 2_000;
/** Quantos posts pegar por vez (assim o tempo do cron não estoura com posts já pegos). */
const CLAIM_BATCH = 3;
/** Margem de tempo para não começar um post sem tempo de terminar. */
const BUDGET_MARGIN_MS = 60_000;

export const MISSED_MESSAGE = "This post missed its time. Pick a new date.";
export const PLAN_MESSAGE = "Your plan is not active. Renew it to keep posting.";
export const NOT_CONNECTED_MESSAGE =
  "Your Instagram account is not connected. Reconnect it to keep posting.";

/** Atraso máximo (SOCIAL_MAX_LATENESS_HOURS, padrão 6 h) para ainda publicar um post. */
export function MAX_LATENESS_MS(): number {
  const hours = Number(process.env.SOCIAL_MAX_LATENESS_HOURS);
  return (Number.isFinite(hours) && hours > 0 ? hours : 6) * HOUR_MS;
}

/** Limite próprio de posts por conta em 24 h (SOCIAL_DAILY_POST_CAP, padrão 10). */
function dailyPostCap(): number {
  const cap = Number(process.env.SOCIAL_DAILY_POST_CAP);
  return Number.isInteger(cap) && cap > 0 ? cap : 10;
}

export type PublisherDeps = {
  client?: InstagramClient | null;
  store?: SocialStore;
  /** Relógio (testes). */
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  hasSocialAccess?: (ownerId: string) => Promise<boolean>;
  getToken?: (account: SocialAccountRecord) => string;
  pauseAccountPosts?: (ownerId: string, accountId: string, reason: string) => Promise<number>;
  sendPostFailedEmail?: (ownerId: string, postId: string, reason: string) => Promise<void>;
  sendReconnectEmail?: (ownerId: string) => Promise<void>;
};

export type PublishSummary = {
  claimed: number;
  published: number;
  retried: number;
  failed: number;
  paused: number;
  missed: number;
};

type Outcome = "published" | "retried" | "failed" | "paused" | "missed" | "skipped";

type Ctx = {
  client: InstagramClient;
  store: SocialStore;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  hasSocialAccess: (ownerId: string) => Promise<boolean>;
  getToken: (account: SocialAccountRecord) => string;
  pauseAccountPosts: (ownerId: string, accountId: string, reason: string) => Promise<number>;
  sendPostFailedEmail: (ownerId: string, postId: string, reason: string) => Promise<void>;
  sendReconnectEmail: (ownerId: string) => Promise<void>;
};

function buildCtx(deps: PublisherDeps): Ctx | null {
  const client = deps.client === undefined ? getInstagramClient() : deps.client;
  if (!client) return null;
  const store = deps.store ?? getSocialStore();
  return {
    client,
    store,
    now: deps.now ?? (() => new Date()),
    sleep: deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    hasSocialAccess: deps.hasSocialAccess ?? ownerHasSocialAccess,
    getToken: deps.getToken ?? getDecryptedToken,
    pauseAccountPosts: deps.pauseAccountPosts ?? pauseAccountPosts,
    sendPostFailedEmail:
      deps.sendPostFailedEmail ??
      ((ownerId, postId, reason) => sendPostFailedEmail(ownerId, postId, reason, { store })),
    sendReconnectEmail:
      deps.sendReconnectEmail ?? ((ownerId) => sendReconnectEmail(ownerId, { store })),
  };
}

/** Pega e publica os posts na hora. Para de pegar novos quando o tempo do cron está acabando. */
export async function publishDuePosts(
  options: { now?: Date; limit?: number; budgetMs?: number } = {},
  deps: PublisherDeps = {},
): Promise<PublishSummary> {
  const summary: PublishSummary = {
    claimed: 0,
    published: 0,
    retried: 0,
    failed: 0,
    paused: 0,
    missed: 0,
  };
  const fixedNow = options.now;
  const ctx = buildCtx(fixedNow && !deps.now ? { ...deps, now: () => fixedNow } : deps);
  if (!ctx) return summary;
  const limit = options.limit ?? 20;
  const budgetMs = options.budgetMs ?? 240_000;
  const started = Date.now();
  const timeLeft = () => budgetMs - (Date.now() - started);

  while (summary.claimed < limit && timeLeft() > BUDGET_MARGIN_MS) {
    const batch = await ctx.store.claimDue(Math.min(CLAIM_BATCH, limit - summary.claimed));
    if (batch.length === 0) break;
    summary.claimed += batch.length;
    for (const post of batch) {
      if (timeLeft() <= BUDGET_MARGIN_MS / 2) {
        // Sem tempo: devolve para a fila sem gastar a tentativa.
        await release(ctx, post);
        summary.retried += 1;
        continue;
      }
      const outcome = await processPost(ctx, post);
      if (outcome !== "skipped") summary[outcome] += 1;
    }
  }
  return summary;
}

/** "Publish now": pega ESTE post de forma atômica; se outro processo já pegou, não faz nada. */
export async function publishOne(postId: string, deps: PublisherDeps = {}): Promise<void> {
  const ctx = buildCtx(deps);
  if (!ctx) return;
  const post = await ctx.store.claimPost(postId);
  if (!post) return;
  await processPost(ctx, post);
}

// ---------- estados ----------

/** Muda o estado só se o post ainda estiver em "publishing". */
function transition(ctx: Ctx, post: SocialPostRecord, patch: SocialPostPatch) {
  return ctx.store.updatePost(post.id, { lockedAt: null, ...patch }, ["publishing"]);
}

/** Volta para a fila sem contar como tentativa (limite diário, container ainda processando...). */
async function reschedule(
  ctx: Ctx,
  post: SocialPostRecord,
  delayMs: number,
  lastError: string | null,
  extra: SocialPostPatch = {},
): Promise<Outcome> {
  const saved = await transition(ctx, post, {
    status: "scheduled",
    attempts: Math.max(0, post.attempts - 1),
    nextAttemptAt: new Date(ctx.now().getTime() + delayMs).toISOString(),
    lastError,
    ...extra,
  });
  return saved ? "retried" : "skipped";
}

async function release(ctx: Ctx, post: SocialPostRecord): Promise<void> {
  await transition(ctx, post, {
    status: post.igContainerId ? "needs_check" : "scheduled",
    attempts: Math.max(0, post.attempts - 1),
    nextAttemptAt: ctx.now().toISOString(),
  });
}

async function pause(ctx: Ctx, post: SocialPostRecord, reason: string): Promise<Outcome> {
  const saved = await transition(ctx, post, {
    status: "paused",
    nextAttemptAt: null,
    attempts: Math.max(0, post.attempts - 1),
    lastError: reason,
  });
  return saved ? "paused" : "skipped";
}

async function fail(ctx: Ctx, post: SocialPostRecord, reason: string): Promise<Outcome> {
  const saved = await transition(ctx, post, {
    status: "failed",
    nextAttemptAt: null,
    lastError: reason,
  });
  if (!saved) return "skipped";
  await ctx.sendPostFailedEmail(post.ownerId, post.id, reason);
  return "failed";
}

async function markPublished(
  ctx: Ctx,
  post: SocialPostRecord,
  account: SocialAccountRecord,
  mediaId: string | null,
  permalink: string | null,
  containerId: string,
): Promise<Outcome> {
  const saved = await transition(ctx, post, {
    status: "published",
    accountId: account.id,
    igContainerId: containerId,
    igMediaId: mediaId,
    permalink,
    publishedAt: ctx.now().toISOString(),
    nextAttemptAt: null,
    lastError: null,
  });
  await ctx.store.logEvent({
    ownerId: post.ownerId,
    accountId: account.id,
    postId: post.id,
    action: "publish_success",
    detail: { mediaId, recovered: mediaId === null },
  });
  return saved ? "published" : "skipped";
}

// ---------- o fluxo de um post ----------

async function loadAccount(ctx: Ctx, post: SocialPostRecord) {
  const account = post.accountId
    ? await ctx.store.getAccount(post.accountId)
    : await ctx.store.getAccountForOwner(post.ownerId, "instagram");
  return account && account.ownerId === post.ownerId ? account : null;
}

async function processPost(ctx: Ctx, post: SocialPostRecord): Promise<Outcome> {
  const now = ctx.now();

  // 1) Atrasado demais (e nunca enviado ao Instagram): não publica.
  if (
    post.scheduledAt &&
    !post.igContainerId &&
    now.getTime() - Date.parse(post.scheduledAt) > MAX_LATENESS_MS()
  ) {
    const saved = await transition(ctx, post, {
      status: "missed",
      nextAttemptAt: null,
      attempts: Math.max(0, post.attempts - 1),
      lastError: MISSED_MESSAGE,
    });
    if (!saved) return "skipped";
    await ctx.store.logEvent({ ownerId: post.ownerId, postId: post.id, action: "publish_missed" });
    return "missed";
  }

  // 2) Conta ligada e ativa.
  const account = await loadAccount(ctx, post);
  if (!account || account.status !== "active") return pause(ctx, post, NOT_CONNECTED_MESSAGE);

  // 3) Plano ativo.
  if (!(await ctx.hasSocialAccess(post.ownerId))) return pause(ctx, post, PLAN_MESSAGE);

  // 4) Limite próprio por conta em 24 h (bem abaixo do limite da Meta).
  const since = new Date(now.getTime() - DAY_MS).toISOString();
  if ((await ctx.store.countPublishedSince(account.id, since)) >= dailyPostCap()) {
    return reschedule(
      ctx,
      post,
      HOUR_MS,
      "This account reached today's post limit. We will try again in an hour.",
    );
  }

  try {
    let token: string;
    try {
      token = ctx.getToken(account);
    } catch {
      throw new InstagramError("The saved Instagram access could not be read.", "auth");
    }
    return await publishWithAccount(ctx, post, account, token);
  } catch (error) {
    return handleError(ctx, post, account, error);
  }
}

async function publishWithAccount(
  ctx: Ctx,
  post: SocialPostRecord,
  account: SocialAccountRecord,
  token: string,
): Promise<Outcome> {
  const { client } = ctx;
  let containerId = post.igContainerId;

  // 5) Já existe container: confere antes de qualquer coisa (nunca publicar duas vezes).
  if (containerId) {
    const status = await client.getContainerStatus(token, containerId);
    if (status === "PUBLISHED") {
      // A Graph API não devolve o id da mídia pelo container: fica sem id e sem link.
      return markPublished(ctx, post, account, post.igMediaId, post.permalink, containerId);
    }
    if (status === "IN_PROGRESS") return reschedule(ctx, post, MINUTE_MS, null);
    if (status === "EXPIRED" || status === "ERROR") {
      const cleared = await ctx.store.updatePost(post.id, { igContainerId: null }, ["publishing"]);
      if (!cleared) return "skipped";
      containerId = null;
    }
  }

  // 6) Cria o container (uma foto ou carrossel) e salva o id NA HORA.
  if (!containerId) {
    containerId = await createContainer(client, token, account.externalId, post);
    const saved = await ctx.store.updatePost(
      post.id,
      { igContainerId: containerId, accountId: account.id },
      ["publishing"],
    );
    // O banco já devolveu este post para conferência: outro processo cuida dele.
    if (!saved) return "skipped";

    let status = await client.getContainerStatus(token, containerId);
    for (let i = 1; i < POLL_TRIES && status === "IN_PROGRESS"; i++) {
      await ctx.sleep(POLL_SLEEP_MS);
      status = await client.getContainerStatus(token, containerId);
    }
    if (status === "PUBLISHED") {
      return markPublished(ctx, post, account, null, null, containerId);
    }
    if (status === "IN_PROGRESS") return reschedule(ctx, post, MINUTE_MS, null);
    if (status === "ERROR") {
      throw new InstagramError("Instagram could not process the photo.", "permanent");
    }
    if (status === "EXPIRED") {
      throw new InstagramError("The Instagram upload expired.", "transient");
    }
  }

  // 7) Publica.
  await ctx.store.logEvent({
    ownerId: post.ownerId,
    accountId: account.id,
    postId: post.id,
    action: "publish_attempt",
    detail: { attempt: post.attempts },
  });
  const mediaId = await client.publish(token, account.externalId, containerId);
  let permalink: string | null = null;
  try {
    permalink = (await client.getMedia(token, mediaId)).permalink;
  } catch {
    // O link é só para mostrar: o post já está no ar.
  }
  return markPublished(ctx, post, account, mediaId, permalink, containerId);
}

async function createContainer(
  client: InstagramClient,
  token: string,
  igUserId: string,
  post: SocialPostRecord,
): Promise<string> {
  const media = post.media;
  const first = media[0];
  if (!first) throw new InstagramError("This post has no photo.", "permanent");
  if (media.length === 1) {
    return client.createImageContainer(token, igUserId, {
      imageUrl: first.url,
      caption: post.caption,
    });
  }
  if (media.length > 10) {
    throw new InstagramError("Instagram allows up to 10 photos per post.", "permanent");
  }
  const children: string[] = [];
  for (const item of media) {
    children.push(
      await client.createImageContainer(token, igUserId, {
        imageUrl: item.url,
        isCarouselItem: true,
      }),
    );
  }
  return client.createCarouselContainer(token, igUserId, { children, caption: post.caption });
}

async function handleError(
  ctx: Ctx,
  post: SocialPostRecord,
  account: SocialAccountRecord,
  error: unknown,
): Promise<Outcome> {
  const ig =
    error instanceof InstagramError
      ? error
      : new InstagramError(error instanceof Error ? error.message : "Unknown error.", "transient");
  await ctx.store.logEvent({
    ownerId: post.ownerId,
    accountId: account.id,
    postId: post.id,
    action: "publish_failed",
    detail: { kind: ig.kind, code: ig.code ?? null, message: ig.message.slice(0, 300) },
  });

  if (ig.kind === "auth") {
    const outcome = await pause(ctx, post, RECONNECT_MESSAGE);
    await markAccountNeedsReconnect(account, RECONNECT_MESSAGE, {
      store: ctx.store,
      pauseAccountPosts: ctx.pauseAccountPosts,
      sendReconnectEmail: ctx.sendReconnectEmail,
    });
    return outcome;
  }

  if (ig.kind === "permanent") {
    return fail(ctx, post, `Instagram did not accept this post: ${ig.message.slice(0, 200)}`);
  }

  // rate_limit / transient: tenta de novo com espera crescente.
  if (post.attempts >= MAX_ATTEMPTS) {
    return fail(ctx, post, "We tried several times and Instagram did not accept this post.");
  }
  const delay = BACKOFF_MS[Math.min(post.attempts, BACKOFF_MS.length) - 1] ?? MINUTE_MS;
  const saved = await transition(ctx, post, {
    status: "scheduled",
    nextAttemptAt: new Date(ctx.now().getTime() + delay).toISOString(),
    lastError:
      ig.kind === "rate_limit"
        ? "Instagram asked us to slow down. We will try again soon."
        : "Instagram did not answer. We will try again soon.",
  });
  return saved ? "retried" : "skipped";
}
