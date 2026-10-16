import type { Client } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { DashboardChecklist, type ChecklistStep } from "@/components/DashboardChecklist";
import { StatusBadge, focusRing } from "@/components/DashboardUi";
import { ExampleSiteEmpty } from "@/components/ExampleSiteEmpty";
import { LocalTime } from "@/components/LocalTime";
import { SitesGrid } from "@/components/SitesGrid";
import { CLIENTS_TIME_ZONE, dateKeyIn, formatDateOnly } from "@/lib/clients";
import { MODULES, type HubModule } from "@/lib/modules";
import { getAccount } from "@/server/admin";
import { createSupabaseServerClient } from "@/server/auth/session";
import { getViewer, type ViewingAs } from "@/server/auth/viewer";
import { clientsNeedingAttention, listClients } from "@/server/clients/service";
import { getSocialStore } from "@/server/social/store";
import type { SocialAccountRecord, SocialPostRecord } from "@/server/social/types";
import { getSiteStore, type SiteRecord } from "@/server/store";
import { Greeting } from "./Greeting";

export const metadata: Metadata = { title: "Home" };

const DAY_MS = 24 * 60 * 60 * 1000;
/** Quantas linhas "Needs you" mostrar no máximo. */
const MAX_NEEDS = 5;

const sectionTitle =
  "font-display text-[17px] leading-6 font-semibold tracking-[-0.015em] text-ink";

/** O rascunho tem foto no topo ou alguma foto na galeria? */
function hasPhotos(site: SiteRecord): boolean {
  return site.spec.sections.some(
    (section) =>
      (section.type === "hero" && Boolean(section.image)) ||
      (section.type === "gallery" && section.images.length > 0),
  );
}

