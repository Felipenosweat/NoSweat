"use client";

import {
  ClientResponse,
  UpdateClientRequest,
  type Client,
  type ClientStage,
} from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { focusRing, primaryButton, secondaryButton, textButton } from "@/components/DashboardUi";
import { CLIENT_STAGES, STAGE_LABELS, followUpState, formatDateOnly } from "@/lib/clients";
import {
  ErrorNote,
  clientUrl,
  clientsApi,
  clientsApiNoContent,
  toClientsError,
  type ClientsApiError,
} from "../api";
import { fieldClass, fieldErrorClass, hintClass, labelClass } from "../ui";

// Controles da ficha do cliente (/clients/[id]). Cada um salva sozinho com PATCH e depois
// `router.refresh()`; a página passa uma `key` com o valor salvo, então o componente recomeça
// com os dados novos (sem copiar props para o estado dentro de efeitos).

/** PATCH /api/clients/[id] com estado de envio e erro. */
function usePatch(clientId: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  async function save(body: UpdateClientRequest): Promise<boolean> {
    setPending(true);
    setError(null);
    try {
      await clientsApi(clientUrl(clientId), ClientResponse, { method: "PATCH", body });
      router.refresh();
      return true;
    } catch (err) {
      setError(toClientsError(err));
      return false;
    } finally {
      setPending(false);
    }
  }

  return { save, pending, error };
}

// ---------- dados de contato ----------

type ContactField = "name" | "phone" | "email" | "address";

/**
 * Dados de contato: mostra `children` (a versão de leitura, feita no servidor) com o botão
 * "Edit details", ou o formulário de edição.
 */
export function ContactDetails({
  client,
  children,
}: {
  client: Pick<Client, "id" | "name" | "phone" | "email" | "address">;
  children: ReactNode;
}) {
  const ids = useId();
  const { save, pending, error } = usePatch(client.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});

  function startEditing() {
    setName(client.name);
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setAddress(client.address ?? "");
    setErrors({});
    setEditing(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = {
      name,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
    };
    const parsed = UpdateClientRequest.safeParse(body);
    const next: Partial<Record<ContactField, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          (key === "name" || key === "phone" || key === "email" || key === "address") &&
          !next[key]
        ) {
          next[key] = issue.message;
        }
      }
    }
    // Mesma regra do cadastro: pelo menos um jeito de falar com a pessoa.
    if (!body.phone && !body.email && !next.phone) next.phone = "Add an email or a phone number.";
    setErrors(next);
    if (!parsed.success || Object.keys(next).length > 0) return;
    if (await save(parsed.data)) setEditing(false);
  }

  if (!editing) {
    return (
      <div>
        {children}
        <button type="button" onClick={startEditing} className={`${textButton} mt-3`}>
          Edit details
        </button>
      </div>
    );
  }

  const field = (
    key: ContactField,
    label: string,
    value: string,
    onChange: (value: string) => void,
    extra: { type?: string; inputMode?: "tel" | "email"; maxLength: number },
  ) => (
    <div>
      <label htmlFor={`${ids}-${key}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`${ids}-${key}`}
        type={extra.type ?? "text"}
        inputMode={extra.inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={extra.maxLength}
        autoComplete="off"
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${ids}-${key}-error` : undefined}
        className={`${fieldClass} mt-1.5 h-11`}
      />
      {errors[key] && (
        <p id={`${ids}-${key}-error`} className={fieldErrorClass}>
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      aria-label="Edit contact details"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) setEditing(false);
      }}
    >
      <fieldset disabled={pending} className="grid gap-4">
        {field("name", "Name", name, setName, { maxLength: 120 })}
        {field("phone", "Phone", phone, setPhone, { type: "tel", inputMode: "tel", maxLength: 40 })}
        {field("email", "Email", email, setEmail, {
          type: "email",
          inputMode: "email",
          maxLength: 254,
        })}
        {field("address", "Address", address, setAddress, { maxLength: 300 })}
      </fieldset>
      {error && <ErrorNote error={error} className="mt-4" />}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save details"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={pending}
          className={textButton}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- etapa ----------

export function StagePicker({ clientId, stage }: { clientId: string; stage: ClientStage }) {
  const ids = useId();
  const { save, pending, error } = usePatch(clientId);
  const [value, setValue] = useState<ClientStage>(stage);

  async function choose(next: ClientStage) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    if (!(await save({ stage: next }))) setValue(previous);
  }

  return (
    <div>
      <fieldset disabled={pending}>
        <legend className={labelClass}>Stage</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {CLIENT_STAGES.map((option) => (
            <label
              key={option}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:border-slate-400 has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand has-disabled:cursor-not-allowed sm:min-h-9"
            >
              <input
                type="radio"
                name={`${ids}-stage`}
                value={option}
                checked={value === option}
                onChange={() => void choose(option)}
                className="sr-only"
              />
              {STAGE_LABELS[option]}
            </label>
          ))}
        </div>
      </fieldset>
      <p aria-live="polite" className="sr-only">
        {pending ? "Saving stage…" : ""}
      </p>
      {error && <ErrorNote error={error} className="mt-3" />}
    </div>
  );
}

