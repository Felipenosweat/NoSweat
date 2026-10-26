import type { Client, ClientActivity } from "@nosweat/schema";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { LocalTime } from "@/components/LocalTime";
import { EmptyState, GlassButton, GlassCard, cx, focusRing } from "@/components/glass";
import {
  STAGE_LABELS,
  dateKeyIn,
  directionsHref,
  formatCents,
  formatDateOnly,
  isClientStage,
  phoneHref,
} from "@/lib/clients";
import { getViewer } from "@/server/auth/viewer";
import { clientsTimeZone, getClientDetail } from "@/server/clients/service";
import { accountReviewLink } from "@/server/reviews";
import { getSiteStore } from "@/server/store";
import { ClientMenu } from "../ClientMenu";
import {
  Avatar,
  DirectionsIcon,
  JobIcon,
  MailIcon,
  NoteIcon,
  PhoneIcon,
  StageBadge,
  StageIcon,
  TagList,
  TextIcon,
  sectionTitle,
} from "../ui";
import { ActivityComposer } from "./ActivityComposer";
import { ContactDetails, FollowUpForm, PinnedNotes, StagePicker } from "./ClientControls";

export const metadata: Metadata = { title: "Client", robots: { index: false } };

type ClientPageProps = { params: Promise<{ id: string }> };

/** Ficha do cliente e "hoje" no fuso da empresa (fora do componente: usa o relógio). */
async function loadClient(ownerId: string, id: string) {
  const [timeZone, detail] = await Promise.all([
    clientsTimeZone(ownerId),
    getClientDetail(ownerId, id),
  ]);
  const today = dateKeyIn(timeZone, new Date());
  // Desde quando é cliente, no mesmo fuso.
  const since = detail
    ? formatDateOnly(dateKeyIn(timeZone, new Date(detail.client.createdAt)), today)
    : "";
  return { today, detail, since };
}

/** Link de avaliações do Google da conta (para "pedir avaliação" no menu). Erro = sem atalho. */
async function loadReviewLink(ownerId: string) {
  try {
    return accountReviewLink(await getSiteStore().list(ownerId));
  } catch (error) {
    console.error("[clients] could not read the review link", error);
    return null;
  }
}

// ---------- ações de um toque ----------

type QuickAction = {
  key: string;
  label: string;
  /** `null` = falta o dado (o botão aparece apagado, com o motivo). */
  href: string | null;
  missing: string;
  icon: ReactNode;
  external?: boolean;
};

const actionTile =
  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[13px] leading-4 font-semibold [&>svg]:size-[22px]";

