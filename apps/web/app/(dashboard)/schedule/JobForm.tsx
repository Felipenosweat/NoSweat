"use client";

import {
  ClientResponse,
  ClientsResponse,
  CreateClientRequest,
  CreateJobRequest,
  JobResponse,
  type Client,
  type Job,
  type TeamMember,
} from "@nosweat/schema";
import { useEffect, useId, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { GlassButton, GlassSearchField, GlassSheet, SpinnerIcon, cx } from "@/components/glass";
import { parseDollars } from "@/lib/clients";
import { ErrorNote, clientsApi, toClientsError, type ClientsApiError } from "../clients/api";
import {
  Avatar,
  PlusIcon,
  fieldClass,
  fieldErrorClass,
  hintClass,
  labelClass,
} from "../clients/ui";
import { addMinutesToTime, zonedToUtc } from "./time";
import { TeamDot } from "./ui";

// Folha "New job": escolher (ou cadastrar rápido) o cliente, título, dia e horário (1 hora por
// padrão), endereço (vem do cliente), quem vai, valor e notas. Valida com o contrato antes de
// enviar. As horas digitadas são do fuso da empresa (settings.timeZone).

type PickedClient = Pick<Client, "id" | "name" | "phone" | "address">;

type Field =
  | "clientId"
  | "title"
  | "description"
  | "startAt"
  | "endAt"
  | "address"
  | "valueCents"
  | "notes";

const FIELDS: readonly Field[] = [
  "clientId",
  "title",
  "description",
  "startAt",
  "endAt",
  "address",
  "valueCents",
  "notes",
];

/** Quantos clientes a busca mostra de uma vez. */
const MAX_MATCHES = 6;

function matches(client: Client, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const digits = needle.replace(/\D/g, "");
  return (
    client.name.toLowerCase().includes(needle) ||
    (client.email?.toLowerCase().includes(needle) ?? false) ||
    (digits.length >= 3 && (client.phone?.replace(/\D/g, "").includes(digits) ?? false))
  );
}

export type NewJobDefaults = {
  /** Dia ("AAAA-MM-DD"); `null` = hoje. */
  date: string | null;
  /** Início "HH:MM"; `null` = 9h. */
  time: string | null;
};

/** Folha com o formulário (monta o formulário de novo a cada abertura: começa vazio). */
export function NewJobSheet({
  open,
  onClose,
  onCreated,
  defaults,
  team,
  timeZone,
  today,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (job: Job) => void;
  defaults: NewJobDefaults;
  /** Só os membros ativos. */
  team: TeamMember[];
  timeZone: string;
  today: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="New job"
      description="Pick the client and a time. You can change anything later."
      size="lg"
      dismissible={!busy}
    >
      {open && (
        <JobForm
          defaults={defaults}
          team={team}
          timeZone={timeZone}
          today={today}
          onCancel={onClose}
          onBusy={setBusy}
          onCreated={onCreated}
        />
      )}
    </GlassSheet>
  );
}

function JobForm({
  defaults,
  team,
  timeZone,
  today,
  onCancel,
  onBusy,
  onCreated,
}: {
  defaults: NewJobDefaults;
  team: TeamMember[];
  timeZone: string;
  today: string;
  onCancel: () => void;
  onBusy: (busy: boolean) => void;
  onCreated: (job: Job) => void;
}) {
  const ids = useId();
  const [client, setClient] = useState<PickedClient | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [later, setLater] = useState(false);
  const [date, setDate] = useState(defaults.date ?? today);
  const [start, setStart] = useState(defaults.time ?? "09:00");
  const [end, setEnd] = useState(addMinutesToTime(defaults.time ?? "09:00", 60));
  const [address, setAddress] = useState("");
  const [assignees, setAssignees] = useState<string[]>(
    // Equipe de uma pessoa só: já vem marcada.
    team.length === 1 && team[0] ? [team[0].id] : [],
  );
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  function pickClient(next: PickedClient | null) {
    // Endereço do serviço = o do cliente, a não ser que o dono já tenha digitado outro.
    setAddress((current) =>
      current.trim() === "" || current === (client?.address ?? "")
        ? (next?.address ?? "")
        : current,
    );
    setClient(next);
    setErrors((e) => ({ ...e, clientId: undefined }));
  }

  function changeStart(next: string) {
    // Mantém a duração ao mudar o início.
    const [sh = 0, sm = 0] = start.split(":").map(Number);
    const [eh = 0, em = 0] = end.split(":").map(Number);
    const duration = Math.max(15, eh * 60 + em - (sh * 60 + sm));
    setStart(next);
    if (next) setEnd(addMinutesToTime(next, duration));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const next: Partial<Record<Field, string>> = {};

    const cents = parseDollars(value);
    if (cents === undefined) next.valueCents = "Enter an amount like 150 or 150.00.";
    if (!later && (!date || !start || !end)) next.startAt = "Pick a day and a start time.";
    else if (!later && end <= start) next.endAt = "The end time must be after the start time.";

    const body = {
      clientId: client?.id ?? "",
      title,
      description: description.trim() || undefined,
      startAt: later || next.startAt ? null : zonedToUtc(date, start, timeZone).toISOString(),
      endAt: later || next.startAt ? null : zonedToUtc(date, end, timeZone).toISOString(),
      address: address.trim() || null,
      assigneeIds: assignees,
      notes: notes.trim() || undefined,
      valueCents: cents ?? null,
    };
    const parsed = CreateJobRequest.safeParse(body);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = FIELDS.find((f) => f === issue.path[0]);
        if (field && !next[field]) next[field] = issue.message;
      }
      if (Object.keys(next).length === 0) {
        next.title = parsed.error.issues[0]?.message ?? "Please check the form.";
      }
    }
    setErrors(next);
    const firstField = Object.keys(next)[0];
    if (!parsed.success || firstField) {
      document.getElementById(`${ids}-${firstField ?? "title"}`)?.focus();
      return;
    }

    setPending(true);
    onBusy(true);
    try {
      const result = await clientsApi("/api/office/jobs", JobResponse, {
        method: "POST",
        body: parsed.data,
      });
      onCreated(result.job);
    } catch (err) {
      setError(toClientsError(err));
      setPending(false);
      onBusy(false);
    }
  }

  const errorProps = (field: Field) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `${ids}-${field}-error` }
      : {};

  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`${ids}-${field}-error`} className={fieldErrorClass}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-label="New job">
      <fieldset disabled={pending} className="grid gap-5">
        <ClientPicker
          inputId={`${ids}-clientId`}
          value={client}
          onChange={pickClient}
          error={errors.clientId}
          errorId={`${ids}-clientId-error`}
        />

        <div>
          <label htmlFor={`${ids}-title`} className={labelClass}>
            What&rsquo;s the job?
          </label>
          <input
            id={`${ids}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoComplete="off"
            autoCapitalize="sentences"
            maxLength={160}
            placeholder="Water heater install"
            className={`${fieldClass} mt-1.5 h-11`}
            {...errorProps("title")}
          />
          {errorText("title")}
        </div>

        <div>
          <label htmlFor={`${ids}-description`} className={labelClass}>
            Details <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id={`${ids}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            maxLength={4000}
            placeholder="What needs to be done"
            className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
            {...errorProps("description")}
          />
          {errorText("description")}
        </div>

        <fieldset>
          <legend className={labelClass}>When</legend>
          {!later && (
            <div className="mt-1.5 grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor={`${ids}-date`} className="sr-only">
                  Day
                </label>
                <input
                  id={`${ids}-date`}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={`${fieldClass} h-11`}
                  {...errorProps("startAt")}
                />
              </div>
              <div>
                <label htmlFor={`${ids}-startAt`} className="sr-only">
                  Start time
                </label>
                <input
                  id={`${ids}-startAt`}
                  type="time"
                  step={900}
                  value={start}
                  onChange={(event) => changeStart(event.target.value)}
                  className={`${fieldClass} h-11`}
                  {...errorProps("startAt")}
                />
              </div>
              <div>
                <label htmlFor={`${ids}-endAt`} className="sr-only">
                  End time
                </label>
                <input
                  id={`${ids}-endAt`}
                  type="time"
                  step={900}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className={`${fieldClass} h-11`}
                  {...errorProps("endAt")}
                />
              </div>
            </div>
          )}
          {errorText("startAt")}
          {errorText("endAt")}
          <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink">
            <input
              type="checkbox"
              checked={later}
              onChange={(event) => setLater(event.target.checked)}
              className="size-5 accent-brand"
            />
            No date yet (keep it in Unscheduled)
          </label>
        </fieldset>

        <div>
          <label htmlFor={`${ids}-address`} className={labelClass}>
            Address
          </label>
          <input
            id={`${ids}-address`}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoComplete="off"
            placeholder="123 Main St, Austin, TX"
            maxLength={300}
            className={`${fieldClass} mt-1.5 h-11`}
            {...errorProps("address")}
          />
          {errorText("address")}
          {client && !client.address && (
            <p className={hintClass}>We&rsquo;ll save it on the job only.</p>
          )}
        </div>

        {team.length > 0 && (
          <AssigneePicker team={team} value={assignees} onChange={setAssignees} />
        )}

        <div className="grid gap-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
          <div>
            <label htmlFor={`${ids}-valueCents`} className={labelClass}>
              Value <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <div className="relative mt-1.5">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500"
              >
                $
              </span>
              <input
                id={`${ids}-valueCents`}
                inputMode="decimal"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoComplete="off"
                placeholder="0.00"
                maxLength={12}
                className={`${fieldClass} h-11 pl-7 tabular-nums`}
                {...errorProps("valueCents")}
              />
            </div>
            {errorText("valueCents")}
          </div>
          <div>
            <label htmlFor={`${ids}-notes`} className={labelClass}>
              Notes for the team <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id={`${ids}-notes`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="Gate code, parts to bring…"
              className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
              {...errorProps("notes")}
            />
            {errorText("notes")}
          </div>
        </div>
      </fieldset>

      {error && <ErrorNote error={error} className="mt-5" />}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <GlassButton variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" variant="primary" loading={pending}>
          {pending ? "Saving…" : "Save job"}
        </GlassButton>
      </div>
    </form>
  );
}

