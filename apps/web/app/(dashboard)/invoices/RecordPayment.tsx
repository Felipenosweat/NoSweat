"use client";

import {
  InvoiceResponse,
  RecordPaymentRequest,
  type Payment,
  type PaymentMethod,
} from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { ConfirmDialog, GlassButton, GlassIconButton, GlassSheet } from "@/components/glass";
import {
  MARKED_PAID_REFERENCE,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_REFERENCE_HINTS,
  centsToInput,
  formatCents,
  formatDateOnly,
  parseDollars,
} from "@/lib/office";
import {
  ErrorNote,
  invoiceUrl,
  officeApi,
  officeApiNoContent,
  toOfficeError,
  type OfficeApiError,
} from "../office/_ui/api";
import {
  TrashIcon,
  choicePill,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
} from "../office/_ui/ui";

// Pagamentos de uma fatura: a folha "Record payment" (valor = saldo, forma de pagamento em
// cápsulas, referência e data; e "Mark as paid", que lança o saldo que falta como "Other · Marked
// paid" para fechar a fatura que o cliente pagou a menos) e a lista dos pagamentos com "apagar"
// (com confirmação; apagar o "Marked paid" desfaz). Depois de cada mudança a página relê a fatura
// (router.refresh) e o editor pega a versão nova.

