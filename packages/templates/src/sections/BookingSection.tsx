"use client";

import type {
  AvailabilityResponse,
  BookableService,
  BookingSlot,
  PublicBooking,
  PublicBookingInfo,
} from "@nosweat/schema";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon } from "../components/icons";
import { ServiceGlyph } from "../compositions/soft/ServiceGlyph";
import { demoAvailability, demoBookingInfo, type DemoService } from "./booking-demo";
import { BookingDetailsFields } from "./BookingDetailsFields";
import {
  buildBookingBody,
  consentsGiven,
  EMPTY_BOOKING_DETAILS,
  validateDetails,
  visibleErrors,
  type BookingDetails,
  type DetailErrors,
} from "./booking-form";
import {
  addDaysToKey,
  dateKeyInZone,
  dayLabel,
  dayLabelLong,
  dayParts,
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

/** Dados de exemplo (só /examples): os serviços do site de exemplo e horários fixos. */
export type BookingDemo = { services: DemoService[]; businessName: string };

/** Dados públicos do agendamento; `off` = nada para mostrar (desligado, erro ou sem serviços). */
function useBookingInfo(endpoint: string | undefined, demo?: BookingDemo): InfoState {
  const [state, setState] = useState<InfoState>({ status: "loading" });
  const demoKey = demo ? JSON.stringify(demo) : "";
  useEffect(() => {
    if (demo) {
      // Modo exemplo: sem API, os dados vêm prontos (e só no navegador, para a data ser a de hoje).
      setState({
        status: "ready",
        info: demoBookingInfo(demo.services, demo.businessName),
        todayKey: dateKeyInZone(new Date(), "UTC"),
      });
      return;
    }
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
  }, [endpoint, demoKey]);
  return endpoint || demo ? state : { status: "off" };
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
  /** "soft": visual do app de salão (composição de beleza). Padrão: o visual de sempre. */
  variant?: "default" | "soft";
  /** Só /examples: horários de exemplo no lugar da API (nunca em site publicado). */
  demo?: BookingDemo;
};

/** Evento disparado pelo "+" dos serviços: escolhe o serviço (pelo nome) no seletor. */
export const BOOK_SERVICE_EVENT = "ns:book-service";

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
  variant = "default",
  demo,
}: BookingSectionProps) {
  const state = useBookingInfo(endpoint, demo);
  // Serviço pedido pelo "+" da lista; `n` sobe a cada clique (clicar de novo no mesmo reescolhe).
  const [preselect, setPreselect] = useState<{ name: string; n: number } | null>(null);
  useEffect(() => {
    const listener = (event: Event) => {
      const name = event instanceof CustomEvent ? (event.detail as { name?: unknown })?.name : null;
      if (typeof name === "string") setPreselect((current) => ({ name, n: (current?.n ?? 0) + 1 }));
    };
    window.addEventListener(BOOK_SERVICE_EVENT, listener);
    return () => window.removeEventListener(BOOK_SERVICE_EVENT, listener);
  }, []);
  if (state.status === "off" && !editable) return <>{fallback ?? null}</>;

  if (variant === "soft") {
    return (
      <section id={id} className={className} aria-busy={state.status === "loading"}>
        <div className="ns-s-card ns-s-book">
          {heading}
          {intro && <p className="ns-s-intro">{intro}</p>}
          {state.status === "ready" && state.info.note && (
            <p className="ns-s-intro">{state.info.note}</p>
          )}
          {demo && <p className="ns-s-intro">Example times, for this demo only.</p>}
          <noscript>
            <p className="ns-s-intro">
              {phone && phoneHref ? (
                <>
                  Call us to book: <a href={phoneHref}>{phone}</a>
                </>
              ) : (
                "Contact us to book."
              )}
            </p>
          </noscript>
          {state.status === "ready" ? (
            <BookingPanel
              endpoint={endpoint ?? ""}
              info={state.info}
              todayKey={state.todayKey}
              phone={phone}
              phoneHref={phoneHref}
              soft
              demo={Boolean(demo)}
              preselect={preselect}
            />
          ) : state.status === "off" ? (
            <p className="ns-s-intro">
              Online booking appears here once you turn it on in Business &rarr; Booking.
            </p>
          ) : (
            <div aria-hidden="true" className="ns-s-skel" />
          )}
        </div>
      </section>
    );
  }

  const split = layout === "split";
  return (
    <section id={id} className={className} aria-busy={state.status === "loading"}>
      {/* grid-cols-1 = minmax(0, 1fr): sem isso a coluna única cresce até a largura da fileira de
          dias e dos horários e a seção estoura a tela do celular. */}
      <div
        className={split ? "grid grid-cols-1 gap-10 @5xl:grid-cols-12" : "grid grid-cols-1 gap-8"}
      >
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
        <div className={split ? "min-w-0 @5xl:col-span-7 @5xl:col-start-6" : "min-w-0"}>
          {state.status === "ready" ? (
            <BookingPanel
              endpoint={endpoint ?? ""}
              info={state.info}
              todayKey={state.todayKey}
              phone={phone}
              phoneHref={phoneHref}
              preselect={preselect}
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

type SubmitState = { state: "idle" } | { state: "sending" } | { state: "error"; message: string };

const chip =
  "ns-btn inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary motion-reduce:transition-none";
const chipOn = "border-ns-primary bg-ns-primary text-ns-on-primary";
const chipOff = "border-ns-border bg-ns-background text-ns-text hover:border-ns-text/40";
const stepLabel = "mb-3 block text-sm font-semibold text-ns-text";

function BookingPanel({
  endpoint,
  info,
  todayKey,
  phone,
  phoneHref,
  soft = false,
  demo = false,
  preselect = null,
}: {
  endpoint: string;
  info: PublicBookingInfo;
  todayKey: string;
  phone?: string;
  phoneHref?: string;
  soft?: boolean;
  demo?: boolean;
  preselect?: { name: string; n: number } | null;
}) {
  const [serviceChoice, setServiceChoice] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [dayChoice, setDayChoice] = useState<string | null>(null);
  const [slotChoice, setSlotChoice] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState | null>(null);
  // Sobe a cada "horário ocupado": força uma nova consulta da disponibilidade.
  const [refreshCount, setRefreshCount] = useState(0);
  const [details, setDetails] = useState<BookingDetails>(EMPTY_BOOKING_DETAILS);
  // Erro de um campo só aparece depois que a pessoa saiu dele ou tentou enviar.
  const [blurred, setBlurred] = useState<Partial<Record<keyof DetailErrors, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ state: "idle" });
  const [notice, setNotice] = useState("");
  const [booked, setBooked] = useState<{ booking: PublicBooking; manageUrl: string } | null>(null);
  const bookedRef = useRef<HTMLDivElement>(null);

  const dayCount = Math.min(MAX_STRIP_DAYS, Math.max(1, info.maxDaysAhead));
  const timeZone = info.timeZone;

  // Um serviço só já vem escolhido. No visual do app de salão (soft) o primeiro já vem escolhido
  // também: dia e horários aparecem logo, como na tela de reserva do app, e dá para trocar.
  const service: BookableService | null =
    info.services.find((item) => item.id === serviceChoice) ??
    (info.services.length === 1 || soft ? (info.services[0] ?? null) : null);
  const serviceId = service?.id ?? null;
  const availabilityKey = serviceId ? `${serviceId}|${staffId ?? ""}|${refreshCount}` : null;

  useEffect(() => {
    if (!serviceId || !availabilityKey) return;
    let live = true;
    const key = availabilityKey;
    if (demo) {
      setAvailability({ key, data: demoAvailability(todayKey, dayCount) });
      return;
    }
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
  }, [endpoint, serviceId, staffId, availabilityKey, todayKey, dayCount, demo]);

  // "+" da lista de serviços: escolhe o serviço de mesmo nome (sem diferenciar maiúsculas).
  useEffect(() => {
    if (!preselect) return;
    const wanted = preselect.name.trim().toLowerCase();
    const match = info.services.find((item) => item.name.trim().toLowerCase() === wanted);
    if (match) chooseService(match.id);
  }, [preselect]);

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

  const hasPolicy = Boolean(info.cancellationPolicy?.trim());
  const fieldErrors = visibleErrors(validateDetails(details), blurred, attempted);
  const consented = consentsGiven(details, hasPolicy);

  function patchDetails(patch: Partial<BookingDetails>) {
    setDetails((current) => ({ ...current, ...patch }));
  }

  function blurField(key: keyof DetailErrors) {
    setBlurred((current) => ({ ...current, [key]: true }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !slot || submit.state === "sending") return;
    if (demo) {
      setNotice("This is an example, so nothing was booked.");
      return;
    }
    const body = buildBookingBody(details, { serviceId: service.id, slot }, hasPolicy);
    if (!body) {
      // Campo inválido: mostra os erros e leva o foco ao primeiro.
      setAttempted(true);
      const form = event.currentTarget;
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
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
        className={
          soft
            ? "ns-s-done"
            : "rounded-xl border border-ns-border bg-ns-background p-6 text-ns-text outline-none @min-[40rem]:p-8"
        }
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

  if (soft) {
    // Visual do app de salão: linhas de serviço, faixa de datas, horários em pílulas e a barra larga.
    const flat = groups.flatMap((group) => group.slots);
    // No exemplo, um horário já vem marcado (só para mostrar o visual); em site real, só o do cliente.
    const shown = slot ?? (demo ? flat[1] : undefined);
    const priceLabel = (cents: number | null) => (cents === null ? "" : formatPrice(cents));
    const serviceRow = (item: BookableService, selected: boolean) => (
      <>
        <span className="ns-s-svc-ico" aria-hidden="true">
          <ServiceGlyph name={item.name} />
        </span>
        <span className="ns-s-svc-text">
          <b>{item.name}</b>
          <small>
            {formatDuration(item.durationMinutes)}
            {item.priceCents !== null ? ` · ${priceLabel(item.priceCents)}` : ""}
          </small>
        </span>
        {selected && <CheckIcon className="ns-s-svc-check" />}
      </>
    );
    const serviceButton = (item: BookableService) => (
      <button
        key={item.id}
        type="button"
        aria-pressed={item.id === serviceId}
        onClick={() => chooseService(item.id)}
        className={`ns-s-svc${item.id === serviceId ? " is-on" : ""}`}
      >
        {serviceRow(item, item.id === serviceId)}
      </button>
    );
    return (
      <div className="ns-s-panel">
        <div aria-live="polite" className={notice ? "ns-s-notice" : "sr-only"}>
          {notice ? (
            <p>{notice}</p>
          ) : loaded?.data && activeDay ? (
            `${daySlots.length} open ${daySlots.length === 1 ? "time" : "times"} on ${dayLabelLong(activeDay)}.`
          ) : null}
        </div>

        <fieldset className="ns-s-fs">
          <legend className={service ? "sr-only" : "ns-s-bh"}>Choose a service</legend>
          {info.services.length === 1 && service ? (
            <div className="ns-s-svc is-on">{serviceRow(service, true)}</div>
          ) : service ? (
            <details key={service.id} className="ns-s-change">
              <summary className="ns-s-svc is-on">
                {serviceRow(service, false)}
                <ChevronDownIcon className="ns-s-svc-check" />
                <span className="sr-only">Change service</span>
              </summary>
              <div className="ns-s-svc-list">
                {info.services.filter((item) => item.id !== serviceId).map(serviceButton)}
              </div>
            </details>
          ) : (
            <div className="ns-s-svc-list">{info.services.map(serviceButton)}</div>
          )}
        </fieldset>

        {service && info.staff.length >= 2 && (
          <fieldset className="ns-s-fs">
            <legend className="ns-s-bh">Who?</legend>
            <div className="ns-s-who">
              {[{ id: null, name: "Anyone" }, ...info.staff].map((person) => (
                <button
                  key={person.id ?? "anyone"}
                  type="button"
                  aria-pressed={person.id === staffId}
                  onClick={() => chooseStaff(person.id)}
                  className={`ns-s-time${person.id === staffId ? " is-on" : ""}`}
                >
                  {person.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {service && (
          <div>
            <p className="ns-s-bh" id="ns-book-day">
              Select date
            </p>
            {loading ? (
              <div aria-hidden="true" className="ns-s-skel ns-s-skel--days" />
            ) : failed ? (
              <p className="ns-s-intro">
                We couldn&rsquo;t load the times.{" "}
                {phone && phoneHref ? (
                  <>
                    Please call <a href={phoneHref}>{phone}</a> to book.
                  </>
                ) : (
                  "Please try again in a moment."
                )}
              </p>
            ) : (
              <div role="group" aria-labelledby="ns-book-day" className="ns-s-days">
                {dayKeys.map((key) => {
                  const open = hasSlots(key);
                  const parts = dayParts(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!open}
                      aria-pressed={key === activeDay}
                      aria-label={`${dayLabelLong(key)}${open ? "" : ", full"}`}
                      onClick={() => {
                        setDayChoice(key);
                        setSlotChoice(null);
                      }}
                      className={`ns-s-day${key === activeDay ? " is-on" : ""}`}
                    >
                      <span aria-hidden="true">{parts.weekday}</span>
                      <b aria-hidden="true">{parts.day}</b>
                      {!open && <small aria-hidden="true">Full</small>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {service && !loading && !failed && (
          <div>
            <p className="ns-s-bh">Select time</p>
            {nothingOpen ? (
              <p className="ns-s-intro">
                No times left in the next {dayCount === 1 ? "day" : `${dayCount} days`}
                {nextOpening && (
                  <>
                    {" · "}
                    <b>Next opening: {formatNextOpening(nextOpening, timeZone, todayKey)}</b>
                  </>
                )}
                {!nextOpening && phone && phoneHref && (
                  <>
                    {". Call "}
                    <a href={phoneHref}>{phone}</a>
                    {" to ask about openings."}
                  </>
                )}
              </p>
            ) : (
              <div className="ns-s-times">
                {flat.map((item) => (
                  <button
                    key={item.startAt}
                    type="button"
                    aria-pressed={item.startAt === shown?.startAt}
                    onClick={() => setSlotChoice(item.startAt)}
                    className={`ns-s-time${item.startAt === shown?.startAt ? " is-on" : ""}`}
                  >
                    {formatTime(item.startAt, timeZone)}
                  </button>
                ))}
              </div>
            )}
            {!nothingOpen && firstSlot && (
              <p className="ns-s-zone">
                Times are in the business&rsquo;s time zone (
                {zoneAbbreviation(firstSlot.startAt, timeZone)}).
              </p>
            )}
          </div>
        )}

        {service && slot ? (
          <form onSubmit={handleSubmit} noValidate className="ns-s-form">
            <p className="ns-s-when">
              {service.name} &middot; {formatDateTime(slot.startAt, timeZone)}
            </p>
            <BookingDetailsFields
              soft
              details={details}
              onChange={patchDetails}
              errors={fieldErrors}
              onBlurField={blurField}
              cancellationPolicy={info.cancellationPolicy}
              cancellationHours={info.cancellationHours}
            />
            {submit.state === "error" && (
              <p role="alert" className="ns-s-error">
                {submit.message}
              </p>
            )}
            <button
              type="submit"
              disabled={submit.state === "sending" || !consented}
              aria-busy={submit.state === "sending"}
              className="ns-s-bar"
            >
              <span>{submit.state === "sending" ? "Booking..." : "Book appointment"}</span>
              <b>{priceLabel(service.priceCents) || formatTime(slot.startAt, timeZone)}</b>
            </button>
            <p className="ns-s-zone">
              Your details are sent to this business so they can reach you about your booking.
            </p>
          </form>
        ) : (
          service &&
          shown && (
            // Exemplo: só mostra a barra (nada é enviado); em site real ela aparece depois do horário.
            <div className="ns-s-bar ns-s-bar--static" aria-hidden="true">
              <span>Book appointment</span>
              <b>{priceLabel(service.priceCents)}</b>
            </div>
          )
        )}
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
        <form
          onSubmit={handleSubmit}
          noValidate
          className="relative mt-8 border-t border-ns-border pt-8"
        >
          <p className="mb-5 text-base font-semibold tabular-nums">
            {service.name} &middot; {formatDateTime(slot.startAt, timeZone)}
          </p>
          <div className="grid gap-5 @min-[40rem]:grid-cols-2">
            <BookingDetailsFields
              details={details}
              onChange={patchDetails}
              errors={fieldErrors}
              onBlurField={blurField}
              cancellationPolicy={info.cancellationPolicy}
              cancellationHours={info.cancellationHours}
            />
          </div>
          {submit.state === "error" && (
            <p role="alert" className="mt-4 text-sm font-medium">
              {submit.message}
            </p>
          )}
          <button
            type="submit"
            disabled={submit.state === "sending" || !consented}
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