/** Ligar, SMS, e-mail e rota: sempre os quatro no mesmo lugar (memória do dedo). */
function QuickActions({ client }: { client: Client }) {
  const tel = client.phone ? phoneHref(client.phone) : null;
  const actions: QuickAction[] = [
    {
      key: "call",
      label: "Call",
      href: tel ? `tel:${tel}` : null,
      missing: "No phone number",
      icon: <PhoneIcon />,
    },
    {
      key: "text",
      label: "Text",
      href: tel ? `sms:${tel}` : null,
      missing: "No phone number",
      icon: <TextIcon />,
    },
    {
      key: "email",
      label: "Email",
      href: client.email ? `mailto:${client.email}` : null,
      missing: "No email",
      icon: <MailIcon />,
    },
    {
      key: "directions",
      label: "Directions",
      href: client.address ? directionsHref(client.address) : null,
      missing: "No address",
      icon: <DirectionsIcon />,
      external: true,
    },
  ];
  return (
    <ul aria-label={`Contact ${client.name}`} className="mt-5 grid grid-cols-4 gap-2">
      {actions.map((action) => (
        <li key={action.key}>
          {action.href ? (
            <a
              href={action.href}
              {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cx(
                actionTile,
                "glass glass-interactive text-brand motion-safe:transition-[background-color,scale] motion-safe:active:scale-[0.97]",
                focusRing,
              )}
            >
              {action.icon}
              <span className="text-(--glass-fg)">{action.label}</span>
              {action.external && <span className="sr-only"> (opens Google Maps)</span>}
            </a>
          ) : (
            <span
              aria-disabled="true"
              title={action.missing}
              className={cx(actionTile, "glass glass-flat text-(--glass-fg-muted) opacity-55")}
            >
              {action.icon}
              <span>{action.label}</span>
              <span className="sr-only">: {action.missing.toLowerCase()}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ContactView({ client }: { client: Client }) {
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Mobile phone",
      value: client.phone ? (
        <a
          href={`tel:${phoneHref(client.phone)}`}
          className={`font-medium text-brand underline-offset-4 hover:underline ${focusRing}`}
        >
          {client.phone}
        </a>
      ) : null,
    },
    {
      label: "Email",
      value: client.email ? (
        <a
          href={`mailto:${client.email}`}
          className={`font-medium break-all text-brand underline-offset-4 hover:underline ${focusRing}`}
        >
          {client.email}
        </a>
      ) : null,
    },
    { label: "Service address", value: client.address },
  ];
  return (
    <dl className="mt-5 grid gap-3 border-t border-(--glass-rim) pt-4 text-[15px] leading-6">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-[13px] font-medium text-slate-500">{row.label}</dt>
          <dd className="break-words text-ink">
            {row.value ?? <span className="text-slate-500">Not added</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- histórico ----------

function activityTitle(activity: ClientActivity): string {
  if (activity.kind === "lead") return "Message from your website";
  if (activity.kind === "job") {
    return activity.amountCents !== null && activity.amountCents > 0
      ? `Job done · ${formatCents(activity.amountCents)}`
      : "Job done";
  }
  if (activity.kind === "stage") {
    const stage = activity.body.trim();
    return `Moved to ${isClientStage(stage) ? STAGE_LABELS[stage] : stage}`;
  }
  return "Note";
}

const ACTIVITY_ICONS: Record<ClientActivity["kind"], (props: { className?: string }) => ReactNode> =
  {
    lead: MailIcon,
    note: NoteIcon,
    job: JobIcon,
    stage: StageIcon,
  };

const ACTIVITY_TONES: Record<ClientActivity["kind"], string> = {
  lead: "bg-brand/10 text-brand",
  note: "bg-slate-500/10 text-slate-600",
  job: "bg-emerald-500/10 text-emerald-700",
  stage: "bg-amber-500/15 text-amber-700",
};

function TimelineItem({ activity, last }: { activity: ClientActivity; last: boolean }) {
  const Icon = ACTIVITY_ICONS[activity.kind];
  // Na mudança de etapa o texto já está no título.
  const body = activity.kind === "stage" ? "" : activity.body.trim();
  return (
    <li className="relative flex gap-3 px-4 py-4 sm:px-5">
      {/* Linha do tempo ligando os ícones. */}
      {!last && (
        <span
          aria-hidden="true"
          className="absolute top-12 bottom-0 left-[2rem] w-px bg-(--glass-rim) sm:left-[2.25rem]"
        />
      )}
      <span
        aria-hidden="true"
        className={cx(
          "glass-edge relative grid size-8 shrink-0 place-items-center rounded-full",
          ACTIVITY_TONES[activity.kind],
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h3 className="text-[15px] leading-6 font-semibold text-ink tabular-nums">
            {activityTitle(activity)}
          </h3>
          <LocalTime
            iso={activity.occurredAt}
            className="text-[13px] text-slate-500 tabular-nums"
          />
        </div>
        {body && (
          <p className="mt-1 max-w-[65ch] text-[15px] leading-[1.6] break-words whitespace-pre-line text-slate-600">
            {body}
          </p>
        )}
      </div>
    </li>
  );
}

/** Números da ficha: serviços, total e último contato. */
function ClientStats({ client }: { client: Client }) {
  const stats: { label: string; value: ReactNode }[] = [
    { label: "Jobs", value: client.jobsCount },
    { label: "Total billed", value: formatCents(client.totalJobsCents) },
    {
      label: "Last contact",
      value: <LocalTime iso={client.lastActivityAt} className="tabular-nums" />,
    },
  ];
  return (
    <dl className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat) => (
        <GlassCard key={stat.label} padding="sm" className="min-w-0">
          <dt className="text-[13px] font-medium text-slate-500">{stat.label}</dt>
          <dd
            className={cx(
              "mt-1 font-semibold break-words text-ink tabular-nums",
              stat.label === "Last contact" ? "text-[13px] leading-5" : "text-lg leading-6",
            )}
          >
            {stat.value}
          </dd>
        </GlassCard>
      ))}
    </dl>
  );
}

export default async function ClientPage({ params }: ClientPageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  const { id } = await params;
  // No modo "ver como" do admin, o cliente da conta vista (só leitura: nada muda).
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/clients/${id}`)}`);
  const readOnly = viewer.viewingAs !== null;

  const [{ today, detail, since }, review] = await Promise.all([
    loadClient(viewer.ownerId, id),
    loadReviewLink(viewer.ownerId),
  ]);
  if (!detail) notFound();
  const { client, activities } = detail;

  const contactKey = [client.name, client.phone, client.email, client.address, ...client.tags].join(
    "|",
  );

  return (
    <div>
      <GlassButton href="/clients" variant="ghost" size="sm" className="-ml-2">
        <span aria-hidden="true">‹</span> Clients
      </GlassButton>

      <div className="mt-3 grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8">
        {/* ---------- coluna da esquerda: cartão de contato, etapa, retorno e anotação ---------- */}
        <div className="grid gap-4">
          <GlassCard as="section" aria-labelledby="client-name">
            <div className="flex items-start justify-between gap-3">
              <Avatar name={client.name} size="lg" />
              <div className="flex items-center gap-1">
                <StageBadge stage={client.stage} />
                <ClientMenu
                  context="detail"
                  readOnly={readOnly}
                  review={review}
                  client={{
                    id: client.id,
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    address: client.address,
                    stage: client.stage,
                  }}
                />
              </div>
            </div>
            <h1
              id="client-name"
              className="mt-4 min-w-0 font-display text-2xl leading-tight font-bold tracking-[-0.02em] break-words text-ink"
            >
              {client.name}
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              {client.source === "website" ? "Came from your website" : "Added by you"} · since{" "}
              {since}
            </p>
            <TagList tags={client.tags} className="mt-3" />
            <QuickActions client={client} />
            <ContactDetails
              key={contactKey}
              readOnly={readOnly}
              client={{
                id: client.id,
                name: client.name,
                phone: client.phone,
                email: client.email,
                address: client.address,
                tags: client.tags,
              }}
            >
              <ContactView client={client} />
            </ContactDetails>
          </GlassCard>

          <GlassCard as="section" aria-label="Stage and follow-up" className="grid gap-6">
            <StagePicker
              key={client.stage}
              clientId={client.id}
              stage={client.stage}
              readOnly={readOnly}
            />
            <FollowUpForm
              key={client.followUpOn ?? "none"}
              clientId={client.id}
              followUpOn={client.followUpOn}
              today={today}
              readOnly={readOnly}
            />
          </GlassCard>

          <GlassCard as="section" aria-label="Pinned notes">
            <PinnedNotes
              key={client.notes}
              clientId={client.id}
              notes={client.notes}
              readOnly={readOnly}
            />
          </GlassCard>
        </div>

        {/* ---------- coluna da direita: números, registrar e histórico ---------- */}
        <section aria-labelledby="history-heading" className="grid min-w-0 gap-4">
          <ClientStats client={client} />

          {!readOnly && <ActivityComposer clientId={client.id} />}

          <div>
            <h2 id="history-heading" className={sectionTitle}>
              Activity
            </h2>
            {activities.length === 0 ? (
              <EmptyState
                className="mt-3"
                headingLevel={3}
                icon={<NoteIcon />}
                title="No activity yet"
                description="Add a note after you talk to them, or log a job when it’s done. Stage changes show up here too."
              />
            ) : (
              <GlassCard as="div" padding="none" className="mt-3 overflow-hidden">
                <ol>
                  {activities.map((activity, index) => (
                    <TimelineItem
                      key={activity.id}
                      activity={activity}
                      last={index === activities.length - 1}
                    />
                  ))}
                </ol>
              </GlassCard>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
