import { getAccount } from "../admin";
import {
  accessAppUrl,
  accessEmailConfigured,
  sendAccessEmail,
  simpleHtml,
  type AccessEmailEnv,
  type AccessEmailResult,
} from "../notify/access-email";
import {
  getGrantStore,
  sameInstant,
  type AccessGrant,
  type GrantStore,
  type ReminderStage,
} from "./grants";
import { billingEnforced } from "./index";
import { PLANS } from "./plans";

// Lembretes de vencimento do acesso manual (Pix/WhatsApp). Roda uma vez por dia no cron
// /api/cron/cleanup-guests. Para cada acesso: um e-mail ao cliente faltando 7 dias, outro
// faltando 1 dia e outro quando acaba (uma vez por etapa para a MESMA data final; se o admin
// mudar a data, os avisos recomeçam). Depois, um resumo para SALES_EMAIL com o que saiu.
// Sem RESEND_API_KEY ou com os planos desligados, não faz nada. Sem carência: o site sai do ar
// na hora em que o acesso acaba (ver ownerHasLiveAccess), até o fundador decidir outra coisa.

const DAY_MS = 24 * 60 * 60 * 1000;
/** Acessos que acabaram há mais do que isto não recebem o aviso de "acabou" (nada de e-mail velho). */
const ENDED_LOOKBACK_DAYS = 3;
/** Acesso cortado pelo admin ("Remove access"): a data final é o momento da própria edição. */
const REVOKE_TOLERANCE_MS = 60_000;
const DEFAULT_SALES_EMAIL = "hello@nosweatfd.com";

