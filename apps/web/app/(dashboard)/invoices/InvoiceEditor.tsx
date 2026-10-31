"use client";

import {
  CreateInvoiceRequest,
  InvoiceResponse,
  SendDocumentResponse,
  UpdateInvoiceRequest,
  type DocumentParty,
  type Invoice,
} from "@nosweat/schema";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { BackLink, PageHeader } from "@/components/DashboardUi";
import { LocalTime } from "@/components/LocalTime";
import { GlassButton, GlassCard, Notice, cx, focusRing } from "@/components/glass";
import {
  INVOICE_STATUS_LABELS,
  bpsToPercentInput,
  formatCents,
  formatDateOnly,
  invoiceItemsEditable,
  invoiceLabel,
  isUnpaidStatus,
  parsePercentToBps,
} from "@/lib/office";
import { ErrorNote, OfficeApiError, invoiceUrl, officeApi, toOfficeError } from "../office/_ui/api";
import { ClientPicker, type PickedClient } from "../office/_ui/ClientPicker";
import { DocumentPaper } from "../office/_ui/DocumentPaper";
import {
  draftTotals,
  formFromDocument,
  formSignature,
  toLineItems,
  unpricedWarning,
  validateForm,
  type DocumentForm,
  type FormProblems,
} from "../office/_ui/draft";
import {
  CardHeading,
  DraftBar,
  MoreOptions,
  SaveBar,
  optionsSummary,
  useUnsavedWarning,
} from "../office/_ui/editor";
import { LineItemsEditor, LineItemsView, TotalsPanel } from "../office/_ui/LineItemsEditor";
import { PrintStyles } from "../office/_ui/PrintStyles";
import { SendSheet } from "../office/_ui/SendSheet";
import {
  CashIcon,
  InvoiceBadge,
  OpenIcon,
  PrintIcon,
  SendIcon,
  TotalRow,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
} from "../office/_ui/ui";
import { InvoiceMenu } from "./InvoiceMenu";
import { PaymentsList, RecordPaymentSheet } from "./RecordPayment";

// Fatura (nova e existente): itens (editáveis só sem pagamento), vencimento, mensagem, "Send"
// com o link, "Record payment", lista de pagamentos e impressão / PDF. Salvar é explícito, como no
// orçamento: no rascunho a barra de baixo tem "Send invoice" (azul) e "Save draft", e linha sem
// preço ($0) não vai para o cliente. Título, mensagem e vencimento ficam em "More options".
// Pagamentos e "Void" relêem a página (router.refresh) e o editor pega a versão nova.

