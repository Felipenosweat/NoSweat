import {
  smsConsentText,
  type BookingSettings,
  type CreateBookingRequest,
} from "@nosweat/schema";
import { OfficeError } from "../office/types";
import type { BookingConsent, SmsConsent } from "./types";

// Aceite do formulário v2: quem manda o formato novo (`firstName`) precisa aceitar a privacidade
// (e a política de cancelamento, se o dono escreveu uma). O formato antigo (só `name`) segue
// valendo para páginas em cache e não registra aceite.

/** "(305) 555-0187" para +1 de 10 dígitos; qualquer outro valor volta como veio. */
export function formatPhoneDisplay(phone: string): string {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(phone.trim());
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone.trim();
}

/** Política do dono já limpa (vazia = sem política). */
export function policyOf(settings: Pick<BookingSettings, "cancellationPolicy">): string {
  return settings.cancellationPolicy?.trim() ?? "";
}

/** O texto que o cliente viu: a política e, se houver, a janela de cancelamento grátis. */
export function cancellationSnapshot(
  settings: Pick<BookingSettings, "cancellationPolicy" | "cancellationHours">,
): string | null {
  const policy = policyOf(settings);
  if (!policy) return null;
  const hours = settings.cancellationHours ?? 0;
  return hours > 0
    ? `${policy}\nCancel free up to ${hours} ${hours === 1 ? "hour" : "hours"} before.`
    : policy;
}

/**
 * `null` = formato antigo (sem aceite). Formato novo sem o aceite certo → 422 `invalid_request`.
 */
export function consentFor(
  input: CreateBookingRequest,
  settings: Pick<BookingSettings, "cancellationPolicy" | "cancellationHours">,
  now: Date,
): BookingConsent | null {
  if (input.firstName === undefined) return null;
  if (input.acceptedPrivacy !== true) {
    throw new OfficeError(422, "invalid_request", "Please agree to the Privacy Policy to book.");
  }
  const snapshot = cancellationSnapshot(settings);
  if (snapshot && input.acceptedCancellation !== true) {
    throw new OfficeError(
      422,
      "invalid_request",
      "Please reload the page and agree to the cancellation policy to book.",
    );
  }
  const at = now.toISOString();
  return {
    customerFirstName: input.firstName.trim(),
    customerLastName: input.lastName?.trim() || null,
    customerPhoneCountry: input.phoneCountry?.toUpperCase() ?? null,
    privacyAcceptedAt: at,
    cancellationAcceptedAt: snapshot ? at : null,
    cancellationPolicySnapshot: snapshot,
  };
}

/**
 * Consentimento para lembretes por texto: só com a caixa marcada (`acceptedSms`) E o dono com
 * `smsReminders` ligado. O texto guardado é montado AQUI, com o nome da empresa, nunca o que o
 * navegador mandar. Vale também para o formato antigo do pedido. Sem a caixa, `null` (a marcação
 * funciona do mesmo jeito: o consentimento nunca é condição).
 */
export function smsConsentFor(
  input: Pick<CreateBookingRequest, "acceptedSms">,
  settings: Pick<BookingSettings, "smsReminders">,
  businessName: string,
  now: Date,
): SmsConsent | null {
  if (input.acceptedSms !== true || settings.smsReminders !== true) return null;
  return { smsConsentAt: now.toISOString(), smsConsentText: smsConsentText(businessName) };
}

/** Nome completo do cliente: "First Last" no formato novo, `name` no antigo. */
export function customerNameOf(input: CreateBookingRequest): string {
  if (input.firstName === undefined) return input.name.trim();
  return [input.firstName.trim(), input.lastName?.trim()].filter(Boolean).join(" ");
}
