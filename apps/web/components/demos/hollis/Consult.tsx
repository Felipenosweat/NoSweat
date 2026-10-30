"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import {
  BUSINESS,
  CONSULT_PLACES,
  CONSULT_ROOMS,
  CONSULT_TIMING,
  serviceById,
  type Service,
} from "./content";
import { Arrow } from "./ui";

// Pedido de consulta da Hollis em três passos (cômodos → onde e quando → contato) e uma
// confirmação. É uma DEMONSTRAÇÃO: nada é enviado nem guardado, e isso está escrito antes e
// depois. Não pergunta orçamento (a fixture não define faixas); em vez disso, ao lado, mostra
// por onde o projeto começaria com as taxas da própria página (fora da área → e-design). O foco
// vai para o título de cada passo.

type Step = 0 | 1 | 2 | 3;
const STEPS = ["Rooms", "Where & when", "You"];

const field =
  "h-field h-focus mt-2 block w-full border-b border-[var(--h-ink)]/40 bg-transparent px-0 py-2.5 text-[17px] text-[var(--h-ink)] placeholder:text-[var(--h-muted)]";
const label = "text-[13px] text-[var(--h-muted)]";

function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} tabIndex={-1} className="h-h3 outline-none">
      {children}
    </h3>
  );
}

/** Por onde começaria, só com as taxas da fixture. */
function suggestion(rooms: string[], place: string): { service: Service; note: string } {
  if (place === "remote")
    return {
      service: serviceById("edesign"),
      note: "Full projects are in Middle Tennessee; e-design works anywhere in the US.",
    };
  if (rooms.includes("whole"))
    return { service: serviceById("full"), note: "Starts with the in-home consultation." };
  if (rooms.includes("kitchen") || rooms.includes("bath"))
    return {
      service: serviceById("kitchen-bath"),
      note: "Starts with the in-home consultation. Kitchens and baths are priced per room.",
    };
  return {
    service: serviceById("single"),
    note:
      rooms.length > 1
        ? "Starts with the in-home consultation; the design fee for your rooms is quoted after it."
        : "Starts with the in-home consultation.",
  };
}

