import type { Client, CreditBalance, Estimate, Job, OfficeSummary } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, cache, type ReactNode } from "react";
import { DashboardChecklist, type ChecklistStep } from "@/components/DashboardChecklist";
import {
  ChevronRightIcon,
  IconTile,
  cardClass,
  focusRing,
  insetDivider,
  sectionTitle,
  type IconTone,
} from "@/components/DashboardUi";
import { ExampleSiteEmpty } from "@/components/ExampleSiteEmpty";
import { glassButtonClass } from "@/components/glass";
import { LocalTime } from "@/components/LocalTime";
import { SitesGrid } from "@/components/SitesGrid";
import { CLIENTS_TIME_ZONE, dateKeyIn, formatDateOnly } from "@/lib/clients";
import { getAccount } from "@/server/admin";
import { getSessionClaims } from "@/server/auth/session";
import { getViewer, type ViewingAs } from "@/server/auth/viewer";
import { accessSummary, ownerHasCustomDomainAccess, type AccessSummary } from "@/server/billing";
import { attentionFromClients, listOwnerClients } from "@/server/clients/service";
import { getBalance } from "@/server/credits";
import { socialCapability } from "@/server/social/config";
import { isValidTimeZone, monthOf } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";
import type {
  SocialAccountRecord,
  SocialPostRecord,
  SocialSettingsRecord,
} from "@/server/social/types";
import {
  getOfficeSettings,
  getOfficeSummary,
  listEstimates,
  listInvoices,
} from "@/server/office/service";
import { listOwnerSites, listSiteLeads } from "@/server/owner-sites";
import type { SiteRecord } from "@/server/store";
import {
  AlertIcon,
  ApproveIcon,
  BillingIcon,
  CheckIcon,
  ClockIcon,
  ClientsIcon,
  EstimatesIcon,
  InvoicesIcon,
  LinkIcon,
  MessagesIcon,
  ScheduleIcon,
  SocialIcon,
} from "../NavIcons";
import { MoneyIcon, PlusIcon } from "../clients/ui";
import { formatTime, safeTimeZone, zonedParts } from "../schedule/time";
import { JobStatusBadge } from "../schedule/ui";
import { Greeting } from "./Greeting";
import {
  GreetingSummarySkeleton,
  OfficeSkeleton,
  OverviewSkeleton,
  SitesSkeleton,
} from "./skeletons";

export const metadata: Metadata = { title: "Home" };

const DAY_MS = 24 * 60 * 60 * 1000;
/** Quantas linhas "Needs you" mostrar no máximo. */
const MAX_NEEDS = 5;

/** O rascunho tem foto no topo ou alguma foto na galeria? */
function hasPhotos(site: SiteRecord): boolean {
  return site.spec.sections.some(
    (section) =>
      (section.type === "hero" && Boolean(section.image)) ||
      (section.type === "gallery" && section.images.length > 0),
  );
}

/**
 * Os 4 passos do checklist que o servidor sabe responder sobre o site (o último fica no cliente).
 * `domainIncluded = false`: o plano atual não tem domínio próprio, então o passo leva aos planos.
 */
function checklistSteps(site: SiteRecord, leads: number, domainIncluded: boolean): ChecklistStep[] {
  const live = site.status === "published";
  const liveHref = site.slug ? `/s/${site.slug}#contact` : null;
  return [
    { label: "Publish", done: live, href: `/sites/${site.id}#publish`, hint: "Put it online" },
    {
      label: "Connect domain",
      done: Boolean(site.customDomain),
      href: domainIncluded ? `/sites/${site.id}#domain` : "/billing",
      hint: domainIncluded ? "Use yourbusiness.com" : "Included in Pro",
    },
    {
      label: "Add photos",
      done: hasPhotos(site),
      href: `/sites/${site.id}/edit`,
      hint: "Your work, your team",
    },
    {
      label: "Send a test request",
      done: leads > 0,
      href: live ? liveHref : null,
      external: true,
      hint: live ? "Use your contact form" : "Publish first",
    },
  ];
}

/**
 * Primeiro nome do cadastro (`user_metadata.first_name`), para a saudação. `null` sem login
 * (dev local), sem nome (login Google/Apple ou conta antiga) ou se a sessão falhar.
 * No modo "ver como" do admin, o nome da conta vista.
 */
async function getFirstName(viewingAs: ViewingAs | null): Promise<string | null> {
  try {
    if (viewingAs) return (await getAccount(viewingAs.id))?.firstName?.slice(0, 40) ?? null;
    // As mesmas claims que o getCurrentUser já leu neste request (sem nova ida ao Supabase).
    const claims = await getSessionClaims();
    const metadata: unknown = claims?.user_metadata;
    if (!metadata || typeof metadata !== "object") return null;
    const raw: unknown = (metadata as Record<string, unknown>).first_name;
    if (typeof raw !== "string") return null;
    const name = raw.trim().slice(0, 40);
    return name || null;
  } catch {
    return null;
  }
}

type SocialSnapshot = { account: SocialAccountRecord | null; posts: SocialPostRecord[] };

// Os loaders abaixo usam `cache()` do React: cada seção da página (em seu próprio <Suspense>) chama
// o que precisa e, no mesmo request, cada leitura acontece uma vez só.

/** O "agora" do request: todas as seções contam o tempo a partir do mesmo instante. */
const requestNow = cache((): number => Date.now());

/** Conta do Instagram e posts de 90 dias para trás a 90 para a frente. Erro = vazio. */
const loadSocial = cache(async (ownerId: string, now: number): Promise<SocialSnapshot> => {
  try {
    const social = getSocialStore();
    const [account, posts] = await Promise.all([
      social.getAccountForOwner(ownerId, "instagram"),
      social.listPosts(
        ownerId,
        new Date(now - 90 * DAY_MS).toISOString(),
        new Date(now + 90 * DAY_MS).toISOString(),
      ),
    ]);
    return { account, posts };
  } catch {
    return { account: null, posts: [] };
  }
});

