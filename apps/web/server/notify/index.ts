import { after } from "next/server";
import { isAppHost } from "../domains/hosts";
import { sendEstimateAnswerNotification, type EstimateAnswerInput } from "./estimate-email";
import { sendLeadNotification, type LeadEmailInput } from "./lead-email";

export {
  DEFAULT_LEADS_FROM,
  buildLeadEmail,
  findOwnerEmail,
  sendLeadNotification,
  type LeadEmailInput,
  type NotifyEnv,
  type NotifyResult,
} from "./lead-email";
export {
  buildEstimateAnswerEmail,
  sendEstimateAnswerNotification,
  type EstimateAnswerInput,
} from "./estimate-email";
export { RateLimiter, clientIp } from "./rate-limit";

/** Endereço padrão do painel quando o pedido chega pelo domínio do cliente. */
const DEFAULT_APP_URL = "https://nosweatfd.com";

/** Origem do painel: a do próprio request se for a plataforma; senão APP_URL (ou nosweatfd.com). */
export function appOrigin(requestUrl: string): string {
  const url = new URL(requestUrl);
  if (isAppHost(url.hostname)) return url.origin;
  return (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, "");
}

/**
 * Agenda o aviso por e-mail para DEPOIS da resposta (`after` do Next): não atrasa nem derruba
 * o envio do formulário. Fora de um request do Next (ex.: testes), dispara sem esperar.
 */
export function notifyOwnerOfLead(input: LeadEmailInput): void {
  const task = async () => {
    await sendLeadNotification(input);
  };
  try {
    after(task);
  } catch {
    void task();
  }
}

/** Aviso ao dono de que o cliente aprovou ou recusou um orçamento (depois da resposta, como acima). */
export function notifyOwnerOfEstimateAnswer(input: EstimateAnswerInput): void {
  const task = async () => {
    await sendEstimateAnswerNotification(input);
  };
  try {
    after(task);
  } catch {
    void task();
  }
}
