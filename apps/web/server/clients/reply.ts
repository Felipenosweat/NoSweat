import type { ClientReplyRequest, ClientReplyResponse } from "@nosweat/schema";
import { getSettings } from "../office/service";
import { findOwnerEmail, type NotifyEnv } from "../notify/lead-email";
import { sendClientReplyEmail } from "../notify/client-reply-email";
import { toPublicActivity, toPublicClient, updateClient } from "./service";
import { getClientStore } from "./store";
import type { ClientActivityRecord } from "./types";

// Responder a um cliente (botão "Reply"): por e-mail, enviado pela plataforma, ou registrado no
// histórico depois que o dono mandou pelo app do celular (SMS ou e-mail). O que o cliente recebeu
// fica como item `message` no histórico, para o dono saber o que já foi dito.

export type ClientReplyOutcome =
  | { ok: true; data: ClientReplyResponse }
  | {
      ok: false;
      reason: "not_found" | "no_contact" | "no_reply_to" | "not_configured" | "send_failed";
    };

/** Quantos caracteres da mensagem vão para o histórico. */
const PREVIEW_CHARS = 120;

/** Texto do histórico: o que foi feito + o começo da mensagem (uma linha só). */
export function replyActivityBody(
  input: Pick<ClientReplyRequest, "channel" | "message" | "confirmation">,
): string {
  const flat = input.message.replace(/\s+/g, " ").trim();
  const preview = flat.length > PREVIEW_CHARS ? `${flat.slice(0, PREVIEW_CHARS).trimEnd()}…` : flat;
  const label =
    input.channel === "email"
      ? input.confirmation
        ? "Confirmation sent by email"
        : "Reply sent by email"
      : input.confirmation
        ? "Confirmation texted"
        : "Texted";
  return `${label}: ${preview}`;
}

/** Nome e e-mail da empresa nas configurações do escritório (erro = vazio, nunca derruba). */
async function companyContact(ownerId: string): Promise<{ name: string; email: string | null }> {
  try {
    const settings = await getSettings(ownerId);
    return { name: settings.companyName, email: settings.email?.trim() || null };
  } catch (error) {
    console.error("[clients] could not read the company settings", error);
    return { name: "", email: null };
  }
}

/** Nome e telefone da empresa para o texto pronto da resposta (erro = sem eles, nunca derruba). */
export async function getReplyCompany(
  ownerId: string,
): Promise<{ name: string; phone: string | null }> {
  try {
    const settings = await getSettings(ownerId);
    return { name: settings.companyName, phone: settings.phone?.trim() || null };
  } catch (error) {
    console.error("[clients] could not read the company settings", error);
    return { name: "", phone: null };
  }
}

/**
 * Responde ao cliente. `mode: "send"` manda o e-mail (Resend) com `reply_to` no e-mail da empresa
 * (ou da conta), para a resposta do cliente chegar no dono; `mode: "log"` só registra. Só depois do
 * envio (ou do registro) entra o item no histórico. Com `moveToContacted`, um cliente em "new"
 * passa para "contacted". `not_found` = cliente de outro dono.
 */
export async function replyToClient(
  ownerId: string,
  clientId: string,
  input: ClientReplyRequest,
  env: NotifyEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<ClientReplyOutcome> {
  const store = getClientStore();
  const client = await store.getClient(ownerId, clientId);
  if (!client) return { ok: false, reason: "not_found" };

  const email = client.email?.trim() || null;
  const phone = client.phone?.trim() || null;
  if (input.channel === "email" ? !email : !phone) return { ok: false, reason: "no_contact" };

  if (input.mode === "send" && email) {
    const company = await companyContact(ownerId);
    const replyTo = company.email ?? (await findOwnerEmail(ownerId, env, fetchImpl));
    // Sem e-mail do dono a resposta do cliente cairia numa caixa que ninguém lê.
    if (!replyTo) return { ok: false, reason: "no_reply_to" };
    const sent = await sendClientReplyEmail(
      {
        to: email,
        replyTo,
        companyName: company.name,
        subject: input.subject ?? "",
        message: input.message,
      },
      env,
      fetchImpl,
    );
    if (!sent.sent) return { ok: false, reason: sent.reason };
  }

  const activity = await store.insertActivity({
    ownerId,
    clientId: client.id,
    kind: "message",
    body: replyActivityBody(input),
    amountCents: null,
    leadId: null,
    siteId: null,
  });
  if (!activity) throw new Error("The reply was not saved.");

  const updated =
    (await store.updateClient(ownerId, client.id, { lastActivityAt: activity.occurredAt })) ??
    client;
  if (input.moveToContacted && client.stage === "new") {
    // updateClient registra a mudança de etapa no histórico.
    const moved = await updateClient(ownerId, client.id, { stage: "contacted" });
    if (moved) return finish(activity, moved, input);
  }
  return finish(activity, toPublicClient(updated), input);
}

function finish(
  activity: ClientActivityRecord,
  client: ClientReplyResponse["client"],
  input: ClientReplyRequest,
): ClientReplyOutcome {
  return {
    ok: true,
    data: {
      activity: toPublicActivity(activity),
      client,
      delivery: input.mode === "send" ? "sent" : "logged",
    },
  };
}