/** Configurações de posts do dono (fuso da empresa e liberação de testador). Erro = `null`. */
const loadSettings = cache(async (ownerId: string): Promise<SocialSettingsRecord | null> => {
  try {
    return await getSocialStore().getSettings(ownerId);
  } catch {
    return null;
  }
});

/**
 * O dono consegue postar sozinho pelo Instagram? Usa a conta MOSTRADA (no "ver como", a conta
 * vista: a do admin sempre daria "auto"). Erro = manual (o passo "Connect Instagram" some).
 */
async function loadAutoPublish(
  account: { id: string; email: string | null },
  settings: SocialSettingsRecord | null,
): Promise<boolean> {
  if (!settings) return false;
  try {
    return (await socialCapability(account, settings)).publishMode === "auto";
  } catch {
    return false;
  }
}

/** Erro ao ler o plano = sem aviso e passo do domínio normal (como `ownerHasLiveAccess`). */
const loadAccess = cache(async (ownerId: string): Promise<AccessSummary> => {
  try {
    return await accessSummary(ownerId);
  } catch {
    return { enforced: false, live: true, endsAt: null, source: null };
  }
});

type ClientsSnapshot = {
  total: number;
  newCount: number;
  followUpsDue: Client[];
  /** Hoje no fuso da empresa ("AAAA-MM-DD"). */
  today: string;
};

/**
 * Resumo do módulo de clientes (o serviço já traz os pedidos novos do site antes de ler; o pedido
 * de teste do próprio dono, achado por `ownerEmail`, não vira cliente). "Hoje" no fuso da empresa.
 * `null` = erro (a página volta a mostrar as mensagens do site por site, como antes).
 */
async function loadClients(
  ownerId: string,
  ownerEmail: string | null,
  now: number,
  timeZone: string,
): Promise<ClientsSnapshot | null> {
  const today = dateKeyIn(timeZone, new Date(now));
  try {
    // Uma leitura só (o sync roda uma vez por request); o resumo sai da mesma lista.
    const clients = await listOwnerClients(ownerId, ownerEmail);
    const attention = attentionFromClients(clients, today);
    return {
      total: clients.length,
      newCount: attention.newCount,
      followUpsDue: attention.followUpsDue,
      today,
    };
  } catch {
    return null;
  }
}

/** Quantos retornos aparecem um por um em "Needs you" (o resto vira uma linha só). */
const MAX_FOLLOW_UP_ROWS = 2;

/** Tipo de cada linha "Needs you": decide o ícone, a cor e a linha de apoio. */
type NeedKind =
  | "plan-ended"
  | "plan-ending"
  | "approval"
  | "ready"
  | "reconnect"
  | "follow-up"
  | "clients"
  | "problem"
  | "messages"
  | "overdue"
  | "approved"
  | "next";

type NeedRow = { key: string; kind: NeedKind; href: string; text: ReactNode; action: string };

type IconComponent = (props: { className?: string }) => ReactNode;

// Aprovação = âmbar, clientes = azul da marca, retorno = céu, problema = vermelho.
const NEED_STYLES: Record<NeedKind, { tone: IconTone; label: string; Icon: IconComponent }> = {
  "plan-ended": { tone: "red", label: "Plan", Icon: BillingIcon },
  "plan-ending": { tone: "amber", label: "Plan", Icon: BillingIcon },
  approval: { tone: "amber", label: "Social posts", Icon: ApproveIcon },
  ready: { tone: "amber", label: "Social posts", Icon: SocialIcon },
  reconnect: { tone: "amber", label: "Instagram", Icon: LinkIcon },
  "follow-up": { tone: "sky", label: "Follow-up", Icon: ClockIcon },
  clients: { tone: "brand", label: "Clients", Icon: ClientsIcon },
  problem: { tone: "red", label: "Social posts", Icon: AlertIcon },
  messages: { tone: "brand", label: "Website messages", Icon: MessagesIcon },
  overdue: { tone: "red", label: "Invoices", Icon: InvoicesIcon },
  approved: { tone: "emerald", label: "Estimates", Icon: EstimatesIcon },
  next: { tone: "slate", label: "Calendar", Icon: SocialIcon },
};

/** Brilho (créditos da IA), no traço dos ícones da navegação. */
function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3.5 13.9 9a2 2 0 0 0 1.2 1.2l5.4 1.8-5.4 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.1 15a2 2 0 0 0-1.2-1.2L3.5 12l5.4-1.8A2 2 0 0 0 10.1 9z" />
    </svg>
  );
}

/** Número em destaque dentro de uma frase (peso, não cor). */
function Count({ value }: { value: number }) {
  return <span className="font-semibold tabular-nums">{value}</span>;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** "YYYY-MM" → "Nov" (mês curto, para "across Nov–Dec"). */
function shortMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(year ?? 1970, (mon ?? 1) - 1, 1)),
  );
}

/** Mês do post no fuso da empresa, para abrir o calendário/revisão no mês certo. */
function monthQuery(iso: string, timeZone: string): string {
  return `month=${encodeURIComponent(monthOf(iso, timeZone))}`;
}

function byScheduledAt(a: SocialPostRecord, b: SocialPostRecord): number {
  return Date.parse(a.scheduledAt ?? "") - Date.parse(b.scheduledAt ?? "");
}