export type InvoiceEditorProps = {
  /** null = fatura nova. */
  invoice: Invoice | null;
  initialClient: PickedClient | null;
  party: DocumentParty | null;
  /** Só na fatura nova (?jobId=). */
  jobId: string | null;
  defaults: { taxRateBps: number; dueOn: string | null };
  company: {
    companyName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  paymentInstructions: string;
  today: string;
  /** Fuso da empresa. A fatura hoje só mostra datas sem hora (emissão, vencimento). */
  timeZone?: string;
  readOnly: boolean;
};

function formFromInvoice(invoice: Invoice): DocumentForm {
  return formFromDocument({
    title: invoice.title,
    items: invoice.items,
    taxRateBps: invoice.taxRateBps,
    discountCents: invoice.discountCents,
    message: invoice.message,
    date: invoice.dueOn,
  });
}

function validationError(message: string | undefined): OfficeApiError {
  return new OfficeApiError(
    "validation_error",
    message ?? "Please check the invoice and try again.",
    400,
  );
}

type Busy = "save" | "send" | null;

export function InvoiceEditor({
  invoice,
  initialClient,
  party,
  jobId,
  defaults,
  company,
  paymentInstructions,
  today,
  readOnly,
}: InvoiceEditorProps) {
  const ids = useId();
  const [doc, setDoc] = useState<Invoice | null>(invoice);
  const [client, setClient] = useState<PickedClient | null>(initialClient);
  const [form, setForm] = useState<DocumentForm>(() =>
    invoice
      ? formFromInvoice(invoice)
      : {
          title: "",
          lines: [],
          taxRate: bpsToPercentInput(defaults.taxRateBps),
          discount: "",
          message: "",
          date: defaults.dueOn ?? "",
        },
  );
  const [baseline, setBaseline] = useState(() => formSignature(form));
  const [problems, setProblems] = useState<FormProblems | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentKey, setPaymentKey] = useState(0);
  // "More options" (título, mensagem, vencimento) aberto.
  const [moreOpen, setMoreOpen] = useState(false);
  // O dono tentou mandar/salvar com linha sem preço: o aviso fica até todas terem preço.
  const [priceCheck, setPriceCheck] = useState(false);
  // Trava contra dois pedidos ao mesmo tempo (ex.: "Send" e "Save" juntos criariam 2 faturas).
  const savingRef = useRef(false);

  const signature = formSignature(form);
  const dirty = signature !== baseline;

  // O servidor mandou uma versão nova (pagamento, "Void" ou router.refresh). Com mudanças sem
  // salvar, o que foi digitado fica; senão a tela mostra a versão nova.
  const [seenUpdatedAt, setSeenUpdatedAt] = useState(invoice?.updatedAt ?? null);
  if (invoice && invoice.updatedAt !== seenUpdatedAt) {
    setSeenUpdatedAt(invoice.updatedAt);
    setDoc(invoice);
    const next = formFromInvoice(invoice);
    if (!dirty || !invoiceItemsEditable(invoice)) {
      setForm(next);
      setBaseline(formSignature(next));
    } else {
      setBaseline(formSignature(next));
    }
  }

  const status = doc?.status ?? "draft";
  const detailsEditable = !readOnly && (doc === null || (status !== "void" && status !== "paid"));
  const itemsEditable = detailsEditable && (doc === null || invoiceItemsEditable(doc));
  useUnsavedWarning(
    detailsEditable && (dirty || (doc === null && client !== null && form.lines.length > 0)),
  );

  const taxRateBps = itemsEditable
    ? (parsePercentToBps(form.taxRate) ?? 0)
    : (doc?.taxRateBps ?? 0);
  const totals = itemsEditable
    ? draftTotals(form.lines, form.taxRate, form.discount)
    : doc
      ? {
          subtotalCents: doc.subtotalCents,
          discountCents: doc.discountCents,
          taxCents: doc.taxCents,
          totalCents: doc.totalCents,
        }
      : draftTotals(form.lines, form.taxRate, form.discount);
  const paidCents = doc?.amountPaidCents ?? 0;
  const balanceCents = itemsEditable ? totals.totalCents - paidCents : (doc?.balanceCents ?? 0);
  const priceWarning = itemsEditable && priceCheck ? unpricedWarning(form.lines) : null;
  // Sem "How to pay" nas configurações, o cliente não vê como pagar.
  const missingPaymentInstructions = !paymentInstructions.trim();

  function update(patch: Partial<DocumentForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function adopt(saved: Invoice) {
    setDoc(saved);
    const next = formFromInvoice(saved);
    const nextSignature = formSignature(next);
    setBaseline(nextSignature);
    if (nextSignature !== signature) setForm(next);
  }

  function focusFirstProblem() {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-invoice-editor="${ids}"] [aria-invalid="true"]`)
        ?.focus();
    });
  }

  function focusFirstUnpriced() {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-invoice-editor="${ids}"] [data-unpriced]`)
        ?.focus();
    });
  }

  async function save(): Promise<Invoice | null> {
    if (savingRef.current) return null;
    savingRef.current = true;
    try {
      return await saveOnce();
    } finally {
      savingRef.current = false;
    }
  }

  async function saveOnce(): Promise<Invoice | null> {
    setError(null);
    if (!doc && !client) {
      setClientError("Choose a client.");
      focusFirstProblem();
      return null;
    }
    setClientError(null);
    const checked = validateForm(form);
    if (itemsEditable && !checked.ok) {
      setProblems(checked.problems);
      // Erro no título ou na mensagem: abre "More options" para o campo aparecer.
      if (checked.problems.title || checked.problems.message) setMoreOpen(true);
      focusFirstProblem();
      return null;
    }
    setProblems(null);
    // Com pagamento registrado, itens, imposto e desconto não vão (o servidor recusaria).
    const body = {
      ...(itemsEditable && checked.ok
        ? checked.body
        : { title: form.title.trim(), message: form.message.trim() }),
      dueOn: form.date || null,
    };
    try {
      if (!doc && client) {
        const parsed = CreateInvoiceRequest.safeParse({
          clientId: client.id,
          jobId: jobId ?? undefined,
          ...body,
        });
        if (!parsed.success) {
          setError(validationError(parsed.error.issues[0]?.message));
          return null;
        }
        const result = await officeApi("/api/office/invoices", InvoiceResponse, {
          method: "POST",
          body: parsed.data,
        });
        adopt(result.invoice);
        window.history.replaceState(null, "", `/invoices/${encodeURIComponent(result.invoice.id)}`);
        return result.invoice;
      }
      if (!doc) return null;
      const parsed = UpdateInvoiceRequest.safeParse(body);
      if (!parsed.success) {
        setError(validationError(parsed.error.issues[0]?.message));
        return null;
      }
      const result = await officeApi(invoiceUrl(doc.id), InvoiceResponse, {
        method: "PATCH",
        body: parsed.data,
      });
      adopt(result.invoice);
      return result.invoice;
    } catch (err) {
      setError(toOfficeError(err));
      return null;
    }
  }

  async function onSave() {
    if (busy !== null || savingRef.current) return;
    // Linha sem preço: o rascunho salva assim mesmo, só com o aviso.
    if (itemsEditable && unpricedWarning(form.lines)) setPriceCheck(true);
    setBusy("save");
    await save();
    setBusy(null);
  }

  async function onSend() {
    if (busy !== null || savingRef.current) return;
    // Fatura sem nenhuma linha não vai para o cliente (nem chega a ser salva).
    if (itemsEditable && form.lines.length === 0) {
      setError(validationError("Add at least one line first."));
      return;
    }
    // Linha sem preço ($0) não vai para o cliente: avisa e leva ao campo.
    if (itemsEditable && unpricedWarning(form.lines)) {
      setPriceCheck(true);
      focusFirstUnpriced();
      return;
    }
    setBusy("send");
    try {
      const saved = dirty || !doc ? await save() : doc;
      if (!saved) return;
      const result = await officeApi(invoiceUrl(saved.id, "/send"), SendDocumentResponse, {
        method: "POST",
      });
      if (result.invoice) adopt(result.invoice);
      setShareUrl(result.url);
      setShareOpen(true);
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setBusy(null);
    }
  }

  function discard() {
    if (!doc) return;
    const next = formFromInvoice(doc);
    setForm(next);
    setBaseline(formSignature(next));
    setProblems(null);
    setError(null);
  }

  const unpaid = isUnpaidStatus(status);
  const sendTarget =
    client ?? (doc ? { id: doc.clientId, name: doc.clientName, phone: null, email: null } : null);
  const lineItems = itemsEditable ? toLineItems(form.lines).items : (doc?.items ?? []);

  // Rascunho editável: a barra de baixo tem o "Send invoice" azul (e o "Save draft").
  const draftBar = detailsEditable && status === "draft";

  // Uma ação azul por vez: rascunho → o "Send" da barra de baixo (o do topo fica secundário e some
  // no celular); em aberto → Record payment; com mudanças sem salvar, o "Save" da barra.
  const canSend = !readOnly && (status === "draft" || unpaid);
  const sendButton = canSend ? (
    <GlassButton
      variant="secondary"
      icon={<SendIcon />}
      onClick={() => void onSend()}
      loading={busy === "send"}
      disabled={busy === "save"}
      className={draftBar ? "max-sm:hidden" : undefined}
    >
      {status === "draft" ? "Send invoice" : "Send again"}
    </GlassButton>
  ) : null;
  // Com mudanças sem salvar, o pagamento espera: o saldo da tela ainda não é o do servidor.
  const paymentButton =
    !readOnly && doc && unpaid ? (
      <span className="inline-flex flex-col items-end gap-1">
        <GlassButton
          variant={dirty ? "secondary" : "primary"}
          icon={<CashIcon />}
          onClick={() => {
            setPaymentKey((key) => key + 1);
            setPaymentOpen(true);
          }}
          disabled={busy !== null || dirty}
          aria-describedby={dirty ? `${ids}-payment-hint` : undefined}
        >
          Record payment
        </GlassButton>
        {dirty && (
          <span id={`${ids}-payment-hint`} className="text-[13px] text-slate-600">
            Save your changes first.
          </span>
        )}
      </span>
    ) : null;

  return (
    <div data-invoice-editor={ids}>
      <PrintStyles />
      <PageHeader
        back={<BackLink href="/invoices">Invoices</BackLink>}
        title={doc ? invoiceLabel(doc.number) : "New invoice"}
        badge={doc ? <InvoiceBadge status={status} /> : undefined}
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
            "Pick a client, add what you did, and send them the link."
          )
        }
        actions={
          <>
            {sendButton}
            {paymentButton}
            {doc && (status === "paid" || status === "void" || readOnly) && (
              <GlassButton variant="secondary" icon={<PrintIcon />} onClick={() => window.print()}>
                Print
              </GlassButton>
            )}
            {doc && (
              <InvoiceMenu
                context="detail"
                readOnly={readOnly}
                triggerVariant="secondary"
                invoice={{
                  id: doc.id,
                  number: doc.number,
                  clientName: doc.clientName,
                  status: doc.status,
                  publicToken: doc.publicToken,
                  paymentsCount: doc.payments.length,
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

      <div className="mt-8 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 print:hidden">
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
            <CardHeading id={`${ids}-items`}>What you did</CardHeading>
            {!detailsEditable && doc?.title && (
              <p className="mb-2 text-[15px] font-semibold text-ink">{doc.title}</p>
            )}
            {itemsEditable ? (
              <LineItemsEditor
                lines={form.lines}
                onChange={(lines) => {
                  update({ lines });
                  // Todas as linhas com preço: o aviso some e só volta num novo "Send".
                  if (!unpricedWarning(lines)) setPriceCheck(false);
                }}
                errors={problems?.lines ?? {}}
                showTax={taxRateBps > 0}
                itemsError={problems?.items}
                priceWarning={priceWarning}
              />
            ) : (
              <>
                <LineItemsView lines={doc?.items ?? []} />
                {detailsEditable && (
                  <p className={hintClass}>
                    Items can&rsquo;t change after a payment is recorded. Delete the payment first
                    if you need to fix them.
                  </p>
                )}
              </>
            )}
          </GlassCard>

          {detailsEditable ? (
            <MoreOptions
              id={`${ids}-more`}
              open={moreOpen}
              onToggle={() => setMoreOpen((open) => !open)}
              summary={optionsSummary({
                kind: "invoice",
                title: form.title,
                message: form.message,
                date: form.date,
                today,
              })}
            >
              <div>
                <label htmlFor={`${ids}-title`} className={labelClass}>
                  Title <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id={`${ids}-title`}
                  value={form.title}
                  onChange={(event) => update({ title: event.target.value })}
                  placeholder="Water heater install"
                  maxLength={160}
                  autoComplete="off"
                  className={`${fieldClass} mt-1.5 h-11`}
                  aria-invalid={problems?.title ? true : undefined}
                  aria-describedby={problems?.title ? `${ids}-title-error` : undefined}
                />
                {problems?.title && (
                  <p id={`${ids}-title-error`} className={fieldErrorClass}>
                    {problems.title}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={`${ids}-message-field`} className={labelClass}>
                  Message to customer <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id={`${ids}-message-field`}
                  value={form.message}
                  onChange={(event) => update({ message: event.target.value })}
                  rows={3}
                  maxLength={4000}
                  placeholder="Thanks for your business!"
                  className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
                  aria-invalid={problems?.message ? true : undefined}
                  aria-describedby={
                    problems?.message
                      ? `${ids}-message-error`
                      : missingPaymentInstructions
                        ? undefined
                        : `${ids}-message-hint`
                  }
                />
                {problems?.message ? (
                  <p id={`${ids}-message-error`} className={fieldErrorClass}>
                    {problems.message}
                  </p>
                ) : missingPaymentInstructions ? null : (
                  // Só promete "como pagar" no rodapé se o dono escreveu as instruções.
                  <p id={`${ids}-message-hint`} className={hintClass}>
                    Your payment instructions from{" "}
                    <Link
                      href="/office/settings"
                      className="font-semibold text-brand underline-offset-4 hover:underline"
                    >
                      Business settings
                    </Link>{" "}
                    show at the bottom.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={`${ids}-date`} className={labelClass}>
                  Due date
                </label>
                <input
                  id={`${ids}-date`}
                  type="date"
                  value={form.date}
                  onChange={(event) => update({ date: event.target.value })}
                  className={`${fieldClass} mt-1.5 h-11`}
                  aria-describedby={`${ids}-date-hint`}
                />
                <p id={`${ids}-date-hint`} className={hintClass}>
                  {form.date ? "After this date it shows as overdue." : "Due on receipt."}
                </p>
              </div>
            </MoreOptions>
          ) : (
            <GlassCard as="section" aria-labelledby={`${ids}-message`}>
              <CardHeading id={`${ids}-message`}>Message to customer</CardHeading>
              <p className="text-[15px] leading-[1.6] whitespace-pre-line text-slate-700">
                {doc?.message || <span className="text-slate-500">No message.</span>}
              </p>
            </GlassCard>
          )}

          {/* Rascunho sem pagamento: ainda não há o que listar. */}
          {doc && (status !== "draft" || doc.payments.length > 0) && (
            <GlassCard as="section" aria-labelledby={`${ids}-payments`}>
              <CardHeading id={`${ids}-payments`}>Payments</CardHeading>
              <PaymentsList
                invoiceId={doc.id}
                payments={doc.payments}
                today={today}
                readOnly={readOnly || status === "void"}
              />
            </GlassCard>
          )}
        </div>

        {/* ---------- lateral: situação, totais e vencimento ---------- */}
        <div className="grid min-w-0 gap-4 lg:sticky lg:top-6">
          {/* No rascunho, a frase "Only you see this…" fica na barra de baixo. */}
          {!draftBar && <InvoiceStatusCard invoice={doc} today={today} />}

          <GlassCard as="section" aria-labelledby={`${ids}-totals`}>
            <CardHeading id={`${ids}-totals`}>Total</CardHeading>
            <TotalsPanel
              totals={totals}
              taxRate={form.taxRate}
              taxRateBps={taxRateBps}
              discount={form.discount}
              onTaxChange={itemsEditable ? (taxRate) => update({ taxRate }) : undefined}
              onDiscountChange={itemsEditable ? (discount) => update({ discount }) : undefined}
              taxError={problems?.taxRate}
              discountError={problems?.discount}
              extra={
                doc && status !== "draft" && status !== "void" ? (
                  <>
                    {paidCents > 0 && (
                      <TotalRow label="Paid" value={`−${formatCents(paidCents)}`} tone="emerald" />
                    )}
                    <TotalRow
                      label="Balance due"
                      value={formatCents(Math.max(0, balanceCents))}
                      strong
                      tone={status === "overdue" ? "red" : undefined}
                    />
                  </>
                ) : null
              }
            />
          </GlassCard>

          {detailsEditable &&
            status !== "paid" &&
            status !== "void" &&
            missingPaymentInstructions && (
              <Notice tone="warning" size="sm" role={null}>
                Your customer won&rsquo;t see how to pay.{" "}
                <Link
                  href="/office/settings"
                  className={`font-semibold underline underline-offset-4 hover:no-underline ${focusRing}`}
                >
                  Add payment instructions in Business settings
                </Link>
                .
              </Notice>
            )}

          {!detailsEditable && (
            <GlassCard as="section" aria-labelledby={`${ids}-due`}>
              <CardHeading id={`${ids}-due`}>Due date</CardHeading>
              <p className="text-[15px] text-ink">
                {doc?.dueOn ? formatDateOnly(doc.dueOn, today) : "Due on receipt"}
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {draftBar ? (
        <DraftBar
          sendLabel="Send invoice"
          onSend={() => void onSend()}
          sending={busy === "send"}
          onSave={!doc || dirty ? () => void onSave() : undefined}
          saving={busy === "save"}
          onDiscard={doc && dirty ? discard : undefined}
          busy={busy !== null}
          message={doc && dirty ? "Unsaved changes" : undefined}
          warning={priceWarning}
        />
      ) : (
        detailsEditable && (
          <SaveBar
            show={dirty}
            saving={busy !== null}
            onSave={() => void onSave()}
            onDiscard={discard}
            label="Save"
            message="Unsaved changes"
          />
        )
      )}

      {/* Só na impressão / PDF: o mesmo papel do link público. */}
      <div className="office-print hidden">
        <DocumentPaper
          kind="invoice"
          number={doc?.number ?? 0}
          title={detailsEditable ? form.title.trim() : (doc?.title ?? "")}
          company={company}
          client={
            party ?? {
              name: sendTarget?.name ?? "",
              email: sendTarget?.email ?? null,
              phone: sendTarget?.phone ?? null,
              address: null,
            }
          }
          items={lineItems}
          taxRateBps={taxRateBps}
          totals={totals}
          amountPaidCents={paidCents}
          balanceCents={status === "void" ? undefined : balanceCents}
          message={detailsEditable ? form.message : (doc?.message ?? "")}
          facts={[
            { label: "Date", value: formatDateOnly(doc?.issuedOn ?? today) },
            {
              label: "Due",
              value: form.date ? formatDateOnly(form.date) : "On receipt",
            },
          ]}
          notes={
            status === "paid" || status === "void"
              ? []
              : [{ title: "How to pay", body: paymentInstructions }]
          }
          stamp={
            status === "paid"
              ? { label: "Paid", tone: "emerald" }
              : status === "void"
                ? { label: "Void", tone: "slate" }
                : null
          }
        />
      </div>

      {shareUrl && doc && sendTarget && (
        <SendSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          url={shareUrl}
          kind="invoice"
          number={doc.number}
          companyName={company.companyName}
          client={sendTarget}
          totalCents={Math.max(0, doc.balanceCents)}
          missingPaymentInstructions={missingPaymentInstructions}
        />
      )}

      {doc && paymentOpen && (
        <RecordPaymentSheet
          key={paymentKey}
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          invoiceId={doc.id}
          invoiceNumber={doc.number}
          balanceCents={Math.max(0, doc.balanceCents)}
          today={today}
        />
      )}
    </div>
  );
}

/** Onde a fatura está e o que acontece agora. */
function InvoiceStatusCard({ invoice, today }: { invoice: Invoice | null; today: string }) {
  // Sem fatura salva, não há o que contar (a barra de baixo já diz "Only you see this…").
  if (!invoice) return null;
  const status = invoice.status;
  const tone =
    status === "paid"
      ? "bg-emerald-50/85 text-emerald-900"
      : status === "overdue"
        ? "bg-red-50/85 text-red-900"
        : status === "partial"
          ? "bg-amber-50/85 text-amber-900"
          : status === "sent"
            ? "bg-blue-50/85 text-[#0b2a5c]"
            : "";
  return (
    <div className={cx("glass-edge rounded-2xl p-4", tone || "glass")}>
      <p className="text-[13px] font-semibold tracking-wide uppercase opacity-80">
        {INVOICE_STATUS_LABELS[status]}
      </p>
      <div className="mt-1 text-[15px] leading-[1.6]">
        {status === "draft" && <p>Only you can see this until you send it.</p>}
        {(status === "sent" || status === "partial") && (
          <p>
            {invoice.sentAt ? (
              <>
                Sent <LocalTime iso={invoice.sentAt} />.{" "}
              </>
            ) : null}
            {invoice.dueOn ? `Due ${formatDateOnly(invoice.dueOn, today)}.` : "Due on receipt."}
          </p>
        )}
        {status === "overdue" && (
          <p>
            Was due {invoice.dueOn ? formatDateOnly(invoice.dueOn, today) : "on receipt"}. Send a
            friendly reminder with &ldquo;Send again&rdquo;.
          </p>
        )}
        {status === "paid" && (
          <p>
            Paid in full
            {invoice.paidAt ? (
              <>
                {" "}
                · <LocalTime iso={invoice.paidAt} />
              </>
            ) : null}
            .
          </p>
        )}
        {status === "void" && <p>This invoice was voided. The customer owes nothing on it.</p>}
      </div>
    </div>
  );
}
