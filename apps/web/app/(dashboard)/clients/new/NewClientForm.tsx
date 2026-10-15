"use client";

import { ClientResponse, CreateClientRequest } from "@nosweat/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { primaryButton, textButton } from "@/components/DashboardUi";
import { ErrorNote, clientsApi, toClientsError, type ClientsApiError } from "../api";
import { fieldClass, fieldErrorClass, hintClass, labelClass } from "../ui";

// Cadastro manual de um cliente: valida com o contrato antes de enviar e abre a ficha nova.

type Field = "name" | "phone" | "email" | "address" | "notes";

/** Primeira mensagem de erro de cada campo. */
function fieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Partial<Record<Field, string>> {
  const out: Partial<Record<Field, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (
      (key === "name" ||
        key === "phone" ||
        key === "email" ||
        key === "address" ||
        key === "notes") &&
      !out[key]
    ) {
      out[key] = issue.message;
    }
  }
  return out;
}

export function NewClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = CreateClientRequest.safeParse({
      name,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await clientsApi("/api/clients", ClientResponse, {
        method: "POST",
        body: parsed.data,
      });
      router.push(`/clients/${encodeURIComponent(result.client.id)}`);
      router.refresh();
    } catch (err) {
      setError(toClientsError(err));
      setPending(false);
    }
  }

  const errorProps = (field: Field) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `new-client-${field}-error` }
      : {};

  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`new-client-${field}-error`} className={fieldErrorClass}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-label="Add client">
      <fieldset disabled={pending} className="grid gap-5">
        <div>
          <label htmlFor="new-client-name" className={labelClass}>
            Name
          </label>
          <input
            id="new-client-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            required
            maxLength={120}
            className={`${fieldClass} mt-1.5 h-11`}
            {...errorProps("name")}
          />
          {errorText("name")}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="new-client-phone" className={labelClass}>
              Phone
            </label>
            <input
              id="new-client-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="off"
              maxLength={40}
              className={`${fieldClass} mt-1.5 h-11`}
              {...errorProps("phone")}
            />
            {errorText("phone")}
          </div>
          <div>
            <label htmlFor="new-client-email" className={labelClass}>
              Email
            </label>
            <input
              id="new-client-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              className={`${fieldClass} mt-1.5 h-11`}
              {...errorProps("email")}
            />
            {errorText("email")}
          </div>
        </div>
        <p className={`-mt-3 ${hintClass}`}>Add at least a phone number or an email.</p>

        <div>
          <label htmlFor="new-client-address" className={labelClass}>
            Address <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="new-client-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoComplete="off"
            maxLength={300}
            className={`${fieldClass} mt-1.5 h-11`}
            {...errorProps("address")}
          />
          {errorText("address")}
        </div>

        <div>
          <label htmlFor="new-client-notes" className={labelClass}>
            Notes <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id="new-client-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="Gate code, pets, how they like things done…"
            className={`${fieldClass} mt-1.5 resize-y py-2.5 leading-[1.55]`}
            {...errorProps("notes")}
          />
          {errorText("notes")}
        </div>
      </fieldset>

      {error && <ErrorNote error={error} className="mt-5" />}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Add client"}
        </button>
        <Link href="/clients" className={textButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
