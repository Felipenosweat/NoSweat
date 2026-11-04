"use client";

import type {
  AvailabilityResponse,
  BookableService,
  BookingSlot,
  CreateBookingRequest,
  PublicBooking,
  PublicBookingInfo,
} from "@nosweat/schema";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckIcon } from "../components/icons";
import {
  addDaysToKey,
  dateKeyInZone,
  dayLabel,
  dayLabelLong,
  formatDateTime,
  formatDuration,
  formatNextOpening,
  formatPrice,
  formatTime,
  groupSlots,
  isAvailabilityResponse,
  isPublicBookingInfo,
  isPublicBookingResponse,
  manageBookingUrl,
  slotsByDate,
  zoneAbbreviation,
} from "./booking-format";

// Seção "Agendamento" dos sites. O servidor desenha só o título e um aviso "ligue para marcar"
// (noscript); no navegador ela busca o que o dono liberou e mostra serviço, dia e horário. Horário
// ocupado simplesmente não aparece. Sem endpoint, ou se o agendamento está desligado (404), a
// seção inteira some; no editor (`editable`) vira um aviso de como ligar.

/** Quantos dias a faixa mostra (a API aceita até 14 por pedido). */
const MAX_STRIP_DAYS = 14;

type InfoState =
  | { status: "loading" }
  | { status: "off" }
  | { status: "ready"; info: PublicBookingInfo; todayKey: string };

/** Dados públicos do agendamento; `off` = nada para mostrar (desligado, erro ou sem serviços). */
function useBookingInfo(endpoint: string | undefined): InfoState {
  const [state, setState] = useState<InfoState>({ status: "loading" });
  useEffect(() => {
    if (!endpoint) return;
    let live = true;
    fetch(endpoint)
      .then((res): Promise<unknown> | null => (res.ok ? res.json() : null))
      .then((data) => {
        if (!live) return;
        if (isPublicBookingInfo(data) && data.services.length > 0) {
          setState({
            status: "ready",
            info: data,
            todayKey: dateKeyInZone(new Date(), data.timeZone),
          });
        } else {
          setState({ status: "off" });
        }
      })
      .catch(() => {
        if (live) setState({ status: "off" });
      });
    return () => {
      live = false;
    };
  }, [endpoint]);
  return endpoint ? state : { status: "off" };
}

export type BookingSectionProps = {
  /** Base das rotas públicas (`/api/public/booking/<siteId>`). Sem ela, a seção não aparece. */
  endpoint?: string;
  /** Modo de edição do editor: sem agendamento ligado, mostra o aviso em vez de sumir. */
  editable?: boolean;
  /** Elemento do título (já desenhado pelo servidor, no estilo da composição). */
  heading: ReactNode;
  intro?: string;
  /** Telefone do negócio, para o aviso de quem está sem JavaScript. */
  phone?: string;
  phoneHref?: string;
  /** Âncora da seção (#book). */
  id?: string;
  /** Classe do <section> (espaçamento e largura da composição). */
  className?: string;
  /** Mostrado no lugar da seção quando o agendamento está desligado (a página própria usa; nos sites a seção some). */
  fallback?: ReactNode;
  /** "split": título à esquerda e seletor à direita (telas largas). "stack": um embaixo do outro. */
  layout?: "split" | "stack";
};