export function RecordPaymentSheet({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
  balanceCents,
  today,
}: {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: number;
  balanceCents: number;
  today: string;
}) {
  const router = useRouter();
  const ids = useId();
  const [amount, setAmount] = useState(centsToInput(Math.max(0, balanceCents), true));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [receivedOn, setReceivedOn] = useState(today);
  const [amountError, setAmountError] = useState<string | null>(null);
  // Qual botão está gravando: "Record payment" ou "Mark as paid" (um de cada vez).
  const [saving, setSaving] = useState<"record" | "mark" | null>(null);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const pending = saving !== null;

  /** Lança o saldo que falta (o do servidor) como "Other · Marked paid" e fecha a fatura. */
  async function markPaid() {
    if (pending) return;
    setError(null);
    setAmountError(null);
    setSaving("mark");
    try {
      await officeApi(invoiceUrl(invoiceId, "/mark-paid"), InvoiceResponse, { method: "POST" });
      onClose();
      router.refresh();
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setSaving(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const cents = parseDollars(amount);
    if (!cents) {
      setAmountError("Enter the amount you received, like 250 or 89.50.");
      document.getElementById(`${ids}-amount`)?.focus();
      return;
    }
    if (cents > balanceCents) {
      setAmountError(`That's more than the balance due (${formatCents(balanceCents)}).`);
      document.getElementById(`${ids}-amount`)?.focus();
      return;
    }
    const parsed = RecordPaymentRequest.safeParse({
      amountCents: cents,
      method,
      reference: reference.trim() || undefined,
      receivedOn: receivedOn || undefined,
    });
    if (!parsed.success) {
      setAmountError(parsed.error.issues[0]?.message ?? "Please check the payment.");
      return;
    }
    setAmountError(null);
    setSaving("record");
    try {
      await officeApi(invoiceUrl(invoiceId, "/payments"), InvoiceResponse, {
        method: "POST",
        body: parsed.data,
      });
      onClose();
      router.refresh();
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setSaving(null);
    }
  }

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      dismissible={!pending}
      title="Record payment"
      description={`Invoice #${invoiceNumber} · ${formatCents(balanceCents)} due`}
    >
      <form onSubmit={(event) => void submit(event)} noValidate aria-label="Record payment">
        <fieldset disabled={pending} className="grid gap-5">
          <div>
            <label htmlFor={`${ids}-amount`} className={labelClass}>
              Amount received
            </label>
            <div className="relative mt-1.5">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500"
              >
                $
              </span>
              <input
                id={`${ids}-amount`}
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                autoComplete="off"
                className={`${fieldClass} h-11 pl-7 text-lg font-semibold tabular-nums`}
                aria-invalid={amountError ? true : undefined}
                aria-describedby={amountError ? `${ids}-amount-error` : undefined}
              />
            </div>
            {amountError && (
              <p id={`${ids}-amount-error`} className={fieldErrorClass}>
                {amountError}
              </p>
            )}
          </div>

          <fieldset>
            <legend className={labelClass}>Paid with</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((option) => (
                <label key={option} className={choicePill}>
                  <input
                    type="radio"
                    name={`${ids}-method`}
                    value={option}
                    checked={method === option}
                    onChange={() => setMethod(option)}
                    className="sr-only"
                  />
                  {PAYMENT_METHOD_LABELS[option]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${ids}-reference`} className={labelClass}>
                Reference <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id={`${ids}-reference`}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={80}
                autoComplete="off"
                placeholder={PAYMENT_REFERENCE_HINTS[method]}
                className={`${fieldClass} mt-1.5 h-11`}
              />
            </div>
            <div>
              <label htmlFor={`${ids}-date`} className={labelClass}>
                Date received
              </label>
              <input
                id={`${ids}-date`}
                type="date"
                value={receivedOn}
                max={today}
                onChange={(event) => setReceivedOn(event.target.value)}
                className={`${fieldClass} mt-1.5 h-11`}
              />
            </div>
          </div>
          <p className={`${hintClass} -mt-2`}>
            This only records the payment. No money moves through No Sweat.
          </p>
        </fieldset>

        {error && <ErrorNote error={error} className="mt-5" />}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <GlassButton variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            variant="primary"
            loading={saving === "record"}
            disabled={saving === "mark"}
          >
            {saving === "record" ? "Saving…" : "Record payment"}
          </GlassButton>
        </div>
      </form>

      {balanceCents > 0 && (
        <section
          aria-labelledby={`${ids}-mark-title`}
          className="mt-6 border-t border-(--glass-rim) pt-5"
        >
          <h3 id={`${ids}-mark-title`} className="text-[15px] font-semibold text-ink">
            Closing it out for less?
          </h3>
          <p className={hintClass}>
            Mark as paid records the {formatCents(balanceCents)} left as &ldquo;
            {PAYMENT_METHOD_LABELS.other} · {MARKED_PAID_REFERENCE}&rdquo; and closes the invoice.
            To undo, delete that payment.
          </p>
          <GlassButton
            variant="secondary"
            className="mt-3"
            onClick={() => void markPaid()}
            loading={saving === "mark"}
            disabled={saving === "record"}
          >
            {saving === "mark" ? "Saving…" : "Mark as paid"}
          </GlassButton>
        </section>
      )}
    </GlassSheet>
  );
}

export function PaymentsList({
  invoiceId,
  payments,
  today,
  readOnly,
}: {
  invoiceId: string;
  payments: readonly Payment[];
  today: string;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<Payment | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!target) return;
    setPending(true);
    setError(null);
    try {
      await officeApiNoContent(
        invoiceUrl(invoiceId, `/payments/${encodeURIComponent(target.id)}`),
        {
          method: "DELETE",
        },
      );
      setTarget(null);
      router.refresh();
    } catch (err) {
      setError(toOfficeError(err).message);
    } finally {
      setPending(false);
    }
  }

  if (payments.length === 0) {
    return <p className="text-[15px] text-slate-500">No payments recorded yet.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-(--glass-rim)">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink">
                {PAYMENT_METHOD_LABELS[payment.method]}
                {payment.reference && (
                  <span className="font-normal text-slate-600"> · {payment.reference}</span>
                )}
              </p>
              <p className="text-[13px] text-slate-500">
                {formatDateOnly(payment.receivedOn, today)}
              </p>
            </div>
            <p className="shrink-0 text-[15px] font-semibold text-emerald-700 tabular-nums">
              {formatCents(payment.amountCents)}
            </p>
            {!readOnly && (
              <GlassIconButton
                label={`Delete ${formatCents(payment.amountCents)} payment`}
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setMounted(true);
                  setTarget(payment);
                }}
              >
                <TrashIcon />
              </GlassIconButton>
            )}
          </li>
        ))}
      </ul>
      {mounted && (
        <ConfirmDialog
          open={target !== null}
          title={
            target ? `Delete the ${formatCents(target.amountCents)} payment?` : "Delete payment?"
          }
          confirmLabel="Delete payment"
          pendingLabel="Deleting…"
          pending={pending}
          error={error}
          onConfirm={() => void remove()}
          onCancel={() => setTarget(null)}
        >
          The balance due goes back up by this amount. Use this only if it was recorded by mistake.
        </ConfirmDialog>
      )}
    </>
  );
}
