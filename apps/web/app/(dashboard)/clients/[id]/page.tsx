import type {
  Client,
  ClientActivity,
  Estimate,
  Invoice,
  InvoiceStatus,
  Job,
} from "@nosweat/schema";
import type { Metadata } from "next";
import Link from "next/link";
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
import { estimateLabel, invoiceLabel } from "@/lib/office";
import { getViewer } from "@/server/auth/viewer";
import { clientsTimeZone, getClientDetail } from "@/server/clients/service";
import { listEstimates, listInvoices, listJobs } from "@/server/office/service";
import { listOwnerSites } from "@/server/owner-sites";
import { accountReviewLink } from "@/server/reviews";
import { EstimateBadge, EstimateIcon, InvoiceBadge, InvoiceIcon } from "../../office/_ui/ui";
import { scheduleHref } from "../../schedule/params";
import { JobStatusBadge } from "../../schedule/ui";
import { ClientMenu } from "../ClientMenu";
import {
  Avatar,
  CalendarIcon,
  DirectionsIcon,
  JobIcon,
  MailIcon,
  MoneyIcon,
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
    return accountReviewLink(await listOwnerSites(ownerId));
  } catch (error) {
    console.error("[clients] could not read the review link", error);
    return null;
  }
}

/** Orçamentos, serviços e faturas do cliente (mais novos primeiro). `null` = erro ao ler. */
type Paperwork = { estimates: Estimate[]; jobs: Job[]; invoices: Invoice[] };

