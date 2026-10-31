"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import type { Barber, OpenHours, Service } from "./content";

// "Book a chair": serviço → barbeiro → horário → conferir, e uma confirmação. É uma
// DEMONSTRAÇÃO: não pede nome nem telefone, nada é enviado nem guardado, e isso está escrito no
// topo, ao conferir e na confirmação. Os dias e horários saem do horário do dono (OPEN_HOURS),
// de meia em meia hora, terminando antes de fechar; não mostramos "ocupado" (seria inventado).
// O quadro de preços chama este fluxo com o serviço já escolhido: links com data-f-pick.

type Step = 0 | 1 | 2 | 3 | 4;
const STEPS = ["Service", "Barber", "Time", "Check"] as const;
const ANY = "any";

type Day = { key: string; date: Date; weekday: string; label: string };

function upcomingDays(hours: OpenHours, count: number): Day[] {
  const days: Day[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  for (let i = 1; days.length < count && i < 21; i++) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + i);
    if (!hours[date.getDay()]) continue;
    days.push({
      key: date.toISOString().slice(0, 10),
      date,
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return days;
}

function clock(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} tabIndex={-1} className="f-book-h">
      {children}
    </h3>
  );
}

export function Booking({
  services,
  barbers,
  hours,
  phone,
  phoneHref,
  cancelNote,
}: {
  services: Service[];
  barbers: Barber[];
  hours: OpenHours;
  phone: string;
  phoneHref: string;
  cancelNote: string;
}) {
  const id = useId();
  const [step, setStep] = useState<Step>(0);
  const [serviceId, setServiceId] = useState(services[1]?.id ?? services[0]?.id ?? "");
  const [barberId, setBarberId] = useState(ANY);
  const [dayKey, setDayKey] = useState("");
  const [slot, setSlot] = useState<number | null>(null);

  // Os dias só aparecem no passo 3, depois de cliques: aí já é o "hoje" de quem visita, não o
  // do servidor (no HTML estático o passo 1 não mostra datas, então não há diferença de hidratação).
  const days = useMemo(() => upcomingDays(hours, 6), [hours]);

  const service = services.find((item) => item.id === serviceId);
  const barber = barbers.find((item) => item.id === barberId);
  const day = days.find((item) => item.key === dayKey) ?? days[0];

  const go = (next: Step) => {
    setStep(next);
    requestAnimationFrame(() => document.getElementById(`${id}-h${next}`)?.focus());
  };

  // Links "Book this" do quadro de preços: escolhem o serviço e pulam para o barbeiro.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLElement>("[data-f-pick]");
      const picked = link?.dataset.fPick;
      if (!picked || !services.some((item) => item.id === picked)) return;
      setServiceId(picked);
      setSlot(null);
      setStep(1);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [services]);

  const slots = useMemo(() => {
    if (!day || !service) return [];
    const open = hours[day.date.getDay()];
    if (!open) return [];
    const list: number[] = [];
    for (let t = open.open; t + service.minutes <= open.close; t += 30) list.push(t);
    return list;
  }, [day, service, hours]);

  const ticket = [
    service?.name ?? "Pick a service",
    step >= 1 ? (barber?.first ?? "First available") : null,
    step >= 2 && day && slot !== null ? `${day.weekday} ${clock(slot)}` : null,
  ].filter(Boolean);

  if (step === 4) {
    return (
      <div className="f-book f-book-done" role="status">
        <p className="f-tag">Demonstration · nothing was sent</p>
        <Heading id={`${id}-h4`}>This is where your chair would be booked</Heading>
        <p className="f-book-p">
          This is a design demo. No booking was made and nothing left this page. At the real Fade
          &amp; Co. this step would hand you to their online booking with {service?.name} and{" "}
          {barber ? barber.first : "the first available barber"} on {day?.weekday} {day?.label} at{" "}
          {slot !== null ? clock(slot) : ""} already filled in.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSlot(null);
              go(0);
            }}
            className="f-btn f-btn-ink f-focus"
          >
            Start over
          </button>
          <a href={phoneHref} className="f-btn f-btn-ghost f-focus">
            Or call {phone}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      className="f-book"
      aria-labelledby={`${id}-h${step}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (step === 2 && slot === null) return;
        go((step + 1) as Step);
      }}
    >
      <div className="f-book-top">
        <p className="f-tag">Demonstration · nothing is sent</p>
        <ol className="f-steps" aria-label="Steps">
          {STEPS.map((title, index) => (
            <li
              key={title}
              aria-current={index === step ? "step" : undefined}
              data-done={index < step || undefined}
            >
              <span className="f-steps-n">{index + 1}</span>
              {title}
            </li>
          ))}
        </ol>
      </div>

      {/* O "bilhete": o que já foi escolhido, em letra grande; muda de largura a cada passo. */}
      <p className="f-ticket" aria-live="polite">
        {ticket.map((part, index) => (
          <span key={index} className="f-ticket-part" data-step={index}>
            {part}
          </span>
        ))}
      </p>

      {step === 0 && (
        <fieldset className="f-step">
          <legend className="sr-only">Service</legend>
          <Heading id={`${id}-h0`}>What are we doing today?</Heading>
          <div className="f-choices f-choices-services">
            {services.map((item) => (
              <label key={item.id} className="f-choice">
                <input
                  type="radio"
                  name="service"
                  value={item.id}
                  checked={serviceId === item.id}
                  onChange={() => setServiceId(item.id)}
                  className="sr-only"
                />
                <span className="f-choice-name">{item.name}</span>
                <span className="f-choice-meta">
                  {item.price}
                  {item.detail ? ` · ${item.detail}` : ""}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="f-step">
          <legend className="sr-only">Barber</legend>
          <Heading id={`${id}-h1`}>Who&rsquo;s cutting?</Heading>
          <div className="f-choices">
            {[
              {
                id: ANY,
                first: "First available",
                name: "",
                role: "",
                note: "Whoever is free first",
              },
              ...barbers,
            ].map((item) => (
              <label key={item.id} className="f-choice">
                <input
                  type="radio"
                  name="barber"
                  value={item.id}
                  checked={barberId === item.id}
                  onChange={() => setBarberId(item.id)}
                  className="sr-only"
                />
                <span className="f-choice-name">{item.first}</span>
                <span className="f-choice-meta">{item.note}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="f-step">
          <legend className="sr-only">Day and time</legend>
          <Heading id={`${id}-h2`}>Pick a time</Heading>
          <p className="f-book-small" id={`${id}-days`}>
            Day
          </p>
          <div className="f-days" role="radiogroup" aria-labelledby={`${id}-days`}>
            {days.map((item) => (
              <label key={item.key} className="f-day">
                <input
                  type="radio"
                  name="day"
                  value={item.key}
                  checked={day?.key === item.key}
                  onChange={() => {
                    setDayKey(item.key);
                    setSlot(null);
                  }}
                  className="sr-only"
                />
                <span className="f-day-w">{item.weekday}</span>
                <span className="f-day-d">{item.label}</span>
              </label>
            ))}
          </div>
          <p className="f-book-small mt-6" id={`${id}-slots`}>
            Time{service ? ` · ${service.name}${service.detail ? `, ${service.detail}` : ""}` : ""}
          </p>
          <div className="f-slots" role="radiogroup" aria-labelledby={`${id}-slots`}>
            {slots.map((minutes) => (
              <label key={minutes} className="f-slot">
                <input
                  type="radio"
                  name="slot"
                  value={minutes}
                  checked={slot === minutes}
                  onChange={() => setSlot(minutes)}
                  className="sr-only"
                />
                {clock(minutes)}
              </label>
            ))}
          </div>
          {slot === null && (
            <p className="f-book-small mt-4" aria-live="polite">
              Choose a time to continue.
            </p>
          )}
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="f-step">
          <legend className="sr-only">Check your chair</legend>
          <Heading id={`${id}-h3`}>Check your chair</Heading>
          <dl className="f-summary">
            <div>
              <dt>Service</dt>
              <dd>
                {service?.name} · {service?.price}
                {service?.detail ? ` · ${service.detail}` : ""}
              </dd>
            </div>
            <div>
              <dt>Barber</dt>
              <dd>{barber ? barber.name : "First available"}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>
                {day?.weekday} {day?.label} · {slot !== null ? clock(slot) : ""}
              </dd>
            </div>
          </dl>
          <p className="f-book-small mt-6">
            {cancelNote} This demo will not send anything when you press the button.
          </p>
        </fieldset>
      )}

      <div className="f-book-actions">
        {step > 0 && (
          <button
            type="button"
            onClick={() => go((step - 1) as Step)}
            className="f-btn-text f-focus"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          aria-disabled={step === 2 && slot === null ? true : undefined}
          className="f-btn f-btn-red f-focus"
        >
          {step === 3 ? "Hold my chair (demo)" : "Continue"}
        </button>
      </div>
    </form>
  );
}
