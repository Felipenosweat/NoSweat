"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { BUSINESS, CITIES, SERVICES, type ServiceId } from "./content";

// Pedido de orçamento (DEMONSTRAÇÃO: nada é enviado, e a página diz isso antes e depois).
// 3 passos: o que está acontecendo → onde (cidade da área atendida + fotos opcionais) → contato.
// As fotos ficam só no navegador (URL.createObjectURL, desfeitas ao remover ou sair). Validação
// por passo, erros ligados ao campo (aria-describedby) e anunciados; a confirmação fica num
// role="status". Nada de diagnóstico: a escolha só aponta o serviço da fixture e o telefone.

type Choice = ServiceId | "other";
type Photo = { url: string; name: string };
type Errors = Partial<Record<"problem" | "city" | "name" | "phone" | "email", string>>;

const STEPS = ["What's going on", "Where", "How to reach you"] as const;
const MAX_PHOTOS = 4;

const CHOICES: { id: Choice; label: string; hint: string }[] = [
  {
    id: "trouble",
    label: "A breaker keeps tripping or an outlet went dead",
    hint: "Troubleshooting · $95 service call",
  },
  { id: "panel", label: "My panel is old or too small", hint: "Panel upgrade · from $2,400" },
  { id: "ev", label: "I need an EV charger installed", hint: "Level 2 install · from $650" },
  {
    id: "lighting",
    label: "Lights, recessed cans or a ceiling fan",
    hint: "Lighting and fans · from $175",
  },
  {
    id: "rewire",
    label: "An older house that needs new wiring",
    hint: "Rewiring · quoted after a walkthrough",
  },
  { id: "other", label: "Something else", hint: "Describe it below" },
];