/** Os 4 passos do checklist que o servidor sabe responder sobre o site (o último fica no cliente). */
function checklistSteps(site: SiteRecord, leads: number): ChecklistStep[] {
  const live = site.status === "published";
  const liveHref = site.slug ? `/s/${site.slug}#contact` : null;
  return [
    { label: "Publish", done: live, href: `/sites/${site.id}#publish`, hint: "Put it online" },
    {
      label: "Connect domain",
      done: Boolean(site.customDomain),
      href: `/sites/${site.id}#domain`,
      hint: "Use yourbusiness.com",
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

type ClientsSnapshot = {
  total: number;
  newCount: number;
  followUpsDue: Client[];
  /** Hoje no fuso da empresa ("AAAA-MM-DD"). */
  today: string;
};

/**
 * Resumo do módulo de clientes (o serviço já traz os pedidos novos do site antes de ler). `null` =
 * erro (a página volta a mostrar as mensagens do site por site, como antes).
 */
async function loadClients(ownerId: string, now: number): Promise<ClientsSnapshot | null> {
  const today = dateKeyIn(CLIENTS_TIME_ZONE, new Date(now));
  try {
    // Um depois do outro: os dois importam os pedidos do site, e em paralelo poderiam duplicar.
    const clients = await listClients(ownerId);
    const attention = await clientsNeedingAttention(ownerId, today);
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

type NeedRow = { key: string; href: string; text: ReactNode; action: string };

/** Número em destaque dentro de uma frase. */
function Count({ value }: { value: number }) {
  return <span className="font-semibold text-brand tabular-nums">{value}</span>;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** Linhas "Needs you": só fatos que o banco sabe, do mais urgente para o informativo. */
function needsRows({
  sites,
  weekLeads,
  social,
  clients,
  now,
}: {
  sites: SiteRecord[];
  weekLeads: Record<string, number>;
  social: SocialSnapshot;
  clients: ClientsSnapshot | null;
  now: number;
}): NeedRow[] {
  const rows: NeedRow[] = [];
  const { account, posts } = social;

  const drafts = posts.filter((post) => post.status === "draft").length;
  if (drafts > 0) {
    rows.push({
      key: "drafts",
      href: "/social/review",
      text: (
        <>
          <Count value={drafts} /> {plural(drafts, "post is", "posts are")} waiting for your
          approval.
        </>
      ),
      action: "Review",
    });
  }

  if (account?.status === "needs_reconnect") {
    rows.push({
      key: "reconnect",
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
        href: "/clients",
        text: "You have more follow-ups due.",
        action: "Clients",
      });
    }

    if (clients.newCount > 0) {
      rows.push({
        key: "new-clients",
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
  const problems = posts.filter(
    (post) =>
      (post.status === "failed" || post.status === "missed") &&
      post.scheduledAt !== null &&
      Date.parse(post.scheduledAt) >= now - 30 * DAY_MS,
  ).length;
  if (problems > 0) {
    rows.push({
      key: "problems",
      href: "/social",
      text: (
        <>
          <Count value={problems} /> {plural(problems, "post", "posts")} didn&rsquo;t go out. Pick a
          new time or post {plural(problems, "it", "them")} yourself.
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

  const next = posts
    .filter(
      (post) =>
        post.status === "scheduled" &&
        post.scheduledAt !== null &&
        Date.parse(post.scheduledAt) > now,
    )
    .sort((a, b) => Date.parse(a.scheduledAt ?? "") - Date.parse(b.scheduledAt ?? ""))[0];
  if (next?.scheduledAt) {
    rows.push({
      key: "next-post",
      href: "/social",
      text: (
        <>
          Your next post goes out{" "}
          <LocalTime iso={next.scheduledAt} className="font-medium tabular-nums" />.
        </>
      ),
      action: "Calendar",
    });
  }

  return rows.slice(0, MAX_NEEDS);
}

function NeedsYou({ rows }: { rows: NeedRow[] }) {
  return (
    <section aria-labelledby="needs-heading">
      <h2 id="needs-heading" className={sectionTitle}>
        Needs you
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-slate-600 sm:px-5">
            Nothing needs you right now.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {rows.map((row) => (
              <li key={row.key}>
                <Link
                  href={row.href}
                  className="flex min-h-14 items-center gap-4 px-4 py-2.5 text-[15px] leading-6 text-ink transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5"
                >
                  <span className="min-w-0 flex-1">{row.text}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-sm font-semibold whitespace-nowrap text-slate-600"
                  >
                    <span className="max-sm:hidden">{row.action} </span>›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const tileBase = "flex min-h-[150px] flex-col gap-1.5 rounded-xl p-4";

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
  return (
    <li>
      <Link
        href={hub.href}
        className={`${tileBase} h-full border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300 ${focusRing}`}
      >
        <h3 className="text-sm font-semibold text-slate-600">{hub.label}</h3>
        {value !== null && (
          <p className="mt-1.5 font-display text-[2rem] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums">
            {value}
          </p>
        )}
        <p className="text-[13px] text-slate-500">{unit}</p>
        <span className="mt-auto pt-2.5 text-sm font-semibold text-brand">{linkText}</span>
      </Link>
    </li>
  );
}

function SoonTile({ hub }: { hub: HubModule }) {
  return (
    <li
      className={`${tileBase} h-full items-start border border-dashed border-slate-300 bg-surface`}
    >
      <h3 className="text-sm font-semibold text-slate-600">{hub.label}</h3>
      <StatusBadge tone="neutral">Coming soon</StatusBadge>
      {hub.soonText && <p className="mt-1 text-sm text-slate-500">{hub.soonText}</p>}
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
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {MODULES.map((hub) => {
          if (hub.comingSoon) return <SoonTile key={hub.key} hub={hub} />;
          if (hub.key === "website") {
            return (
              <LiveTile
                key={hub.key}
                hub={hub}
                value={liveSites}
                unit={`live of ${totalSites} ${plural(totalSites, "site", "sites")}`}
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
                unit={
                  clients
                    ? `${plural(clients.total, "client", "clients")} · ${clients.newCount} new`
                    : "Everyone who contacted you"
                }
                linkText="Open clients"
              />
            );
          }
          return (
            <LiveTile
              key={hub.key}
              hub={hub}
              value={scheduledSoon}
              unit="scheduled · next 30 days"
              linkText="Open calendar"
            />
          );
        })}
      </ul>
    </section>
  );
}

/** Tudo o que a página inicial mostra, lido de uma vez (fora do componente: usa o relógio). */
async function loadHome(ownerId: string, viewingAs: ViewingAs | null) {
  const now = Date.now();
  const store = getSiteStore();
  const [sites, firstName, social, clients] = await Promise.all([
    store.list(ownerId),
    getFirstName(viewingAs),
    loadSocial(ownerId, now),
    loadClients(ownerId, now),
  ]);
  const leadLists = await Promise.all(sites.map((site) => store.listLeads(site.id)));
  const weekAgo = now - 7 * DAY_MS;
  const leadCounts: Record<string, number> = {};
  const weekLeads: Record<string, number> = {};
  sites.forEach((site, i) => {
    const leads = leadLists[i] ?? [];
    leadCounts[site.id] = leads.length;
    weekLeads[site.id] = leads.filter((lead) => Date.parse(lead.createdAt) >= weekAgo).length;
  });
  return { now, sites, firstName, social, clients, leadCounts, weekLeads };
}

export default async function DashboardPage() {
  // Sempre renderiza na hora do request (os dados mudam a cada site gerado).
  await connection();
  // No modo "ver como" do admin, os dados da conta vista (só leitura).
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/dashboard");
  const { now, sites, firstName, social, clients, leadCounts, weekLeads } = await loadHome(
    viewer.ownerId,
    viewer.viewingAs,
  );
  // `list` já vem do mais recente para o mais antigo.
  const latest = sites[0];

  const liveSites = sites.filter((site) => site.status === "published").length;
  const scheduledSoon = social.posts.filter(
    (post) =>
      post.status === "scheduled" &&
      post.scheduledAt !== null &&
      Date.parse(post.scheduledAt) >= now &&
      Date.parse(post.scheduledAt) < now + 30 * DAY_MS,
  ).length;

  const socialSteps: ChecklistStep[] = [
    {
      label: "Connect Instagram",
      done: social.account?.status === "active",
      href: "/social",
      hint: "Post without opening the app",
    },
    {
      label: "Plan your first month",
      done: social.posts.length > 0,
      href: "/social",
      hint: "A month of posts in minutes",
    },
  ];

  const needs = <NeedsYou rows={needsRows({ sites, weekLeads, social, clients, now })} />;
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
        emptyState={
          <div className="mt-3">
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
        <div className="mt-6 grid gap-10 lg:mt-8 lg:gap-12">
          {needs}
          {office}
          <DashboardChecklist
            siteId={latest.id}
            siteName={latest.spec.business.name}
            steps={checklistSteps(latest, leadCounts[latest.id] ?? 0)}
            extraSteps={socialSteps}
            shareHref={latest.status === "published" ? `/sites/${latest.id}#publish` : null}
          />
          {yourSites}
        </div>
      ) : (
        // Conta sem sites: primeiro o convite para criar, depois o resto.
        <div className="mt-6 grid gap-10 lg:mt-8 lg:gap-12">
          {yourSites}
          {needs}
          {office}
        </div>
      )}
    </div>
  );
}