/** Linhas "Needs you": só fatos que o banco sabe, do mais urgente para o informativo. */
function needsRows({
  sites,
  weekLeads,
  social,
  clients,
  access,
  office,
  timeZone,
  now,
}: {
  sites: SiteRecord[];
  weekLeads: Record<string, number>;
  social: SocialSnapshot;
  clients: ClientsSnapshot | null;
  access: AccessSummary;
  /** Escritório (faturas vencidas e orçamentos aprovados); `null` = erro ao ler. */
  office: OfficeSnapshot | null;
  /** Fuso da empresa (meses do calendário e datas do plano). */
  timeZone: string;
  now: number;
}): NeedRow[] {
  const rows: NeedRow[] = [];
  const { account, posts } = social;
  const hasLiveSite = sites.some((site) => site.status === "published");

  // Plano acabou com site no ar: os visitantes já veem "temporarily unavailable". Vem primeiro.
  if (access.enforced && !access.live && hasLiveSite) {
    rows.push({
      key: "plan-ended",
      kind: "plan-ended",
      href: "/billing",
      text: (
        <>
          Your plan ended, so visitors see a &ldquo;temporarily unavailable&rdquo; page. Renew to
          bring your site back.
        </>
      ),
      action: "Renew",
    });
  } else if (access.enforced && access.live && access.endsAt) {
    const endsAt = Date.parse(access.endsAt);
    if (endsAt > now && endsAt - now <= 7 * DAY_MS) {
      const date = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone,
      }).format(new Date(endsAt));
      rows.push({
        key: "plan-ending",
        kind: "plan-ending",
        href: "/billing",
        text: (
          <>
            Your access ends <span className="font-medium tabular-nums">{date}</span>.{" "}
            {hasLiveSite ? "Renew to keep your site online." : "Renew to keep your plan."}
          </>
        ),
        action: "Renew",
      });
    }
  }

  // Dinheiro parado: faturas vencidas e orçamentos aprovados que ainda não viraram serviço/fatura.
  if (office && office.summary.overdueInvoices > 0) {
    const count = office.summary.overdueInvoices;
    rows.push({
      key: "overdue-invoices",
      kind: "overdue",
      href: "/invoices?status=overdue",
      text: (
        <>
          <Count value={count} /> {plural(count, "invoice is", "invoices are")} past due (
          <span className="font-medium tabular-nums">{money(office.summary.overdueCents)}</span>).
          Send a reminder.
        </>
      ),
      action: "Open",
    });
  }
  const toConvert = office?.toConvert ?? [];
  const firstToConvert = toConvert[0];
  if (firstToConvert) {
    rows.push(
      toConvert.length === 1
        ? {
            key: "approved-estimates",
            kind: "approved",
            href: `/estimates/${encodeURIComponent(firstToConvert.id)}`,
            text: (
              <>
                <span className="font-medium">{firstToConvert.clientName}</span> approved estimate #
                {firstToConvert.number}. Create the job or invoice.
              </>
            ),
            action: "Open",
          }
        : {
            key: "approved-estimates",
            kind: "approved",
            href: "/estimates?status=approved",
            text: (
              <>
                <Count value={toConvert.length} /> approved estimates are waiting to become jobs or
                invoices.
              </>
            ),
            action: "Open",
          },
    );
  }

  // Só rascunhos com data ainda no futuro: a revisão não mostra (nem aprova) os outros.
  const drafts = pendingDrafts(posts, now);
  const firstDraft = drafts[0];
  const lastDraft = drafts[drafts.length - 1];
  if (firstDraft?.scheduledAt && lastDraft?.scheduledAt) {
    const firstMonth = monthOf(firstDraft.scheduledAt, timeZone);
    const lastMonth = monthOf(lastDraft.scheduledAt, timeZone);
    const count = drafts.length;
    rows.push({
      key: "drafts",
      kind: "approval",
      href: `/social/review?${monthQuery(firstDraft.scheduledAt, timeZone)}`,
      text:
        firstMonth === lastMonth ? (
          <>
            <Count value={count} /> {plural(count, "post is", "posts are")} waiting for your
            approval.
          </>
        ) : (
          <>
            <Count value={count} /> posts across {shortMonth(firstMonth)}&ndash;
            {shortMonth(lastMonth)} are waiting for your approval.
          </>
        ),
      action: "Review",
    });
  }

  // Aprovados para postar à mão (sem postagem automática): os das próximas 24 horas e os que
  // venceram na última semana e ainda não foram marcados como postados.
  const ready = posts
    .filter(
      (post) =>
        post.status === "approved" &&
        post.scheduledAt !== null &&
        Date.parse(post.scheduledAt) <= now + DAY_MS &&
        Date.parse(post.scheduledAt) >= now - 7 * DAY_MS,
    )
    .sort(byScheduledAt);
  const firstReady = ready[0];
  if (firstReady?.scheduledAt) {
    const count = ready.length;
    const overdue = Date.parse(firstReady.scheduledAt) < now;
    rows.push({
      key: "ready",
      kind: "ready",
      href: `/social?${monthQuery(firstReady.scheduledAt, timeZone)}`,
      text: overdue ? (
        count === 1 ? (
          <>
            Your post was due{" "}
            <LocalTime iso={firstReady.scheduledAt} className="font-medium tabular-nums" />. Share
            it on Instagram, then mark it posted.
          </>
        ) : (
          <>
            <Count value={count} /> posts are ready to share. The first was due{" "}
            <LocalTime iso={firstReady.scheduledAt} className="font-medium tabular-nums" />.
          </>
        )
      ) : (
        <>
          <Count value={count} /> {plural(count, "post is", "posts are")} ready to share in the next
          24 hours.
        </>
      ),
      action: "Open",
    });
  }

  if (account?.status === "needs_reconnect") {
    rows.push({
      key: "reconnect",
      kind: "reconnect",
      href: "/social",
      text: "Your Instagram account needs to be reconnected before posts can go out.",
      action: "Reconnect",
    });
  }

  if (clients) {
    const { followUpsDue, today } = clients;
    for (const client of followUpsDue.slice(0, MAX_FOLLOW_UP_ROWS)) {
      const due =
        client.followUpOn === null || client.followUpOn === today
          ? "today"
          : formatDateOnly(client.followUpOn, today);
      rows.push({
        key: `follow-up-${client.id}`,
        kind: "follow-up",
        href: `/clients/${encodeURIComponent(client.id)}`,
        text: (
          <>
            Follow up with <span className="font-medium">{client.name}</span> (due {due}).
          </>
        ),
        action: "Open",
      });
    }
    // O serviço manda no máximo 5 retornos: sem número aqui, para não contar a menos.
    if (followUpsDue.length > MAX_FOLLOW_UP_ROWS) {
      rows.push({
        key: "follow-ups-more",
        kind: "follow-up",
        href: "/clients",
        text: "You have more follow-ups due.",
        action: "Clients",
      });
    }

    if (clients.newCount > 0) {
      rows.push({
        key: "new-clients",
        kind: "clients",
        href: "/clients?stage=new",
        text: (
          <>
            <Count value={clients.newCount} /> new{" "}
            {plural(clients.newCount, "client is", "clients are")} waiting for a reply.
          </>
        ),
        action: "Reply",
      });
    }
  }

  // Só os problemas recentes (últimos 30 dias), para não lembrar para sempre de um post antigo.
  const problems = posts
    .filter(
      (post) =>
        (post.status === "failed" || post.status === "missed") &&
        post.scheduledAt !== null &&
        Date.parse(post.scheduledAt) >= now - 30 * DAY_MS,
    )
    .sort(byScheduledAt);
  const newestProblem = problems[problems.length - 1];
  if (newestProblem?.scheduledAt) {
    const count = problems.length;
    rows.push({
      key: "problems",
      kind: "problem",
      href: `/social?${monthQuery(newestProblem.scheduledAt, timeZone)}`,
      text: (
        <>
          <Count value={count} /> {plural(count, "post", "posts")} didn&rsquo;t go out. Pick a new
          time or post {plural(count, "it", "them")} yourself.
        </>
      ),
      action: "Open",
    });
  }

  // Mensagens do site por site: só sem o módulo de clientes (com ele, viram "new clients" acima).
  for (const site of clients ? [] : sites) {
    const count = weekLeads[site.id] ?? 0;
    if (count === 0) continue;
    rows.push({
      key: `leads-${site.id}`,
      kind: "messages",
      href: `/sites/${site.id}#messages`,
      text: (
        <>
          <Count value={count} /> {plural(count, "message", "messages")} from your website{" "}
          <span className="font-medium">{site.spec.business.name}</span> in the last 7 days.
        </>
      ),
      action: "Read",
    });
  }

  // Próximo post já aprovado: "scheduled" sai sozinho; "approved" o dono posta à mão.
  const next = posts
    .filter(
      (post) =>
        (post.status === "scheduled" || post.status === "approved") &&
        post.scheduledAt !== null &&
        Date.parse(post.scheduledAt) > now,
    )
    .sort(byScheduledAt)[0];
  if (next?.scheduledAt && !ready.includes(next)) {
    rows.push({
      key: "next-post",
      kind: "next",
      href: `/social?${monthQuery(next.scheduledAt, timeZone)}`,
      text: (
        <>
          {next.status === "scheduled"
            ? "Your next post goes out"
            : "Your next post is planned for"}{" "}
          <LocalTime iso={next.scheduledAt} className="font-medium tabular-nums" />.
        </>
      ),
      action: "Calendar",
    });
  }

  return rows.slice(0, MAX_NEEDS);
}

