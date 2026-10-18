"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "../components/icons";
import { foldMessage } from "./fold-message";

/** Modelo do formulário: os campos extras mudam com o tipo de negócio. */
export type ContactFormPreset = "trade" | "appointment" | "catering" | "consultation" | "inquiry";

/** Raio dos campos e do botão, o mesmo da composição. */
export type ContactFormRadius = "none" | "sm" | "md" | "lg";

type ExtraField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "date" | "number";
  required?: boolean;
  autoComplete?: string;
};

type PresetCopy = {
  nameLabel: string;
  namePlaceholder: string;
  extras: ExtraField[];
  messageLabel: string;
  messagePlaceholder?: string;
  /** Sem extras obrigatórios, a mensagem é o que diz o que a pessoa quer. */
  messageRequired: boolean;
};

/*
 * Campos extras de cada modelo. Eles NÃO mudam o contrato da API (LeadRequest): o texto deles
 * vai junto na mensagem, uma linha por campo ("Event date: 2026-11-07"), antes do que a pessoa
 * escreveu. O dono lê tudo no painel, como qualquer outro pedido.
 */
const PRESETS: Record<ContactFormPreset, PresetCopy> = {
  trade: {
    nameLabel: "Full name",
    namePlaceholder: "Jane Smith",
    extras: [
      {
        key: "where",
        label: "Where is the job?",
        placeholder: "Street or ZIP code",
        autoComplete: "street-address",
      },
    ],
    messageLabel: "What's going on?",
    messagePlaceholder: "Water heater leaking, slow drain in the kitchen...",
    messageRequired: true,
  },
  appointment: {
    nameLabel: "Full name",
    namePlaceholder: "Jane Smith",
    extras: [
      {
        key: "service",
        label: "Service",
        placeholder: "Cut and blowout, color...",
        required: true,
      },
      { key: "when", label: "Preferred day and time", placeholder: "Saturday morning" },
    ],
    messageLabel: "Anything we should know?",
    messageRequired: false,
  },
  catering: {
    nameLabel: "Full name",
    namePlaceholder: "Jane Smith",
    extras: [
      { key: "date", label: "Event date", type: "date" },
      { key: "guests", label: "Number of guests", type: "number", placeholder: "40" },
    ],
    messageLabel: "What are you planning?",
    messagePlaceholder: "Office lunch, birthday, pickup or delivery...",
    messageRequired: true,
  },
  consultation: {
    nameLabel: "Full name",
    namePlaceholder: "Jane Smith",
    extras: [
      {
        key: "topic",
        label: "What do you need help with?",
        placeholder: "Monthly books, a tax return, a letter you received...",
        required: true,
      },
    ],
    messageLabel: "Anything else?",
    messageRequired: false,
  },
  inquiry: {
    nameLabel: "Your names",
    namePlaceholder: "Ana & Luis",
    extras: [
      { key: "date", label: "Date", type: "date" },
      { key: "place", label: "Venue or location", placeholder: "Where it will happen" },
    ],
    messageLabel: "Tell me about it",
    messagePlaceholder: "What you have in mind, how many people, what matters most...",
    messageRequired: true,
  },
};

const RADIUS: Record<ContactFormRadius, { field: string; frame: string }> = {
  none: { field: "rounded-none", frame: "rounded-none" },
  sm: { field: "rounded-sm", frame: "rounded-sm" },
  md: { field: "rounded-md", frame: "rounded-lg" },
  lg: { field: "rounded-xl", frame: "rounded-[1.75rem]" },
};

const fieldBase =
  "mt-1.5 block w-full border border-ns-border bg-ns-background px-4 py-3 text-base text-ns-text placeholder:text-ns-muted/70 focus:border-ns-primary focus:ring-2 focus:ring-ns-primary/20 focus:outline-none";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; message: string };

