"use client";

import {
  ConvertEstimateResponse,
  CreateInvoiceRequest,
  InvoiceResponse,
  JobResponse,
  UpdateJobRequest,
  type Job,
  type JobStatus,
  type TeamMember,
} from "@nosweat/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ConfirmDialog,
  GlassButton,
  GlassMenu,
  GlassSheet,
  cx,
  focusRing,
  type GlassMenuItem,
} from "@/components/glass";
import { parseDollars } from "@/lib/clients";
import {
  ErrorNote,
  clientsApi,
  clientsApiNoContent,
  toClientsError,
  type ClientsApiError,
} from "../../clients/api";
import {
  CalendarIcon,
  OpenIcon,
  TrashIcon,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
} from "../../clients/ui";
import { AssigneePicker } from "../JobForm";
import { scheduleHref } from "../params";
import {
  addMinutesToTime,
  dateKeyOf,
  formatTimeRange,
  relativeDayLabel,
  timeValueOf,
  zonedToUtc,
} from "../time";
import { CancelIcon, EditIcon, InvoiceIcon, JobStatusBadge, RestoreIcon, TeamDot } from "../ui";

// Controles da ficha do serviço (/schedule/[id]). Cada um salva sozinho (PATCH/POST) e depois
// `router.refresh()`; a página passa uma `key` com os dados salvos, então o componente recomeça
// com os dados novos. `readOnly` (modo "ver como" do admin): mostra tudo sem deixar mudar nada.

function jobUrl(id: string): string {
  return `/api/office/jobs/${encodeURIComponent(id)}`;
}

/** PATCH /api/office/jobs/[id] com estado de envio e erro. */
function useJobPatch(jobId: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  async function save(body: UpdateJobRequest): Promise<boolean> {
    setPending(true);
    setError(null);
    try {
      await clientsApi(jobUrl(jobId), JobResponse, {
        method: "PATCH",
        body: UpdateJobRequest.parse(body),
      });
      router.refresh();
      return true;
    } catch (err) {
      setError(toClientsError(err));
      return false;
    } finally {
      setPending(false);
    }
  }

  return { save, pending, error, setError };
}

// ---------- cartão principal ----------