/** "Needs you" como lista agrupada do iOS: ícone colorido, a frase, a linha de apoio e a seta. */
function NeedsYou({ rows }: { rows: NeedRow[] }) {
  return (
    <section aria-labelledby="needs-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="needs-heading" className={sectionTitle}>
          Needs you
        </h2>
        {rows.length > 0 && (
          <p className="text-[13px] text-slate-500 tabular-nums">
            {rows.length} {plural(rows.length, "item", "items")}
          </p>
        )}
      </div>
      <div className={`mt-3 overflow-hidden ${cardClass}`}>
        {rows.length === 0 ? (
          <div className="flex min-h-16 items-center gap-3.5 px-4 py-3 sm:px-5">
            <IconTile tone="emerald">
              <CheckIcon className="size-[18px]" />
            </IconTile>
            <p className="text-[15px] text-slate-600">Nothing needs you right now.</p>
          </div>
        ) : (
          <ul>
            {rows.map((row) => {
              const style = NEED_STYLES[row.kind];
              return (
                <li key={row.key} className={insetDivider}>
                  <Link
                    href={row.href}
                    className="group flex min-h-16 items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5"
                  >
                    <IconTile tone={style.tone}>
                      <style.Icon className="size-[18px]" />
                    </IconTile>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] leading-[1.45] text-ink">{row.text}</span>
                      <span className="mt-0.5 block text-[13px] leading-5 text-slate-500">
                        {style.label}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex shrink-0 items-center gap-1 text-[15px] whitespace-nowrap text-slate-500 transition-colors duration-150 group-hover:text-ink"
                    >
                      <span className="max-sm:hidden">{row.action}</span>
                      <ChevronRightIcon className="size-4 text-slate-400" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Número de um quadro: `null` = indisponível (erro ao ler). */
type StatValue = number | "unlimited" | null;

type Stat = {
  key: string;
  label: string;
  value: StatValue;
  /** Linha de apoio embaixo do número (o que fazer ou de onde vem). */
  hint: string;
  /** `null` = quadro só informativo (sem link nem seta). */
  href: string | null;
  tone: IconTone;
  Icon: IconComponent;
  /** Pede atenção (número > 0): o número fica na cor do tom. */
  attention: boolean;
  /** O serviço corta a lista (ex.: no máximo 5 retornos): mostra "5+". */
  capped?: boolean;
  /** Texto pronto no lugar do número (ex.: dinheiro "$1,250"). */
  display?: string;
};

const STAT_NUMBER: Record<IconTone, string> = {
  brand: "text-brand",
  amber: "text-amber-700",
  sky: "text-sky-700",
  red: "text-red-700",
  emerald: "text-emerald-700",
  slate: "text-ink",
};

/** Quadro de número (como os widgets do iOS): ícone, número grande, rótulo e a linha de apoio. */
function StatTile({ stat }: { stat: Stat }) {
  const { value } = stat;
  const shown =
    stat.display ??
    (value === null ? "–" : value === "unlimited" ? "∞" : `${value}${stat.capped ? "+" : ""}`);
  const content = (
    <>
      <span className="flex items-start justify-between gap-2">
        <IconTile tone={stat.tone}>
          <stat.Icon className="size-[18px]" />
        </IconTile>
        {stat.href && (
          <ChevronRightIcon className="mt-2.5 size-4 text-slate-400 transition-colors duration-150 group-hover:text-slate-600" />
        )}
      </span>
      {/* Rótulo antes do número para o leitor de tela ("New requests, 3"); na tela, o número
            fica em cima (ordem visual com `order`). */}
      <span className="mt-auto flex flex-col pt-4">
        <span className="order-2 text-[15px] leading-5 font-semibold text-ink">{stat.label}</span>
        <span
          className={`order-1 mb-1 font-display text-[2rem] leading-none font-semibold tracking-[-0.02em] tabular-nums ${
            stat.attention ? STAT_NUMBER[stat.tone] : "text-ink"
          }`}
        >
          {shown}
          {value === null && <span className="sr-only">not available</span>}
          {value === "unlimited" && <span className="sr-only">unlimited</span>}
        </span>
        <span className="order-3 mt-0.5 text-[13px] leading-5 text-slate-500">{stat.hint}</span>
      </span>
    </>
  );
  const tile = `flex h-full min-h-[8.5rem] flex-col rounded-2xl p-4 sm:p-5 ${cardClass}`;
  return (
    <li>
      {stat.href ? (
        <Link
          href={stat.href}
          className={`group ${tile} glass-interactive motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:glass-raised ${focusRing}`}
        >
          {content}
        </Link>
      ) : (
        <div className={tile}>{content}</div>
      )}
    </li>
  );
}

function QuickStats({ stats }: { stats: Stat[] }) {
  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        At a glance
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatTile key={stat.key} stat={stat} />
        ))}
      </ul>
    </section>
  );
}

// ---------- escritório (agenda e dinheiro) ----------

type OfficeSnapshot = {
  summary: OfficeSummary;
  /** Orçamentos aprovados sem serviço nem fatura (mais novos primeiro). */
  toConvert: Estimate[];
  /** Fuso da agenda (configurações do escritório). */
  timeZone: string;
  /** "Hoje" e o mês corrente no fuso da agenda. */
  today: string;
};

/**
 * Resumo do escritório (serviços de hoje e dinheiro). `null` = erro ou módulo ainda sem dados:
 * a seção some e o resto da página continua igual.
 */
const loadOffice = cache(async (ownerId: string, now: number): Promise<OfficeSnapshot | null> => {
  try {
    const [summary, settings, toConvert] = await Promise.all([
      getOfficeSummary(ownerId),
      getOfficeSettings(ownerId).catch(() => null),
      loadEstimatesToConvert(ownerId),
    ]);
    const timeZone = safeTimeZone(settings?.timeZone);
    return { summary, toConvert, timeZone, today: zonedParts(new Date(now), timeZone).dateKey };
  } catch (error) {
    console.error("[dashboard] could not load the office summary", error);
    return null;
  }
});

/**
 * Orçamentos aprovados que ainda não viraram serviço nem fatura. Barato: as faturas só são lidas
 * quando há aprovado sem serviço. Erro = lista vazia (a linha "Needs you" só não aparece).
 */
async function loadEstimatesToConvert(ownerId: string): Promise<Estimate[]> {
  try {
    const approved = (await listEstimates(ownerId, { status: "approved" })).filter(
      (estimate) => estimate.jobId === null,
    );
    if (approved.length === 0) return [];
    const invoices = await listInvoices(ownerId, {});
    const invoiced = new Set(
      invoices
        .filter((invoice) => invoice.status !== "void" && invoice.estimateId !== null)
        .map((invoice) => invoice.estimateId),
    );
    return approved.filter((estimate) => !invoiced.has(estimate.id));
  } catch (error) {
    console.error("[dashboard] could not list approved estimates", error);
    return [];
  }
}

/** Centavos → "$1,250" (com centavos só quando houver). */
function money(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

/** Mês por extenso de uma data "AAAA-MM-DD" ("October"). */
function monthLong(dateKey: string): string {
  const [year, mon] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year ?? 1970, (mon ?? 1) - 1, 1)),
  );
}

/** Quadros de dinheiro: a receber, vencido, orçamentos esperando e recebido no mês. */
function moneyStats({ summary, today }: OfficeSnapshot): Stat[] {
  return [
    {
      key: "unpaid",
      label: "Unpaid invoices",
      value: summary.unpaidInvoices,
      display: money(summary.unpaidCents),
      hint:
        summary.unpaidInvoices > 0
          ? `${summary.unpaidInvoices} ${plural(summary.unpaidInvoices, "invoice", "invoices")} out`
          : "All paid up",
      href: "/invoices?status=unpaid",
      tone: "brand",
      Icon: InvoicesIcon,
      attention: summary.unpaidCents > 0,
    },
    {
      key: "overdue",
      label: "Overdue",
      value: summary.overdueInvoices,
      display: money(summary.overdueCents),
      hint:
        summary.overdueInvoices > 0 ? `${summary.overdueInvoices} past due` : "Nothing past due",
      href: "/invoices?status=overdue",
      tone: "red",
      Icon: AlertIcon,
      attention: summary.overdueInvoices > 0,
    },
    {
      key: "estimates",
      label: "Estimates waiting",
      value: summary.estimatesAwaiting,
      hint:
        summary.estimatesAwaiting > 0
          ? `${money(summary.estimatesAwaitingCents)} waiting for a yes`
          : "No open estimates",
      href: "/estimates?status=sent",
      tone: "amber",
      Icon: EstimatesIcon,
      attention: summary.estimatesAwaiting > 0,
    },
    {
      key: "collected",
      label: "Collected",
      value: summary.collectedThisMonthCents,
      display: money(summary.collectedThisMonthCents),
      hint: `In ${monthLong(today)}`,
      // Pagamentos do mês (inclui parciais): a lista "Paid" não é o mesmo número, então sem link.
      href: null,
      tone: "emerald",
      Icon: MoneyIcon,
      attention: summary.collectedThisMonthCents > 0,
    },
  ];
}

/** Uma linha de serviço de hoje: horário, título, cliente e situação. */
function TodayJobRow({ job, timeZone }: { job: Job; timeZone: string }) {
  return (
    <li className={insetDivider}>
      <Link
        href={`/schedule/${encodeURIComponent(job.id)}`}
        className="group flex min-h-16 items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5"
      >
        <span className="w-[4.5rem] shrink-0 text-[13px] leading-5 font-semibold text-brand tabular-nums">
          {job.startAt ? formatTime(job.startAt, timeZone) : "No time"}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[15px] leading-5 font-semibold text-ink ${
              job.status === "canceled" ? "line-through opacity-60" : ""
            }`}
          >
            {job.title}
          </span>
          <span className="mt-0.5 block truncate text-[13px] leading-5 text-slate-500">
            {job.clientName}
            {job.startAt && job.endAt && (
              <span className="tabular-nums"> · until {formatTime(job.endAt, timeZone)}</span>
            )}
          </span>
        </span>
        {job.status !== "scheduled" && <JobStatusBadge status={job.status} size="sm" />}
        <ChevronRightIcon className="size-4 shrink-0 text-slate-400" />
      </Link>
    </li>
  );
}

/** "Today": os serviços de hoje (no fuso da agenda) e o atalho para marcar um. */
function TodayCard({ office, readOnly }: { office: OfficeSnapshot; readOnly: boolean }) {
  const { summary, timeZone, today } = office;
  const jobs = summary.todayJobs;
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${today}T12:00:00Z`));
  return (
    <section aria-labelledby="today-heading" className="flex min-w-0 flex-col">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="today-heading" className={sectionTitle}>
          Today
          <span className="font-sans text-[15px] font-normal text-slate-500"> · {dateLabel}</span>
        </h2>
        <Link
          href="/schedule"
          className={`inline-flex min-h-11 items-center gap-1 rounded-lg text-[15px] font-semibold whitespace-nowrap text-brand sm:min-h-9 ${focusRing}`}
        >
          Schedule
          <ChevronRightIcon className="size-4" />
        </Link>
      </div>
      <div className={`mt-3 flex-1 overflow-hidden ${cardClass}`}>
        {jobs.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <IconTile tone="brand" size="lg">
              <ScheduleIcon className="size-6" />
            </IconTile>
            <p className="text-[15px] font-semibold text-ink">Nothing scheduled today</p>
            {!readOnly && (
              <Link href="/schedule?new=1" className={glassButtonClass({ variant: "secondary" })}>
                <PlusIcon className="-ml-0.5 size-[1.15em]" />
                New job
              </Link>
            )}
          </div>
        ) : (
          <ul>
            {jobs.map((job) => (
              <TodayJobRow key={job.id} job={job} timeZone={timeZone} />
            ))}
          </ul>
        )}
        {summary.unscheduledJobs > 0 && (
          <Link
            href="/schedule"
            className="flex min-h-12 items-center justify-between gap-3 border-t border-(--glass-rim) px-4 text-[13px] text-slate-600 hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5"
          >
            <span>
              <Count value={summary.unscheduledJobs} />{" "}
              {plural(summary.unscheduledJobs, "job is", "jobs are")} waiting for a date
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-slate-400" />
          </Link>
        )}
      </div>
    </section>
  );
}

