"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { SUITES } from "./content";

// Pedido de reserva em três passos (datas → suíte → contato) e uma confirmação. É uma
// DEMONSTRAÇÃO: nada é enviado nem guardado, e isso está escrito no topo do formulário e na
// confirmação. Os campos usam a validação nativa do navegador; o foco vai para o título de
// cada passo para quem usa leitor de tela.

type Step = 0 | 1 | 2 | 3;

const STEPS = ["Dates", "Suite", "Details"];

function today(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

const field =
  "a-focus mt-2 block w-full border-0 border-b border-[var(--a-ink)]/30 bg-transparent px-0 py-3 text-[17px] text-[var(--a-ink)] placeholder:text-[var(--a-ink)]/55 focus:border-[var(--a-claret)] focus:ring-0";
const label = "a-caps text-[10px] text-[var(--a-ink)]/65";

function Legend({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h3
      id={id}
      tabIndex={-1}
      className="a-display text-[clamp(1.9rem,3vw,2.6rem)] leading-none text-[var(--a-ink)] outline-none"
    >
      {children}
    </h3>
  );
}

export function Reserve() {
  const id = useId();
  const [step, setStep] = useState<Step>(0);
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [guests, setGuests] = useState(2);
  const [suite, setSuite] = useState(SUITES[0]?.id ?? "");
  const [name, setName] = useState("");

  const go = (next: Step) => {
    setStep(next);
    requestAnimationFrame(() => document.getElementById(`${id}-h${next}`)?.focus());
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 2) go((step + 1) as Step);
    else go(3);
  };

  const nights =
    arrival && departure
      ? Math.max(0, Math.round((Date.parse(departure) - Date.parse(arrival)) / 86_400_000))
      : 0;
  const chosen = SUITES.find((item) => item.id === suite);

  if (step === 3) {
    return (
      <div className="a-reserve-done" role="status">
        <p className="a-caps text-[11px] text-[var(--a-claret)]">Request noted · Demonstration</p>
        <Legend id={`${id}-h3`}>Thank you{name ? `, ${name.split(" ")[0]}` : ""}.</Legend>
        <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.7] text-[var(--a-ink)]/75">
          In a real estate the concierge would now write to confirm{" "}
          {chosen ? <>the {chosen.name.replace("The ", "")}</> : "your suite"}
          {nights ? ` for ${nights} night${nights === 1 ? "" : "s"}` : ""}. This is a demonstration:
          no reservation was made and nothing was sent.
        </p>
        <button
          type="button"
          onClick={() => go(0)}
          className="a-caps a-btn-ink a-focus mt-8 inline-flex h-12 items-center px-7 text-[11px]"
        >
          Start again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} aria-labelledby={`${id}-h${step}`}>
      <p className="a-caps mb-8 inline-flex items-center gap-2 border border-[var(--a-claret)]/40 px-3 py-1.5 text-[10px] text-[var(--a-claret)]">
        Demonstration · no booking is made
      </p>
      <ol className="mb-10 flex gap-6" aria-label="Steps">
        {STEPS.map((title, index) => (
          <li
            key={title}
            aria-current={index === step ? "step" : undefined}
            className={`a-caps flex items-center gap-2 text-[10px] ${index === step ? "text-[var(--a-ink)]" : "text-[var(--a-ink)]/70"}`}
          >
            <span
              className={`grid size-6 place-items-center rounded-full border text-[10px] ${
                index <= step
                  ? "border-[var(--a-claret)] text-[var(--a-claret)]"
                  : "border-[var(--a-ink)]/25"
              }`}
            >
              {index + 1}
            </span>
            {title}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <fieldset className="a-step">
          <legend className="sr-only">Dates and guests</legend>
          <Legend id={`${id}-h0`}>When will you arrive?</Legend>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Arrival</span>
              <input
                type="date"
                required
                min={today(1)}
                value={arrival}
                onChange={(event) => setArrival(event.target.value)}
                className={field}
              />
            </label>
            <label className="block">
              <span className={label}>Departure</span>
              <input
                type="date"
                required
                min={arrival || today(2)}
                value={departure}
                onChange={(event) => setDeparture(event.target.value)}
                className={field}
              />
            </label>
          </div>
          <div className="mt-8">
            <span className={label} id={`${id}-guests`}>
              Guests
            </span>
            <div
              className="mt-3 flex items-center gap-5"
              role="group"
              aria-labelledby={`${id}-guests`}
            >
              <button
                type="button"
                onClick={() => setGuests((value) => Math.max(1, value - 1))}
                className="a-focus grid size-11 place-items-center rounded-full border border-[var(--a-ink)]/30 text-lg"
              >
                <span className="sr-only">Fewer guests</span>−
              </button>
              <output className="a-display w-8 text-center text-3xl" aria-live="polite">
                {guests}
              </output>
              <button
                type="button"
                onClick={() => setGuests((value) => Math.min(6, value + 1))}
                className="a-focus grid size-11 place-items-center rounded-full border border-[var(--a-ink)]/30 text-lg"
              >
                <span className="sr-only">More guests</span>+
              </button>
            </div>
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="a-step">
          <legend className="sr-only">Suite</legend>
          <Legend id={`${id}-h1`}>Choose your suite</Legend>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {SUITES.map((item) => (
              <label
                key={item.id}
                className="a-focus-within relative flex cursor-pointer flex-col border border-[var(--a-ink)]/20 p-5 transition-colors has-checked:border-[var(--a-claret)] has-checked:bg-[var(--a-claret)]/[0.04]"
              >
                <input
                  type="radio"
                  name="suite"
                  value={item.id}
                  checked={suite === item.id}
                  onChange={() => setSuite(item.id)}
                  className="sr-only"
                />
                <span className="a-display text-xl leading-tight text-[var(--a-ink)]">
                  {item.name}
                </span>
                <span className="mt-2 text-[13px] text-[var(--a-ink)]/65">
                  {item.size} · {item.guests}
                </span>
                <span className="a-caps mt-3 text-[10px] text-[var(--a-claret)]">
                  From {item.from} a night
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="a-step">
          <legend className="sr-only">Your details</legend>
          <Legend id={`${id}-h2`}>How may we reach you?</Legend>
          <div className="mt-8 grid gap-6">
            <label className="block">
              <span className={label}>Full name</span>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={field}
              />
            </label>
            <label className="block">
              <span className={label}>Email</span>
              <input type="email" required autoComplete="email" className={field} />
            </label>
            <label className="block">
              <span className={label}>An occasion, or a wish (optional)</span>
              <textarea rows={2} className={`${field} resize-none`} />
            </label>
          </div>
        </fieldset>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {step > 0 && (
          <button
            type="button"
            onClick={() => go((step - 1) as Step)}
            className="a-caps a-focus h-12 px-2 text-[11px] text-[var(--a-ink)]/70 hover:text-[var(--a-ink)]"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          className="a-caps a-btn-ink a-focus inline-flex h-12 items-center px-8 text-[11px]"
        >
          {step === 2 ? "Send request" : "Continue"}
        </button>
        {step === 0 && nights > 0 && (
          <p className="text-[13px] text-[var(--a-ink)]/65">
            {nights} night{nights === 1 ? "" : "s"} · {guests} guest{guests === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </form>
  );
}
