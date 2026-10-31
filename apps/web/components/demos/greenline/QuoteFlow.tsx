"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ALL_SERVICES, BUSINESS, TOWNS, YARD_SIZES } from "./content";
import { Arrow } from "./ui";

// Pedido de orçamento da Greenline em quatro passos (quintal → serviços → fotos, opcionais →
// contato) e uma confirmação. É uma DEMONSTRAÇÃO: nada é enviado nem guardado, e isso está
// escrito no topo e na confirmação. As fotos só viram miniaturas no próprio navegador
// (URL.createObjectURL), nunca saem dele. O tamanho do quintal é escolhido em "plantas baixas"
// desenhadas (o lote cresce, a casa fica do mesmo tamanho). O foco vai para o título de cada passo.

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = ["Yard", "Work", "Photos", "You"];

const field =
  "g-field g-focus mt-2 block w-full rounded-[10px] border border-[var(--g-ink)]/30 bg-[var(--g-paper)] px-4 py-3 text-[17px] text-[var(--g-ink)] placeholder:text-[var(--g-ink)]/55";
const label = "text-[14px] font-semibold text-[var(--g-ink)]";

function Heading({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h3
      id={id}
      tabIndex={-1}
      className="g-display text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.05] text-[var(--g-ink)] outline-none"
    >
      {children}
    </h3>
  );
}

