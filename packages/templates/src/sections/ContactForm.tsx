"use client";

import { useState, type FormEvent } from "react";

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-ns-border bg-ns-background px-4 py-3 text-base text-ns-text placeholder:text-ns-muted/70 focus:border-ns-primary focus:ring-2 focus:ring-ns-primary/20 focus:outline-none";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; message: string };

export type ContactFormProps = {
  /** Para onde o formulário envia (POST JSON). Sem endpoint (ex.: preview) o envio fica desligado. */
  endpoint?: string;
  submitLabel: string;
};

/** Formulário de contato do site publicado: envia o pedido para o painel do dono do site. */
export function ContactForm({ endpoint, submitLabel }: ContactFormProps) {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!endpoint) return;
    const form = event.currentTarget;
    // O campo-isca tem um nome que o preenchimento automático do navegador não reconhece
    // ("company" era preenchido pelo autofill); para a API ele continua sendo `company`.
    const { ns_hp: honeypot, ...fields } = Object.fromEntries(new FormData(form).entries());
    const data = { ...fields, company: typeof honeypot === "string" ? honeypot : "" };

    setStatus({ state: "sending" });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setStatus({
          state: "error",
          message: body?.error?.message ?? "Something went wrong. Please call us instead.",
        });
        return;
      }
      form.reset();
      setStatus({ state: "sent" });
    } catch {
      setStatus({ state: "error", message: "We couldn't send your message. Please try again." });
    }
  }

  if (status.state === "sent") {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-ns-border bg-ns-background p-10 text-center shadow-sm"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-ns-primary text-2xl text-ns-on-primary">
          ✓
        </span>
        <p className="text-xl font-semibold">Thanks! Your message was sent.</p>
        <p className="text-ns-muted">We&rsquo;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-ns-border bg-ns-background p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium sm:col-span-2">
          Full name
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Jane Smith"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Phone
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(555) 555-0100"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          How can we help?
          <textarea
            name="message"
            required
            rows={4}
            placeholder="Tell us a little about what you need..."
            className={inputClass}
          />
        </label>
        {/* Isca para robôs: invisível para pessoas, precisa ficar vazia. */}
        <input
          name="ns_hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] size-px opacity-0"
        />
      </div>

      {status.state === "error" && (
        <p role="alert" className="mt-4 text-sm font-medium text-ns-primary">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!endpoint || status.state === "sending"}
        className="mt-6 w-full rounded-xl bg-ns-primary px-6 py-4 text-base font-semibold text-ns-on-primary shadow-lg shadow-ns-primary/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status.state === "sending" ? "Sending..." : submitLabel}
      </button>
      <p className="mt-3 text-center text-sm text-ns-muted">
        {endpoint
          ? "We’ll get back to you soon."
          : "Preview: the form starts working once the site is published."}
      </p>
    </form>
  );
}