export function BookingSection({
  endpoint,
  editable = false,
  heading,
  intro,
  phone,
  phoneHref,
  id,
  className = "",
  fallback,
  layout = "split",
}: BookingSectionProps) {
  const state = useBookingInfo(endpoint);
  if (state.status === "off" && !editable) return <>{fallback ?? null}</>;

  const split = layout === "split";
  return (
    <section id={id} className={className} aria-busy={state.status === "loading"}>
      <div className={split ? "grid gap-10 @5xl:grid-cols-12" : "grid gap-8"}>
        <div className={split ? "@5xl:col-span-4" : ""}>
          {heading}
          {intro && <p className="mt-5 max-w-prose text-base text-ns-muted">{intro}</p>}
          {state.status === "ready" && state.info.note && (
            <p className="mt-4 max-w-prose text-sm text-ns-muted">{state.info.note}</p>
          )}
          <noscript>
            <p className="mt-5 text-base">
              {phone && phoneHref ? (
                <>
                  Call us to book:{" "}
                  <a href={phoneHref} className="font-semibold underline underline-offset-4">
                    {phone}
                  </a>
                </>
              ) : (
                "Contact us to book."
              )}
            </p>
          </noscript>
        </div>
        <div className={split ? "@5xl:col-span-7 @5xl:col-start-6" : ""}>
          {state.status === "ready" ? (
            <BookingPanel
              endpoint={endpoint ?? ""}
              info={state.info}
              todayKey={state.todayKey}
              phone={phone}
              phoneHref={phoneHref}
            />
          ) : state.status === "off" ? (
            <p className="rounded-xl border border-dashed border-ns-border p-6 text-sm text-ns-muted">
              Online booking appears here once you turn it on in Business &rarr; Booking.
            </p>
          ) : (
            // Reserva o espaço enquanto carrega (sem salto de layout).
            <div aria-hidden="true" className="min-h-72 rounded-xl bg-ns-surface" />
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- seletor ----------

type AvailabilityState = { key: string; data: AvailabilityResponse | null };

type Details = { name: string; phone: string; email: string; notes: string; website: string };
const EMPTY_DETAILS: Details = { name: "", phone: "", email: "", notes: "", website: "" };

type SubmitState = { state: "idle" } | { state: "sending" } | { state: "error"; message: string };

const chip =
  "ns-btn inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary motion-reduce:transition-none";
const chipOn = "border-ns-primary bg-ns-primary text-ns-on-primary";
const chipOff = "border-ns-border bg-ns-background text-ns-text hover:border-ns-text/40";
const fieldBase =
  "mt-1.5 block w-full rounded-lg border border-ns-border bg-ns-background px-4 py-3 text-base text-ns-text placeholder:text-ns-muted/70 focus:border-ns-primary focus:ring-2 focus:ring-ns-primary/20 focus:outline-none";
const stepLabel = "mb-3 block text-sm font-semibold text-ns-text";

function BookingPanel({
  endpoint,
  info,
  todayKey,
  phone,
  phoneHref,
}: {
  endpoint: string;
  info: PublicBookingInfo;
  todayKey: string;
  phone?: string;
  phoneHref?: string;
}) {
  const [serviceChoice, setServiceChoice] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [dayChoice, setDayChoice] = useState<string | null>(null);
  const [slotChoice, setSlotChoice] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState | null>(null);
  // Sobe a cada "horário ocupado": força uma nova consulta da disponibilidade.
  const [refreshCount, setRefreshCount] = useState(0);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [submit, setSubmit] = useState<SubmitState>({ state: "idle" });
  const [notice, setNotice] = useState("");
  const [booked, setBooked] = useState<{ booking: PublicBooking; manageUrl: string } | null>(null);
  const bookedRef = useRef<HTMLDivElement>(null);

  const dayCount = Math.min(MAX_STRIP_DAYS, Math.max(1, info.maxDaysAhead));
  const timeZone = info.timeZone;

  // Um serviço só já vem escolhido.
  const service: BookableService | null =
    info.services.find((item) => item.id === serviceChoice) ??
    (info.services.length === 1 ? (info.services[0] ?? null) : null);
  const serviceId = service?.id ?? null;
  const availabilityKey = serviceId ? `${serviceId}|${staffId ?? ""}|${refreshCount}` : null;

  useEffect(() => {
    if (!serviceId || !availabilityKey) return;
    let live = true;
    const key = availabilityKey;
    const query = new URLSearchParams({
      serviceId,
      from: todayKey,
      days: String(dayCount),
    });
    if (staffId) query.set("staffId", staffId);
    fetch(`${endpoint}/availability?${query.toString()}`)
      .then((res): Promise<unknown> | null => (res.ok ? res.json() : null))
      .then((data) => {
        if (live) setAvailability({ key, data: isAvailabilityResponse(data) ? data : null });
      })
      .catch(() => {
        if (live) setAvailability({ key, data: null });
      });
    return () => {
      live = false;
    };
  }, [endpoint, serviceId, staffId, availabilityKey, todayKey, dayCount]);

  // Move o foco para o cartão de confirmação (leitores de tela leem "You're booked").
  useEffect(() => {
    if (booked) bookedRef.current?.focus();
  }, [booked]);

  const loaded = availability && availability.key === availabilityKey ? availability : null;
  const loading = serviceId !== null && loaded === null;
  const failed = loaded !== null && loaded.data === null;
  const byDate = loaded?.data ? slotsByDate(loaded.data) : new Map<string, BookingSlot[]>();
  const dayKeys = Array.from({ length: dayCount }, (_, i) => addDaysToKey(todayKey, i));
  const hasSlots = (key: string) => (byDate.get(key)?.length ?? 0) > 0;
  const firstOpen = dayKeys.find(hasSlots) ?? null;
  const activeDay = dayChoice && hasSlots(dayChoice) ? dayChoice : firstOpen;
  const daySlots = activeDay ? (byDate.get(activeDay) ?? []) : [];
  const groups = groupSlots(daySlots, timeZone);
  const slot = slotChoice ? daySlots.find((item) => item.startAt === slotChoice) : undefined;
  const nothingOpen = loaded?.data !== undefined && loaded.data !== null && firstOpen === null;
  const nextOpening = loaded?.data?.nextAvailableAt ?? null;
  const firstSlot = groups[0]?.slots[0];

  function chooseService(id: string) {
    setServiceChoice(id);
    setDayChoice(null);
    setSlotChoice(null);
    setNotice("");
    setSubmit({ state: "idle" });
  }

  function chooseStaff(id: string | null) {
    setStaffId(id);
    setDayChoice(null);
    setSlotChoice(null);
    setNotice("");
  }

  function setDetail(key: keyof Details, value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !slot || submit.state === "sending") return;
    const body: CreateBookingRequest = {
      serviceId: service.id,
      startAt: slot.startAt,
      staffId: slot.staffId,
      name: details.name.trim(),
      phone: details.phone.trim(),
      email: details.email.trim(),
      notes: details.notes.trim() || undefined,
      website: details.website,
    };
    setSubmit({ state: "sending" });
    setNotice("");
    try {
      const res = await fetch(`${endpoint}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: unknown = await res.json().catch(() => null);
      if (res.status === 201 && isPublicBookingResponse(data)) {
        setBooked({
          booking: data.booking,
          manageUrl: manageBookingUrl(data.booking.token, window.location.hostname),
        });
        setSubmit({ state: "idle" });
        return;
      }
      const error =
        typeof data === "object" && data !== null && "error" in data
          ? (data as { error?: { code?: string; message?: string } }).error
          : undefined;
      if (res.status === 409 || error?.code === "slot_taken") {
        // Alguém marcou esse horário antes: atualiza a lista e pede outro (os dados ficam).
        setNotice("That time was just taken, pick another.");
        setSlotChoice(null);
        setRefreshCount((count) => count + 1);
        setSubmit({ state: "idle" });
        return;
      }
      setSubmit({
        state: "error",
        message:
          res.status === 429
            ? "Too many tries. Please wait a few minutes or call us to book."
            : (error?.message ?? "We couldn't book that time. Please try again or call us."),
      });
    } catch {
      setSubmit({ state: "error", message: "We couldn't reach the server. Please try again." });
    }
  }

  if (booked) {
    const { booking, manageUrl } = booked;
    return (
      <div
        ref={bookedRef}
        tabIndex={-1}
        role="status"
        className="rounded-xl border border-ns-border bg-ns-background p-6 text-ns-text outline-none @min-[40rem]:p-8"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-ns-primary text-ns-on-primary">
          <CheckIcon className="size-6" />
        </span>
        <p className="mt-4 text-2xl font-semibold">You&rsquo;re booked</p>
        <dl className="mt-5 grid gap-3 text-base">
          <div>
            <dt className="text-sm text-ns-muted">Service</dt>
            <dd className="font-medium">
              {booking.serviceName}
              {booking.staffName ? ` with ${booking.staffName}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ns-muted">When</dt>
            <dd className="font-medium tabular-nums">
              {formatDateTime(booking.startAt, booking.timeZone)}
            </dd>
          </div>
          {booking.businessAddress && (
            <div>
              <dt className="text-sm text-ns-muted">Where</dt>
              <dd>{booking.businessAddress}</dd>
            </div>
          )}
          {booking.businessPhone && (
            <div>
              <dt className="text-sm text-ns-muted">Phone</dt>
              <dd>
                <a
                  href={`tel:${booking.businessPhone.replace(/[^\d+]/g, "")}`}
                  className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary"
                >
                  {booking.businessPhone}
                </a>
              </dd>
            </div>
          )}
        </dl>
        <a
          href={manageUrl}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary"
        >
          Cancel or change
        </a>
      </div>
    );
  }

  return (
    <div className="text-ns-text">
      {/* Avisos para leitores de tela e o aviso de "horário ocupado" (fica sempre no DOM). */}
      <div aria-live="polite" className={notice ? "mb-5" : "sr-only"}>
        {notice ? (
          <p className="rounded-lg border border-ns-primary p-3 text-sm font-medium">{notice}</p>
        ) : loaded?.data && activeDay ? (
          `${daySlots.length} open ${daySlots.length === 1 ? "time" : "times"} on ${dayLabelLong(activeDay)}.`
        ) : null}
      </div>

      <fieldset className="min-w-0">
        <legend className={stepLabel}>Choose a service</legend>
        <div className="grid gap-3 @min-[40rem]:grid-cols-2">
          {info.services.map((item) => {
            const on = item.id === serviceId;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                onClick={() => chooseService(item.id)}
                className={`min-h-14 rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary motion-reduce:transition-none ${on ? chipOn : chipOff}`}
              >
                <span className="block text-base font-semibold">{item.name}</span>
                <span className="mt-1 block text-sm tabular-nums opacity-80">
                  {formatDuration(item.durationMinutes)}
                  {item.priceCents !== null ? ` · ${formatPrice(item.priceCents)}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {service && info.staff.length >= 2 && (
        <fieldset className="mt-8 min-w-0">
          <legend className={stepLabel}>Who?</legend>
          <div className="flex flex-wrap gap-2">
            {[{ id: null, name: "Anyone" }, ...info.staff].map((person) => (
              <button
                key={person.id ?? "anyone"}
                type="button"
                aria-pressed={person.id === staffId}
                onClick={() => chooseStaff(person.id)}
                className={`${chip} ${person.id === staffId ? chipOn : chipOff}`}
              >
                {person.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {service && (
        <div className="mt-8">
          <p className={stepLabel} id="ns-book-day">
            Pick a day
          </p>
          {loading ? (
            <div aria-hidden="true" className="h-[4.75rem] rounded-lg bg-ns-surface" />
          ) : failed ? (
            <p className="text-sm text-ns-muted">
              We couldn&rsquo;t load the times.{" "}
              {phone && phoneHref ? (
                <>
                  Please call{" "}
                  <a href={phoneHref} className="underline underline-offset-4">
                    {phone}
                  </a>{" "}
                  to book.
                </>
              ) : (
                "Please try again in a moment."
              )}
            </p>
          ) : (
            <div
              role="group"
              aria-labelledby="ns-book-day"
              className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pt-1 pb-3"
            >
              {dayKeys.map((key) => {
                const open = hasSlots(key);
                const on = key === activeDay;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!open}
                    aria-pressed={on}
                    onClick={() => {
                      setDayChoice(key);
                      setSlotChoice(null);
                    }}
                    className={`${chip} min-h-[4.25rem] min-w-[5.25rem] shrink-0 snap-start flex-col gap-0.5 px-2 whitespace-nowrap ${on ? chipOn : chipOff} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-ns-border`}
                  >
                    <span>{dayLabel(key, todayKey)}</span>
                    <span className="block min-h-4 text-xs font-normal opacity-80">
                      {open ? "" : "Full"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {service && !loading && !failed && (
        <div className="mt-5 min-h-24">
          {nothingOpen ? (
            <p className="text-base">
              No times left in the next {dayCount === 1 ? "day" : `${dayCount} days`}
              {nextOpening && (
                <>
                  {" · "}
                  <span className="font-semibold">
                    Next opening: {formatNextOpening(nextOpening, timeZone, todayKey)}
                  </span>
                </>
              )}
              {!nextOpening && phone && phoneHref && (
                <>
                  {". Call "}
                  <a href={phoneHref} className="font-semibold underline underline-offset-4">
                    {phone}
                  </a>
                  {" to ask about openings."}
                </>
              )}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.part} className="mb-5">
                <p className="mb-2 text-sm text-ns-muted">{group.label}</p>
                <div className="grid grid-cols-3 gap-2 @min-[40rem]:grid-cols-4">
                  {group.slots.map((item) => (
                    <button
                      key={item.startAt}
                      type="button"
                      aria-pressed={item.startAt === slot?.startAt}
                      onClick={() => setSlotChoice(item.startAt)}
                      className={`${chip} tabular-nums ${item.startAt === slot?.startAt ? chipOn : chipOff}`}
                    >
                      {formatTime(item.startAt, timeZone)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
          {!nothingOpen && firstSlot && (
            <p className="text-xs text-ns-muted">
              Times are in the business&rsquo;s time zone (
              {zoneAbbreviation(firstSlot.startAt, timeZone)}).
            </p>
          )}
        </div>
      )}

      {service && slot && (
        <form onSubmit={handleSubmit} className="relative mt-8 border-t border-ns-border pt-8">
          <p className="mb-5 text-base font-semibold tabular-nums">
            {service.name} &middot; {formatDateTime(slot.startAt, timeZone)}
          </p>
          <div className="grid gap-5 @min-[40rem]:grid-cols-2">
            <label className="block text-sm font-medium">
              Your name
              <input
                name="name"
                required
                maxLength={120}
                autoComplete="name"
                value={details.name}
                onChange={(event) => setDetail("name", event.target.value)}
                className={fieldBase}
              />
            </label>
            <label className="block text-sm font-medium">
              Phone
              <input
                name="phone"
                type="tel"
                required
                minLength={7}
                maxLength={40}
                autoComplete="tel"
                placeholder="(555) 555-0100"
                value={details.phone}
                onChange={(event) => setDetail("phone", event.target.value)}
                className={fieldBase}
              />
            </label>
            <label className="block text-sm font-medium @min-[40rem]:col-span-2">
              Email <span className="font-normal text-ns-muted">(optional)</span>
              <input
                name="email"
                type="email"
                maxLength={200}
                autoComplete="email"
                value={details.email}
                onChange={(event) => setDetail("email", event.target.value)}
                className={fieldBase}
              />
            </label>
            <label className="block text-sm font-medium @min-[40rem]:col-span-2">
              Note <span className="font-normal text-ns-muted">(optional)</span>
              <textarea
                name="notes"
                rows={3}
                maxLength={500}
                value={details.notes}
                onChange={(event) => setDetail("notes", event.target.value)}
                className={fieldBase}
              />
            </label>
            {/* Isca para robôs: invisível para pessoas, precisa ficar vazia. */}
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={details.website}
              onChange={(event) => setDetail("website", event.target.value)}
              className="absolute -left-[9999px] size-px opacity-0"
            />
          </div>
          {submit.state === "error" && (
            <p role="alert" className="mt-4 text-sm font-medium">
              {submit.message}
            </p>
          )}
          <button
            type="submit"
            disabled={submit.state === "sending"}
            aria-busy={submit.state === "sending"}
            className="ns-btn mt-6 min-h-12 w-full rounded-lg bg-ns-primary px-6 py-4 text-base font-semibold text-ns-on-primary transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
          >
            {submit.state === "sending" ? "Booking..." : "Book this time"}
          </button>
          <p className="mt-3 text-center text-sm text-ns-muted">
            Your details are sent to this business so they can reach you about your booking.
          </p>
        </form>
      )}
    </div>
  );
}
