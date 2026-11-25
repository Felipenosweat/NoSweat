import { after } from "next/server";
import { firstNameOf, reviewEmailSubject, reviewRequestMessage } from "@/lib/reviews";
import { ownerHasFeature } from "../billing";
import { getClientStore } from "../clients/store";
import { findOwnerEmail, type NotifyEnv } from "../notify/lead-email";
import { sendClientReplyEmail } from "../notify/client-reply-email";
import { getOfficeStore } from "../office/store";
import { accountReviewLink } from "../reviews";
import { getSiteStore } from "../store";
import { getReviewRequestStore } from "./store";

// Pedido de avaliação no Google automático (Pro e Premium): quando um job vira "done", o cliente
// do job recebe por e-mail o mesmo texto do pedido manual de /reviews (lib/reviews.ts), com
// `reply_to` no e-mail da empresa. Só sai se TUDO valer: Resend configurada, job "done", plano com
// o recurso, chave do dono ligada, link de avaliações no site, cliente com e-mail, e
// `claim` aceitou (um por job, nenhum para o mesmo cliente em 30 dias; gravado antes de enviar).
// Nunca atrasa nem derruba a mudança do job: roda depois da resposta e todo erro só vai para o log.
// (Não importa office/service para não criar ciclo: office/service chama este arquivo.)

export type AutoReviewSkipReason =
  | "not_configured"
  | "not_done"
  | "no_feature"
  | "disabled"
  | "no_review_link"
  | "no_email"
  | "no_reply_to"
  | "already_asked"
  | "send_failed";

export type AutoReviewOutcome = { sent: true } | { sent: false; reason: AutoReviewSkipReason };

export type AutoReviewDeps = {
  env?: NotifyEnv;
  fetchImpl?: typeof fetch;
  /** Troca a consulta do plano (testes). */
  hasFeature?: (ownerId: string) => Promise<boolean>;
};

/** Texto do histórico do cliente. */
export function autoReviewActivityBody(jobNumber: number): string {
  return `Google review request sent automatically by email (job #${jobNumber} marked done).`;
}

/** E-mail que parece válido (o resto a Resend confere). `null` se não servir. */
function usableEmail(value: string | null | undefined): string | null {
  const email = (value ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Primeiro dia do mês corrente (UTC), em ISO: início da contagem "this month". */
export function monthStartIso(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Manda (ou não) o pedido automático do job. Nunca lança por causa do envio. */
export async function sendAutoReviewRequest(
  ownerId: string,
  jobId: string,
  deps: AutoReviewDeps = {},
): Promise<AutoReviewOutcome> {
  const env = deps.env ?? process.env;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const hasFeature =
    deps.hasFeature ?? ((owner: string) => ownerHasFeature(owner, "autoReviewRequests"));

  // Sem Resend não há como mandar: nem lê o banco.
  if (!env.RESEND_API_KEY) return { sent: false, reason: "not_configured" };

  const job = await getOfficeStore().getJob(ownerId, jobId);
  if (!job || job.status !== "done") return { sent: false, reason: "not_done" };
  if (!(await hasFeature(ownerId))) return { sent: false, reason: "no_feature" };

  const store = getReviewRequestStore();
  if (!(await store.getAutoEnabled(ownerId))) return { sent: false, reason: "disabled" };

  const link = accountReviewLink(await getSiteStore().list(ownerId));
  if (!link) return { sent: false, reason: "no_review_link" };

  const clients = getClientStore();
  const client = await clients.getClient(ownerId, job.clientId);
  const email = usableEmail(client?.email);
  if (!client || !email) return { sent: false, reason: "no_email" };

  const settings = await getOfficeStore().getSettings(ownerId);
  const companyName = settings?.companyName.trim() || link.businessName.trim();
  const replyTo = usableEmail(settings?.email) ?? (await findOwnerEmail(ownerId, env, fetchImpl));
  // Sem e-mail do dono a resposta do cliente cairia numa caixa que ninguém lê.
  if (!replyTo) return { sent: false, reason: "no_reply_to" };

  // Gravado ANTES do envio: dois "done" ao mesmo tempo nunca mandam dois e-mails.
  const claimId = await store.claim({ ownerId, jobId, clientId: client.id, email });
  if (!claimId) return { sent: false, reason: "already_asked" };

  const sent = await sendClientReplyEmail(
    {
      to: email,
      replyTo,
      companyName,
      subject: reviewEmailSubject(companyName),
      message: reviewRequestMessage({
        firstName: firstNameOf(client.name),
        businessName: companyName,
        link: link.url,
      }),
    },
    env,
    fetchImpl,
  );
  await store.finish(claimId, sent.sent ? "sent" : "failed");
  if (!sent.sent) return { sent: false, reason: "send_failed" };

  const activity = await clients.insertActivity({
    ownerId,
    clientId: client.id,
    kind: "message",
    body: autoReviewActivityBody(job.number),
    amountCents: null,
    leadId: null,
    siteId: null,
  });
  if (activity) {
    await clients.updateClient(ownerId, client.id, { lastActivityAt: activity.occurredAt });
  }
  return { sent: true };
}

/**
 * Agenda o pedido para DEPOIS da resposta (`after` do Next), como os avisos de server/notify.
 * Fora de um request do Next (testes, scripts), dispara sem esperar. Erros só vão para o log.
 */
export function scheduleAutoReviewRequest(ownerId: string, jobId: string): void {
  const task = async () => {
    try {
      const outcome = await sendAutoReviewRequest(ownerId, jobId);
      if (!outcome.sent && outcome.reason === "send_failed") {
        console.error(`[reviews] automatic review request failed for job ${jobId}`);
      }
    } catch (error) {
      console.error("[reviews] automatic review request failed", error);
    }
  };
  try {
    after(task);
  } catch {
    void task();
  }
}

export type AutoReviewSummary = {
  /** O plano da conta tem o recurso. */
  available: boolean;
  enabled: boolean;
  sentThisMonth: number;
};

/** Estado do pedido automático para a página /reviews. Erro no banco = desligado, sem números. */
export async function getAutoReviewSummary(ownerId: string): Promise<AutoReviewSummary> {
  try {
    const store = getReviewRequestStore();
    const [available, enabled, sentThisMonth] = await Promise.all([
      ownerHasFeature(ownerId, "autoReviewRequests"),
      store.getAutoEnabled(ownerId),
      store.countSent(ownerId, monthStartIso()),
    ]);
    return { available, enabled, sentThisMonth };
  } catch (error) {
    console.error("[reviews] could not read the automatic review settings", error);
    return { available: false, enabled: false, sentThisMonth: 0 };
  }
}

/** Liga ou desliga o pedido automático. */
export async function setAutoReviewEnabled(ownerId: string, enabled: boolean): Promise<void> {
  await getReviewRequestStore().setAutoEnabled(ownerId, enabled);
}
