"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { BAKERY } from "./content";
import { breadBox, earliestCake, formatDate, isOpenDay, isoDate, localTime, useNow } from "./time";
import { Icon } from "./ui";

// Encomenda (DEMONSTRAÇÃO: nada é enviado nem cobrado, e o formulário diz isso antes e depois).
// Dois caminhos, os dois do dono: a caixa de sábado ($28, pedido até quinta ao meio-dia) e o
// bolo sob medida (5 dias de antecedência; casamento com prova antes). As datas saem do relógio
// de Sacramento: o sábado certo da caixa e a primeira data possível do bolo, só em dia aberto.
// Outras partes da página abrem o bolo direto com o evento "sunrise:order" (detail "cake").

type Kind = "box" | "cake";
type Done = { kind: Kind; summary: string; name: string };

function validContact(value: string): boolean {
  const v = value.trim();
  if (v.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return v.replace(/\D/g, "").length >= 10;
}

export function Preorder() {
  const now = useNow();
  const t = now === null ? null : localTime(now);
  const [kind, setKind] = useState<Kind>("box");
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<"six" | "tiered">("six");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Done | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  useEffect(() => {
    const onOrder = (event: Event) => {
      const detail = (event as CustomEvent<Kind>).detail;
      if (detail === "cake" || detail === "box") {
        setKind(detail);
        setDone(null);
        setErrors({});
      }
    };
    window.addEventListener("sunrise:order", onOrder);
    return () => window.removeEventListener("sunrise:order", onOrder);
  }, []);

  useEffect(() => {
    if (done) statusRef.current?.focus();
  }, [done]);

  const box = t ? breadBox(t) : null;
  const minCake = t ? earliestCake(t) : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const contact = String(data.get("contact") ?? "");
    const next: Record<string, string> = {};
    if (!name) next.name = "Add the name for the order.";
    if (!validContact(contact))
      next.contact = "Add a phone number (10 digits) or an email address.";
    let date = "";
    if (kind === "cake") {
      date = String(data.get("date") ?? "");
      if (!date) next.date = "Pick a pickup date.";
      else if (minCake && date < isoDate(minCake))
        next.date = `Custom cakes need 5 days. The earliest date is ${formatDate(minCake)}.`;
      else if (!isOpenDay(date))
        next.date = "We're closed Monday and Tuesday. Pick Wednesday to Sunday.";
    }
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const pretty = date ? formatDate(new Date(`${date}T00:00:00Z`)) : "";
    const summary =
      kind === "box"
        ? `${qty} Saturday bread box${qty > 1 ? "es" : ""} ($${qty * 28}) for pickup on ${box ? formatDate(box.pickup) : "Saturday"}, 7 AM – 1 PM at the counter.`
        : size === "six"
          ? `A 6-inch custom cake (from $55, serves 8–10) for ${pretty}, designed and decorated by Elena.`
          : `A tiered wedding cake (from $350) around ${pretty}, starting with a tasting by appointment.`;
    setDone({ kind, summary, name });
  };

  const err = (key: string) =>
    errors[key] ? (
      <p id={`${uid}-${key}-err`} className="mt-2 text-[14px] font-medium text-[var(--sb-crust)]">
        {errors[key]}
      </p>
    ) : null;
  const described = (key: string, hint?: string) =>
    [errors[key] ? `${uid}-${key}-err` : "", hint ?? ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className="sb-order">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="What would you like to order?" className="sb-switch">
          <button
            type="button"
            aria-pressed={kind === "box"}
            onClick={() => {
              setKind("box");
              setDone(null);
              setErrors({});
            }}
            className="sb-focus"
          >
            Saturday bread box
          </button>
          <button
            type="button"
            aria-pressed={kind === "cake"}
            onClick={() => {
              setKind("cake");
              setDone(null);
              setErrors({});
            }}
            className="sb-focus"
          >
            Custom cake
          </button>
        </div>
        <p className="sb-stamp">Demonstration · nothing is sent</p>
      </div>

      {done ? (
        <div ref={statusRef} tabIndex={-1} role="status" className="sb-receipt sb-focus mt-8">
          <p className="sb-label text-[var(--sb-crust)]">Demo receipt · not sent</p>
          <p className="sb-display mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05]">
            Thanks, {done.name.split(" ")[0]}. That&rsquo;s the whole flow.
          </p>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed">{done.summary}</p>
          <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-[var(--sb-ink-2)]">
            This is a design demonstration: nothing was sent, saved or charged. On the real site,
            bread box preorders go through {BAKERY.orderHost}, and cake requests reach Sunrise
            Bakery directly.
          </p>
          <button
            type="button"
            onClick={() => setDone(null)}
            className="sb-btn sb-btn-ghost sb-focus mt-6"
          >
            Start over
          </button>
        </div>
      ) : (
        <form ref={formRef} noValidate onSubmit={submit} className="mt-8 grid gap-6">
          {kind === "box" ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p id={`${uid}-qty`} className="sb-field-label">
                  How many boxes
                </p>
                <div className="sb-stepper mt-2" role="group" aria-labelledby={`${uid}-qty`}>
                  <button
                    type="button"
                    aria-label="One box fewer"
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="sb-focus"
                  >
                    −
                  </button>
                  <output aria-live="polite" className="tabular-nums">
                    {qty}
                  </output>
                  <button
                    type="button"
                    aria-label="One box more"
                    disabled={qty >= 6}
                    onClick={() => setQty((q) => Math.min(6, q + 1))}
                    className="sb-focus"
                  >
                    +
                  </button>
                </div>
                <p className="mt-2 text-[14px] text-[var(--sb-ink-2)]">
                  Each box: two loaves and four pastries, $28.
                </p>
              </div>
              <div>
                <p className="sb-field-label">Pickup</p>
                <p className="sb-display mt-2 text-[1.6rem] leading-tight">
                  {box ? formatDate(box.pickup) : "Saturday"}
                  <span className="text-[var(--sb-ink-2)]"> · 7 AM – 1 PM</span>
                </p>
                <p className="mt-2 text-[14px] text-[var(--sb-ink-2)]">
                  Orders close Thursday at noon for that Saturday.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              <fieldset>
                <legend className="sb-field-label">Which cake</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="sb-option sb-focus-within">
                    <input
                      type="radio"
                      name="size"
                      value="six"
                      checked={size === "six"}
                      onChange={() => setSize("six")}
                      className="sr-only"
                    />
                    <span className="sb-display text-[1.35rem]">6-inch custom cake</span>
                    <span className="text-[15px] text-[var(--sb-ink-2)]">
                      Serves 8–10 · from $55
                    </span>
                  </label>
                  <label className="sb-option sb-focus-within">
                    <input
                      type="radio"
                      name="size"
                      value="tiered"
                      checked={size === "tiered"}
                      onChange={() => setSize("tiered")}
                      className="sr-only"
                    />
                    <span className="sb-display text-[1.35rem]">Tiered wedding cake</span>
                    <span className="text-[15px] text-[var(--sb-ink-2)]">
                      From $350 · tasting first
                    </span>
                  </label>
                </div>
              </fieldset>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${uid}-date`} className="sb-field-label">
                    {size === "six" ? "Pickup date" : "Wedding date"}
                  </label>
                  <input
                    id={`${uid}-date`}
                    name="date"
                    type="date"
                    min={minCake ? isoDate(minCake) : undefined}
                    aria-invalid={errors.date ? true : undefined}
                    aria-describedby={described("date", `${uid}-date-hint`)}
                    className="sb-input mt-2"
                  />
                  <p id={`${uid}-date-hint`} className="mt-2 text-[14px] text-[var(--sb-ink-2)]">
                    {minCake
                      ? `Earliest: ${formatDate(minCake)}. Open Wednesday to Sunday.`
                      : "At least 5 days ahead, Wednesday to Sunday."}
                  </p>
                  {err("date")}
                </div>
                <div>
                  <label htmlFor={`${uid}-idea`} className="sb-field-label">
                    What should it look like? <span className="font-normal">(optional)</span>
                  </label>
                  <textarea
                    id={`${uid}-idea`}
                    name="idea"
                    rows={3}
                    placeholder="Colours, words on top, a drawing you'll bring…"
                    className="sb-input mt-2 resize-y"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-name`} className="sb-field-label">
                Name for the order
              </label>
              <input
                id={`${uid}-name`}
                name="name"
                autoComplete="name"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={described("name")}
                className="sb-input mt-2"
              />
              {err("name")}
            </div>
            <div>
              <label htmlFor={`${uid}-contact`} className="sb-field-label">
                Phone or email
              </label>
              <input
                id={`${uid}-contact`}
                name="contact"
                autoComplete="email"
                inputMode="email"
                aria-invalid={errors.contact ? true : undefined}
                aria-describedby={described("contact")}
                className="sb-input mt-2"
              />
              {err("contact")}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--sb-rule)] pt-6">
            <button type="submit" className="sb-btn sb-btn-crust sb-btn-lg sb-focus">
              <Icon name="bag" />
              {kind === "box"
                ? `Preorder ${qty} box${qty > 1 ? "es" : ""} · $${qty * 28}`
                : "Send cake request"}
            </button>
            <p className="text-[14px] text-[var(--sb-ink-2)]">
              Demo only. Nothing is sent, saved or charged.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
