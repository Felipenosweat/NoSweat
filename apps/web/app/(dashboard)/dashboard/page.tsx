import type { Client } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { DashboardChecklist, type ChecklistStep } from "@/components/DashboardChecklist";
import {
  ChevronRightIcon,
  IconTile,
  StatusBadge,
  cardClass,
  cardShadowHover,
  focusRing,
  insetDivider,
  sectionTitle,
  type IconTone,
} from "@/components/DashboardUi";
import { ExampleSiteEmpty } from "@/components/ExampleSiteEmpty";
import { LocalTime } from "@/components/LocalTime";
import { SitesGrid } from "@/components/SitesGrid";
import { CLIENTS_TIME_ZONE, dateKeyIn, formatDateOnly } from "@/lib/clients";
import { MODULES, type HubModule } from "@/lib/modules";
import { getAccount } from "@/server/admin";
import { createSupabaseServerClient } from "@/server/auth/session";
import { getViewer, type Viewer, type ViewingAs } from "@/server/auth/viewer";
import { accessSummary, ownerHasCustomDomainAccess, type AccessSummary } from "@/server/billing";
import { clientsNeedingAttention, listClients } from "@/server/clients/service";
import { socialCapability } from "@/server/social/config";
import { isValidTimeZone, monthOf } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";
import type {
  SocialAccountRecord,
  SocialPostRecord,
  SocialSettingsRecord,
} from "@/server/social/types";
import { getSiteStore, type SiteRecord } from "@/server/store";
import {
  AlertIcon,
  ApproveIcon,
  BillingIcon,
  CheckIcon,
  ClockIcon,
  ClientsIcon,
  LinkIcon,
  MODULE_ICONS,
  MessagesIcon,
  SocialIcon,
} from "../NavIcons";
import { Greeting } from "./Greeting";

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
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getClaims();
    const metadata: unknown = data?.claims?.user_metadata;
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

/** Conta do Instagram e posts de 90 dias para trás a 90 para a frente. Erro = vazio. */
async function loadSocial(ownerId: string, now: number): Promise<SocialSnapshot> {
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
}

