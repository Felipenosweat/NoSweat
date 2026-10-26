"use client";

import {
  ConvertEstimateResponse,
  CreateEstimateRequest,
  EstimateResponse,
  SendDocumentResponse,
  UpdateEstimateRequest,
  type DocumentParty,
  type Estimate,
} from "@nosweat/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { PageHeader } from "@/components/DashboardUi";
import { LocalTime } from "@/components/LocalTime";
import { GlassButton, GlassCard, GlassSheet, cx, focusRing } from "@/components/glass";
import {
  ESTIMATE_STATUS_LABELS,
  bpsToPercentInput,
  estimateItemsEditable,
  estimateLabel,
  formatDateOnly,
  parsePercentToBps,
} from "@/lib/office";
import {
  ErrorNote,
  OfficeApiError,
  estimateUrl,
  officeApi,
  toOfficeError,
} from "../office/_ui/api";
import { ClientPicker, type PickedClient } from "../office/_ui/ClientPicker";
import { DocumentPaper } from "../office/_ui/DocumentPaper";
import {
  draftTotals,
  formFromDocument,
  formSignature,
  toLineItems,
  validateForm,
  type DocumentForm,
  type FormProblems,
} from "../office/_ui/draft";
import { CardHeading, SaveBar, useUnsavedWarning } from "../office/_ui/editor";
import { LineItemsEditor, LineItemsView, TotalsPanel } from "../office/_ui/LineItemsEditor";
import { PrintStyles } from "../office/_ui/PrintStyles";
import { SendSheet } from "../office/_ui/SendSheet";
import {
  ConvertIcon,
  EstimateBadge,
  OpenIcon,
  PrintIcon,
  SendIcon,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
} from "../office/_ui/ui";
import { EstimateMenu } from "./EstimateMenu";

// Editor do orçamento (novo e existente). Salvar é explícito: a barra "Unsaved changes" aparece
// quando algo mudou, e "Send" salva antes de gerar o link. Os totais na tela usam o mesmo
// `computeTotals` do servidor (que recalcula ao salvar). Depois de criado, o endereço muda para
// /estimates/<id> sem recarregar (history.replaceState), para a folha "Send" continuar aberta.

