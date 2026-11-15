import { getAccount } from "../admin";
import { ownerHasLiveAccess } from "../billing";
import { getBookingStore } from "../booking/store";
import { accessAppUrl, simpleHtml } from "../notify/access-email";
import { DEFAULT_LEADS_FROM } from "../notify/lead-email";
import { getSiteStore } from "../store";
import { dayKey, getVisitStore } from "./store";

// Resumo mensal por e-mail para o dono: visitas, pedidos e marcações do mês que acabou. É o que
// mostra que o site trabalha para ele (quem não vê resultado cancela). Roda no dia 1 pelo cron
// /api/cron/monthly-report. Regras:
// - só contas com site publicado e plano em dia (com planos valendo);
// - mês sem nenhuma visita, pedido ou marcação não gera e-mail (um "zero" só desanima);
// - cada conta recebe no máximo um resumo por mês (monthly_reports, gravado antes do envio);
// - contas de teste e sem e-mail ficam de fora.

const TIMEOUT_MS = 5_000;

export type MonthRange = {
  /** Primeiro dia do mês (YYYY-MM-DD): também é a chave do resumo. */
  month: string;
  fromDay: string;
  toDay: string;
  fromIso: string;
  /** Começo do mês seguinte (exclusivo). */
  toIso: string;
  /** "October" */
  label: string;
};

/** O mês (UTC) anterior ao de `now`. */
export function previousMonth(now: Date = new Date()): MonthRange {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastDay = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return {
    month: dayKey(start),
    fromDay: dayKey(start),
    toDay: dayKey(lastDay),
    fromIso: start.toISOString(),
    toIso: end.toISOString(),
    label: new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(start),
  };
}

export type SiteNumbers = { siteId: string; name: string; visits: number; requests: number };

export type MonthlyReport = {
  monthLabel: string;
  sites: SiteNumbers[];
  /** Marcações pelo site com horário no mês (da conta toda). */
  bookings: number;
  appUrl: string;
};

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;

/** Total de visitas, pedidos e marcações do resumo. */
export function reportTotals(report: Pick<MonthlyReport, "sites" | "bookings">) {
  const visits = report.sites.reduce((sum, site) => sum + site.visits, 0);
  const requests = report.sites.reduce((sum, site) => sum + site.requests, 0);
  return { visits, requests, bookings: report.bookings };
}

/** Assunto e corpo do resumo. Os números vão no assunto: dá para ler sem abrir. */
export function buildMonthlyReportEmail(report: MonthlyReport): {
  subject: string;
  text: string;
  html: string;
} {
  const { visits, requests, bookings } = reportTotals(report);
  const first = report.sites[0];
  const name = report.sites.length === 1 && first ? first.name : "your websites";
  const parts = [plural(visits, "visit"), plural(requests, "request")];
  if (bookings > 0) parts.push(plural(bookings, "online booking"));

  const paragraphs = [
    `Here is how ${name} did in ${report.monthLabel}:`,
    [
      `- ${plural(visits, "visit")} to your website`,
      `- ${plural(requests, "request")} from your contact form`,
      bookings > 0 ? `- ${plural(bookings, "online booking")}` : null,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  ];
  if (report.sites.length > 1) {
    paragraphs.push(
      report.sites
        .map(
          (site) =>
            `${site.name}: ${plural(site.visits, "visit")}, ${plural(site.requests, "request")}`,
        )
        .join("\n"),
    );
  }
  paragraphs.push(
    requests > 0
      ? "People who get a fast answer are the ones who book. Your requests are waiting here:"
      : "Want more visits? Put your website link on your Google Business Profile, your Instagram bio and your business cards. Your dashboard:",
    first && report.sites.length === 1
      ? `${report.appUrl}/sites/${first.siteId}`
      : `${report.appUrl}/dashboard`,
    "You get this summary once a month because you have a website with No Sweat. Reply to this email if you'd rather not get it.",
    "No Sweat",
  );
  return {
    subject: `Your website in ${report.monthLabel}: ${parts.join(", ")}`,
    text: paragraphs.join("\n\n"),
    html: simpleHtml(paragraphs),
  };
}

export type ReportEnv = {
  [key: string]: string | undefined;
  RESEND_API_KEY?: string;
  LEADS_FROM_EMAIL?: string;
  SALES_EMAIL?: string;
};

/** Envia pela API HTTP da Resend (sem SDK). As respostas vão para SALES_EMAIL. Nunca lança. */
async function sendReportEmail(
  to: string,
  email: { subject: string; text: string; html: string },
  env: ReportEnv,
): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.LEADS_FROM_EMAIL || DEFAULT_LEADS_FROM,
        to: [to],
        ...(env.SALES_EMAIL ? { reply_to: env.SALES_EMAIL } : {}),
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[reports] Resend failed (${res.status}): ${await res.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[reports] monthly report email failed", error);
    return false;
  }
}