export function Consult() {
  const id = useId();
  const [step, setStep] = useState<Step>(0);
  const [rooms, setRooms] = useState<string[]>(["living"]);
  const [place, setPlace] = useState<string>("nashville");
  const [timing, setTiming] = useState<string>("season");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const go = (next: Step) => {
    setError("");
    setStep(next);
    requestAnimationFrame(() => document.getElementById(`${id}-h${next}`)?.focus());
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 0 && rooms.length === 0) {
      setError("Choose at least one room, or “Another room”.");
      return;
    }
    if (step === 2) {
      if (!name.trim()) return setError("Add your name so the studio knows who to call.");
      if (!/^\S+@\S+\.\S+$/.test(email.trim()))
        return setError("Add an email address like name@example.com.");
    }
    go((step + 1) as Step);
  };

  const toggle = (room: string) =>
    setRooms((list) => (list.includes(room) ? list.filter((r) => r !== room) : [...list, room]));

  const { service, note } = suggestion(rooms, place);
  const consult = serviceById("consult");
  const roomNames = CONSULT_ROOMS.filter((r) => rooms.includes(r.id)).map((r) => r.label);
  const placeName = CONSULT_PLACES.find((p) => p.id === place)?.label ?? "";
  const timingName = CONSULT_TIMING.find((t) => t.id === timing)?.label ?? "";

  const summary = (
    <aside aria-label="Where you would start" className="h-consult-aside">
      <p className="h-tag">Where you would start</p>
      <dl className="mt-4 divide-y divide-[var(--h-line)] border-y border-[var(--h-line)] text-[14px]">
        {place !== "remote" && (
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt>{consult.name}</dt>
            <dd className="text-right tabular-nums">
              {consult.price} · {consult.time}
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt>{service.name}</dt>
          <dd className="text-right tabular-nums">{service.price}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3 text-[var(--h-muted)]">
          <dt>Usual timeline</dt>
          <dd className="text-right">{service.time.replace(/Per room · |remote · /g, "")}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[13px] leading-[1.55] text-[var(--h-muted)]">
        {note} Design fees are flat; furniture and fixtures at cost plus 15%.
      </p>
    </aside>
  );

  if (step === 3) {
    return (
      <div className="h-consult grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <div role="status" className="h-step">
          <p className="h-tag text-[var(--h-walnut)]">Demonstration · nothing was sent</p>
          <div className="mt-4">
            <Heading id={`${id}-h3`}>
              Thank you{name ? `, ${name.trim().split(" ")[0]}` : ""}.
            </Heading>
          </div>
          <p className="mt-5 max-w-[52ch] text-[16px] leading-[1.7]">
            On a live site this request would go to the studio at {BUSINESS.email}, and Claire or
            Jess would reply to book the visit. This page is a design demonstration by No Sweat:
            nothing was sent or stored.
          </p>
          <dl className="mt-7 grid max-w-[34rem] gap-x-8 gap-y-3 text-[14px] sm:grid-cols-[8rem_1fr]">
            <dt className="text-[var(--h-muted)]">Rooms</dt>
            <dd>{roomNames.join(", ")}</dd>
            <dt className="text-[var(--h-muted)]">Where</dt>
            <dd>{placeName}</dd>
            <dt className="text-[var(--h-muted)]">When</dt>
            <dd>{timingName}</dd>
            <dt className="text-[var(--h-muted)]">Reply to</dt>
            <dd className="break-all">{email}</dd>
          </dl>
          <p className="mt-7 text-[15px]">
            Or call the studio, Mon–Fri 9 AM – 5 PM:{" "}
            <a href={BUSINESS.phoneHref} className="h-link h-focus tabular-nums">
              {BUSINESS.phone}
            </a>{" "}
            <span className="text-[var(--h-muted)]">(a fictional 555 number).</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setName("");
              setEmail("");
              go(0);
            }}
            className="h-focus h-more mt-8"
          >
            Start again <Arrow />
          </button>
        </div>
        {summary}
      </div>
    );
  }

  return (
    <div className="h-consult grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
      <form onSubmit={submit} noValidate aria-describedby={`${id}-demo`}>
        <p id={`${id}-demo`} className="h-tag text-[var(--h-walnut)]">
          Demonstration · this form does not send anything
        </p>
        <ol aria-label="Steps" className="mt-5 flex gap-6 text-[13px]">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? "step" : undefined}
              className={`h-stepper flex items-center gap-2 ${index === step ? "text-[var(--h-ink)]" : "text-[var(--h-muted)]"}`}
            >
              <span className="tabular-nums">0{index + 1}</span>
              <span className={index === step ? "" : "hidden sm:inline"}>{label}</span>
            </li>
          ))}
        </ol>

        <div key={step} className="h-step mt-8">
          {step === 0 && (
            <fieldset>
              <legend>
                <Heading id={`${id}-h0`}>Which rooms are you thinking about?</Heading>
              </legend>
              <div className="mt-6 flex flex-wrap gap-2">
                {CONSULT_ROOMS.map((room) => (
                  <label key={room.id} className="h-chip h-focus-within">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={rooms.includes(room.id)}
                      onChange={() => toggle(room.id)}
                    />
                    {room.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <div>
              <Heading id={`${id}-h1`}>Where is the house, and when?</Heading>
              <fieldset className="mt-6">
                <legend className={label}>Where</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CONSULT_PLACES.map((item) => (
                    <label key={item.id} className="h-chip h-focus-within">
                      <input
                        type="radio"
                        name={`${id}-place`}
                        className="sr-only"
                        checked={place === item.id}
                        onChange={() => setPlace(item.id)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-7">
                <legend className={label}>When would you like to start?</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CONSULT_TIMING.map((item) => (
                    <label key={item.id} className="h-chip h-focus-within">
                      <input
                        type="radio"
                        name={`${id}-timing`}
                        className="sr-only"
                        checked={timing === item.id}
                        onChange={() => setTiming(item.id)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <div>
              <Heading id={`${id}-h2`}>How should the studio reach you?</Heading>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className={label}>Name</span>
                  <input
                    className={field}
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={!!error && !name.trim()}
                    aria-describedby={error ? `${id}-error` : undefined}
                  />
                </label>
                <label className="block">
                  <span className={label}>Email</span>
                  <input
                    className={field}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={!!error && !!name.trim()}
                    aria-describedby={error ? `${id}-error` : undefined}
                  />
                </label>
                <label className="block">
                  <span className={label}>Phone (optional)</span>
                  <input className={field} type="tel" autoComplete="tel" inputMode="tel" />
                </label>
                <label className="block sm:col-span-2">
                  <span className={label}>Anything we should know (optional)</span>
                  <textarea rows={2} className={`${field} resize-none`} />
                </label>
              </div>
            </div>
          )}
        </div>

        <p
          id={`${id}-error`}
          role="alert"
          className="mt-5 min-h-[1.5em] text-[14px] text-[var(--h-walnut)]"
        >
          {error}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="submit" className="h-focus h-btn">
            {step === 2 ? "Send request (demo)" : "Continue"} <Arrow />
          </button>
          {step > 0 && (
            <button
              type="button"
              onClick={() => go((step - 1) as Step)}
              className="h-focus h-link text-[14px]"
            >
              Back
            </button>
          )}
        </div>
      </form>
      {summary}
    </div>
  );
}
