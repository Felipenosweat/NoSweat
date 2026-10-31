"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { BUSINESS } from "./content";

// Pedido de catering ou do truck. É uma DEMONSTRAÇÃO: nada é enviado nem guardado, e isso
// está escrito antes do botão e na confirmação. Validação nativa do navegador + uma regra do
// dono (mínimo de 25 convidados para catering, até 100 para o truck), com a mensagem ligada ao
// campo (aria-describedby).

type Kind = "catering" | "truck" | "brisket";

const KINDS: { id: Kind; label: string; detail: string }[] = [
  { id: "catering", label: "Catering", detail: "$22 per person · 25 guests min" },
  { id: "truck", label: "The truck", detail: "From $1,500 · up to 100 guests" },
  { id: "brisket", label: "Whole brisket", detail: "$95 · 48 hours notice" },
];

const field =
  "sr-field mt-2 block h-12 w-full border border-[var(--sr-line-strong)] bg-[var(--sr-coal)] px-4 text-[16px] text-[var(--sr-smoke)] placeholder:text-[var(--sr-ash)]";
const label = "sr-label text-[11px] text-[var(--sr-ash)]";

export function CateringForm() {
  const id = useId();
  const [kind, setKind] = useState<Kind>("catering");
  const [guests, setGuests] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const status = useRef<HTMLParagraphElement>(null);

  const count = Number(guests);
  const guestError =
    guests === ""
      ? null
      : kind === "catering" && count < 25
        ? "Catering starts at 25 guests."
        : kind === "truck" && count > 100
          ? "The truck serves up to 100 guests."
          : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (guestError) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    setSent(name.split(" ")[0] || "there");
    requestAnimationFrame(() => status.current?.focus());
  };

  if (sent) {
    return (
      <div className="sr-ticket p-6 sm:p-8">
        <p
          ref={status}
          role="status"
          tabIndex={-1}
          className="sr-display text-[clamp(2rem,3.4vw,2.8rem)] leading-[0.95] outline-none"
        >
          Thanks, {sent}. This is a demo, so nothing was sent.
        </p>
        <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.6] text-[var(--sr-smoke)]/85">
          On a real Smoke &amp; Rail site this request would reach Keisha, who runs catering and the
          truck. To book for real you would call {BUSINESS.phone}.
        </p>
        <button
          type="button"
          onClick={() => setSent(null)}
          className="sr-btn-ghost sr-focus mt-6 inline-flex h-12 items-center px-5 text-[12px]"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="sr-ticket p-6 sm:p-8" aria-describedby={`${id}-demo`}>
      <p
        id={`${id}-demo`}
        className="sr-label inline-flex items-center gap-2 border border-[var(--sr-ember)] px-3 py-1.5 text-[11px] text-[var(--sr-ember)]"
      >
        Demo form · nothing is sent
      </p>
      <fieldset className="mt-6">
        <legend className={label}>What are you planning?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {KINDS.map((option) => (
            <label key={option.id} className="sr-choice sr-focus-within cursor-pointer">
              <input
                type="radio"
                name="kind"
                value={option.id}
                checked={kind === option.id}
                onChange={() => setKind(option.id)}
                className="sr-only"
              />
              <span className="sr-display block text-[22px] leading-none">{option.label}</span>
              <span className="mt-1.5 block text-[13px] text-[var(--sr-ash)]">{option.detail}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Your name</span>
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className={label}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="block">
          <span className={label}>Date</span>
          <input name="date" type="date" required className={field} />
        </label>
        {kind === "brisket" ? (
          <label className="block">
            <span className={label}>How many briskets</span>
            <input name="count" type="number" min={1} defaultValue={1} className={field} />
          </label>
        ) : (
          <label className="block">
            <span className={label}>Guests</span>
            <input
              name="guests"
              type="number"
              inputMode="numeric"
              min={1}
              required
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
              aria-invalid={guestError ? true : undefined}
              aria-describedby={`${id}-guests`}
              className={field}
            />
            <span
              id={`${id}-guests`}
              className={`mt-2 block text-[13px] ${guestError ? "text-[var(--sr-ember)]" : "text-[var(--sr-ash)]"}`}
            >
              {guestError ??
                (kind === "catering"
                  ? "25 guests minimum, one week notice."
                  : "Up to 100 guests, book a month ahead.")}
            </span>
          </label>
        )}
      </div>
      <label className="mt-5 block">
        <span className={label}>Anything else (optional)</span>
        <textarea
          name="notes"
          rows={3}
          className={`${field} h-auto py-3 leading-[1.5]`}
          placeholder="Venue, meats you want, timing"
        />
      </label>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[34ch] text-[13px] leading-[1.5] text-[var(--sr-ash)]">
          This is a design demo: the form checks your answers but does not send or store them.
        </p>
        <button
          type="submit"
          className="sr-btn sr-focus inline-flex h-12 shrink-0 items-center justify-center px-6 text-[13px]"
        >
          Ask about this date
        </button>
      </div>
    </form>
  );
}