export function QuoteRequest() {
  const uid = useId();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [problem, setProblem] = useState<Choice | "">("");
  const [details, setDetails] = useState("");
  const [city, setCity] = useState("");
  const [streets, setStreets] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reach, setReach] = useState<"call" | "text">("call");
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const urls = useRef<string[]>([]);

  // "Quote for this" no quadro de disjuntores escolhe o serviço e volta ao primeiro passo.
  useEffect(() => {
    const pick = (event: Event) => {
      const id = (event as CustomEvent<ServiceId>).detail;
      if (!SERVICES.some((service) => service.id === id)) return;
      setProblem(id);
      setDone(false);
      setStep(0);
      setErrors({});
    };
    window.addEventListener("bs:quote", pick);
    return () => window.removeEventListener("bs:quote", pick);
  }, []);

  useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const id = (field: string) => `${uid}-${field}`;

  const validate = (at: number): Errors => {
    const next: Errors = {};
    if (at === 0) {
      if (!problem) next.problem = "Pick the one that sounds closest.";
      else if (problem === "other" && details.trim().length < 3)
        next.problem = "Tell us in a few words what's going on.";
    }
    if (at === 1 && !city) next.city = "Pick the city the house is in.";
    if (at === 2) {
      if (name.trim().length < 2) next.name = "Enter your name.";
      if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a 10-digit phone number.";
      if (email && !/^\S+@\S+\.\S+$/.test(email))
        next.email = "Check the email address, or leave it empty.";
    }
    return next;
  };

  const focusFirstError = (found: Errors) => {
    const first = Object.keys(found)[0];
    if (!first) return;
    window.requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
      el?.focus();
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length) {
      focusFirstError(found);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>("[data-step-title]")?.focus(),
      );
      return;
    }
    setDone(true);
    window.requestAnimationFrame(() => statusRef.current?.focus());
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const added = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, room)
      .map((file) => {
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        return { url, name: file.name };
      });
    setPhotos((list) => [...list, ...added]);
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    urls.current = urls.current.filter((item) => item !== url);
    setPhotos((list) => list.filter((photo) => photo.url !== url));
  };

  const reset = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    urls.current = [];
    setPhotos([]);
    setProblem("");
    setDetails("");
    setCity("");
    setStreets("");
    setName("");
    setPhone("");
    setEmail("");
    setReach("call");
    setErrors({});
    setStep(0);
    setDone(false);
  };

  const choice = CHOICES.find((item) => item.id === problem);

  if (done) {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="bs-quote-done">
        <p className="bs-label">
          <span className="bs-demo-tag">Demo</span> Nothing was sent
        </p>
        <p className="bs-h3 mt-5">
          Thanks, {name.trim().split(" ")[0]}. This is where Tasha would pick it up.
        </p>
        <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.6]">
          This page is a design demo, so your request stayed in this browser and went nowhere.
          {photos.length
            ? ` Your ${photos.length === 1 ? "photo was" : `${photos.length} photos were`} never uploaded.`
            : ""}{" "}
          On a real site, you would get a written quote before any work starts.
        </p>
        <dl className="bs-summary mt-6">
          <div>
            <dt>Problem</dt>
            <dd>
              {choice?.label}
              {details ? ` — ${details}` : ""}
            </dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>
              {city}
              {streets ? `, ${streets}` : ""}
            </dd>
          </div>
          <div>
            <dt>Reach you</dt>
            <dd>
              {reach === "call" ? "Call" : "Text"} {phone}
              {email ? ` · ${email}` : ""}
            </dd>
          </div>
        </dl>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href={`tel:${BUSINESS.tel}`} className="bs-btn bs-btn-ink">
            Call {BUSINESS.phone}
          </a>
          <button type="button" onClick={reset} className="bs-btn bs-btn-line">
            Start over
          </button>
        </div>
      </div>
    );
  }

  const err = (field: keyof Errors) =>
    errors[field] ? (
      <p id={id(`${field}-err`)} className="bs-error mt-2">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      className="bs-quote"
      aria-describedby={id("demo")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ol className="bs-steps" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              data-done={i < step || undefined}
            >
              <span className="bs-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="bs-steps-label">{label}</span>
            </li>
          ))}
        </ol>
        <p id={id("demo")} className="bs-label">
          <span className="bs-demo-tag">Demo</span> Nothing is sent
        </p>
      </div>

      <div className="sr-only" aria-live="polite">
        {Object.values(errors).filter(Boolean).join(" ")}
      </div>

      {step === 0 ? (
        <fieldset className="mt-8">
          <legend data-step-title tabIndex={-1} className="bs-h3">
            What&apos;s going on?
          </legend>
          <p className="bs-hint mt-2">
            Pick the closest one. We don&apos;t diagnose from a form; it just routes your request.
          </p>
          <div
            className="bs-choices mt-5"
            role="radiogroup"
            aria-describedby={errors.problem ? id("problem-err") : undefined}
          >
            {CHOICES.map((item, i) => (
              <label
                key={item.id}
                className="bs-choice"
                data-checked={problem === item.id || undefined}
              >
                <input
                  type="radio"
                  name="problem"
                  value={item.id}
                  checked={problem === item.id}
                  onChange={() => setProblem(item.id)}
                  data-field={i === 0 ? "problem" : undefined}
                />
                <span className="bs-choice-text">
                  <span className="bs-choice-label">{item.label}</span>
                  <span className="bs-choice-hint">{item.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <label className="bs-field mt-5 block" htmlFor={id("details")}>
            <span className="bs-field-label">In a sentence (optional)</span>
            <textarea
              id={id("details")}
              rows={2}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="The kitchen outlets stopped working this morning"
              aria-describedby={errors.problem ? id("problem-err") : undefined}
            />
          </label>
          {err("problem")}
        </fieldset>
      ) : null}

      {step === 1 ? (
        <fieldset className="mt-8">
          <legend data-step-title tabIndex={-1} className="bs-h3">
            Where is the house?
          </legend>
          <p className="bs-hint mt-2">
            We cover these six cities. A cross street or ZIP is enough, no full address.
          </p>
          <div
            className="bs-cities mt-5"
            role="radiogroup"
            aria-label="City"
            aria-describedby={errors.city ? id("city-err") : undefined}
          >
            {CITIES.map((item, i) => (
              <label key={item} className="bs-city" data-checked={city === item || undefined}>
                <input
                  type="radio"
                  name="city"
                  value={item}
                  checked={city === item}
                  onChange={() => setCity(item)}
                  data-field={i === 0 ? "city" : undefined}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          {err("city")}
          <label className="bs-field mt-5 block" htmlFor={id("streets")}>
            <span className="bs-field-label">Cross streets or ZIP (optional)</span>
            <input
              id={id("streets")}
              type="text"
              autoComplete="postal-code"
              value={streets}
              onChange={(event) => setStreets(event.target.value)}
              placeholder="McDowell & 16th St, or 85006"
            />
          </label>
          <div className="mt-6">
            <p className="bs-field-label" id={id("photos-label")}>
              Photos of the panel or the problem (optional, up to {MAX_PHOTOS})
            </p>
            <p className="bs-hint mt-1" id={id("photos-hint")}>
              They stay in your browser. Nothing is uploaded.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {photos.map((photo) => (
                <figure key={photo.url} className="bs-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) */}
                  <img src={photo.url} alt={`Your photo: ${photo.name}`} width={96} height={96} />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.url)}
                    className="bs-thumb-x"
                  >
                    <span className="sr-only">Remove {photo.name}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                </figure>
              ))}
              {photos.length < MAX_PHOTOS ? (
                <label className="bs-drop">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    aria-labelledby={id("photos-label")}
                    aria-describedby={id("photos-hint")}
                    onChange={(event) => {
                      addPhotos(event.target.files);
                      event.target.value = "";
                    }}
                  />
                  <span aria-hidden="true" className="bs-drop-plus">
                    +
                  </span>
                  <span>Add photo</span>
                </label>
              ) : null}
            </div>
          </div>
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset className="mt-8">
          <legend data-step-title tabIndex={-1} className="bs-h3">
            How do we reach you?
          </legend>
          <p className="bs-hint mt-2">You talk to Marcus or Tasha, not a call center.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="bs-field block" htmlFor={id("name")}>
              <span className="bs-field-label">Name</span>
              <input
                id={id("name")}
                data-field="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? id("name-err") : undefined}
              />
              {err("name")}
            </label>
            <label className="bs-field block" htmlFor={id("phone")}>
              <span className="bs-field-label">Phone</span>
              <input
                id={id("phone")}
                data-field="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? id("phone-err") : undefined}
              />
              {err("phone")}
            </label>
            <label className="bs-field block sm:col-span-2" htmlFor={id("email")}>
              <span className="bs-field-label">Email (optional)</span>
              <input
                id={id("email")}
                data-field="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? id("email-err") : undefined}
              />
              {err("email")}
            </label>
          </div>
          <div className="mt-5" role="radiogroup" aria-label="Best way to reach you">
            <p className="bs-field-label" aria-hidden="true">
              Best way to reach you
            </p>
            <div className="mt-2 flex gap-3">
              {(["call", "text"] as const).map((item) => (
                <label key={item} className="bs-city" data-checked={reach === item || undefined}>
                  <input
                    type="radio"
                    name="reach"
                    value={item}
                    checked={reach === item}
                    onChange={() => setReach(item)}
                  />
                  <span>{item === "call" ? "Call me" : "Text me"}</span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--bs-rule)] pt-6">
        {step > 0 ? (
          <button
            type="button"
            className="bs-btn bs-btn-line"
            onClick={() => {
              setErrors({});
              setStep(step - 1);
            }}
          >
            Back
          </button>
        ) : null}
        <button type="submit" className="bs-btn bs-btn-ink">
          {step < STEPS.length - 1 ? "Next" : "Finish the demo request"}
        </button>
        <span className="bs-hint">
          Or call{" "}
          <a className="bs-link font-semibold" href={`tel:${BUSINESS.tel}`}>
            {BUSINESS.phone}
          </a>
        </span>
      </div>
    </form>
  );
}
