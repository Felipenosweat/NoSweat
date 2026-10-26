"use client";

import { ClientResponse, CreateClientRequest, type ClientStage } from "@nosweat/schema";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { GlassButton, cx, focusRing } from "@/components/glass";
import { CLIENT_STAGES, STAGE_LABELS, parseTagsInput } from "@/lib/clients";
import { ErrorNote, clientsApi, toClientsError, type ClientsApiError } from "./api";
import { choicePill, fieldClass, fieldErrorClass, hintClass, labelClass } from "./ui";

// Cadastro manual de um cliente: valida com o contrato antes de enviar e avisa quem chamou com o
// cliente novo. Serve na folha "Add client" da lista e na página /clients/new. À vista só nome,
// telefone, e-mail e endereço; etapa, retorno, etiquetas e notas ficam em "More details
// (optional)", fechado (abre sozinho se um desses campos tiver erro).

type Field = "name" | "phone" | "email" | "address" | "notes" | "tags" | "followUpOn";

const FIELDS: readonly Field[] = [
  "name",
  "phone",
  "email",
  "address",
  "notes",
  "tags",
  "followUpOn",
];

/** Campos dentro de "More details (optional)". */
const MORE_FIELDS: readonly Field[] = ["notes", "tags", "followUpOn"];

/** Etiquetas comuns de pequenos negócios dos EUA (um toque para acrescentar). */
export const SUGGESTED_TAGS = ["Repeat", "VIP", "Referral", "Commercial", "Residential"] as const;

/** Primeira mensagem de erro de cada campo. */
function fieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Partial<Record<Field, string>> {
  const out: Partial<Record<Field, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    const field = FIELDS.find((f) => f === key);
    if (field && !out[field]) out[field] = issue.message;
  }
  return out;
}

/** Acrescenta uma etiqueta ao texto "a, b" (sem repetir, sem diferença de maiúsculas). */
export function addTagToInput(input: string, tag: string): string {
  const tags = parseTagsInput(input);
  if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return tags.join(", ");
  return [...tags, tag].join(", ");
}

/** Botões de etiquetas sugeridas (as que já estão no campo somem). */
export function TagSuggestions({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const current = new Set(parseTagsInput(value).map((t) => t.toLowerCase()));
  const options = SUGGESTED_TAGS.filter((tag) => !current.has(tag.toLowerCase()));
  if (options.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.map((tag) => (
        <GlassButton
          key={tag}
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange(addTagToInput(value, tag))}
        >
          <span aria-hidden="true">+</span> {tag}
          <span className="sr-only"> tag</span>
        </GlassButton>
      ))}
    </div>
  );
}