export type ContactFormProps = {
  /** Para onde o formulário envia (POST JSON). Sem endpoint (ex.: preview) o envio fica desligado. */
  endpoint?: string;
  submitLabel: string;
  /** Campos extras por tipo de negócio (padrão: só nome, contato e mensagem). */
  preset?: ContactFormPreset;
  radius?: ContactFormRadius;
  /** `false` quando a composição já põe o formulário dentro de um quadro. */
  framed?: boolean;
};

/** Formulário de contato do site publicado: envia o pedido para o painel do dono do site. */
export function ContactForm({
  endpoint,
  submitLabel,
  preset,
  radius = "md",
  framed = true,
}: ContactFormProps) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const copy = preset ? PRESETS[preset] : null;
  const extras = copy?.extras ?? [];
  const r = RADIUS[radius];
  const inputClass = `${fieldBase} ${r.field}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!endpoint) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const text = (name: string) => {
      const value = values.get(name);
      return typeof value === "string" ? value : "";
    };
    const message = foldMessage(
      extras.map((extra) => ({ label: extra.label, value: text(`x_${extra.key}`) })),
      text("message"),
    );
    if (!message) {
      setStatus({ state: "error", message: "Please tell us how we can help." });
      return;
    }
    // O campo-isca tem um nome que o preenchimento automático do navegador não reconhece
    // ("company" era preenchido pelo autofill); para a API ele continua sendo `company`.
    const data = {
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      message,
      company: text("ns_hp"),
    };

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

  const frame = framed
    ? `${r.frame} border border-ns-border bg-ns-background p-6 @min-[40rem]:p-8`
    : "";

  if (status.state === "sent") {
    return (
      <div
        role="status"
        className={`flex flex-col items-center justify-center gap-3 text-center ${framed ? `${r.frame} border border-ns-border bg-ns-background p-10` : "py-10"}`}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-ns-primary text-ns-on-primary">
          <CheckIcon className="size-7" />
        </span>
        <p className="text-xl font-semibold">Thanks! Your message was sent.</p>
        <p className="text-ns-muted">We&rsquo;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`relative text-ns-text ${frame}`}>
      <div className="grid gap-5 @min-[40rem]:grid-cols-2">
        <label className="block text-sm font-medium @min-[40rem]:col-span-2">
          {copy?.nameLabel ?? "Full name"}
          <input
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            placeholder={copy?.namePlaceholder ?? "Jane Smith"}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Phone
          <input
            name="phone"
            type="tel"
            maxLength={40}
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
        {extras.map((extra) => (
          <label
            key={extra.key}
            className={`block text-sm font-medium ${extras.length === 1 ? "@min-[40rem]:col-span-2" : ""}`}
          >
            {extra.label}
            {!extra.required && <span className="font-normal text-ns-muted"> (optional)</span>}
            <input
              name={`x_${extra.key}`}
              type={extra.type ?? "text"}
              required={extra.required}
              maxLength={extra.type === "number" ? undefined : 120}
              min={extra.type === "number" ? 1 : undefined}
              autoComplete={extra.autoComplete ?? "off"}
              placeholder={extra.placeholder}
              className={`${inputClass} tabular-nums`}
            />
          </label>
        ))}
        <label className="block text-sm font-medium @min-[40rem]:col-span-2">
          {copy?.messageLabel ?? "How can we help?"}
          {copy && !copy.messageRequired && (
            <span className="font-normal text-ns-muted"> (optional)</span>
          )}
          <textarea
            name="message"
            required={copy ? copy.messageRequired : true}
            rows={4}
            maxLength={1500}
            placeholder={copy ? copy.messagePlaceholder : "Tell us a little about what you need..."}
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

      {/* Na prévia (sem endpoint) o botão fica com a cor cheia: desbotado parecia quebrado. */}
      <button
        type="submit"
        disabled={!endpoint || status.state === "sending"}
        className={`mt-6 min-h-12 w-full ${r.field} bg-ns-primary px-6 py-4 text-base font-semibold text-ns-on-primary transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary disabled:cursor-not-allowed disabled:hover:brightness-100 aria-busy:opacity-70 motion-reduce:transition-none`}
        aria-busy={status.state === "sending"}
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