// ---------- quem vai ----------

/** Cápsulas de marcar (uma por membro ativo, com a cor da pessoa). */
export function AssigneePicker({
  team,
  value,
  onChange,
  legend = "Who's going",
}: {
  team: TeamMember[];
  value: string[];
  onChange: (next: string[]) => void;
  legend?: string;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {team.map((member) => {
          const checked = value.includes(member.id);
          return (
            <label
              key={member.id}
              className="glass glass-flat glass-interactive flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold text-(--glass-fg) has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(checked ? value.filter((id) => id !== member.id) : [...value, member.id])
                }
                className="sr-only"
              />
              <TeamDot color={member.color} />
              {member.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// ---------- cliente ----------

/**
 * Busca nos clientes do dono (GET /api/clients, uma vez) ou cadastro rápido com nome e telefone
 * (POST /api/clients). O cliente escolhido aparece numa linha com "Change".
 */
function ClientPicker({
  inputId,
  value,
  onChange,
  error,
  errorId,
}: {
  inputId: string;
  value: PickedClient | null;
  onChange: (client: PickedClient | null) => void;
  error?: string;
  errorId: string;
}) {
  const ids = useId();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [loadError, setLoadError] = useState<ClientsApiError | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let alive = true;
    clientsApi("/api/clients", ClientsResponse)
      .then((result) => {
        if (alive) setClients(result.clients);
      })
      .catch((err: unknown) => {
        if (alive) setLoadError(toClientsError(err));
      });
    return () => {
      alive = false;
    };
  }, []);

  const found = useMemo(
    () => (clients ?? []).filter((client) => matches(client, query)).slice(0, MAX_MATCHES),
    [clients, query],
  );

  if (value) {
    return (
      <div>
        <p className={labelClass}>Client</p>
        <div className="glass glass-flat mt-1.5 flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2">
          <Avatar name={value.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-ink">{value.name}</span>
            {(value.phone || value.address) && (
              <span className="block truncate text-[13px] text-slate-500">
                {[value.phone, value.address].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="max-sm:min-h-11"
          >
            Change
          </GlassButton>
        </div>
      </div>
    );
  }

  if (creating) {
    return (
      <QuickClientForm
        initialName={query}
        onCancel={() => setCreating(false)}
        onCreated={(client) => {
          setClients((list) => (list ? [client, ...list] : [client]));
          setCreating(false);
          onChange(client);
        }}
      />
    );
  }

  return (
    <div>
      <p id={`${ids}-label`} className={labelClass}>
        Client
      </p>
      <GlassSearchField
        id={inputId}
        label="Search your clients"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
        onKeyDown={(event) => {
          // Enter na busca não envia o formulário do serviço: com um só resultado, escolhe ele.
          if (event.key !== "Enter") return;
          event.preventDefault();
          const only = found.length === 1 ? found[0] : undefined;
          if (only) {
            onChange({ id: only.id, name: only.name, phone: only.phone, address: only.address });
          }
        }}
        placeholder="Search name or phone"
        autoComplete="off"
        className="mt-1.5"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className={fieldErrorClass}>
          {error}
        </p>
      )}
      <div className="mt-2 grid gap-1">
        {clients === null && !loadError && (
          <p className="flex min-h-11 items-center gap-2 px-1 text-[15px] text-slate-500">
            <SpinnerIcon /> Loading your clients…
          </p>
        )}
        {loadError && <ErrorNote error={loadError} />}
        {clients !== null && (
          <ul aria-labelledby={`${ids}-label`} className="grid gap-1">
            {found.map((client) => (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      id: client.id,
                      name: client.name,
                      phone: client.phone,
                      address: client.address,
                    })
                  }
                  className={cx(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:outline-brand",
                  )}
                >
                  <Avatar name={client.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink">
                      {client.name}
                    </span>
                    {(client.phone || client.address) && (
                      <span className="block truncate text-[13px] text-slate-500">
                        {[client.phone, client.address].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {found.length === 0 && query.trim() && (
              <li className="px-2 py-2 text-[15px] text-slate-500">
                No client matches &ldquo;{query.trim()}&rdquo;.
              </li>
            )}
          </ul>
        )}
        <GlassButton
          variant="secondary"
          icon={<PlusIcon />}
          onClick={() => setCreating(true)}
          className="mt-1 justify-self-start"
        >
          {query.trim() ? `New client “${query.trim().slice(0, 30)}”` : "New client"}
        </GlassButton>
      </div>
    </div>
  );
}

/** Cadastro rápido: só nome e telefone (o resto se completa depois na ficha do cliente). */
function QuickClientForm({
  initialName,
  onCancel,
  onCreated,
}: {
  initialName: string;
  onCancel: () => void;
  onCreated: (client: Client) => void;
}) {
  const ids = useId();
  const [name, setName] = useState(initialName.trim());
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  async function save() {
    if (pending) return;
    setError(null);
    // Quem é agendado já falou com o dono: "Contacted" (como no cadastro manual).
    const parsed = CreateClientRequest.safeParse({
      name,
      phone: phone.trim() || null,
      stage: "contacted",
    });
    if (!parsed.success) {
      const next: { name?: string; phone?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "name" || key === "phone") && !next[key]) next[key] = issue.message;
      }
      if (!next.name && !next.phone) next.phone = "Add a phone number.";
      setErrors(next);
      document.getElementById(`${ids}-${next.name ? "name" : "phone"}`)?.focus();
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await clientsApi("/api/clients", ClientResponse, {
        method: "POST",
        body: parsed.data,
      });
      onCreated(result.client);
    } catch (err) {
      setError(toClientsError(err));
      setPending(false);
    }
  }

  // Não é um <form> (já estamos dentro do formulário do serviço): Enter salva o cliente.
  const onEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void save();
    }
  };

  return (
    <div
      role="group"
      aria-labelledby={`${ids}-legend`}
      className="glass glass-flat rounded-2xl p-4"
    >
      <p id={`${ids}-legend`} className="text-[15px] font-semibold text-ink">
        New client
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-name`} className={labelClass}>
            Name
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={onEnter}
            autoComplete="off"
            autoCapitalize="words"
            maxLength={120}
            disabled={pending}
            className={`${fieldClass} mt-1.5 h-11`}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${ids}-name-error` : undefined}
          />
          {errors.name && (
            <p id={`${ids}-name-error`} className={fieldErrorClass}>
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${ids}-phone`} className={labelClass}>
            Mobile phone
          </label>
          <input
            id={`${ids}-phone`}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            onKeyDown={onEnter}
            autoComplete="off"
            placeholder="(512) 555-0100"
            maxLength={40}
            disabled={pending}
            className={`${fieldClass} mt-1.5 h-11`}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? `${ids}-phone-error` : undefined}
          />
          {errors.phone && (
            <p id={`${ids}-phone-error`} className={fieldErrorClass}>
              {errors.phone}
            </p>
          )}
        </div>
      </div>
      {error && <ErrorNote error={error} className="mt-4" />}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <GlassButton variant="ghost" onClick={onCancel} disabled={pending}>
          Back to search
        </GlassButton>
        <GlassButton variant="secondary" onClick={() => void save()} loading={pending}>
          {pending ? "Adding…" : "Add client"}
        </GlassButton>
      </div>
    </div>
  );
}