const STAGE_RANK: Record<ReminderStage, number> = { "7d": 1, "1d": 2, ended: 3 };
const STAGE_LABEL: Record<ReminderStage, string> = {
  "7d": "ends within 7 days",
  "1d": "ends within 1 day",
  ended: "ended",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

/** Em que etapa o acesso está agora (`null` = nenhum aviso cabe). */
export function reminderStageFor(grant: AccessGrant, now: Date = new Date()): ReminderStage | null {
  const left = Date.parse(grant.expiresAt) - now.getTime();
  if (Number.isNaN(left)) return null;
  if (left <= 0) {
    if (-left > ENDED_LOOKBACK_DAYS * DAY_MS) return null;
    // Cortado pelo admin: não manda "renove" para quem teve o acesso removido de propósito.
    if (Date.parse(grant.updatedAt) >= Date.parse(grant.expiresAt) - REVOKE_TOLERANCE_MS) {
      return null;
    }
    return "ended";
  }
  if (left <= DAY_MS) return "1d";
  if (left <= 7 * DAY_MS) return "7d";
  return null;
}

/** Etapa a avisar agora, ou `null` se já avisamos esta etapa (ou uma mais adiante) desta data. */
export function reminderDue(grant: AccessGrant, now: Date = new Date()): ReminderStage | null {
  const stage = reminderStageFor(grant, now);
  if (!stage) return null;
  const already =
    grant.reminderStage && sameInstant(grant.remindedFor, grant.expiresAt)
      ? STAGE_RANK[grant.reminderStage]
      : 0;
  return already >= STAGE_RANK[stage] ? null : stage;
}

/** Assunto e texto do e-mail ao cliente. */
export function buildReminderEmail(
  grant: AccessGrant,
  stage: ReminderStage,
  appUrl: string,
): { subject: string; text: string; html: string } {
  const plan = PLANS[grant.plan].name;
  const date = dateFormat.format(new Date(grant.expiresAt));
  const billing = `${appUrl}/billing`;
  const paragraphs =
    stage === "ended"
      ? [
          `Your No Sweat ${plan} plan ended on ${date}.`,
          `Your published websites stay offline until you renew. Your drafts are saved. Renew here: ${billing}`,
        ]
      : [
          `Your No Sweat ${plan} plan ends on ${date}.`,
          `Renew to keep your website live: ${billing}`,
        ];
  const subject =
    stage === "ended"
      ? `Your No Sweat ${plan} plan has ended`
      : `Your No Sweat ${plan} plan ends on ${date}`;
  const text = [...paragraphs, "", "Questions? Just reply to this email.", "", "No Sweat"].join(
    "\n",
  );
  return {
    subject,
    text,
    html: simpleHtml([...paragraphs, "Questions? Just reply to this email.", "No Sweat"]),
  };
}

export type ReminderDeps = {
  store: GrantStore;
  /** E-mail da conta e se é conta de teste (`null` = conta não existe mais). */
  getAccount: (userId: string) => Promise<{ email: string | null; testAccount: boolean } | null>;
  send: (to: string, subject: string, text: string, html: string) => Promise<AccessEmailResult>;
  enforced: boolean;
  env: AccessEmailEnv;
};

function defaultDeps(): ReminderDeps {
  return {
    store: getGrantStore(),
    getAccount,
    send: (to, subject, text, html) => sendAccessEmail(to, subject, text, html),
    enforced: billingEnforced(),
    env: process.env,
  };
}

export type ReminderSummary = {
  /** Por que não rodou (`null` = rodou). */
  disabled: "billing_off" | "email_off" | null;
  checked: number;
  sent: number;
  failed: number;
  skipped: number;
  /** Resumo para SALES_EMAIL ("none" = não havia nada para contar). */
  digest: AccessEmailResult | "none";
};

/** Manda os lembretes que estão devendo e o resumo para a equipe. Erros de um não param os outros. */
export async function sendAccessReminders(
  now: Date = new Date(),
  deps: ReminderDeps = defaultDeps(),
): Promise<ReminderSummary> {
  const summary: ReminderSummary = {
    disabled: null,
    checked: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    digest: "none",
  };
  if (!deps.enforced) return { ...summary, disabled: "billing_off" };
  if (!accessEmailConfigured(deps.env)) return { ...summary, disabled: "email_off" };

  const appUrl = accessAppUrl(deps.env);
  const grants = await deps.store.listExpiringOrExpired(
    new Date(now.getTime() + 7 * DAY_MS).toISOString(),
    new Date(now.getTime() - ENDED_LOOKBACK_DAYS * DAY_MS).toISOString(),
  );
  const digestLines: string[] = [];

  for (const grant of grants) {
    summary.checked += 1;
    const stage = reminderDue(grant, now);
    if (!stage) continue;
    try {
      const account = await deps.getAccount(grant.userId);
      if (!account?.email || account.testAccount) {
        summary.skipped += 1;
        continue;
      }
      // Grava a etapa ANTES de enviar: se a gravação falhar (ex.: migration 0018 não rodou), não
      // manda nada, em vez de repetir o mesmo e-mail todo dia.
      await deps.store.setReminder(grant.userId, stage, grant.expiresAt);
      const email = buildReminderEmail(grant, stage, appUrl);
      const result = await deps.send(account.email, email.subject, email.text, email.html);
      const line = `- ${account.email} · ${PLANS[grant.plan].name} · ${STAGE_LABEL[stage]} (${dateFormat.format(new Date(grant.expiresAt))}) · ${appUrl}/admin/clients/${grant.userId}`;
      if (result === "sent") {
        summary.sent += 1;
        digestLines.push(line);
      } else {
        summary.failed += 1;
        digestLines.push(`${line} · EMAIL FAILED`);
        // Volta a etapa anterior para tentar de novo amanhã.
        await deps.store
          .setReminder(grant.userId, grant.reminderStage ?? null, grant.remindedFor ?? null)
          .catch(() => undefined);
      }
    } catch (error) {
      summary.failed += 1;
      console.error(
        `[billing] access reminder failed for ${grant.userId} (did migration 0018 run?)`,
        error,
      );
    }
  }

  if (digestLines.length > 0) {
    const salesEmail = deps.env.SALES_EMAIL || DEFAULT_SALES_EMAIL;
    const paragraphs = [
      `Plan reminders sent today (manual access):`,
      digestLines.join("\n"),
      `All accounts: ${appUrl}/admin`,
    ];
    summary.digest = await deps.send(
      salesEmail,
      `No Sweat: ${digestLines.length} plan ${digestLines.length === 1 ? "reminder" : "reminders"} today`,
      paragraphs.join("\n\n"),
      simpleHtml(paragraphs),
    );
  }
  return summary;
}
