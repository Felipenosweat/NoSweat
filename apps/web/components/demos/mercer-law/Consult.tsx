"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { FIRM, MATTERS } from "./content";

// Pedido de consulta em três passos (assunto → quando e como responder → contato) e uma
// confirmação. É uma DEMONSTRAÇÃO: nada sai da página, nada é guardado, e isso está escrito no
// topo, ao lado do campo de observação e na confirmação. Ao lado, a "ficha" (o resumo) se
// preenche conforme a pessoa responde. Sem promessa de resultado e sem pedir detalhes do caso.

type Step = 0 | 1 | 2 | 3;
const STEP_NAMES = ["Subject", "Timing", "Contact"];
const UNSURE = "unsure";

const WHEN = [
  { id: "day", label: "During office hours", note: "Mon–Thu 9 AM – 5 PM, Fri 9 AM – 1 PM" },
  { id: "evening", label: "A Tuesday evening", note: "By request" },
] as const;

const REPLY = [
  { id: "phone", label: "Call me" },
  { id: "email", label: "Email me" },
] as const;

function Title({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} tabIndex={-1} className="m-display text-[clamp(1.7rem,2.6vw,2.3rem)] outline-none">
      {children}
    </h3>
  );
}

function Option({
  name,
  value,
  checked,
  onChange,
  label,
  note,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  note?: string;
}) {
  return (
    <label className="m-option flex cursor-pointer items-baseline gap-3 border border-[var(--m-rule-strong)] px-4 py-3.5">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative top-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${checked ? "border-[var(--m-ox)]" : "border-[var(--m-rule-strong)]"}`}
      >
        {checked && <span className="size-2 rounded-full bg-[var(--m-ox)]" />}
      </span>
      <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[17px] leading-snug">{label}</span>
        {note && <span className="m-num text-[14px] text-[var(--m-muted)]">{note}</span>}
      </span>
    </label>
  );
}

export function Consult() {
  const id = useId();
  const [step, setStep] = useState<Step>(0);
  const [matter, setMatter] = useState<string>(MATTERS[0]?.id ?? UNSURE);
  const [when, setWhen] = useState<string>("day");
  const [reply, setReply] = useState<string>("phone");
  const [name, setName] = useState("");

  // "Ask about this" no índice de serviços marca o assunto aqui.
  useEffect(() => {
    const onMatter = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (!MATTERS.some((item) => item.id === detail)) return;
      setMatter(detail);
      setStep(0);
    };
    window.addEventListener("mercer:matter", onMatter);
    return () => window.removeEventListener("mercer:matter", onMatter);
  }, []);

  const go = (next: Step) => {
    setStep(next);
    requestAnimationFrame(() => document.getElementById(`${id}-h${next}`)?.focus());
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    go(Math.min(3, step + 1) as Step);
  };

  const chosen = MATTERS.find((item) => item.id === matter);
  const whenLabel = WHEN.find((item) => item.id === when)?.label ?? "";
  const first = name.trim().split(/\s+/)[0];

  const slip = (
    <dl className="text-[16px] leading-snug">
      {[
        ["Subject", chosen ? chosen.name : "Not sure yet"],
        ["Fee", chosen ? `${chosen.price}. ${chosen.detail}.` : "Depends on the matter"],
        ["When", step >= 1 ? whenLabel : "…"],
        ["Reply by", step >= 1 ? (reply === "phone" ? "Phone" : "Email") : "…"],
        ["Name", step >= 2 && name ? name : "…"],
      ].map(([term, value]) => (
        <div
          key={term}
          className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-[var(--m-rule)] py-3"
        >
          <dt className="m-label pt-0.5 text-[11px] text-[var(--m-muted)]">{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        {step === 3 ? (
          <div role="status" className="m-step">
            <p className="m-label text-[var(--m-ox)]">Demonstration · nothing was sent</p>
            <div className="mt-4">
              <Title id={`${id}-h3`}>Thank you{first ? `, ${first}` : ""}.</Title>
            </div>
            <div className="m-prose mt-5 max-w-[56ch] space-y-4 text-[18px] leading-[1.65]">
              <p>
                At a real office, Mercer Law would now {reply === "phone" ? "call" : "write to"} you
                to find a time{when === "evening" ? " on a Tuesday evening" : ""} for{" "}
                {chosen ? `the ${chosen.name.toLowerCase()}` : "a first conversation"}.
              </p>
              <p>
                This page is a design demonstration. Your answers stayed in this browser tab: no
                request was made, nothing was stored and no one will contact you.
              </p>
            </div>
            <button type="button" onClick={() => go(0)} className="m-btn m-btn-line mt-8">
              Start again
            </button>
          </div>
        ) : (
          <form onSubmit={submit} aria-labelledby={`${id}-h${step}`} noValidate={false}>
            <p className="m-label inline-flex border border-[var(--m-ox)] px-3 py-1.5 text-[11px] text-[var(--m-ox)]">
              Demonstration · private · nothing leaves this page
            </p>
            <ol aria-label="Steps" className="m-num mt-6 mb-8 flex gap-6 text-[14px]">
              {STEP_NAMES.map((title, index) => (
                <li
                  key={title}
                  aria-current={index === step ? "step" : undefined}
                  className={`flex items-baseline gap-2 border-t-2 pt-2 ${index === step ? "border-[var(--m-ox)] text-[var(--m-ink)]" : index < step ? "border-[var(--m-ink)] text-[var(--m-muted)]" : "border-[var(--m-rule)] text-[var(--m-muted)]"}`}
                >
                  <span>{index + 1}</span>
                  {title}
                </li>
              ))}
            </ol>

            {step === 0 && (
              <fieldset key="s0" className="m-step">
                <legend className="sr-only">Subject</legend>
                <Title id={`${id}-h0`}>What would you like to talk about?</Title>
                <div className="mt-6 grid gap-2">
                  {MATTERS.map((item) => (
                    <Option
                      key={item.id}
                      name="matter"
                      value={item.id}
                      checked={matter === item.id}
                      onChange={setMatter}
                      label={item.name}
                      note={item.price}
                    />
                  ))}
                  <Option
                    name="matter"
                    value={UNSURE}
                    checked={matter === UNSURE}
                    onChange={setMatter}
                    label="I'm not sure yet"
                  />
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <div key="s1" className="m-step">
                <Title id={`${id}-h1`}>When suits you?</Title>
                <fieldset className="mt-6">
                  <legend className="m-label mb-3 text-[11px] text-[var(--m-muted)]">
                    A first meeting
                  </legend>
                  <div className="grid gap-2">
                    {WHEN.map((item) => (
                      <Option
                        key={item.id}
                        name="when"
                        value={item.id}
                        checked={when === item.id}
                        onChange={setWhen}
                        label={item.label}
                        note={item.note}
                      />
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-7">
                  <legend className="m-label mb-3 text-[11px] text-[var(--m-muted)]">
                    How should we reply?
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {REPLY.map((item) => (
                      <Option
                        key={item.id}
                        name="reply"
                        value={item.id}
                        checked={reply === item.id}
                        onChange={setReply}
                        label={item.label}
                      />
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 2 && (
              <fieldset key="s2" className="m-step">
                <legend className="sr-only">Contact</legend>
                <Title id={`${id}-h2`}>How can we reach you?</Title>
                <div className="mt-6 grid gap-6">
                  <label className="block">
                    <span className="m-label text-[11px] text-[var(--m-muted)]">Your name</span>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="m-field"
                    />
                  </label>
                  {reply === "phone" ? (
                    <label className="block">
                      <span className="m-label text-[11px] text-[var(--m-muted)]">Phone</span>
                      <input type="tel" required autoComplete="tel" className="m-field m-num" />
                    </label>
                  ) : (
                    <label className="block">
                      <span className="m-label text-[11px] text-[var(--m-muted)]">Email</span>
                      <input type="email" required autoComplete="email" className="m-field" />
                    </label>
                  )}
                  <label className="block">
                    <span className="m-label text-[11px] text-[var(--m-muted)]">
                      Anything we should know first (optional)
                    </span>
                    <textarea
                      rows={2}
                      aria-describedby={`${id}-note`}
                      className="m-field resize-none"
                    />
                    <span
                      id={`${id}-note`}
                      className="mt-2 block text-[14px] text-[var(--m-muted)]"
                    >
                      Please keep the details of your situation for the meeting. In this demo the
                      note goes nowhere.
                    </span>
                  </label>
                </div>
              </fieldset>
            )}

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button type="submit" className="m-btn m-btn-ox">
                {step === 2 ? "Send request" : "Continue"} <span aria-hidden="true">→</span>
              </button>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => go((step - 1) as Step)}
                  className="m-btn text-[var(--m-muted)] hover:text-[var(--m-ink)]"
                >
                  Back
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <aside aria-label="Your request" className="lg:col-span-5">
        <div className="border-t-[3px] border-double border-[var(--m-ink)] pt-5">
          <p className="m-label text-[var(--m-ox)]">Your request</p>
          <div className="mt-3">{slip}</div>
          <p className="mt-6 text-[16px] leading-relaxed text-[var(--m-muted)]">
            Rather talk to someone? Call{" "}
            <a
              href={`tel:${FIRM.tel}`}
              className="m-link m-num whitespace-nowrap text-[var(--m-ink)]"
            >
              {FIRM.phone}
            </a>{" "}
            or write to
            <br />
            <a href={`mailto:${FIRM.email}`} className="m-link text-[var(--m-ink)]">
              {FIRM.email}
            </a>
            .
          </p>
        </div>
      </aside>
    </div>
  );
}
