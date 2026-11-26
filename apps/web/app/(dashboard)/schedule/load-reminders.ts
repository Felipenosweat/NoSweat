import { getBookingSettings } from "@/server/booking/service";
import { getBookingStore } from "@/server/booking/store";
import { getClientStore } from "@/server/clients/store";
import { getSettings as getOfficeSettings } from "@/server/office/service";
import { getSiteStore } from "@/server/store";
import { buildReminderRows, readWindow, type ReminderRow } from "./sms-reminders";
import { safeTimeZone } from "./time";

// Lista "Text reminders" da agenda: marcações de AMANHÃ com consentimento, sem quem respondeu STOP.
// Sem provedor de SMS: o dono manda do próprio celular. As regras puras ficam em
// sms-reminders.ts; aqui só se lê o que vem do banco (só para server components).

export type SmsRemindersData = {
  timeZone: string;
  businessName: string;
  rows: ReminderRow[];
  /** O "agora" usado na lista (a tela começa por ele, sem ler o relógio). */
  nowMs: number;
};

/** Mesmo nome que o aviso de consentimento mostrou: o da empresa no escritório, senão o do site. */
async function businessNameOf(ownerId: string, companyName: string): Promise<string> {
  if (companyName.trim()) return companyName.trim();
  const sites = await getSiteStore().list(ownerId);
  const site = sites.find((item) => item.status === "published") ?? sites[0];
  return site?.spec.business.name.trim() ?? "";
}

/**
 * `null` = o dono não liga lembretes por texto (o cartão nem aparece). Erros são do chamador
 * (a página mostra o resto da agenda sem o cartão).
 */
export async function loadSmsReminders(
  ownerId: string,
  now: Date = new Date(),
): Promise<SmsRemindersData | null> {
  const settings = await getBookingSettings(ownerId);
  if (settings.smsReminders !== true) return null;

  const office = await getOfficeSettings(ownerId);
  const timeZone = safeTimeZone(office.timeZone);
  const { fromIso, toIso } = readWindow(now);
  const [bookings, clients, businessName] = await Promise.all([
    getBookingStore().listActive(ownerId, fromIso, toIso),
    getClientStore().listClients(ownerId),
    businessNameOf(ownerId, office.companyName),
  ]);
  return {
    timeZone,
    businessName,
    rows: buildReminderRows({ now, timeZone, businessName, bookings, clients }),
    nowMs: now.getTime(),
  };
}
