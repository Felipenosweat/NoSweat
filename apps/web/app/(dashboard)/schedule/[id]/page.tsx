import type { Client, Job, TeamMember } from "@nosweat/schema";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { GlassButton, GlassCard, cx, focusRing } from "@/components/glass";
import { directionsHref, formatCents, phoneHref } from "@/lib/clients";
import { getViewer } from "@/server/auth/viewer";
import { getClientDetail } from "@/server/clients/service";
import { getInvoice, getJob, getOfficeSettings, listTeam } from "@/server/office/service";
import { DirectionsIcon, PhoneIcon, TextIcon } from "../../clients/ui";
import { scheduleHref } from "../params";
import { dateKeyOf, safeTimeZone, zonedParts } from "../time";
import { EstimateIcon, InvoiceIcon } from "../ui";
import { AssigneesCard, JobHero, JobNotes } from "./JobControls";

export const metadata: Metadata = { title: "Job", robots: { index: false } };

type JobPageProps = { params: Promise<{ id: string }> };

type ClientContact = Pick<Client, "phone" | "address">;

/**
 * Serviço, fuso, equipe e contato do cliente (fora do componente: usa o relógio). Equipe ou
 * cliente com erro = sem cores / sem atalhos (a ficha continua).
 */
async function loadJob(ownerId: string, id: string) {
  const found = await getJob(ownerId, id);
  if (!found) return null;
  const [settings, team, contact, invoice] = await Promise.all([
    getOfficeSettings(ownerId).catch((error: unknown) => {
      console.error("[schedule] could not read office settings", error);
      return null;
    }),
    listTeam(ownerId).catch((error: unknown): TeamMember[] => {
      console.error("[schedule] could not list the team", error);
      return [];
    }),
    getClientDetail(ownerId, found.clientId)
      .then((detail): ClientContact | null =>
        detail ? { phone: detail.client.phone, address: detail.client.address } : null,
      )
      .catch((error: unknown) => {
        console.error("[schedule] could not read the client", error);
        return null;
      }),
    found.invoiceId
      ? getInvoice(ownerId, found.invoiceId).catch((error: unknown) => {
          console.error("[schedule] could not read the invoice", error);
          return undefined;
        })
      : Promise.resolve(undefined),
  ]);
  // Fatura anulada (ou apagada) não conta: a ficha mostra "Create invoice" de novo.
  const invoiceGone = found.invoiceId !== null && (invoice === null || invoice?.status === "void");
  const job: Job = invoiceGone ? { ...found, invoiceId: null } : found;
  const timeZone = safeTimeZone(settings?.timeZone);
  const today = zonedParts(new Date(), timeZone).dateKey;
  return { job, team, contact, timeZone, today };
}

// ---------- ações de um toque ----------

const actionTile =
  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[13px] leading-4 font-semibold [&>svg]:size-[22px]";

/** Ligar, SMS e rota: grandes, sempre no mesmo lugar (a equipe usa no caminho). */
function QuickActions({ job, contact }: { job: Job; contact: ClientContact | null }) {
  const tel = contact?.phone ? phoneHref(contact.phone) : null;
  const address = job.address ?? contact?.address ?? null;
  const actions: {
    key: string;
    label: string;
    href: string | null;
    missing: string;
    icon: ReactNode;
    external?: boolean;
  }[] = [
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
      key: "directions",
      label: "Directions",
      href: address ? directionsHref(address) : null,
      missing: "No address",
      icon: <DirectionsIcon />,
      external: true,
    },
  ];
  return (
    <ul aria-label={`Contact ${job.clientName}`} className="mt-4 grid grid-cols-3 gap-2">
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

/** Orçamento e fatura ligados ao serviço. */
function Paperwork({ job }: { job: Job }) {
  const links: { key: string; label: string; href: string; icon: ReactNode }[] = [];
  if (job.estimateId) {
    links.push({
      key: "estimate",
      label: "Estimate",
      href: `/estimates/${encodeURIComponent(job.estimateId)}`,
      icon: <EstimateIcon />,
    });
  }
  if (job.invoiceId) {
    links.push({
      key: "invoice",
      label: "Invoice",
      href: `/invoices/${encodeURIComponent(job.invoiceId)}`,
      icon: <InvoiceIcon />,
    });
  }
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-ink">Estimate &amp; invoice</h2>
      {links.length === 0 ? (
        <p className="mt-1.5 text-[15px] text-slate-500">
          {job.status === "done"
            ? "No invoice yet. Create one from the button above."
            : "None linked yet. When the job is done, you can bill it in one tap."}
        </p>
      ) : (
        <ul className="mt-2 grid gap-2">
          {links.map((link) => (
            <li key={link.key}>
              <GlassButton href={link.href} variant="secondary" icon={link.icon} fullWidth>
                Open {link.label.toLowerCase()}
              </GlassButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function JobPage({ params }: JobPageProps) {
  // Sempre na hora do request (dados do dono).
  await connection();
  const { id } = await params;
  // No modo "ver como" do admin, o serviço da conta vista (só leitura: nada muda).
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/schedule/${id}`)}`);
  const readOnly = viewer.viewingAs !== null;

  const data = await loadJob(viewer.ownerId, id);
  if (!data) notFound();
  const { job, team, contact, timeZone, today } = data;
  const day = job.startAt ? dateKeyOf(new Date(job.startAt), timeZone) : null;
  const address = job.address ?? contact?.address ?? null;

  // Chave com o que a ficha salva: depois de salvar, os controles recomeçam com os dados novos.
  const key = [
    job.status,
    job.startAt,
    job.endAt,
    job.title,
    job.description,
    job.address,
    job.valueCents,
    job.invoiceId,
    job.assigneeIds.join(","),
  ].join("|");

  return (
    <div>
      <GlassButton
        href={scheduleHref({ view: null, date: day, team: null })}
        variant="ghost"
        size="sm"
        className="-ml-2 max-sm:min-h-11"
      >
        <span aria-hidden="true">‹</span> Schedule
      </GlassButton>

      <div className="mt-3 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-8">
        <GlassCard as="section" aria-labelledby="job-title">
          <JobHero key={key} job={job} timeZone={timeZone} today={today} readOnly={readOnly}>
            <QuickActions job={job} contact={contact} />
          </JobHero>
        </GlassCard>

        <div className="grid gap-4">
          <GlassCard as="section" aria-label="Job details">
            <dl className="grid gap-3 text-[15px] leading-6">
              <div>
                <dt className="text-[13px] font-medium text-slate-500">Address</dt>
                <dd className="break-words text-ink">
                  {address ?? <span className="text-slate-500">Not added</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-slate-500">Value</dt>
                <dd className="font-semibold text-ink tabular-nums">
                  {job.valueCents !== null ? (
                    formatCents(job.valueCents)
                  ) : (
                    <span className="font-normal text-slate-500">Not set</span>
                  )}
                </dd>
              </div>
              {job.description.trim() && (
                <div>
                  <dt className="text-[13px] font-medium text-slate-500">Details</dt>
                  <dd className="break-words whitespace-pre-line text-ink">{job.description}</dd>
                </div>
              )}
            </dl>
          </GlassCard>

          <GlassCard as="section" aria-label="Team">
            <AssigneesCard key={key} job={job} team={team} readOnly={readOnly} />
          </GlassCard>

          <GlassCard as="section" aria-label="Notes">
            <JobNotes key={job.notes} job={job} readOnly={readOnly} />
          </GlassCard>

          <GlassCard as="section" aria-label="Estimate and invoice">
            <Paperwork job={job} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