// ---------- retorno combinado ----------

/** "AAAA-MM-DD" + n dias (conta em UTC: só a data importa). */
function addDays(date: string, days: number): string {
  const [y = 2000, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function FollowUpForm({
  clientId,
  followUpOn,
  today,
}: {
  clientId: string;
  followUpOn: string | null;
  /** Hoje no fuso da empresa ("AAAA-MM-DD"). */
  today: string;
}) {
  const ids = useId();
  const { save, pending, error } = usePatch(clientId);
  const [value, setValue] = useState(followUpOn ?? "");
  const saved = followUpOn ?? "";
  const state = followUpOn ? followUpState(followUpOn, today) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    await save({ followUpOn: value });
  }

  return (
    <form onSubmit={(event) => void submit(event)} aria-label="Follow-up date">
      <label htmlFor={`${ids}-date`} className={labelClass}>
        Follow up on
      </label>
      {state && followUpOn && (
        <p
          id={`${ids}-state`}
          className={`mt-1 text-[13px] leading-5 font-medium ${
            state === "overdue"
              ? "text-red-700"
              : state === "today"
                ? "text-amber-800"
                : "text-slate-500"
          }`}
        >
          {state === "overdue"
            ? `Overdue since ${formatDateOnly(followUpOn, today)}`
            : state === "today"
              ? "Due today"
              : `Due ${formatDateOnly(followUpOn, today)}`}
        </p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <input
          id={`${ids}-date`}
          type="date"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={pending}
          aria-describedby={state ? `${ids}-state` : undefined}
          className={`${fieldClass} h-11 w-auto min-w-0 flex-1 sm:h-10`}
        />
        <button
          type="submit"
          disabled={pending || !value || value === saved}
          className={secondaryButton}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4">
        <button
          type="button"
          disabled={pending}
          onClick={() => void save({ followUpOn: addDays(today, 1) })}
          className={textButton}
        >
          Tomorrow
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void save({ followUpOn: addDays(today, 7) })}
          className={textButton}
        >
          In a week
        </button>
        {followUpOn && (
          <button
            type="button"
            disabled={pending}
            onClick={() => void save({ followUpOn: null })}
            className={textButton}
          >
            Clear
          </button>
        )}
      </div>
      {error && <ErrorNote error={error} className="mt-3" />}
    </form>
  );
}

// ---------- anotação fixa ----------

export function PinnedNotes({ clientId, notes }: { clientId: string; notes: string }) {
  const ids = useId();
  const { save, pending, error } = usePatch(clientId);
  const [value, setValue] = useState(notes);
  const changed = value.trim() !== notes.trim();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changed) return;
    await save({ notes: value.trim() });
  }

  return (
    <form onSubmit={(event) => void submit(event)} aria-labelledby={`${ids}-label`}>
      <label id={`${ids}-label`} htmlFor={`${ids}-notes`} className={labelClass}>
        Pinned notes
      </label>
      <p id={`${ids}-hint`} className={hintClass}>
        Gate codes, pets, how they like things done. Only you see this.
      </p>
      <textarea
        id={`${ids}-notes`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={pending}
        rows={4}
        maxLength={5000}
        aria-describedby={`${ids}-hint`}
        className={`${fieldClass} mt-2 resize-y py-2.5 leading-[1.55]`}
      />
      {error && <ErrorNote error={error} className="mt-3" />}
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending || !changed} className={secondaryButton}>
          {pending ? "Saving…" : "Save notes"}
        </button>
      </div>
    </form>
  );
}

// ---------- apagar ----------

export function DeleteClientButton({ clientId, name }: { clientId: string; name: string }) {
  const router = useRouter();
  const ids = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      await clientsApiNoContent(clientUrl(clientId), { method: "DELETE" });
      dialogRef.current?.close();
      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError(toClientsError(err));
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          dialogRef.current?.showModal();
        }}
        className={`inline-flex min-h-11 items-center rounded-lg border border-red-200 bg-white px-4 text-[15px] font-semibold text-red-700 transition-colors duration-150 hover:bg-red-50 active:translate-y-px sm:min-h-10 ${focusRing}`}
      >
        Delete client
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`${ids}-title`}
        aria-describedby={`${ids}-text`}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="m-auto w-[min(100%-2.5rem,28rem)] rounded-xl border border-slate-200 bg-white p-5 text-ink backdrop:bg-ink/40 sm:p-6"
      >
        <h2
          id={`${ids}-title`}
          className="font-display text-lg leading-7 font-semibold tracking-[-0.02em]"
        >
          Delete {name}?
        </h2>
        <p id={`${ids}-text`} className="mt-2 text-[15px] leading-[1.6] text-slate-600">
          Their contact details, notes and job history are erased. This can&rsquo;t be undone.
        </p>
        {error && <ErrorNote error={error} className="mt-4" />}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            className={secondaryButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={pending}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-4 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-red-700 active:translate-y-px disabled:opacity-70 sm:min-h-10 ${focusRing}`}
          >
            {pending ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}