type OwnerSite = { id: string; ownerId: string; name: string };

export type ReportDeps = {
  env: ReportEnv;
  appUrl: string;
  /** Sites publicados que têm dono. */
  publishedSites: () => Promise<OwnerSite[]>;
  hasLiveAccess: (ownerId: string) => Promise<boolean>;
  visits: (fromDay: string, toDay: string) => Promise<Map<string, number>>;
  /** Pedidos do formulário do site entre `fromIso` (incluído) e `toIso` (excluído). */
  requests: (siteId: string, fromIso: string, toIso: string) => Promise<number>;
  bookings: (ownerId: string, fromIso: string, toIso: string) => Promise<number>;
  getAccount: (ownerId: string) => Promise<{ email: string | null; testAccount: boolean } | null>;
  claim: (ownerId: string, month: string) => Promise<boolean>;
  send: (to: string, email: { subject: string; text: string; html: string }) => Promise<boolean>;
};

function defaultDeps(): ReportDeps {
  const env: ReportEnv = process.env;
  return {
    env,
    appUrl: accessAppUrl(process.env),
    publishedSites: async () =>
      (await getSiteStore().listAllSummaries()).flatMap((site) =>
        site.status === "published" && site.ownerId
          ? [{ id: site.id, ownerId: site.ownerId, name: site.spec.business.name }]
          : [],
      ),
    hasLiveAccess: ownerHasLiveAccess,
    visits: (fromDay, toDay) => getVisitStore().totals(fromDay, toDay),
    requests: async (siteId, fromIso, toIso) =>
      (await getSiteStore().listLeads(siteId)).filter(
        (lead) => lead.createdAt >= fromIso && lead.createdAt < toIso,
      ).length,
    bookings: async (ownerId, fromIso, toIso) =>
      (await getBookingStore().listActive(ownerId, fromIso, toIso)).length,
    getAccount,
    claim: (ownerId, month) => getVisitStore().claimReport(ownerId, month),
    send: (to, email) => sendReportEmail(to, email, env),
  };
}

export type ReportSummary = {
  /** Por que não rodou (`null` = rodou). */
  disabled: "email_off" | null;
  month: string;
  owners: number;
  sent: number;
  failed: number;
  /** Sem atividade no mês, sem plano, sem e-mail, conta de teste ou já enviado. */
  skipped: number;
};

/** Manda o resumo do mês anterior para cada conta. O erro de uma conta não para as outras. */
export async function sendMonthlyReports(
  now: Date = new Date(),
  deps: ReportDeps = defaultDeps(),
): Promise<ReportSummary> {
  const range = previousMonth(now);
  const summary: ReportSummary = {
    disabled: null,
    month: range.month,
    owners: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };
  if (!deps.env.RESEND_API_KEY) return { ...summary, disabled: "email_off" };

  const byOwner = new Map<string, OwnerSite[]>();
  for (const site of await deps.publishedSites()) {
    byOwner.set(site.ownerId, [...(byOwner.get(site.ownerId) ?? []), site]);
  }
  const visits = await deps.visits(range.fromDay, range.toDay);

  for (const [ownerId, ownerSites] of byOwner) {
    summary.owners += 1;
    try {
      if (!(await deps.hasLiveAccess(ownerId))) {
        summary.skipped += 1;
        continue;
      }
      const sites: SiteNumbers[] = [];
      for (const site of ownerSites) {
        sites.push({
          siteId: site.id,
          name: site.name,
          visits: visits.get(site.id) ?? 0,
          requests: await deps.requests(site.id, range.fromIso, range.toIso),
        });
      }
      const report: MonthlyReport = {
        monthLabel: range.label,
        sites,
        bookings: await deps.bookings(ownerId, range.fromIso, range.toIso),
        appUrl: deps.appUrl,
      };
      const totals = reportTotals(report);
      if (totals.visits + totals.requests + totals.bookings === 0) {
        summary.skipped += 1;
        continue;
      }
      const account = await deps.getAccount(ownerId);
      if (!account?.email || account.testAccount) {
        summary.skipped += 1;
        continue;
      }
      // Marca ANTES de enviar: se o cron rodar duas vezes, o cliente não recebe dois resumos.
      if (!(await deps.claim(ownerId, range.month))) {
        summary.skipped += 1;
        continue;
      }
      if (await deps.send(account.email, buildMonthlyReportEmail(report))) summary.sent += 1;
      else summary.failed += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(`[reports] monthly report failed for ${ownerId}`, error);
    }
  }
  return summary;
}