/** Configurações de posts do dono (fuso da empresa e liberação de testador). Erro = `null`. */
async function loadSettings(ownerId: string): Promise<SocialSettingsRecord | null> {
  try {
    return await getSocialStore().getSettings(ownerId);
  } catch {
    return null;
  }
}

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
async function loadAccess(ownerId: string): Promise<AccessSummary> {
  try {
    return await accessSummary(ownerId);
  } catch {
    return { enforced: false, live: true, endsAt: null, source: null };
  }
}

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
    // Um depois do outro: os dois importam os pedidos do site, e em paralelo poderiam duplicar.
    const clients = await listClients(ownerId, { ownerEmail });
    const attention = await clientsNeedingAttention(ownerId, today, ownerEmail);
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
  next: { tone: "slate", label: "Calendar", Icon: SocialIcon },
};

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
  timeZone,
  now,
}: {
  sites: SiteRecord[];
  weekLeads: Record<string, number>;
  social: SocialSnapshot;
  clients: ClientsSnapshot | null;
  access: AccessSummary;
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

  // Só rascunhos com data ainda no futuro: a revisão não mostra (nem aprova) os outros.
  const drafts = posts
    .filter(
      (post) =>
        post.status === "draft" && post.scheduledAt !== null && Date.parse(post.scheduledAt) >= now,
    )
    .sort(byScheduledAt);
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
                    className="group flex min-h-16 items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5"
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

const tileBase = "flex h-full min-h-[10.5rem] flex-col rounded-2xl p-4 sm:p-5";

function LiveTile({
  hub,
  value,
  unit,
  linkText,
}: {
  hub: HubModule;
  /** `null` = número indisponível (erro ao ler): só o rótulo e o link. */
  value: number | null;
  unit: string;
  linkText: string;
}) {
  const ModuleIcon = MODULE_ICONS[hub.key];
  return (
    <li>
      <Link
        href={hub.href}
        className={`group ${tileBase} ${cardClass} transition-[box-shadow,border-color] duration-200 hover:border-slate-300/80 ${cardShadowHover} ${focusRing}`}
      >
        <span className="flex items-start justify-between gap-2">
          <IconTile tone="brand">
            <ModuleIcon className="size-[18px]" />
          </IconTile>
          <ChevronRightIcon className="mt-2.5 size-4 text-slate-300 transition-colors duration-150 group-hover:text-slate-500" />
        </span>
        {/* Rótulo, número e unidade, nessa ordem (na tela e no leitor de tela: "Website, 1"). */}
        <div className="mt-auto flex flex-col pt-5">
          <h3 className="text-[15px] leading-6 font-semibold text-ink">{hub.label}</h3>
          {value !== null && (
            <span className="my-1 font-display text-[2.25rem] leading-none font-semibold tracking-[-0.02em] text-ink tabular-nums">
              {value}
            </span>
          )}
          <span className="text-[13px] leading-5 text-slate-500">{unit}</span>
          <span className="sr-only">. {linkText}</span>
        </div>
      </Link>
    </li>
  );
}

function SoonTile({ hub }: { hub: HubModule }) {
  const ModuleIcon = MODULE_ICONS[hub.key];
  return (
    <li className={`${tileBase} border border-slate-200/70 bg-white/50`}>
      <span className="flex items-start justify-between gap-2">
        <IconTile tone="slate">
          <ModuleIcon className="size-[18px]" />
        </IconTile>
        <span aria-hidden="true">
          <StatusBadge tone="neutral">Soon</StatusBadge>
        </span>
      </span>
      <div className="mt-auto pt-5">
        <h3 className="text-[15px] leading-6 font-semibold text-slate-600">
          {hub.label}
          <span className="sr-only"> (coming soon)</span>
        </h3>
        {hub.soonText && (
          <p className="mt-0.5 text-[13px] leading-5 text-slate-500">{hub.soonText}</p>
        )}
      </div>
    </li>
  );
}

function YourOffice({
  liveSites,
  totalSites,
  scheduledSoon,
  clients,
}: {
  liveSites: number;
  totalSites: number;
  scheduledSoon: number;
  clients: ClientsSnapshot | null;
}) {
  return (
    <section aria-labelledby="office-heading">
      <h2 id="office-heading" className={sectionTitle}>
        Your office
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {MODULES.map((hub) => {
          if (hub.comingSoon) return <SoonTile key={hub.key} hub={hub} />;
          if (hub.key === "website") {
            return (
              <LiveTile
                key={hub.key}
                hub={hub}
                value={liveSites}
                unit={`live · ${totalSites} ${plural(totalSites, "site", "sites")} total`}
                linkText="See sites"
              />
            );
          }
          if (hub.key === "clients") {
            return (
              <LiveTile
                key={hub.key}
                hub={hub}
                value={clients?.total ?? null}
                unit={clients ? `${clients.newCount} new` : "Everyone who contacted you"}
                linkText="Open clients"
              />
            );
          }
          return (
            <LiveTile
              key={hub.key}
              hub={hub}
              value={scheduledSoon}
              unit="posts in the next 30 days"
              linkText="Open calendar"
            />
          );
        })}
      </ul>
    </section>
  );
}

/** Tudo o que a página inicial mostra, lido de uma vez (fora do componente: usa o relógio). */
async function loadHome(viewer: Viewer) {
  const { ownerId, viewingAs } = viewer;
  // A conta MOSTRADA: no "ver como", a conta vista (nunca o e-mail ou a liberação do admin).
  const shown = { id: ownerId, email: viewingAs ? viewingAs.email : viewer.user.email };
  const now = Date.now();
  const store = getSiteStore();
  const [sites, firstName, social, settings, access] = await Promise.all([
    store.list(ownerId),
    getFirstName(viewingAs),
    loadSocial(ownerId, now),
    loadSettings(ownerId),
    loadAccess(ownerId),
  ]);
  // Fuso da empresa (configurações de posts); sem ele, Nova York como antes.
  const timeZone =
    settings?.timezone && isValidTimeZone(settings.timezone)
      ? settings.timezone
      : CLIENTS_TIME_ZONE;
  const [clients, autoPublish, domainIncluded, leadLists] = await Promise.all([
    loadClients(ownerId, shown.email, now, timeZone),
    loadAutoPublish(shown, settings),
    // Erro ao ler o plano já vira `true` lá dentro (o passo segue para o domínio, como antes).
    ownerHasCustomDomainAccess(ownerId),
    Promise.all(sites.map((site) => store.listLeads(site.id))),
  ]);
  const weekAgo = now - 7 * DAY_MS;
  const leadCounts: Record<string, number> = {};
  const weekLeads: Record<string, number> = {};
  sites.forEach((site, i) => {
    const leads = leadLists[i] ?? [];
    leadCounts[site.id] = leads.length;
    weekLeads[site.id] = leads.filter((lead) => Date.parse(lead.createdAt) >= weekAgo).length;
  });
  return {
    now,
    sites,
    firstName,
    social,
    clients,
    leadCounts,
    weekLeads,
    access,
    timeZone,
    autoPublish,
    domainIncluded,
  };
}

export default async function DashboardPage() {
  // Sempre renderiza na hora do request (os dados mudam a cada site gerado).
  await connection();
  // No modo "ver como" do admin, os dados da conta vista (só leitura).
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/dashboard");
  const {
    now,
    sites,
    firstName,
    social,
    clients,
    leadCounts,
    weekLeads,
    access,
    timeZone,
    autoPublish,
    domainIncluded,
  } = await loadHome(viewer);
  // `list` já vem do mais recente para o mais antigo.
  const latest = sites[0];
  // Planos valendo e o acesso acabou: o site publicado mostra "temporarily unavailable".
  const offline = access.enforced && !access.live;

  const liveSites = sites.filter((site) => site.status === "published").length;
  // Posts já aprovados nos próximos 30 dias: "scheduled" (sai sozinho) e "approved" (postar à mão).
  const scheduledSoon = social.posts.filter(
    (post) =>
      (post.status === "scheduled" || post.status === "approved") &&
      post.scheduledAt !== null &&
      Date.parse(post.scheduledAt) >= now &&
      Date.parse(post.scheduledAt) < now + 30 * DAY_MS,
  ).length;

  // "Connect Instagram" só quando a conta pode postar sozinha (ou já tem conta ligada): no modo
  // manual não há botão de conectar e o passo nunca terminaria.
  const socialSteps: ChecklistStep[] = [
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

  const needs = (
    <NeedsYou rows={needsRows({ sites, weekLeads, social, clients, access, timeZone, now })} />
  );
  const office = (
    <YourOffice
      liveSites={liveSites}
      totalSites={sites.length}
      scheduledSoon={scheduledSoon}
      clients={clients}
    />
  );
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
      <SitesGrid
        sites={sites}
        leadCounts={leadCounts}
        headingLevel={3}
        offline={offline}
        emptyState={
          <div className="mt-4">
            <ExampleSiteEmpty />
          </div>
        }
      />
    </section>
  );

  return (
    <div>
      <Greeting firstName={firstName} nowIso={new Date(now).toISOString()} />

      {latest ? (
        <div className="mt-8 grid gap-10 sm:gap-12 lg:mt-10 lg:gap-14">
          {needs}
          {office}
          <DashboardChecklist
            siteId={latest.id}
            siteName={latest.spec.business.name}
            steps={checklistSteps(latest, leadCounts[latest.id] ?? 0, domainIncluded)}
            extraSteps={socialSteps}
            shareHref={latest.status === "published" ? `/sites/${latest.id}#publish` : null}
          />
          {yourSites}
        </div>
      ) : (
        // Conta sem sites: primeiro o convite para criar, depois o resto.
        <div className="mt-8 grid gap-10 sm:gap-12 lg:mt-10 lg:gap-14">
          {yourSites}
          {needs}
          {office}
        </div>
      )}
    </div>
  );
}
