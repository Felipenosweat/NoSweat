import type { TemplateId } from "@nosweat/schema";
import type { FillBooking } from "./look";

// Quais negócios ganham a seção "booking" (agendamento online) nos geradores sem IA (mock do dev e
// modo modelo). A IA de verdade decide pelo prompt (prompt.ts). A seção só leva título e uma frase
// neutra: nada de horário, preço ou promessa (regra 8). Serviços, horários e equipe vêm das
// configurações do dono; sem o agendamento ligado, a seção nem aparece no site.

export const DEFAULT_BOOKING_FILL: FillBooking = {
  title: "Book online",
  intro: "Choose a service and a time that works for you.",
};

/** Tipos do modo modelo (template-mode.ts) que atendem com hora marcada. */
const APPOINTMENT_PROFILES = new Set([
  "barber",
  "hair",
  "beauty",
  "nails",
  "lash-brow",
  "spa",
  "tattoo",
  "pet-grooming",
  "fitness",
  "dental",
  "chiropractor",
  "therapy",
  "photography",
]);

/** O tipo do modo modelo atende com hora marcada? */
export function isAppointmentProfile(profileId: string): boolean {
  return APPOINTMENT_PROFILES.has(profileId);
}

/** Mock do dev: o template "beauty" (salão, barbearia, unhas, spa, tatuagem) atende com hora marcada. */
export function isAppointmentTemplate(template: TemplateId): boolean {
  return template === "beauty";
}