export type EstimateEditorProps = {
  /** null = orçamento novo. */
  estimate: Estimate | null;
  /** Cliente já escolhido (link "New estimate" da ficha do cliente, ou o do orçamento). */
  initialClient: PickedClient | null;
  /** Dados do cliente para a impressão (endereço etc.). */
  party: DocumentParty | null;
  /** Padrões das configurações para um orçamento novo. */
  defaults: { taxRateBps: number; validUntil: string | null };
  company: {
    companyName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  terms: string;
  today: string;
  readOnly: boolean;
};

function formFromEstimate(estimate: Estimate): DocumentForm {
  return formFromDocument({
    title: estimate.title,
    items: estimate.items,
    taxRateBps: estimate.taxRateBps,
    discountCents: estimate.discountCents,
    message: estimate.message,
    date: estimate.validUntil,
  });
}

function emptyForm(defaults: EstimateEditorProps["defaults"]): DocumentForm {
  return {
    title: "",
    lines: [],
    taxRate: bpsToPercentInput(defaults.taxRateBps),
    discount: "",
    message: "",
    date: defaults.validUntil ?? "",
  };
}

type Busy = "save" | "send" | "convert" | null;

/** Erro de validação local no mesmo formato dos erros da API. */
function validationError(message: string | undefined): OfficeApiError {
  return new OfficeApiError(
    "validation_error",
    message ?? "Please check the estimate and try again.",
    400,
  );
}

export function EstimateEditor({
  estimate,
  initialClient,
  party,
  defaults,
  company,
  terms,
  today,
  readOnly,
}: EstimateEditorProps) {
  const router = useRouter();
  const ids = useId();
  const [doc, setDoc] = useState<Estimate | null>(estimate);
  const [client, setClient] = useState<PickedClient | null>(initialClient);
  const [form, setForm] = useState<DocumentForm>(() =>
    estimate ? formFromEstimate(estimate) : emptyForm(defaults),
  );
  const [baseline, setBaseline] = useState(() => formSignature(form));
  const [problems, setProblems] = useState<FormProblems | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [createJob, setCreateJob] = useState(true);
  const [createInvoice, setCreateInvoice] = useState(true);
  const [convertError, setConvertError] = useState<OfficeApiError | null>(null);
  const [jobCreated, setJobCreated] = useState(false);

  // O servidor mandou uma versão nova (ex.: "Mark approved" no menu ⋯ + router.refresh()).
  const [seenUpdatedAt, setSeenUpdatedAt] = useState(estimate?.updatedAt ?? null);
  if (estimate && estimate.updatedAt !== seenUpdatedAt) {
    setSeenUpdatedAt(estimate.updatedAt);
    const next = formFromEstimate(estimate);
    setDoc(estimate);
    setForm(next);
    setBaseline(formSignature(next));
  }

  const signature = formSignature(form);
  const dirty = signature !== baseline;
  const editable = !readOnly && (doc === null || estimateItemsEditable(doc.status));
  useUnsavedWarning(
    editable && (dirty || (doc === null && client !== null && form.lines.length > 0)),
  );

  const taxRateBps = parsePercentToBps(form.taxRate) ?? 0;
  const totals = draftTotals(form.lines, form.taxRate, form.discount);
  const lineErrors = problems?.lines ?? {};

  function update(patch: Partial<DocumentForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  /** Guarda a versão do servidor sem atrapalhar quem está digitando. */
  function adopt(saved: Estimate) {
    setDoc(saved);
    const next = formFromEstimate(saved);
    const nextSignature = formSignature(next);
    setBaseline(nextSignature);
    if (nextSignature !== signature) setForm(next);
  }

  function focusFirstProblem() {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-estimate-editor="${ids}"] [aria-invalid="true"]`)
        ?.focus();
    });
  }

  async function save(): Promise<Estimate | null> {
    setError(null);
    if (!doc && !client) {
      setClientError("Choose a client.");
      focusFirstProblem();
      return null;
    }
    setClientError(null);
    const checked = validateForm(form);
    if (!checked.ok) {
      setProblems(checked.problems);
      focusFirstProblem();
      return null;
    }
    setProblems(null);
    const body = { ...checked.body, validUntil: form.date || null };
    try {
      if (!doc && client) {
        const parsed = CreateEstimateRequest.safeParse({ clientId: client.id, ...body });
        if (!parsed.success) {
          setError(validationError(parsed.error.issues[0]?.message));
          return null;
        }
        const result = await officeApi("/api/office/estimates", EstimateResponse, {
          method: "POST",
          body: parsed.data,
        });
        adopt(result.estimate);
        // Mesmo endereço de um orçamento salvo, sem recarregar a tela.
        window.history.replaceState(
          null,
          "",
          `/estimates/${encodeURIComponent(result.estimate.id)}`,
        );
        return result.estimate;
      }
      if (!doc) return null;
      const parsed = UpdateEstimateRequest.safeParse(body);
      if (!parsed.success) {
        setError(validationError(parsed.error.issues[0]?.message));
        return null;
      }
      const result = await officeApi(estimateUrl(doc.id), EstimateResponse, {
        method: "PATCH",
        body: parsed.data,
      });
      adopt(result.estimate);
      return result.estimate;
    } catch (err) {
      setError(toOfficeError(err));
      return null;
    }
  }

  async function onSave() {
    setBusy("save");
    await save();
    setBusy(null);
  }

  async function onSend() {
    setBusy("send");
    try {
      const saved = dirty || !doc ? await save() : doc;
      if (!saved) return;
      const result = await officeApi(estimateUrl(saved.id, "/send"), SendDocumentResponse, {
        method: "POST",
      });
      if (result.estimate) adopt(result.estimate);
      setShareUrl(result.url);
      setShareOpen(true);
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setBusy(null);
    }
  }

  async function onConvert() {
    if (!doc) return;
    setBusy("convert");
    setConvertError(null);
    try {
      const result = await officeApi(estimateUrl(doc.id, "/convert"), ConvertEstimateResponse, {
        method: "POST",
        body: { createJob: createJob && !doc.jobId, createInvoice },
      });
      adopt(result.estimate);
      if (result.invoice) {
        router.push(`/invoices/${encodeURIComponent(result.invoice.id)}`);
        return;
      }
      setConvertOpen(false);
      if (result.job) setJobCreated(true);
    } catch (err) {
      setConvertError(toOfficeError(err));
    } finally {
      setBusy(null);
    }
  }

  function discard() {
    if (!doc) return;
    const next = formFromEstimate(doc);
    setForm(next);
    setBaseline(formSignature(next));
    setProblems(null);
    setError(null);
  }

  const status = doc?.status ?? "draft";
  const title = doc ? estimateLabel(doc.number) : "New estimate";
  const sendTarget =
    client ?? (doc ? { id: doc.clientId, name: doc.clientName, phone: null, email: null } : null);
  const blocked = dirty ? "Save your changes first." : null;

  // Uma ação azul por vez: com mudanças sem salvar, o azul é o "Save" da barra de baixo.
  const sendable = !readOnly && (status === "draft" || status === "sent" || status === "expired");
  const primaryAction = readOnly ? null : status === "approved" ? (
    <GlassButton
      variant="primary"
      icon={<ConvertIcon />}
      onClick={() => {
        setConvertError(null);
        setCreateJob(!doc?.jobId);
        setConvertOpen(true);
      }}
    >
      Create job or invoice
    </GlassButton>
  ) : sendable ? (
    <GlassButton
      variant={dirty ? "secondary" : "primary"}
      icon={<SendIcon />}
      onClick={() => void onSend()}
      loading={busy === "send"}
      disabled={busy !== null && busy !== "send"}
    >
      {status === "draft" ? "Send estimate" : "Send again"}
    </GlassButton>
  ) : null;

  const valid = toLineItems(form.lines).items;

  return (
    <div data-estimate-editor={ids}>
      <PrintStyles />
      <PageHeader
        back={
          <GlassButton href="/estimates" variant="ghost" size="sm" className="-ml-2">
            <span aria-hidden="true">‹</span> Estimates
          </GlassButton>
        }
        title={title}
        badge={doc ? <EstimateBadge status={status} /> : undefined}
        description={
          doc ? (
            <>
              For{" "}
              <Link
                href={`/clients/${encodeURIComponent(doc.clientId)}`}
                className={`font-semibold text-ink underline-offset-4 hover:underline ${focusRing}`}
              >
                {doc.clientName}
              </Link>
            </>
          ) : (
            "Pick a client, add what you'll do, and send them the link."
          )
        }
        actions={
          <>
            {primaryAction}
            {doc && (
              <EstimateMenu
                context="detail"
                readOnly={readOnly}
                triggerVariant="secondary"
                blockedReason={blocked}
                estimate={{
                  id: doc.id,
                  number: doc.number,
                  clientName: doc.clientName,
                  status: doc.status,
                  publicToken: doc.publicToken,
                }}
                extraItems={[
                  {
                    label: "Print / Save as PDF",
                    icon: <PrintIcon />,
                    onSelect: () => window.print(),
                  },
                  {
                    type: "link",
                    label: "Open client",
                    href: `/clients/${encodeURIComponent(doc.clientId)}`,
                    icon: <OpenIcon />,
                    key: "client",
                  },
                ]}
              />
            )}
          </>
        }
      />

      {error && <ErrorNote error={error} className="mt-6" />}

      <div className="mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 print:hidden">
        {/* ---------- coluna principal ---------- */}
        <div className="grid min-w-0 gap-4">
          {!doc && (
            <GlassCard as="section" aria-labelledby={`${ids}-client`}>
              <CardHeading id={`${ids}-client`}>Client</CardHeading>
              <ClientPicker
                value={client}
                onChange={(picked) => {
                  setClient(picked);
                  setClientError(null);
                }}
                invalid={Boolean(clientError)}
                errorId={clientError ? `${ids}-client-error` : undefined}
              />
              {clientError && (
                <p id={`${ids}-client-error`} className={fieldErrorClass}>
                  {clientError}
                </p>
              )}
            </GlassCard>
          )}

          <GlassCard as="section" aria-labelledby={`${ids}-items`}>
            <CardHeading id={`${ids}-items`}>What you&rsquo;ll do</CardHeading>
            {editable ? (
              <>
                <label htmlFor={`${ids}-title`} className={labelClass}>
                  Title <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id={`${ids}-title`}
                  value={form.title}
                  onChange={(event) => update({ title: event.target.value })}
                  placeholder="Kitchen faucet replacement"
                  maxLength={160}
                  autoComplete="off"
                  className={`${fieldClass} mt-1.5 mb-5 h-11`}
                  aria-invalid={problems?.title ? true : undefined}
                />
                {problems?.title && (
                  <p className={`${fieldErrorClass} -mt-4 mb-5`}>{problems.title}</p>
                )}
                <LineItemsEditor
                  lines={form.lines}
                  onChange={(lines) => update({ lines })}
                  errors={lineErrors}
                  showTax={taxRateBps > 0}
                  itemsError={problems?.items}
                />
              </>
            ) : (
              <>
                {doc?.title && (
                  <p className="mb-2 text-[15px] font-semibold text-ink">{doc.title}</p>
                )}
                <LineItemsView lines={doc?.items ?? []} />
              </>
            )}
          </GlassCard>

          <GlassCard as="section" aria-labelledby={`${ids}-message`}>
            <CardHeading id={`${ids}-message`}>Message to customer</CardHeading>
            {editable ? (
              <>
                <label htmlFor={`${ids}-message-field`} className="sr-only">
                  Message to customer
                </label>
                <textarea
                  id={`${ids}-message-field`}
                  value={form.message}
                  onChange={(event) => update({ message: event.target.value })}
                  rows={4}
                  maxLength={4000}
                  placeholder="Thanks for having us out. Here's the price we talked about…"
                  className={`${fieldClass} resize-y py-2.5 leading-[1.55]`}
                  aria-invalid={problems?.message ? true : undefined}
                  aria-describedby={`${ids}-message-hint`}
                />
                {problems?.message ? (
                  <p className={fieldErrorClass}>{problems.message}</p>
                ) : (
                  <p id={`${ids}-message-hint`} className={hintClass}>
                    Shows at the top of the estimate. Your terms from{" "}
                    <Link
                      href="/office/settings"
                      className="font-semibold text-brand underline-offset-4 hover:underline"
                    >
                      Office settings
                    </Link>{" "}
                    show at the bottom.
                  </p>
                )}
              </>
            ) : (
              <p className="text-[15px] leading-[1.6] whitespace-pre-line text-slate-700">
                {doc?.message || <span className="text-slate-500">No message.</span>}
              </p>
            )}
          </GlassCard>
        </div>

        {/* ---------- lateral: situação, totais e validade ---------- */}
        <div className="grid min-w-0 gap-4 lg:sticky lg:top-6">
          <StatusCard estimate={doc} today={today} jobCreated={jobCreated} />

          <GlassCard as="section" aria-labelledby={`${ids}-totals`}>
            <CardHeading id={`${ids}-totals`}>Total</CardHeading>
            <TotalsPanel
              totals={editable ? totals : doc ? docTotals(doc) : totals}
              taxRate={form.taxRate}
              taxRateBps={editable ? taxRateBps : (doc?.taxRateBps ?? 0)}
              discount={form.discount}
              onTaxChange={editable ? (taxRate) => update({ taxRate }) : undefined}
              onDiscountChange={editable ? (discount) => update({ discount }) : undefined}
              taxError={problems?.taxRate}
              discountError={problems?.discount}
            />
          </GlassCard>

          <GlassCard as="section" aria-labelledby={`${ids}-valid`}>
            <CardHeading id={`${ids}-valid`}>Valid until</CardHeading>
            {editable ? (
              <>
                <label htmlFor={`${ids}-date`} className="sr-only">
                  Valid until
                </label>
                <input
                  id={`${ids}-date`}
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={(event) => update({ date: event.target.value })}
                  className={`${fieldClass} h-11`}
                />
                <p className={hintClass}>
                  {form.date ? "After this date the customer can't approve it." : "No end date."}
                </p>
              </>
            ) : (
              <p className="text-[15px] text-ink">
                {doc?.validUntil ? formatDateOnly(doc.validUntil, today) : "No end date"}
              </p>
            )}
          </GlassCard>
        </div>
      </div>

      {editable && (
        <SaveBar
          show={doc ? dirty : true}
          saving={busy === "save"}
          onSave={() => void onSave()}
          onDiscard={doc ? discard : undefined}
          label={doc ? "Save" : "Save draft"}
          message={doc ? "Unsaved changes" : "New estimate, not saved yet"}
        />
      )}

      {/* Só na impressão / PDF. */}
      <div className="office-print hidden">
        <DocumentPaper
          kind="estimate"
          number={doc?.number ?? 0}
          title={editable ? form.title.trim() : (doc?.title ?? "")}
          company={company}
          client={
            party ?? {
              name: sendTarget?.name ?? "",
              email: sendTarget?.email ?? null,
              phone: sendTarget?.phone ?? null,
              address: null,
            }
          }
          items={editable ? valid : (doc?.items ?? [])}
          taxRateBps={editable ? taxRateBps : (doc?.taxRateBps ?? 0)}
          totals={editable ? totals : doc ? docTotals(doc) : totals}
          message={editable ? form.message : (doc?.message ?? "")}
          facts={[
            {
              label: "Date",
              value: formatDateOnly((doc?.sentAt ?? doc?.createdAt ?? today).slice(0, 10)),
            },
            ...(form.date ? [{ label: "Valid until", value: formatDateOnly(form.date) }] : []),
          ]}
          notes={[{ title: "Terms", body: terms }]}
        />
      </div>

      {shareUrl && doc && sendTarget && (
        <SendSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          url={shareUrl}
          kind="estimate"
          number={doc.number}
          companyName={company.companyName}
          client={sendTarget}
          totalCents={doc.totalCents}
        />
      )}

      {doc && (
        <GlassSheet
          open={convertOpen}
          onClose={() => setConvertOpen(false)}
          dismissible={busy !== "convert"}
          title="What's next?"
          description={`${doc.clientName} said yes. Create the job, the invoice, or both — the items and prices come along.`}
          footer={
            <>
              <GlassButton
                variant="secondary"
                onClick={() => setConvertOpen(false)}
                disabled={busy === "convert"}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={() => void onConvert()}
                loading={busy === "convert"}
                disabled={!((createJob && !doc.jobId) || createInvoice)}
              >
                {busy === "convert" ? "Creating…" : "Create"}
              </GlassButton>
            </>
          }
        >
          <fieldset className="grid gap-2">
            <legend className="sr-only">Create</legend>
            <ConvertOption
              checked={createJob && !doc.jobId}
              disabled={Boolean(doc.jobId)}
              onChange={setCreateJob}
              title="Schedule a job"
              hint={
                doc.jobId ? "Already has a job." : "Shows up as unscheduled until you pick a time."
              }
            />
            <ConvertOption
              checked={createInvoice}
              onChange={setCreateInvoice}
              title="Create an invoice"
              hint="A draft invoice with the same items. Send it when the work is done."
            />
          </fieldset>
          {convertError && <ErrorNote error={convertError} className="mt-4" />}
        </GlassSheet>
      )}
    </div>
  );
}

function docTotals(doc: Estimate) {
  return {
    subtotalCents: doc.subtotalCents,
    discountCents: doc.discountCents,
    taxCents: doc.taxCents,
    totalCents: doc.totalCents,
  };
}

function ConvertOption({
  checked,
  disabled,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={cx(
        "glass glass-flat flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl px-4 py-3 has-disabled:cursor-not-allowed has-disabled:opacity-60",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-brand"
      />
      <span>
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="block text-[13px] leading-5 text-slate-600">{hint}</span>
      </span>
    </label>
  );
}

/** Onde o orçamento está e o que acontece agora. */
function StatusCard({
  estimate,
  today,
  jobCreated,
}: {
  estimate: Estimate | null;
  today: string;
  jobCreated: boolean;
}) {
  if (!estimate) {
    return (
      <GlassCard padding="sm">
        <p className="text-[15px] leading-[1.6] text-slate-600">
          Only you can see this until you send it.
        </p>
      </GlassCard>
    );
  }
  const status = estimate.status;
  const tone =
    status === "approved"
      ? "bg-emerald-50/85 text-emerald-900"
      : status === "declined"
        ? "bg-red-50/85 text-red-900"
        : status === "sent"
          ? "bg-blue-50/85 text-[#0b2a5c]"
          : "";
  return (
    <div className={cx("glass-edge rounded-2xl p-4", tone || "glass")}>
      <p className="text-[13px] font-semibold tracking-wide uppercase opacity-80">
        {ESTIMATE_STATUS_LABELS[status]}
      </p>
      <div className="mt-1 text-[15px] leading-[1.6]">
        {status === "draft" && <p>Only you can see this until you send it.</p>}
        {status === "sent" && (
          <p>
            Sent {estimate.sentAt ? <LocalTime iso={estimate.sentAt} /> : null}. Waiting for{" "}
            {estimate.clientName} to approve.
          </p>
        )}
        {status === "expired" && (
          <p>
            Expired{estimate.validUntil ? ` on ${formatDateOnly(estimate.validUntil, today)}` : ""}.
            Pick a new &ldquo;Valid until&rdquo; date and send it again.
          </p>
        )}
        {status === "approved" && (
          <>
            <p>
              Approved
              {estimate.approvedByName ? (
                <>
                  {" "}
                  by <strong className="font-semibold">{estimate.approvedByName}</strong>
                </>
              ) : null}
              {estimate.respondedAt ? (
                <>
                  {" "}
                  · <LocalTime iso={estimate.respondedAt} />
                </>
              ) : null}
            </p>
            {(estimate.jobId || jobCreated) && (
              <p className="mt-1">
                Job created.{" "}
                <Link
                  href="/schedule"
                  className={`font-semibold underline underline-offset-4 ${focusRing}`}
                >
                  Open schedule
                </Link>
              </p>
            )}
          </>
        )}
        {status === "declined" && (
          <p>
            {estimate.clientName} declined
            {estimate.respondedAt ? (
              <>
                {" "}
                · <LocalTime iso={estimate.respondedAt} />
              </>
            ) : null}
            .
          </p>
        )}
      </div>
    </div>
  );
}