const STEPS: { status: JobStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

/** Posição do serviço nos 3 passos (-1 = ainda sem data). */
function stepIndex(status: JobStatus): number {
  if (status === "scheduled") return 0;
  if (status === "in_progress") return 1;
  if (status === "done") return 2;
  return -1;
}

/**
 * Topo da ficha: situação, título, quando, os 3 passos (Scheduled → In progress → Done), a próxima
 * ação (o único botão azul da tela) e o menu "⋯" (editar, remarcar, cancelar, apagar).
 * `children` = os atalhos de ligar/SMS/rota (feitos no servidor).
 */
export function JobHero({
  job,
  timeZone,
  today,
  readOnly,
  children,
}: {
  job: Job;
  timeZone: string;
  today: string;
  readOnly: boolean;
  children?: ReactNode;
}) {
  const router = useRouter();
  const { save, pending, error, setError } = useJobPatch(job.id);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [invoicing, setInvoicing] = useState(false);
  const [invoiceError, setInvoiceError] = useState<ClientsApiError | null>(null);
  const invoicingRef = useRef(false);

  const canceled = job.status === "canceled";
  const current = stepIndex(job.status);
  const day = job.startAt ? dateKeyOf(new Date(job.startAt), timeZone) : null;

  async function setStatus(status: JobStatus) {
    if (readOnly || status === job.status) return;
    // "Scheduled" sem data: primeiro escolher o horário.
    if (status === "scheduled" && !job.startAt) {
      setRescheduleOpen(true);
      return;
    }
    await save({ status });
  }

  async function createInvoice() {
    if (invoicingRef.current) return;
    invoicingRef.current = true;
    setInvoicing(true);
    setInvoiceError(null);
    // Serviço que veio de um orçamento: a fatura sai do orçamento (mesmos itens, imposto e
    // desconto), sem somar imposto de novo em cima do valor que já tem imposto.
    if (job.estimateId) {
      try {
        const result = await clientsApi(
          `/api/office/estimates/${encodeURIComponent(job.estimateId)}/convert`,
          ConvertEstimateResponse,
          { method: "POST", body: { createJob: false, createInvoice: true } },
        );
        if (result.invoice) {
          router.push(`/invoices/${encodeURIComponent(result.invoice.id)}`);
          return;
        }
      } catch (err) {
        const apiError = toClientsError(err);
        // 409 = o orçamento não está aprovado: cai na fatura de uma linha abaixo.
        if (apiError.status !== 409) {
          setInvoiceError(apiError);
          setInvoicing(false);
          invoicingRef.current = false;
          return;
        }
      }
    }
    // Uma linha com o título e o valor do serviço (o dono ajusta na fatura). O valor do serviço
    // já é o final (pode vir de um orçamento com imposto): a linha não recebe imposto.
    const parsed = CreateInvoiceRequest.safeParse({
      clientId: job.clientId,
      jobId: job.id,
      title: job.title,
      taxRateBps: 0,
      items: [
        {
          priceItemId: null,
          name: job.title.slice(0, 120),
          description: "",
          quantity: 1,
          unitPriceCents: job.valueCents ?? 0,
          taxable: false,
        },
      ],
    });
    if (!parsed.success) {
      setInvoiceError(toClientsError(null));
      setInvoicing(false);
      invoicingRef.current = false;
      return;
    }
    try {
      const result = await clientsApi("/api/office/invoices", InvoiceResponse, {
        method: "POST",
        body: parsed.data,
      });
      router.push(`/invoices/${encodeURIComponent(result.invoice.id)}`);
    } catch (err) {
      setInvoiceError(toClientsError(err));
      setInvoicing(false);
      invoicingRef.current = false;
    }
  }

  async function confirmAction() {
    if (!confirm) return;
    setConfirmPending(true);
    setConfirmError(null);
    try {
      if (confirm === "delete") {
        await clientsApiNoContent(jobUrl(job.id), { method: "DELETE" });
        router.push(scheduleHref({ view: null, date: day, team: null }));
        router.refresh();
        return;
      }
      await clientsApi(jobUrl(job.id), JobResponse, {
        method: "PATCH",
        body: { status: "canceled" },
      });
      setConfirm(null);
      router.refresh();
    } catch (err) {
      setConfirmError(toClientsError(err).message);
    } finally {
      setConfirmPending(false);
    }
  }

  // ---------- próxima ação ----------
  let next: ReactNode = null;
  if (!readOnly) {
    if (canceled) {
      next = (
        <GlassButton
          variant="primary"
          icon={<RestoreIcon />}
          loading={pending}
          onClick={() => void save({ status: job.startAt ? "scheduled" : "unscheduled" })}
          fullWidth
        >
          Restore job
        </GlassButton>
      );
    } else if (job.status === "unscheduled" || !job.startAt) {
      next = (
        <GlassButton
          variant="primary"
          icon={<CalendarIcon />}
          onClick={() => setRescheduleOpen(true)}
          fullWidth
        >
          Pick a time
        </GlassButton>
      );
    } else if (job.status === "scheduled") {
      next = (
        <GlassButton
          variant="primary"
          loading={pending}
          onClick={() => void save({ status: "in_progress" })}
          fullWidth
        >
          Start job
        </GlassButton>
      );
    } else if (job.status === "in_progress") {
      next = (
        <GlassButton
          variant="primary"
          loading={pending}
          onClick={() => void save({ status: "done" })}
          fullWidth
        >
          Mark as done
        </GlassButton>
      );
    } else if (job.status === "done" && !job.invoiceId) {
      next = (
        <GlassButton
          variant="primary"
          icon={<InvoiceIcon />}
          loading={invoicing}
          onClick={() => void createInvoice()}
          fullWidth
        >
          {invoicing ? "Creating invoice…" : "Create invoice"}
        </GlassButton>
      );
    }
  }
  if (job.status === "done" && job.invoiceId) {
    next = (
      <GlassButton
        href={`/invoices/${encodeURIComponent(job.invoiceId)}`}
        variant="primary"
        icon={<InvoiceIcon />}
        fullWidth
      >
        Open invoice
      </GlassButton>
    );
  }

  // ---------- menu ⋯ ----------
  const items: GlassMenuItem[] = [];
  if (!readOnly) {
    items.push(
      { label: "Edit details", icon: <EditIcon />, onSelect: () => setEditOpen(true) },
      {
        label: job.startAt ? "Reschedule" : "Pick a time",
        icon: <CalendarIcon />,
        onSelect: () => setRescheduleOpen(true),
      },
    );
  }
  items.push({
    type: "link",
    label: "Open client",
    href: `/clients/${encodeURIComponent(job.clientId)}`,
    icon: <OpenIcon />,
  });
  if (!readOnly) {
    items.push({ type: "separator", key: "danger" });
    if (!canceled) {
      items.push({
        label: "Cancel job",
        icon: <CancelIcon />,
        destructive: true,
        onSelect: () => {
          setConfirmError(null);
          setConfirm("cancel");
        },
      });
    }
    items.push({
      label: "Delete job",
      icon: <TrashIcon />,
      destructive: true,
      onSelect: () => {
        setConfirmError(null);
        setConfirm("delete");
      },
    });
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <JobStatusBadge status={job.status} />
        <GlassMenu items={items} label={`More actions for ${job.title}`} />
      </div>
      <h1
        id="job-title"
        className="mt-3 min-w-0 font-display text-2xl leading-tight font-bold tracking-[-0.02em] break-words text-ink"
      >
        {job.title}
      </h1>
      <p className="mt-1 text-[15px] text-slate-600">
        <span className="tabular-nums">Job #{job.number}</span> ·{" "}
        <Link
          href={`/clients/${encodeURIComponent(job.clientId)}`}
          className={`font-medium text-brand underline-offset-4 hover:underline ${focusRing}`}
        >
          {job.clientName}
        </Link>
      </p>

      {/* Quando. */}
      <div className="glass glass-flat mt-4 flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2.5">
        <CalendarIcon className="size-5 shrink-0 text-brand" />
        <p className="min-w-0 flex-1 text-[15px] leading-5">
          {job.startAt && day ? (
            <>
              <span className="block font-semibold text-ink">{relativeDayLabel(day, today)}</span>
              <span className="block text-slate-600 tabular-nums">
                {formatTimeRange(job.startAt, job.endAt, timeZone)}
              </span>
            </>
          ) : (
            <span className="font-semibold text-ink">No date yet</span>
          )}
        </p>
        {!readOnly && !canceled && job.startAt && (
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setRescheduleOpen(true)}
            className="max-sm:min-h-11"
          >
            Reschedule
          </GlassButton>
        )}
        {day && (
          <GlassButton
            href={scheduleHref({ view: "day", date: day, team: null })}
            variant="ghost"
            size="sm"
            className="max-sm:min-h-11"
          >
            See day
          </GlassButton>
        )}
      </div>

      {/* Passos. */}
      {canceled ? (
        <p className="glass-edge mt-4 rounded-2xl bg-slate-100/90 px-4 py-3 text-[15px] text-slate-700">
          This job was canceled. It stays here for your records.
        </p>
      ) : (
        <ol aria-label="Job progress" className="mt-4 grid grid-cols-3 gap-1.5">
          {STEPS.map((step, index) => {
            const done = index <= current;
            const isCurrent = index === current;
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className={cx(
                    "grid size-6 place-items-center rounded-full text-[12px] font-bold",
                    done ? "bg-brand text-white" : "border-2 border-slate-300 text-slate-400",
                  )}
                >
                  {done ? "✓" : index + 1}
                </span>
                <span
                  className={cx(
                    "text-[13px] leading-4 font-semibold",
                    done ? "text-ink" : "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </>
            );
            const tile = cx(
              "flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2",
              isCurrent ? "glass-pill" : "glass glass-flat",
            );
            return (
              <li key={step.status} aria-current={isCurrent ? "step" : undefined}>
                {readOnly ? (
                  <span className={tile}>{content}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setStatus(step.status)}
                    disabled={pending || isCurrent}
                    aria-label={`${step.label}${isCurrent ? " (current)" : ": set the job to this step"}`}
                    className={cx(tile, "glass-interactive disabled:cursor-default", focusRing)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {next && <div className="mt-4">{next}</div>}
      {error && <ErrorNote error={error} className="mt-3" />}
      {invoiceError && <ErrorNote error={invoiceError} className="mt-3" />}

      {children}

      {!readOnly && (
        <>
          <RescheduleSheet
            open={rescheduleOpen}
            onClose={() => {
              setRescheduleOpen(false);
              setError(null);
            }}
            job={job}
            timeZone={timeZone}
            today={today}
          />
          <EditDetailsSheet open={editOpen} onClose={() => setEditOpen(false)} job={job} />
          <ConfirmDialog
            open={confirm !== null}
            title={confirm === "delete" ? `Delete “${job.title}”?` : `Cancel “${job.title}”?`}
            confirmLabel={confirm === "delete" ? "Delete job" : "Cancel job"}
            pendingLabel={confirm === "delete" ? "Deleting…" : "Canceling…"}
            cancelLabel={confirm === "cancel" ? "Keep job" : "Cancel"}
            pending={confirmPending}
            error={confirmError}
            onConfirm={() => void confirmAction()}
            onCancel={() => setConfirm(null)}
          >
            {confirm === "delete"
              ? "The job is erased from your schedule. Estimates and invoices stay. This can’t be undone."
              : "It leaves the calendar but stays in your records. You can restore it later."}
          </ConfirmDialog>
        </>
      )}
    </>
  );
}

// ---------- remarcar ----------

function RescheduleSheet({
  open,
  onClose,
  job,
  timeZone,
  today,
}: {
  open: boolean;
  onClose: () => void;
  job: Job;
  timeZone: string;
  today: string;
}) {
  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title={job.startAt ? "Reschedule" : "Pick a time"}
      description="Times are in your business’s time zone."
      size="md"
    >
      {open && <RescheduleForm job={job} timeZone={timeZone} today={today} onDone={onClose} />}
    </GlassSheet>
  );
}

function RescheduleForm({
  job,
  timeZone,
  today,
  onDone,
}: {
  job: Job;
  timeZone: string;
  today: string;
  onDone: () => void;
}) {
  const ids = useId();
  const { save, pending, error } = useJobPatch(job.id);
  const startAt = job.startAt ? new Date(job.startAt) : null;
  const [date, setDate] = useState(startAt ? dateKeyOf(startAt, timeZone) : today);
  const [start, setStart] = useState(startAt ? timeValueOf(startAt, timeZone) : "09:00");
  const [end, setEnd] = useState(
    job.endAt
      ? timeValueOf(new Date(job.endAt), timeZone)
      : addMinutesToTime(startAt ? timeValueOf(startAt, timeZone) : "09:00", 60),
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  function changeStart(next: string) {
    const [sh = 0, sm = 0] = start.split(":").map(Number);
    const [eh = 0, em = 0] = end.split(":").map(Number);
    const duration = Math.max(15, eh * 60 + em - (sh * 60 + sm));
    setStart(next);
    if (next) setEnd(addMinutesToTime(next, duration));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || !start || !end) {
      setFieldError("Pick a day and a start time.");
      return;
    }
    if (end <= start) {
      setFieldError("The end time must be after the start time.");
      return;
    }
    setFieldError(null);
    const ok = await save({
      startAt: zonedToUtc(date, start, timeZone).toISOString(),
      endAt: zonedToUtc(date, end, timeZone).toISOString(),
      // Sem data → agendado; em andamento ou feito continua como está.
      ...(job.status === "unscheduled" ? { status: "scheduled" as const } : {}),
    });
    if (ok) onDone();
  }

  async function unschedule() {
    const ok = await save({ startAt: null, endAt: null, status: "unscheduled" });
    if (ok) onDone();
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <fieldset disabled={pending} className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor={`${ids}-date`} className={labelClass}>
            Day
          </label>
          <input
            id={`${ids}-date`}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={`${fieldClass} mt-1.5 h-11`}
            aria-invalid={fieldError ? true : undefined}
          />
        </div>
        <div>
          <label htmlFor={`${ids}-start`} className={labelClass}>
            Start
          </label>
          <input
            id={`${ids}-start`}
            type="time"
            step={900}
            value={start}
            onChange={(event) => changeStart(event.target.value)}
            className={`${fieldClass} mt-1.5 h-11`}
            aria-invalid={fieldError ? true : undefined}
          />
        </div>
        <div>
          <label htmlFor={`${ids}-end`} className={labelClass}>
            End
          </label>
          <input
            id={`${ids}-end`}
            type="time"
            step={900}
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className={`${fieldClass} mt-1.5 h-11`}
            aria-invalid={fieldError ? true : undefined}
          />
        </div>
      </fieldset>
      {fieldError && (
        <p role="alert" className={fieldErrorClass}>
          {fieldError}
        </p>
      )}
      {error && <ErrorNote error={error} className="mt-4" />}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        {job.startAt && job.status !== "done" && (
          <GlassButton
            variant="ghost"
            onClick={() => void unschedule()}
            disabled={pending}
            className="sm:mr-auto"
          >
            Remove from calendar
          </GlassButton>
        )}
        <GlassButton type="submit" variant="primary" loading={pending}>
          {pending ? "Saving…" : "Save time"}
        </GlassButton>
      </div>
    </form>
  );
}

// ---------- editar dados ----------

function EditDetailsSheet({
  open,
  onClose,
  job,
}: {
  open: boolean;
  onClose: () => void;
  job: Job;
}) {
  return (
    <GlassSheet open={open} onClose={onClose} title="Edit job" size="md">
      {open && <EditDetailsForm job={job} onDone={onClose} />}
    </GlassSheet>
  );
}

function EditDetailsForm({ job, onDone }: { job: Job; onDone: () => void }) {
  const ids = useId();
  const { save, pending, error } = useJobPatch(job.id);
  const [title, setTitle] = useState(job.title);
  const [address, setAddress] = useState(job.address ?? "");
  const [description, setDescription] = useState(job.description);
  const [value, setValue] = useState(
    job.valueCents !== null ? (job.valueCents / 100).toFixed(2) : "",
  );
  const [errors, setErrors] = useState<{ title?: string; value?: string }>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: { title?: string; value?: string } = {};
    if (!title.trim()) next.title = "Give the job a title.";
    const cents = parseDollars(value);
    if (cents === undefined) next.value = "Enter an amount like 150 or 150.00.";
    setErrors(next);
    if (next.title || next.value || cents === undefined) return;
    const ok = await save({
      title: title.trim(),
      address: address.trim() || null,
      description: description.trim(),
      valueCents: cents,
    });
    if (ok) onDone();
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <fieldset disabled={pending} className="grid gap-5">
        <div>
          <label htmlFor={`${ids}-title`} className={labelClass}>
            Title
          </label>
          <input
            id={`${ids}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
            autoComplete="off"
            className={`${fieldClass} mt-1.5 h-11`}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? `${ids}-title-error` : undefined}
          />
          {errors.title && (
            <p id={`${ids}-title-error`} className={fieldErrorClass}>
              {errors.title}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${ids}-address`} className={labelClass}>
            Address
          </label>
          <input
            id={`${ids}-address`}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            maxLength={300}
            autoComplete="off"
            className={`${fieldClass} mt-1.5 h-11`}
          />
        </div>
        <div>
          <label htmlFor={`${ids}-description`} className={labelClass}>
            Details
          </label>
          <textarea
            id={`${ids}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={4000}
            rows={3}
            placeholder="What the job is about"
            className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
          />
        </div>
        <div className="max-w-[12rem]">
          <label htmlFor={`${ids}-value`} className={labelClass}>
            Value
          </label>
          <div className="relative mt-1.5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500"
            >
              $
            </span>
            <input
              id={`${ids}-value`}
              inputMode="decimal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
              placeholder="0.00"
              maxLength={12}
              className={`${fieldClass} h-11 pl-7 tabular-nums`}
              aria-invalid={errors.value ? true : undefined}
              aria-describedby={errors.value ? `${ids}-value-error` : undefined}
            />
          </div>
          {errors.value && (
            <p id={`${ids}-value-error`} className={fieldErrorClass}>
              {errors.value}
            </p>
          )}
        </div>
      </fieldset>
      {error && <ErrorNote error={error} className="mt-4" />}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <GlassButton variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" variant="primary" loading={pending}>
          {pending ? "Saving…" : "Save changes"}
        </GlassButton>
      </div>
    </form>
  );
}

// ---------- quem vai ----------

/** Responsáveis: lista com as cores e "Change" (folha com as cápsulas de marcar). */
export function AssigneesCard({
  job,
  team,
  readOnly,
}: {
  job: Job;
  /** Todos os membros (os inativos só aparecem se já estiverem no serviço). */
  team: TeamMember[];
  readOnly: boolean;
}) {
  const { save, pending, error } = useJobPatch(job.id);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string[]>(job.assigneeIds);
  const assigned = job.assigneeIds
    .map((id) => team.find((member) => member.id === id))
    .filter((member): member is TeamMember => Boolean(member));
  const choices = team.filter((member) => member.active || job.assigneeIds.includes(member.id));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Who&rsquo;s going</h2>
        {!readOnly && choices.length > 0 && (
          <GlassButton
            variant="ghost"
            size="sm"
            className="max-sm:min-h-11"
            onClick={() => {
              setValue(job.assigneeIds);
              setOpen(true);
            }}
          >
            Change
          </GlassButton>
        )}
      </div>
      {assigned.length === 0 ? (
        <p className="mt-1.5 text-[15px] text-slate-500">No one assigned yet.</p>
      ) : (
        <ul className="mt-2 grid gap-1.5">
          {assigned.map((member) => (
            <li key={member.id} className="flex min-h-9 items-center gap-2.5 text-[15px] text-ink">
              <TeamDot color={member.color} />
              <span className="font-medium">{member.name}</span>
              {member.role && <span className="text-[13px] text-slate-500">{member.role}</span>}
            </li>
          ))}
        </ul>
      )}
      {team.length === 0 && !readOnly && (
        <p className={hintClass}>
          <Link
            href="/team"
            className={`font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
          >
            Add your team
          </Link>{" "}
          to assign jobs and color your calendar.
        </p>
      )}

      {!readOnly && (
        <GlassSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Who’s going?"
          size="md"
          dismissible={!pending}
          footer={
            <>
              <GlassButton variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                loading={pending}
                onClick={() =>
                  void save({ assigneeIds: value }).then((ok) => {
                    if (ok) setOpen(false);
                  })
                }
              >
                Save
              </GlassButton>
            </>
          }
        >
          <AssigneePicker team={choices} value={value} onChange={setValue} legend="Tap to choose" />
          {error && <ErrorNote error={error} className="mt-4" />}
        </GlassSheet>
      )}
    </div>
  );
}

// ---------- notas ----------

export function JobNotes({ job, readOnly }: { job: Job; readOnly: boolean }) {
  const ids = useId();
  const { save, pending, error } = useJobPatch(job.id);
  const [value, setValue] = useState(job.notes);
  const changed = value.trim() !== job.notes.trim();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changed) return;
    await save({ notes: value.trim() });
  }

  return (
    <form onSubmit={(event) => void submit(event)} aria-labelledby={`${ids}-label`}>
      <label
        id={`${ids}-label`}
        htmlFor={`${ids}-notes`}
        className="text-[15px] font-semibold text-ink"
      >
        Notes for the team
      </label>
      <p id={`${ids}-hint`} className={hintClass}>
        Gate code, parts to bring, what was done. Your client never sees this.
      </p>
      <textarea
        id={`${ids}-notes`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={pending}
        readOnly={readOnly}
        rows={4}
        maxLength={4000}
        aria-describedby={`${ids}-hint`}
        className={`${fieldClass} mt-2 resize-y py-2.5 leading-[1.55]`}
      />
      {error && <ErrorNote error={error} className="mt-3" />}
      {!readOnly && changed && (
        <div className="mt-3 flex justify-end gap-2">
          <GlassButton variant="ghost" onClick={() => setValue(job.notes)} disabled={pending}>
            Undo
          </GlassButton>
          <GlassButton type="submit" variant="secondary" loading={pending}>
            Save notes
          </GlassButton>
        </div>
      )}
    </form>
  );
}