/** O escritório primeiro: os serviços de hoje e o dinheiro. */
function OfficeSection({ office, readOnly }: { office: OfficeSnapshot; readOnly: boolean }) {
  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
      <TodayCard office={office} readOnly={readOnly} />
      <section aria-labelledby="money-heading" className="flex min-w-0 flex-col">
        <h2 id="money-heading" className={sectionTitle}>
          Money
        </h2>
        <ul className="mt-3 grid flex-1 grid-cols-2 gap-3 sm:gap-4">
          {moneyStats(office).map((stat) => (
            <StatTile key={stat.key} stat={stat} />
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Rascunhos com data ainda no futuro (os que a revisão mostra e deixa aprovar). */
function pendingDrafts(posts: SocialPostRecord[], now: number): SocialPostRecord[] {
  return posts
    .filter(
      (post) =>
        post.status === "draft" && post.scheduledAt !== null && Date.parse(post.scheduledAt) >= now,
    )
    .sort(byScheduledAt);
}

/** Saldo de créditos da IA da conta mostrada. Erro = `null` (o quadro mostra "–"). */
const loadCredits = cache(async (ownerId: string): Promise<CreditBalance | null> => {
  try {
    return await getBalance({ id: ownerId });
  } catch {
    return null;
  }
});

/** Pedidos por site: o total (checklist e cards) e os dos últimos 7 dias. */
const loadLeadStats = cache(async (ownerId: string, now: number) => {
  const sites = await listOwnerSites(ownerId);
  // Mesmas leituras (com dedupe) que o sync dos clientes faz neste request.
  const leadLists = await Promise.all(sites.map((site) => listSiteLeads(site.id)));
  const weekAgo = now - 7 * DAY_MS;
  const leadCounts: Record<string, number> = {};
  const weekLeads: Record<string, number> = {};
  sites.forEach((site, i) => {
    const leads = leadLists[i] ?? [];
    leadCounts[site.id] = leads.length;
    weekLeads[site.id] = leads.filter((lead) => Date.parse(lead.createdAt) >= weekAgo).length;
  });
  return { leadCounts, weekLeads };
});

/** O que toda seção da página precisa saber (só valores simples: viram chave do `cache()`). */
type HomeContext = {
  ownerId: string;
  /** E-mail da conta MOSTRADA: no "ver como", o da conta vista (nunca o do admin). */
  shownEmail: string | null;
  now: number;
  /** "Ver como" do admin: só leitura (sem o atalho "New job"). */
  readOnly: boolean;
};

/**
 * Tudo o que "Needs you", os quadros, o checklist e a saudação mostram. Cada leitura começa na
 * hora e com dedupe: o escritório e a lista de sites (lidos também por outras seções e pela
 * moldura) não vão ao banco duas vezes.
 */
const loadHome = cache(async (ownerId: string, shownEmail: string | null, now: number) => {
  const shown = { id: ownerId, email: shownEmail };
  const [sites, social, settings, access, credits, office, leadStats] = await Promise.all([
    listOwnerSites(ownerId),
    loadSocial(ownerId, now),
    loadSettings(ownerId),
    loadAccess(ownerId),
    loadCredits(ownerId),
    loadOffice(ownerId, now),
    loadLeadStats(ownerId, now),
  ]);
  // Fuso da empresa (configurações de posts); sem ele, Nova York como antes.
  const timeZone =
    settings?.timezone && isValidTimeZone(settings.timezone)
      ? settings.timezone
      : CLIENTS_TIME_ZONE;
  const [clients, autoPublish, domainIncluded] = await Promise.all([
    loadClients(ownerId, shownEmail, now, timeZone),
    loadAutoPublish(shown, settings),
    // Erro ao ler o plano já vira `true` lá dentro (o passo segue para o domínio, como antes).
    ownerHasCustomDomainAccess(ownerId),
  ]);
  const { leadCounts, weekLeads } = leadStats;
  const needRows = needsRows({
    sites,
    weekLeads,
    social,
    clients,
    access,
    office,
    timeZone,
    now,
  });
  return {
    sites,
    social,
    clients,
    leadCounts,
    weekLeads,
    access,
    timeZone,
    autoPublish,
    domainIncluded,
    credits,
    office,
    needRows,
  };
});

type HomeData = Awaited<ReturnType<typeof loadHome>>;

/** Quadros de número: pedidos novos, retornos para hoje, posts esperando aprovação e créditos. */
function homeStats(home: HomeData, now: number): Stat[] {
  const { sites, social, clients, weekLeads, timeZone, credits } = home;
  const latest = sites[0];
  const drafts = pendingDrafts(social.posts, now);
  const firstDraft = drafts[0];
  const weekTotal = Object.values(weekLeads).reduce((sum, n) => sum + n, 0);
  const followUps = clients?.followUpsDue.length ?? null;
  return [
    clients
      ? {
          key: "requests",
          label: "New requests",
          value: clients.newCount,
          hint: clients.newCount > 0 ? "Waiting for a reply" : "All caught up",
          href: clients.newCount > 0 ? "/clients?stage=new" : "/clients",
          tone: "brand",
          Icon: ClientsIcon,
          attention: clients.newCount > 0,
        }
      : {
          // Sem o módulo de clientes (erro ao ler): as mensagens do site nos últimos 7 dias.
          key: "requests",
          label: "New requests",
          value: weekTotal,
          hint: "Last 7 days",
          href: latest ? `/sites/${latest.id}#messages` : "/dashboard#sites",
          tone: "brand",
          Icon: MessagesIcon,
          attention: weekTotal > 0,
        },
    {
      key: "follow-ups",
      label: "Follow-ups due",
      value: followUps,
      // O serviço manda no máximo 5 retornos.
      capped: followUps !== null && followUps >= 5,
      hint:
        followUps === null
          ? "Open clients"
          : followUps > 0
            ? "Due today or earlier"
            : "Nothing due",
      href: "/clients",
      tone: "sky",
      Icon: ClockIcon,
      attention: Boolean(followUps),
    },
    {
      key: "approvals",
      label: "Posts to approve",
      value: drafts.length,
      hint: drafts.length > 0 ? "Read and approve" : "Nothing waiting",
      href: firstDraft?.scheduledAt
        ? `/social/review?${monthQuery(firstDraft.scheduledAt, timeZone)}`
        : "/social",
      tone: "amber",
      Icon: ApproveIcon,
      attention: drafts.length > 0,
    },
    {
      key: "credits",
      label: "AI credits left",
      value: credits === null ? null : credits.unlimited ? "unlimited" : credits.total,
      hint:
        credits === null || credits.unlimited
          ? "Plans and billing"
          : `Refills ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(credits.resetsAt))}`,
      href: "/billing#credits",
      tone: credits !== null && !credits.unlimited && credits.total === 0 ? "red" : "emerald",
      Icon: SparkIcon,
      attention: credits !== null && !credits.unlimited && credits.total === 0,
    },
  ];
}

/**
 * "Connect Instagram" só quando a conta pode postar sozinha (ou já tem conta ligada): no modo
 * manual não há botão de conectar e o passo nunca terminaria.
 */
function socialSteps(home: HomeData): ChecklistStep[] {
  const { autoPublish, social } = home;
  return [
    ...(autoPublish || social.account !== null
      ? [
          {
            label: "Connect Instagram",
            done: social.account?.status === "active",
            href: "/social",
            hint: "Post without opening the app",
          },
        ]
      : []),
    {
      label: "Plan your first month",
      done: social.posts.length > 0,
      href: "/social",
      hint: "A month of posts in minutes",
    },
  ];
}

/** Serviços de hoje (sem os cancelados), para a frase da saudação. */
function jobsTodayText(office: OfficeSnapshot | null): string {
  const todayCount =
    office?.summary.todayJobs.filter((job) => job.status !== "canceled").length ?? 0;
  return todayCount > 0
    ? `${todayCount} ${plural(todayCount, "job", "jobs")} on today’s schedule. `
    : "";
}

// ---------- seções em streaming (cada uma no seu <Suspense>) ----------

/** Linha de resumo da saudação ("2 things need you."): espera os dados de "Needs you". */
async function GreetingSummary({ ctx }: { ctx: HomeContext }) {
  const { sites, office, needRows } = await loadHome(ctx.ownerId, ctx.shownEmail, ctx.now);
  const jobsToday = jobsTodayText(office);
  if (!sites[0] && !jobsToday) return <>Let’s get your business online.</>;
  if (needRows.length === 0) return <>{jobsToday}You’re all caught up.</>;
  return (
    <>
      {jobsToday}
      {needRows.length} {plural(needRows.length, "thing needs", "things need")} you.
    </>
  );
}

/** O escritório primeiro: os serviços de hoje e o dinheiro. Erro = a seção some. */
async function OfficeBlock({ ctx }: { ctx: HomeContext }) {
  const office = await loadOffice(ctx.ownerId, ctx.now);
  return office ? <OfficeSection office={office} readOnly={ctx.readOnly} /> : null;
}

/**
 * Quadros, "Needs you" e (com site) o checklist. `order`: com site, os quadros primeiro; conta sem
 * site mostra "Needs you" antes (o convite para criar fica em cima, ver `HomeSections`).
 */
async function Overview({
  ctx,
  order,
}: {
  ctx: HomeContext;
  order: "stats-first" | "needs-first";
}) {
  const home = await loadHome(ctx.ownerId, ctx.shownEmail, ctx.now);
  const quickStats = <QuickStats stats={homeStats(home, ctx.now)} />;
  const needs = <NeedsYou rows={home.needRows} />;
  if (order === "needs-first") {
    return (
      <>
        {needs}
        {quickStats}
      </>
    );
  }
  const latest = home.sites[0];
  return (
    <>
      {quickStats}
      {needs}
      {latest && (
        <DashboardChecklist
          siteId={latest.id}
          siteName={latest.spec.business.name}
          steps={checklistSteps(latest, home.leadCounts[latest.id] ?? 0, home.domainIncluded)}
          extraSteps={socialSteps(home)}
          shareHref={latest.status === "published" ? `/sites/${latest.id}#publish` : null}
        />
      )}
    </>
  );
}

/** Os cards dos sites: espera os pedidos por site e o plano (selo "Offline"). */
async function SitesCards({ ctx }: { ctx: HomeContext }) {
  const [sites, { leadCounts }, access] = await Promise.all([
    listOwnerSites(ctx.ownerId),
    loadLeadStats(ctx.ownerId, ctx.now),
    loadAccess(ctx.ownerId),
  ]);
  // Planos valendo e o acesso acabou: o site publicado mostra "temporarily unavailable".
  const offline = access.enforced && !access.live;
  return <SitesGrid sites={sites} leadCounts={leadCounts} headingLevel={3} offline={offline} />;
}

/**
 * Tudo depois do escritório. A lista de sites (a mesma que a moldura já leu, com dedupe) decide a
 * ordem; o resto chega em streaming, cada parte no seu <Suspense>.
 */
async function HomeSections({ ctx }: { ctx: HomeContext }) {
  const sites = await listOwnerSites(ctx.ownerId);
  // `list` já vem do mais recente para o mais antigo.
  const latest = sites[0];

  const yourSites = (
    <section id="sites" aria-labelledby="sites-heading">
      <h2 id="sites-heading" className={sectionTitle}>
        Your sites
        {sites.length > 0 && (
          <span className="font-sans font-normal text-slate-500 tabular-nums">
            {" "}
            · {sites.length}
          </span>
        )}
      </h2>
      {sites.length === 0 ? (
        <div className="mt-4">
          <ExampleSiteEmpty />
        </div>
      ) : (
        <Suspense fallback={<SitesSkeleton count={sites.length} />}>
          <SitesCards ctx={ctx} />
        </Suspense>
      )}
    </section>
  );

  if (latest) {
    return (
      <>
        <Suspense fallback={<OverviewSkeleton order="stats-first" />}>
          <Overview ctx={ctx} order="stats-first" />
        </Suspense>
        {yourSites}
      </>
    );
  }
  // Conta sem sites: primeiro o convite para criar, depois o resto.
  return (
    <>
      {yourSites}
      <Suspense fallback={<OverviewSkeleton order="needs-first" />}>
        <Overview ctx={ctx} order="needs-first" />
      </Suspense>
    </>
  );
}

export default async function DashboardPage() {
  // Sempre renderiza na hora do request (os dados mudam a cada site gerado).
  await connection();
  // No modo "ver como" do admin, os dados da conta vista (só leitura).
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/dashboard");
  const { ownerId, viewingAs } = viewer;
  const ctx: HomeContext = {
    ownerId,
    // A conta MOSTRADA: no "ver como", a conta vista (nunca o e-mail ou a liberação do admin).
    shownEmail: viewingAs ? viewingAs.email : viewer.user.email,
    now: requestNow(),
    readOnly: viewingAs !== null,
  };
  // Rápido: as claims da sessão já lidas (ou a conta vista, já lida pelo getViewer).
  const firstName = await getFirstName(viewingAs);

  // A saudação aparece na hora; o resto chega em partes (escritório, quadros e "Needs you", sites).
  return (
    <div>
      <Greeting
        firstName={firstName}
        nowIso={new Date(ctx.now).toISOString()}
        summary={
          <Suspense fallback={<GreetingSummarySkeleton />}>
            <GreetingSummary ctx={ctx} />
          </Suspense>
        }
      />

      <div className="mt-6 grid gap-10 sm:gap-12 lg:mt-8 lg:gap-14">
        {/* O escritório vem primeiro: o dono abre o painel e vê o dia e o dinheiro. */}
        <Suspense fallback={<OfficeSkeleton />}>
          <OfficeBlock ctx={ctx} />
        </Suspense>
        <Suspense fallback={<OverviewSkeleton order="stats-first" />}>
          <HomeSections ctx={ctx} />
        </Suspense>
      </div>
    </div>
  );
}