export function ClientForm({
  onCreated,
  onCancel,
  cancelSlot,
}: {
  /** Cliente salvo: quem chamou decide para onde ir. */
  onCreated: (clientId: string) => void;
  /** Botão "Cancel" (na folha). */
  onCancel?: () => void;
  /** Ou um link de cancelar (na página /clients/new). */
  cancelSlot?: ReactNode;
}) {
  const ids = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [followUpOn, setFollowUpOn] = useState("");
  // Quem é cadastrado à mão normalmente já conversou com o dono: "Contacted", e não "New" (que
  // faria o painel dizer que a pessoa está esperando resposta).
  const [stage, setStage] = useState<ClientStage>("contacted");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const parsed = CreateClientRequest.safeParse({
      name,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || undefined,
      tags: parseTagsInput(tags),
      followUpOn: followUpOn || null,
      stage,
    });
    if (!parsed.success) {
      const next = fieldErrors(parsed.error.issues);
      // Nenhum erro ligado a um campo visível: mostra a primeira mensagem embaixo do formulário
      // (nunca falhar em silêncio).
      if (Object.keys(next).length === 0) {
        next.name = parsed.error.issues[0]?.message ?? "Please check the form.";
      }
      setErrors(next);
      // Erro num campo da seção fechada: abre antes de levar o foco (nada de erro escondido).
      if (MORE_FIELDS.some((field) => next[field])) {
        const more = document.getElementById(`${ids}-more`);
        if (more instanceof HTMLDetailsElement) more.open = true;
      }
      document.getElementById(`${ids}-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await clientsApi("/api/clients", ClientResponse, {
        method: "POST",
        body: parsed.data,
      });
      onCreated(result.client.id);
    } catch (err) {
      setError(toClientsError(err));
      setPending(false);
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
    <form onSubmit={(event) => void submit(event)} noValidate aria-label="Add client">
      <fieldset disabled={pending} className="grid gap-5">
        <div>
          <label htmlFor={`${ids}-name`} className={labelClass}>
            Name
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            autoCapitalize="words"
            required
            maxLength={120}
            className={`${fieldClass} mt-1.5 h-11`}
            {...errorProps("name")}
          />
          {errorText("name")}
        </div>

        <div>
          <div className="grid gap-5 sm:grid-cols-2">
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
                autoComplete="off"
                placeholder="(512) 555-0100"
                maxLength={40}
                className={`${fieldClass} mt-1.5 h-11`}
                {...errorProps("phone")}
              />
              {errorText("phone")}
            </div>
            <div>
              <label htmlFor={`${ids}-email`} className={labelClass}>
                Email
              </label>
              <input
                id={`${ids}-email`}
                type="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                maxLength={254}
                className={`${fieldClass} mt-1.5 h-11`}
                {...errorProps("email")}
              />
              {errorText("email")}
            </div>
          </div>
          <p className={hintClass}>Add at least a phone number or an email.</p>
        </div>

        <div>
          <label htmlFor={`${ids}-address`} className={labelClass}>
            Service address <span className="font-normal text-slate-500">(optional)</span>
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
        </div>

        <details id={`${ids}-more`} className="group/more">
          <summary
            className={cx(
              "-mx-1 inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-xl px-1 text-[15px] font-semibold text-brand [&::-webkit-details-marker]:hidden",
              focusRing,
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-4 motion-safe:transition-transform group-open/more:rotate-90"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            More details <span className="font-normal text-slate-500">(optional)</span>
          </summary>
          <div className="mt-3 grid gap-5">
            <fieldset>
              <legend className={labelClass}>Stage</legend>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CLIENT_STAGES.map((option) => (
                  <label key={option} className={choicePill}>
                    <input
                      type="radio"
                      name={`${ids}-stage`}
                      value={option}
                      checked={stage === option}
                      onChange={() => setStage(option)}
                      className="sr-only"
                    />
                    {STAGE_LABELS[option]}
                  </label>
                ))}
              </div>
              <p className={hintClass}>
                Pick &ldquo;New&rdquo; only if they&rsquo;re still waiting to hear back from you.
              </p>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor={`${ids}-followUpOn`} className={labelClass}>
                  Follow up on
                </label>
                <input
                  id={`${ids}-followUpOn`}
                  type="date"
                  value={followUpOn}
                  onChange={(event) => setFollowUpOn(event.target.value)}
                  className={`${fieldClass} mt-1.5 h-11`}
                  {...errorProps("followUpOn")}
                />
                {errorText("followUpOn")}
              </div>
              <div>
                <label htmlFor={`${ids}-tags`} className={labelClass}>
                  Tags
                </label>
                <input
                  id={`${ids}-tags`}
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  autoComplete="off"
                  placeholder="VIP, Referral"
                  maxLength={340}
                  className={`${fieldClass} mt-1.5 h-11`}
                  aria-describedby={errors.tags ? `${ids}-tags-error` : `${ids}-tags-hint`}
                  aria-invalid={errors.tags ? true : undefined}
                />
                {errors.tags ? (
                  errorText("tags")
                ) : (
                  <p id={`${ids}-tags-hint`} className={hintClass}>
                    Like VIP or Referral.
                  </p>
                )}
                <TagSuggestions value={tags} onChange={setTags} disabled={pending} />
              </div>
            </div>

            <div>
              <label htmlFor={`${ids}-notes`} className={labelClass}>
                Notes
              </label>
              <textarea
                id={`${ids}-notes`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Gate code, pets, how they like things done…"
                className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
                {...errorProps("notes")}
              />
              {errorText("notes")}
            </div>
          </div>
        </details>
      </fieldset>

      {error && <ErrorNote error={error} className="mt-5" />}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <GlassButton variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </GlassButton>
        )}
        {cancelSlot}
        <GlassButton type="submit" variant="primary" loading={pending}>
          {pending ? "Saving…" : "Save client"}
        </GlassButton>
      </div>
    </form>
  );
}
