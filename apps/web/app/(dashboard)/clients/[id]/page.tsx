import type { Client, ClientActivity } from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import {
  cardClass,
  focusRing,
  panelClass,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";
import { LocalTime } from "@/components/LocalTime";
import {
  STAGE_LABELS,
  dateKeyIn,
  formatCents,
  formatDateOnly,
  isClientStage,
  mapsHref,
  phoneHref,
} from "@/lib/clients";
import { getViewer } from "@/server/auth/viewer";
import { clientsTimeZone, getClientDetail } from "@/server/clients/service";
import {
  JobIcon,
  MailIcon,
  NoteIcon,
  PhoneIcon,
  PinIcon,
  StageBadge,
  StageIcon,
  TextIcon,
  sectionTitle,
} from "../ui";
import { ActivityComposer } from "./ActivityComposer";
import {
  ContactDetails,
  DeleteClientButton,
  FollowUpForm,
  PinnedNotes,
  StagePicker,
} from "./ClientControls";

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

// ---------- contato ----------

function QuickActions({ client }: { client: Client }) {
  const actions: { key: string; href: string; label: string; icon: ReactNode }[] = [];
  if (client.phone) {
    const tel = phoneHref(client.phone);
    actions.push({
      key: "call",
      href: `tel:${tel}`,
      label: "Call",
      icon: <PhoneIcon className="size-4" />,
    });
    actions.push({
      key: "text",
      href: `sms:${tel}`,
      label: "Text",
      icon: <TextIcon className="size-4" />,
    });
  }
  if (client.email) {
    actions.push({
      key: "email",
      href: `mailto:${client.email}`,
      label: "Email",
      icon: <MailIcon className="size-4" />,
    });
  }
  if (actions.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {actions.map((action) => (
        <li key={action.key}>
          <a href={action.href} className={secondaryButton}>
            {action.icon}
            {action.label}
            <span className="sr-only"> {client.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function ContactView({ client }: { client: Client }) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Phone", value: client.phone },
    { label: "Email", value: client.email },
    {
      label: "Address",
      value: client.address ? (
        <>
          {client.address}
          <a
            href={mapsHref(client.address)}
            target="_blank"
            rel="noreferrer"
            className={`mt-0.5 flex w-fit items-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
          >
            <PinIcon className="size-4" />
            Open in Google Maps
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      ) : null,
    },
  ];
  return (
    <dl className="mt-5 grid gap-3 border-t border-slate-200/70 pt-4 text-[15px] leading-6">
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

function TimelineItem({ activity }: { activity: ClientActivity }) {
  const Icon = ACTIVITY_ICONS[activity.kind];
  // Na mudança de etapa o texto já está no título.
  const body = activity.kind === "stage" ? "" : activity.body.trim();
  return (
    <li className="flex gap-3 px-4 py-4 sm:px-5">
      <span
        aria-hidden="true"
        className={`grid size-8 shrink-0 place-items-center rounded-full ${
          activity.kind === "lead" ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-600"
        }`}
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

export default async function ClientPage({ params }: ClientPageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  const { id } = await params;
  // No modo "ver como" do admin, o cliente da conta vista (só leitura: sem anotar nem apagar).
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/clients/${id}`)}`);
  const readOnly = viewer.viewingAs !== null;

  const { today, detail, since } = await loadClient(viewer.ownerId, id);
  if (!detail) notFound();
  const { client, activities } = detail;

  const contactKey = [client.name, client.phone, client.email, client.address].join("|");

  return (
    <div>
      <Link href="/clients" className={`${textButton} -ml-1`}>
        <span aria-hidden="true">‹</span> Clients
      </Link>

      <div className="mt-3 grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
        {/* ---------- coluna da esquerda: contato, etapa, retorno e anotação ---------- */}
        <div className="grid gap-4">
          <section aria-labelledby="client-name" className={panelClass}>
            {/* Como um cartão de contato: avatar com a inicial, nome grande e a etapa (no HTML o
                nome vem antes da etapa; a grade põe a etapa no canto de cima). */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
              <span
                aria-hidden="true"
                className="col-start-1 row-start-1 grid size-14 place-items-center rounded-full bg-slate-100 font-display text-xl font-semibold text-slate-600"
              >
                {client.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <h1
                id="client-name"
                className="col-span-2 row-start-2 mt-4 min-w-0 font-display text-2xl leading-tight font-bold tracking-[-0.02em] break-words text-ink"
              >
                {client.name}
              </h1>
              <span className="col-start-2 row-start-1">
                <StageBadge stage={client.stage} />
              </span>
            </div>
            <p className="mt-1 text-[13px] text-slate-500">
              {client.source === "website" ? "Came from your website" : "Added by you"} · since{" "}
              {since}
            </p>
            <QuickActions client={client} />
            <ContactDetails
              key={contactKey}
              client={{
                id: client.id,
                name: client.name,
                phone: client.phone,
                email: client.email,
                address: client.address,
              }}
            >
              <ContactView client={client} />
            </ContactDetails>
          </section>

          <section aria-label="Stage and follow-up" className={`${panelClass} grid gap-5`}>
            <StagePicker key={client.stage} clientId={client.id} stage={client.stage} />
            <FollowUpForm
              key={client.followUpOn ?? "none"}
              clientId={client.id}
              followUpOn={client.followUpOn}
              today={today}
            />
          </section>

          <section aria-label="Pinned notes" className={panelClass}>
            <PinnedNotes key={client.notes} clientId={client.id} notes={client.notes} />
          </section>
        </div>

        {/* ---------- coluna da direita: histórico ---------- */}
        <section aria-labelledby="history-heading" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="history-heading" className={sectionTitle}>
              History
            </h2>
            {client.jobsCount > 0 && (
              <p className="text-[15px] text-slate-600 tabular-nums">
                <span className="font-semibold text-ink">
                  {client.jobsCount} {client.jobsCount === 1 ? "job" : "jobs"}
                </span>
                {client.totalJobsCents > 0 && <> · {formatCents(client.totalJobsCents)}</>}
              </p>
            )}
          </div>

          {!readOnly && (
            <div className="mt-3">
              <ActivityComposer clientId={client.id} />
            </div>
          )}

          {activities.length === 0 ? (
            <p className={`mt-4 px-4 py-6 text-[15px] text-slate-600 sm:px-5 ${cardClass}`}>
              Nothing here yet. Add a note after you talk to them, or log a job when it&rsquo;s
              done.
            </p>
          ) : (
            <ol className={`mt-4 divide-y divide-slate-200/70 overflow-hidden ${cardClass}`}>
              {activities.map((activity) => (
                <TimelineItem key={activity.id} activity={activity} />
              ))}
            </ol>
          )}
        </section>
      </div>

      {!readOnly && (
        <div className="mt-12 border-t border-slate-200/70 pt-6">
          <DeleteClientButton clientId={client.id} name={client.name} />
        </div>
      )}
    </div>
  );
}