/** Planta do lote: retângulo do terreno em escala, casa fixa, linha de cota embaixo. */
function LotPlan({ scale }: { scale: number }) {
  const w = 22 + 70 * scale;
  const h = 16 + 44 * scale;
  const x = (100 - w) / 2;
  const y = (68 - h) / 2;
  return (
    <svg viewBox="0 0 100 78" aria-hidden="true" className="h-auto w-full">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <rect x={x + 5} y={y + 5} width="14" height="10" className="g-plan-house" />
      <path
        d={`M${x} 74h${w}M${x} 71.5v5M${x + w} 71.5v5`}
        stroke="currentColor"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export function QuoteFlow() {
  const id = useId();
  const [step, setStep] = useState<Step>(0);
  const [size, setSize] = useState<string>("medium");
  const [town, setTown] = useState<string>(TOWNS[0]!);
  const [services, setServices] = useState<string[]>(["mowing"]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [reach, setReach] = useState("call");
  const [error, setError] = useState("");
  const urls = useRef<string[]>([]);

  // Libera as miniaturas ao sair (elas só existem na memória do navegador).
  useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const go = (next: Step) => {
    setError("");
    setStep(next);
    requestAnimationFrame(() => document.getElementById(`${id}-h${next}`)?.focus());
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1 && services.length === 0) {
      setError("Pick at least one kind of work, or choose “Not sure yet”.");
      return;
    }
    go((step + 1) as Step);
  };

  const toggle = (service: string) =>
    setServices((list) =>
      list.includes(service) ? list.filter((item) => item !== service) : [...list, service],
    );

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 6 - photos.length)
      .map((file) => {
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        return { url, name: file.name };
      });
    setPhotos((list) => [...list, ...added]);
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    setPhotos((list) => list.filter((item) => item.url !== url));
  };

  const reset = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setServices(["mowing"]);
    setNote("");
    setName("");
    go(0);
  };

  const chosenSize = YARD_SIZES.find((item) => item.id === size);
  const chosenNames = ALL_SERVICES.filter((item) => services.includes(item.id)).map(
    (item) => item.name,
  );
  if (services.includes("unsure")) chosenNames.push("Not sure yet");

  if (step === 4) {
    return (
      <div className="g-step g-quote-card" role="status">
        <p className="g-caps text-[11px] text-[var(--g-clay-ink)]">
          Demonstration · nothing was sent
        </p>
        <div className="mt-4">
          <Heading id={`${id}-h4`}>Thanks{name ? `, ${name.split(" ")[0]}` : ""}.</Heading>
        </div>
        <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.65] text-[var(--g-ink)]/85">
          On a live site this request would go to Greenline at {BUSINESS.email}. This is a design
          demonstration: nothing was sent or stored, and your photos never left this browser.
        </p>
        <dl className="mt-8 grid gap-x-8 gap-y-4 border-t border-[var(--g-ink)]/15 pt-6 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="g-caps text-[11px] text-[var(--g-ink)]/75">Yard</dt>
            <dd className="mt-1 text-[var(--g-ink)]">
              {chosenSize?.name} · {chosenSize?.detail} · {town}
            </dd>
          </div>
          <div>
            <dt className="g-caps text-[11px] text-[var(--g-ink)]/75">Work</dt>
            <dd className="mt-1 text-[var(--g-ink)]">{chosenNames.join(", ")}</dd>
          </div>
          <div>
            <dt className="g-caps text-[11px] text-[var(--g-ink)]/75">Photos</dt>
            <dd className="mt-1 text-[var(--g-ink)]">
              {photos.length ? `${photos.length} attached (kept on this device)` : "None"}
            </dd>
          </div>
          <div>
            <dt className="g-caps text-[11px] text-[var(--g-ink)]/75">Reply by</dt>
            <dd className="mt-1 text-[var(--g-ink)] capitalize">{reach}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={reset}
          className="g-btn-ghost g-focus mt-9 inline-flex h-12 items-center rounded-full px-6 text-[15px] font-semibold"
        >
          Start again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} aria-labelledby={`${id}-h${step}`} className="g-quote-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="g-caps inline-flex items-center gap-2 rounded-full border border-[var(--g-clay-ink)]/45 px-3 py-1.5 text-[11px] text-[var(--g-clay-ink)]">
          Demonstration · nothing is sent
        </p>
        <ol className="flex gap-4 sm:gap-5" aria-label="Steps">
          {STEPS.map((title, index) => (
            <li
              key={title}
              aria-current={index === step ? "step" : undefined}
              className={`flex items-center gap-1.5 text-[13px] ${index === step ? "font-semibold text-[var(--g-ink)]" : "text-[var(--g-ink)]/75"}`}
            >
              <span
                aria-hidden="true"
                className={`grid size-[22px] place-items-center rounded-full text-[11px] tabular-nums ${
                  index < step
                    ? "bg-[var(--g-pine)] text-[var(--g-paper)]"
                    : index === step
                      ? "border border-[var(--g-pine)] text-[var(--g-pine)]"
                      : "border border-[var(--g-ink)]/30"
                }`}
              >
                {index + 1}
              </span>
              <span className={index === step ? "" : "sr-only sm:not-sr-only"}>{title}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8">
        {step === 0 && (
          <fieldset className="g-step">
            <legend className="sr-only">Your yard</legend>
            <Heading id={`${id}-h0`}>How big is the yard?</Heading>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {YARD_SIZES.map((item) => (
                <label key={item.id} className="g-choice g-focus-within cursor-pointer">
                  <input
                    type="radio"
                    name="size"
                    value={item.id}
                    checked={size === item.id}
                    onChange={() => setSize(item.id)}
                    className="sr-only"
                  />
                  <span className="block px-3 pt-3 text-[var(--g-ink)]/70">
                    <LotPlan scale={item.lot} />
                  </span>
                  <span className="block px-3 pb-3">
                    <span className="block text-[16px] font-semibold text-[var(--g-ink)]">
                      {item.name}
                    </span>
                    <span className="block text-[13px] text-[var(--g-ink)]/75">{item.detail}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className="mt-6 block">
              <span className={label}>Where is it?</span>
              <select
                value={town}
                onChange={(event) => setTown(event.target.value)}
                className={field}
                autoComplete="address-level2"
              >
                {TOWNS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
                <option>Somewhere else</option>
              </select>
            </label>
            {town === "Somewhere else" && (
              <p className="mt-3 text-[14px] text-[var(--g-ink)]/80">
                Greenline works in {TOWNS.slice(0, -1).join(", ")} and {TOWNS.at(-1)}. Send it
                anyway and they can tell you.
              </p>
            )}
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="g-step" aria-describedby={error ? `${id}-err` : undefined}>
            <legend className="sr-only">The work</legend>
            <Heading id={`${id}-h1`}>What should the crew do?</Heading>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                ...ALL_SERVICES.map((item) => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                })),
                { id: "unsure", name: "Not sure yet", price: undefined },
              ].map((item) => (
                <label
                  key={item.id}
                  className="g-check g-focus-within flex cursor-pointer items-center gap-3 rounded-[10px] border border-[var(--g-ink)]/20 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={services.includes(item.id)}
                    onChange={() => toggle(item.id)}
                    className="size-[18px] shrink-0 accent-[var(--g-pine)]"
                  />
                  <span className="flex-1 text-[15px] leading-tight text-[var(--g-ink)]">
                    {item.name}
                  </span>
                  {item.price && (
                    <span className="text-[13px] whitespace-nowrap text-[var(--g-ink)]/75 tabular-nums">
                      {item.price}
                    </span>
                  )}
                </label>
              ))}
            </div>
            {error && (
              <p
                id={`${id}-err`}
                role="alert"
                className="mt-4 text-[15px] text-[var(--g-clay-ink)]"
              >
                {error}
              </p>
            )}
            <label className="mt-6 block">
              <span className={label}>Anything the crew should know? (optional)</span>
              <textarea
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="A side gate, a dog, a slope, a sprinkler zone that stopped…"
                className={`${field} resize-none`}
              />
            </label>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="g-step">
            <legend className="sr-only">Photos</legend>
            <Heading id={`${id}-h2`}>A few photos? (optional)</Heading>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-[var(--g-ink)]/80">
              Wide shots of the yard help most. In this demo the photos stay in your browser: they
              are not uploaded.
            </p>
            <label className="g-drop g-focus-within mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] px-6 py-8 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  addPhotos(event.target.files);
                  event.target.value = "";
                }}
                className="sr-only"
                disabled={photos.length >= 6}
              />
              <span className="g-display text-[22px] text-[var(--g-ink)]">
                {photos.length >= 6 ? "That's six" : "Choose photos"}
              </span>
              <span className="text-[13px] text-[var(--g-ink)]/75">Up to 6 images</span>
            </label>
            {photos.length > 0 && (
              <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Chosen photos">
                {photos.map((photo) => (
                  <li key={photo.url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local (blob:) */}
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="aspect-square w-full rounded-[8px] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.url)}
                      className="g-focus absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-[var(--g-paper)] text-[15px] text-[var(--g-ink)]"
                    >
                      <span className="sr-only">Remove {photo.name}</span>
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="g-step">
            <legend className="sr-only">Your details</legend>
            <Heading id={`${id}-h3`}>Who should we get back to?</Heading>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={label}>Name</span>
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
                <span className={label}>Phone</span>
                <input type="tel" required autoComplete="tel" className={field} />
              </label>
              <label className="block">
                <span className={label}>Email (optional)</span>
                <input type="email" autoComplete="email" className={field} />
              </label>
            </div>
            <fieldset className="mt-6">
              <legend className={label}>Best way to reply</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {["call", "text", "email"].map((item) => (
                  <label key={item} className="g-pill g-focus-within cursor-pointer">
                    <input
                      type="radio"
                      name="reach"
                      value={item}
                      checked={reach === item}
                      onChange={() => setReach(item)}
                      className="sr-only"
                    />
                    <span className="capitalize">{item}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </fieldset>
        )}
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="g-btn g-focus inline-flex h-12 items-center gap-3 rounded-full px-7 text-[16px] font-semibold"
        >
          {step === 3
            ? "Send request"
            : step === 2 && photos.length === 0
              ? "Skip photos"
              : "Continue"}
          <Arrow className="w-4" />
        </button>
        {step > 0 && (
          <button
            type="button"
            onClick={() => go((step - 1) as Step)}
            className="g-focus h-12 px-3 text-[15px] text-[var(--g-ink)]/80 underline-offset-4 hover:underline"
          >
            Back
          </button>
        )}
        <p className="ml-auto text-[14px] text-[var(--g-ink)]/75">
          Or call{" "}
          <a
            href={BUSINESS.phoneHref}
            className="g-link font-semibold text-[var(--g-ink)] tabular-nums"
          >
            {BUSINESS.phone}
          </a>
        </p>
      </div>
    </form>
  );
}
