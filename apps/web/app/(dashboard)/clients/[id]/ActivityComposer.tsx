"use client";

import { ClientActivityResponse, CreateClientActivityRequest } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { primaryButton } from "@/components/DashboardUi";
import { parseDollars } from "@/lib/clients";
import { ErrorNote, clientUrl, clientsApi, toClientsError, type ClientsApiError } from "../api";
import { fieldClass, fieldErrorClass, labelClass } from "../ui";

// Caixa para registrar no histórico: uma nota ou um serviço feito (com valor e data opcionais).

type Kind = "note" | "job";

const KINDS: { value: Kind; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "job", label: "Job done" },
];

/** "AAAA-MM-DD" de hoje no relógio de quem está usando. */
function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Data escolhida → instante ISO (meio-dia local). Hoje ou vazio = agora (o servidor decide). */
function occurredAtFor(date: string): string | undefined {
  if (!date || date === localToday()) return undefined;
  return new Date(`${date}T12:00:00`).toISOString();
}

export function ActivityComposer({ clientId }: { clientId: string }) {
  const router = useRouter();
  const ids = useId();
  const [kind, setKind] = useState<Kind>("note");
  const [body, setBody] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [fieldError, setFieldError] = useState<{ body?: string; amount?: string }>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);
  const [savedText, setSavedText] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSavedText("");
    const amountCents = kind === "job" ? parseDollars(amount) : null;
    const parsed = CreateClientActivityRequest.safeParse({
      kind,
      body,
      ...(kind === "job" ? { amountCents: amountCents ?? null } : {}),
      ...(kind === "job" ? { occurredAt: occurredAtFor(date) } : {}),
    });
    const next: { body?: string; amount?: string } = {};
    if (!parsed.success) {
      const issue = parsed.error.issues.find((item) => item.path[0] === "body");
      if (issue) next.body = issue.message;
    }
    if (amountCents === undefined) next.amount = "Enter an amount like 120 or 120.50.";
    setFieldError(next);
    if (!parsed.success || next.body || next.amount) return;

    setPending(true);
    try {
      await clientsApi(clientUrl(clientId, "/activities"), ClientActivityResponse, {
        method: "POST",
        body: parsed.data,
      });
      setBody("");
      setAmount("");
      setDate("");
      setSavedText(kind === "job" ? "Job saved." : "Note saved.");
      router.refresh();
    } catch (err) {
      setError(toClientsError(err));
    } finally {
      setPending(false);
    }
  }

  const bodyLabel = kind === "job" ? "What did you do?" : "Note";

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      aria-label="Add to history"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <fieldset disabled={pending}>
        <legend className="sr-only">What are you adding?</legend>
        <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
          {KINDS.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center rounded-lg px-4 text-sm font-semibold text-slate-600 transition-colors duration-150 hover:text-ink has-checked:bg-white has-checked:text-ink has-checked:ring-1 has-checked:ring-slate-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand sm:min-h-9"
            >
              <input
                type="radio"
                name={`${ids}-kind`}
                value={option.value}
                checked={kind === option.value}
                onChange={() => {
                  setKind(option.value);
                  setFieldError({});
                }}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={pending} className="mt-4 grid gap-4">
        <div>
          <label htmlFor={`${ids}-body`} className={labelClass}>
            {bodyLabel}
          </label>
          <textarea
            id={`${ids}-body`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={
              kind === "job"
                ? "Deep clean, 3 bedrooms and 2 baths"
                : "Called back, wants a quote for next week"
            }
            aria-invalid={fieldError.body ? true : undefined}
            aria-describedby={fieldError.body ? `${ids}-body-error` : undefined}
            className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
          />
          {fieldError.body && (
            <p id={`${ids}-body-error`} className={fieldErrorClass}>
              {fieldError.body}
            </p>
          )}
        </div>

        {kind === "job" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${ids}-amount`} className={labelClass}>
                Amount <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <div className="relative mt-1.5">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[15px] text-slate-500"
                >
                  $
                </span>
                <input
                  id={`${ids}-amount`}
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  autoComplete="off"
                  aria-invalid={fieldError.amount ? true : undefined}
                  aria-describedby={fieldError.amount ? `${ids}-amount-error` : undefined}
                  className={`${fieldClass} h-11 pl-7 tabular-nums`}
                />
              </div>
              {fieldError.amount && (
                <p id={`${ids}-amount-error`} className={fieldErrorClass}>
                  {fieldError.amount}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${ids}-date`} className={labelClass}>
                Date <span className="font-normal text-slate-500">(optional, today if empty)</span>
              </label>
              <input
                id={`${ids}-date`}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={`${fieldClass} mt-1.5 h-11`}
              />
            </div>
          </div>
        )}
      </fieldset>

      {error && <ErrorNote error={error} className="mt-4" />}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : kind === "job" ? "Save job" : "Add note"}
        </button>
        <p aria-live="polite" className="text-[13px] text-slate-500">
          {savedText}
        </p>
      </div>
    </form>
  );
}