async function loadPaperwork(ownerId: string, clientId: string): Promise<Paperwork | null> {
  try {
    const [estimates, jobs, invoices] = await Promise.all([
      listEstimates(ownerId, { clientId }),
      listJobs(ownerId, { clientId }),
      listInvoices(ownerId, { clientId }),
    ]);
    // A agenda devolve os serviços por horário; aqui o mais novo (maior número) vem primeiro.
    return { estimates, jobs: [...jobs].sort((a, b) => b.number - a.number), invoices };
  } catch (error) {
    console.error("[clients] could not read the client's paperwork", error);
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
  // Pagamento registrado numa fatura (tipo novo do servidor; comparação por texto até o contrato
  // ter o tipo).
  if (activity.kind === "payment") {
    return activity.amountCents !== null && activity.amountCents > 0
      ? `Payment · ${formatCents(activity.amountCents)}`
      : "Payment";
  }
  return "Note";
}

// Por texto (não `Record<kind>`): um tipo novo do servidor cai no ícone e na cor da nota.
const ACTIVITY_ICONS: Partial<Record<string, (props: { className?: string }) => ReactNode>> = {
  lead: MailIcon,
  note: NoteIcon,
  job: JobIcon,
  stage: StageIcon,
  payment: MoneyIcon,
};

const ACTIVITY_TONES: Partial<Record<string, string>> = {
  lead: "bg-brand/10 text-brand",
  note: "bg-slate-500/10 text-slate-600",
  job: "bg-emerald-500/10 text-emerald-700",
  stage: "bg-amber-500/15 text-amber-700",
  payment: "bg-emerald-500/10 text-emerald-700",
};

function TimelineItem({ activity, last }: { activity: ClientActivity; last: boolean }) {
  const Icon = ACTIVITY_ICONS[activity.kind] ?? NoteIcon;
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
          ACTIVITY_TONES[activity.kind] ?? ACTIVITY_TONES.note,
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

/**
 * Números da ficha: serviços registrados à mão, o que entrou (pagamentos das faturas + serviços
 * registrados com valor, ver `clientTotals`) e último contato.
 */
function ClientStats({ client }: { client: Client }) {
  const stats: { label: string; value: ReactNode }[] = [
    { label: "Past work", value: client.jobsCount },
    { label: "Collected", value: formatCents(client.totalJobsCents) },
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

// ---------- papéis: orçamentos, serviços e faturas ----------

/** Quantos de cada tipo a ficha mostra (o resto fica na lista própria). */
const PAPERWORK_LIMIT = 5;

/** Faturas enviadas que ainda têm saldo (rascunho ainda não é cobrança; anulada não conta). */
const OPEN_INVOICE: ReadonlySet<InvoiceStatus> = new Set<InvoiceStatus>([
  "sent",
  "partial",
  "overdue",
]);

type PaperRow = {
  key: string;
  href: string;
  title: string;
  meta: string;
  amount: string | null;
  badge: ReactNode;
};

function PaperGroup({
  title,
  rows,
  total,
  seeAllHref,
}: {
  title: string;
  rows: PaperRow[];
  /** Quantos existem (pode ser mais do que os mostrados). */
  total: number;
  seeAllHref?: string;
}) {
  if (rows.length === 0) return null;
  const more = total - rows.length;
  return (
    <div className="border-t border-(--glass-rim) first:border-t-0">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 sm:px-5">
        <h3 className="text-[13px] font-semibold text-slate-500">
          {title} <span className="font-normal tabular-nums">{total}</span>
        </h3>
        {more > 0 &&
          (seeAllHref ? (
            <Link
              href={seeAllHref}
              className={`inline-flex min-h-11 items-center text-[13px] font-semibold text-brand underline-offset-4 hover:underline sm:min-h-0 ${focusRing}`}
            >
              See all {total}
            </Link>
          ) : (
            <span className="text-[13px] text-slate-500 tabular-nums">+{more} more</span>
          ))}
      </div>
      <ul className="pb-1.5">
        {rows.map((row) => (
          <li key={row.key}>
            <Link
              href={row.href}
              className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] leading-5 font-semibold text-ink">
                  {row.title}
                </span>
                <span className="block truncate text-[13px] leading-5 text-slate-500 tabular-nums">
                  {row.meta}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                {row.amount && (
                  <span className="text-[15px] leading-5 font-semibold text-ink tabular-nums">
                    {row.amount}
                  </span>
                )}
                {row.badge}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tudo o que foi feito no papel para o cliente, com o saldo em aberto em cima. */
function PaperworkSection({ client, paperwork }: { client: Client; paperwork: Paperwork | null }) {
  if (!paperwork) {
    return (
      <p
        role="alert"
        className="glass-edge rounded-2xl bg-red-50/90 px-4 py-3 text-[15px] text-red-700"
      >
        We couldn&rsquo;t load this client&rsquo;s estimates, jobs and invoices. Please refresh the
        page.
      </p>
    );
  }
  const { estimates, jobs, invoices } = paperwork;
  if (estimates.length + jobs.length + invoices.length === 0) return null;

  const openBalance = invoices
    .filter((invoice) => OPEN_INVOICE.has(invoice.status))
    .reduce((sum, invoice) => sum + Math.max(0, invoice.balanceCents), 0);
  // As listas próprias buscam pelo nome do cliente.
  const byName = `?q=${encodeURIComponent(client.name.slice(0, 100))}`;

  const estimateRows: PaperRow[] = estimates.slice(0, PAPERWORK_LIMIT).map((estimate) => ({
    key: estimate.id,
    href: `/estimates/${encodeURIComponent(estimate.id)}`,
    title: estimate.title || estimateLabel(estimate.number),
    meta: estimateLabel(estimate.number),
    amount: formatCents(estimate.totalCents),
    badge: <EstimateBadge status={estimate.status} size="sm" />,
  }));
  const jobRows: PaperRow[] = jobs.slice(0, PAPERWORK_LIMIT).map((job) => ({
    key: job.id,
    href: `/schedule/${encodeURIComponent(job.id)}`,
    title: job.title,
    meta: `Job #${job.number}`,
    amount: job.valueCents !== null && job.valueCents > 0 ? formatCents(job.valueCents) : null,
    badge: <JobStatusBadge status={job.status} size="sm" />,
  }));
  const invoiceRows: PaperRow[] = invoices.slice(0, PAPERWORK_LIMIT).map((invoice) => ({
    key: invoice.id,
    href: `/invoices/${encodeURIComponent(invoice.id)}`,
    title: invoice.title || invoiceLabel(invoice.number),
    meta:
      OPEN_INVOICE.has(invoice.status) && invoice.balanceCents > 0
        ? `${invoiceLabel(invoice.number)} · ${formatCents(invoice.balanceCents)} due`
        : invoiceLabel(invoice.number),
    amount: formatCents(invoice.totalCents),
    badge: <InvoiceBadge status={invoice.status} size="sm" />,
  }));

  return (
    <section aria-labelledby="paperwork-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="paperwork-heading" className={sectionTitle}>
          Paperwork
        </h2>
        {openBalance > 0 && (
          <p className="text-[15px] text-slate-600">
            Open balance{" "}
            <span className="font-semibold text-amber-700 tabular-nums">
              {formatCents(openBalance)}
            </span>
          </p>
        )}
      </div>
      <GlassCard as="div" padding="none" className="mt-3 overflow-hidden">
        <PaperGroup
          title="Estimates"
          rows={estimateRows}
          total={estimates.length}
          seeAllHref={`/estimates${byName}`}
        />
        <PaperGroup title="Jobs" rows={jobRows} total={jobs.length} />
        <PaperGroup
          title="Invoices"
          rows={invoiceRows}
          total={invoices.length}
          seeAllHref={`/invoices${byName}`}
        />
      </GlassCard>
    </section>
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

  const [{ today, detail, since }, review, paperwork] = await Promise.all([
    loadClient(viewer.ownerId, id),
    loadReviewLink(viewer.ownerId),
    loadPaperwork(viewer.ownerId, id),
  ]);
  if (!detail) notFound();
  const { client, activities } = detail;

  const contactKey = [client.name, client.phone, client.email, client.address, ...client.tags].join(
    "|",
  );

  return (
    <div>
      <GlassButton href="/clients" variant="ghost" size="sm" className="-ml-2 max-sm:min-h-11">
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
            {!readOnly && (
              // Três seguidos só onde cabem sem cortar o texto (no celular e na coluna estreita do
              // computador, "Book a job" ocupa a linha de cima).
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                <GlassButton
                  href={scheduleHref({
                    view: null,
                    date: null,
                    team: null,
                    openNew: true,
                    clientId: client.id,
                  })}
                  variant="secondary"
                  icon={<CalendarIcon />}
                  fullWidth
                  className="col-span-2 sm:col-span-1 lg:col-span-2"
                >
                  Book a job
                </GlassButton>
                <GlassButton
                  href={`/estimates/new?clientId=${encodeURIComponent(client.id)}`}
                  variant="secondary"
                  icon={<EstimateIcon />}
                  fullWidth
                >
                  Estimate
                </GlassButton>
                <GlassButton
                  href={`/invoices/new?clientId=${encodeURIComponent(client.id)}`}
                  variant="secondary"
                  icon={<InvoiceIcon />}
                  fullWidth
                >
                  Invoice
                </GlassButton>
              </div>
            )}
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

          <PaperworkSection client={client} paperwork={paperwork} />

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
                description="Add a note after you talk to them, or log past work when it’s done. Stage changes show up here too."
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
