"use client";

import {
  ClientResponse,
  UpdateClientRequest,
  type Client,
  type ClientStage,
} from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { GlassButton } from "@/components/glass";
import { CLIENT_STAGES, STAGE_LABELS, parseTagsInput } from "@/lib/clients";
import { ErrorNote, clientUrl, clientsApi, toClientsError, type ClientsApiError } from "../api";
import { TagSuggestions } from "../ClientForm";
import {
  FollowUpBadge,
  choicePill,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
} from "../ui";

// Controles da ficha do cliente (/clients/[id]). Cada um salva sozinho com PATCH e depois
// `router.refresh()`; a página passa uma `key` com o valor salvo, então o componente recomeça
// com os dados novos (sem copiar props para o estado dentro de efeitos).
// `readOnly` (modo "ver como" do admin): mostra os dados sem deixar mudar nada.

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

type ContactField = "name" | "phone" | "email" | "address" | "tags";

/**
 * Dados de contato: mostra `children` (a versão de leitura, feita no servidor) com o botão
 * "Edit details", ou o formulário de edição (inclui as etiquetas).
 */
export function ContactDetails({
  client,
  readOnly = false,
  children,
}: {
  client: Pick<Client, "id" | "name" | "phone" | "email" | "address" | "tags">;
  readOnly?: boolean;
  children: ReactNode;
}) {
  const ids = useId();
  const { save, pending, error } = usePatch(client.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [tags, setTags] = useState(client.tags.join(", "));
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});

  function startEditing() {
    setName(client.name);
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setAddress(client.address ?? "");
    setTags(client.tags.join(", "));
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
      tags: parseTagsInput(tags),
    };
    const parsed = UpdateClientRequest.safeParse(body);
    const next: Partial<Record<ContactField, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          (key === "name" ||
            key === "phone" ||
            key === "email" ||
            key === "address" ||
            key === "tags") &&
          !next[key]
        ) {
          next[key] = issue.message;
        }
      }
      if (Object.keys(next).length === 0) {
        next.name = parsed.error.issues[0]?.message ?? "Please check the form.";
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
        {!readOnly && (
          <GlassButton variant="secondary" onClick={startEditing} className="mt-4" fullWidth>
            Edit details
          </GlassButton>
        )}
      </div>
    );
  }

  const field = (
    key: Exclude<ContactField, "tags">,
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
      className="mt-5 border-t border-(--glass-rim) pt-5"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) setEditing(false);
      }}
    >
      <fieldset disabled={pending} className="grid gap-4">
        {field("name", "Name", name, setName, { maxLength: 120 })}
        {field("phone", "Mobile phone", phone, setPhone, {
          type: "tel",
          inputMode: "tel",
          maxLength: 40,
        })}
        {field("email", "Email", email, setEmail, {
          type: "email",
          inputMode: "email",
          maxLength: 254,
        })}
        {field("address", "Service address", address, setAddress, { maxLength: 300 })}
        <div>
          <label htmlFor={`${ids}-tags`} className={labelClass}>
            Tags
          </label>
          <input
            id={`${ids}-tags`}
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            maxLength={340}
            autoComplete="off"
            placeholder="VIP, Referral"
            aria-invalid={errors.tags ? true : undefined}
            aria-describedby={errors.tags ? `${ids}-tags-error` : `${ids}-tags-hint`}
            className={`${fieldClass} mt-1.5 h-11`}
          />
          {errors.tags ? (
            <p id={`${ids}-tags-error`} className={fieldErrorClass}>
              {errors.tags}
            </p>
          ) : (
            <p id={`${ids}-tags-hint`} className={hintClass}>
              Separate tags with commas.
            </p>
          )}
          <TagSuggestions value={tags} onChange={setTags} disabled={pending} />
        </div>
      </fieldset>
      {error && <ErrorNote error={error} className="mt-4" />}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <GlassButton variant="secondary" onClick={() => setEditing(false)} disabled={pending}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" variant="primary" loading={pending}>
          {pending ? "Saving…" : "Save details"}
        </GlassButton>
      </div>
    </form>
  );
}

// ---------- etapa ----------

export function StagePicker({
  clientId,
  stage,
  readOnly = false,
}: {
  clientId: string;
  stage: ClientStage;
  readOnly?: boolean;
}) {
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
      <fieldset disabled={pending || readOnly}>
        <legend className={labelClass}>Stage</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CLIENT_STAGES.map((option) => (
            <label key={option} className={choicePill}>
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
  readOnly = false,
}: {
  clientId: string;
  followUpOn: string | null;
  /** Hoje no fuso da empresa ("AAAA-MM-DD"). */
  today: string;
  readOnly?: boolean;
}) {
  const ids = useId();
  const { save, pending, error } = usePatch(clientId);
  const [value, setValue] = useState(followUpOn ?? "");
  const saved = followUpOn ?? "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    await save({ followUpOn: value });
  }

  const quick: { label: string; days: number }[] = [
    { label: "Tomorrow", days: 1 },
    { label: "In 3 days", days: 3 },
    { label: "Next week", days: 7 },
  ];

  return (
    <form onSubmit={(event) => void submit(event)} aria-label="Follow-up date">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`${ids}-date`} className={labelClass}>
          Follow up on
        </label>
        {followUpOn && (
          <span id={`${ids}-state`}>
            <FollowUpBadge date={followUpOn} today={today} />
          </span>
        )}
      </div>
      <fieldset disabled={pending || readOnly}>
        <div className="mt-2 flex items-center gap-2">
          <input
            id={`${ids}-date`}
            type="date"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-describedby={followUpOn ? `${ids}-state` : undefined}
            className={`${fieldClass} h-11 min-w-0 flex-1`}
          />
          {!readOnly && (
            <GlassButton
              type="submit"
              variant="secondary"
              disabled={!value || value === saved}
              loading={pending}
            >
              Save
            </GlassButton>
          )}
        </div>
        {!readOnly && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quick.map((option) => (
              <GlassButton
                key={option.days}
                variant="ghost"
                onClick={() => void save({ followUpOn: addDays(today, option.days) })}
              >
                {option.label}
              </GlassButton>
            ))}
            {followUpOn && (
              <GlassButton variant="ghost" onClick={() => void save({ followUpOn: null })}>
                Clear
              </GlassButton>
            )}
          </div>
        )}
      </fieldset>
      {error && <ErrorNote error={error} className="mt-3" />}
    </form>
  );
}

// ---------- anotação fixa ----------

export function PinnedNotes({
  clientId,
  notes,
  readOnly = false,
}: {
  clientId: string;
  notes: string;
  readOnly?: boolean;
}) {
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
        readOnly={readOnly}
        rows={4}
        maxLength={5000}
        aria-describedby={`${ids}-hint`}
        className={`${fieldClass} mt-2 resize-y py-2.5 leading-[1.55]`}
      />
      {error && <ErrorNote error={error} className="mt-3" />}
      {!readOnly && changed && (
        <div className="mt-3 flex justify-end gap-2">
          <GlassButton variant="ghost" onClick={() => setValue(notes)} disabled={pending}>
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
