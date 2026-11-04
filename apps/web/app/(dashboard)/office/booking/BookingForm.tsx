"use client";

import {
  BookingSettingsResponse,
  UpdateBookingSettingsRequest,
  type BookingSettings,
} from "@nosweat/schema";
import Link from "next/link";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import {
  GlassButton,
  GlassCard,
  GlassSegmented,
  Notice,
  focusRing,
  type GlassSegmentOption,
} from "@/components/glass";
import { SITE_ORIGIN } from "@/lib/site";
import { ErrorNote, officeApi, toOfficeError, type OfficeApiError } from "../_ui/api";
import { CardHeading, useUnsavedWarning } from "../_ui/editor";
import {
  CopyIcon,
  PlusIcon,
  TrashIcon,
  fieldClass,
  hintClass,
  labelClass,
  textButtonClass,
} from "../_ui/ui";
import {
  DAY_NAMES,
  WEEK_ORDER,
  addClosedDate,
  copyMondayToAll,
  formatClosedDate,
  formatHours,
  secondRangeAfter,
  weeklyProblem,
  withCurrent,
} from "./hours";

// Agendamento online do dono: liga/desliga, horários da semana, passo, folga, antecedência,
// dias fechados e o link da página de marcação. O servidor calcula os horários livres; aqui o
// dono só diz quando atende. Salvar é explícito ("Save changes"). Os dados vêm de
// GET /api/office/booking-settings (a tela carrega e mostra um esqueleto enquanto isso).

export type BookingSite = {
  id: string;
  name: string;
  /** Endereço grátis (só com o site publicado). */
  slug: string | null;
  /** O rascunho do site já tem a seção "Booking". */
  hasSection: boolean;
};

type Load =
  | { status: "loading" }
  | { status: "error"; error: OfficeApiError }
  | { status: "ready"; settings: BookingSettings };

export function BookingForm({
  sites,
  bookableCount,
  readOnly,
}: {
  sites: BookingSite[];
  /** Quantos itens da tabela de preços o cliente enxerga (null = não deu para ler). */
  bookableCount: number | null;
  readOnly: boolean;
}) {
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    let live = true;
    officeApi("/api/office/booking-settings", BookingSettingsResponse)
      .then((result) => {
        if (live) setLoad({ status: "ready", settings: result.settings });
      })
      .catch((err: unknown) => {
        if (live) setLoad({ status: "error", error: toOfficeError(err) });
      });
    return () => {
      live = false;
    };
  }, []);

  if (load.status === "loading") {
    return (
      <div aria-busy="true" aria-label="Loading booking settings" className="grid gap-4">
        <div className="h-40 rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse" />
        <div className="h-96 rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse" />
      </div>
    );
  }
  if (load.status === "error") {
    return <ErrorNote error={load.error} />;
  }
  return (
    <BookingEditor
      initial={load.settings}
      sites={sites}
      bookableCount={bookableCount}
      readOnly={readOnly}
    />
  );
}

const STEPS = [15, 30, 45, 60] as const;
const BUFFERS = [0, 5, 10, 15, 30] as const;
const NOTICES = [0, 1, 2, 4, 12, 24, 48] as const;
const AHEAD = [7, 14, 30, 60, 90, 180] as const;

function Switch({
  checked,
  onChange,
  labelledBy,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 transition-colors aria-checked:bg-brand disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${focusRing}`}
    >
      <span
        aria-hidden="true"
        className={`size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${checked ? "translate-x-7" : "translate-x-1"}`}
      />
    </button>
  );
}

function Select({
  id,
  label,
  hint,
  value,
  options,
  format,
  onChange,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  value: number;
  options: readonly number[];
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`${fieldClass} mt-1.5 h-11 cursor-pointer`}
      >
        {withCurrent(options, value).map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

function BookingEditor({
  initial,
  sites,
  bookableCount,
  readOnly,
}: {
  initial: BookingSettings;
  sites: BookingSite[];
  bookableCount: number | null;
  readOnly: boolean;
}) {
  const ids = useId();
  const [values, setValues] = useState<BookingSettings>(initial);
  const [saved, setSaved] = useState<BookingSettings>(initial);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState("");
  const [error, setError] = useState<OfficeApiError | null>(null);
  const [notice, setNotice] = useState("");
  const [newClosed, setNewClosed] = useState("");
  const [copied, setCopied] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedWarning(!readOnly && dirty);

  function change(patch: Partial<BookingSettings>) {
    setValues((current) => ({ ...current, ...patch }));
    setNotice("");
    setProblem("");
  }

  function setDay(day: number, ranges: BookingSettings["weekly"][number]) {
    change({ weekly: values.weekly.map((current, index) => (index === day ? ranges : current)) });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || readOnly) return;
    setError(null);
    const hoursProblem = weeklyProblem(values.weekly);
    if (hoursProblem) {
      setProblem(hoursProblem);
      return;
    }
    const parsed = UpdateBookingSettingsRequest.safeParse(values);
    if (!parsed.success) {
      setProblem(parsed.error.issues[0]?.message ?? "Please check your hours.");
      return;
    }
    setProblem("");
    setPending(true);
    try {
      const result = await officeApi("/api/office/booking-settings", BookingSettingsResponse, {
        method: "PUT",
        body: parsed.data,
      });
      setValues(result.settings);
      setSaved(result.settings);
      setNotice(
        result.settings.enabled
          ? "Saved. Customers can book online."
          : "Saved. Online booking is off.",
      );
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setPending(false);
    }
  }

  const liveSite = sites.find((site) => site.slug);
  const bookingUrl = liveSite?.slug ? `${SITE_ORIGIN}/book/${liveSite.slug}` : null;
  const anySection = sites.some((site) => site.hasSection);

  async function copyLink() {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão para copiar: o link continua visível para copiar à mão.
    }
  }

  const stepOptions: GlassSegmentOption<string>[] = withCurrent(STEPS, values.slotStepMinutes).map(
    (minutes) => ({ value: String(minutes), label: `${minutes} min` }),
  );

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      aria-label="Online booking"
      data-tour="booking-form"
    >
      <fieldset disabled={pending || readOnly} className="grid gap-4">
        <GlassCard as="section" aria-labelledby={`${ids}-master`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id={`${ids}-master`}
                className="font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink"
              >
                Let customers book online
              </h2>
              <p role="status" className="mt-1 text-[15px] leading-6 text-slate-600">
                {saved.enabled
                  ? "On. Customers see your free times and can book them."
                  : "Off. Your site doesn’t show booking times."}
              </p>
            </div>
            <Switch
              checked={values.enabled}
              onChange={(next) => change({ enabled: next })}
              labelledBy={`${ids}-master`}
              disabled={pending || readOnly}
            />
          </div>
          {values.enabled && bookableCount === 0 && (
            <Notice tone="warning" size="sm" className="mt-4">
              No services are bookable yet. In the{" "}
              <Link href="/office/price-book" className="font-semibold underline">
                Price book
              </Link>
              , turn on &ldquo;Bookable&rdquo; and add a duration for each service.
            </Notice>
          )}
          {values.enabled && !anySection && sites.length > 0 && (
            <Notice tone="info" size="sm" className="mt-4">
              Your site doesn&rsquo;t have the Booking section yet. Add it in the editor (Sections
              &rarr; Add).
            </Notice>
          )}
        </GlassCard>

        <GlassCard as="section" aria-labelledby={`${ids}-hours`}>
          <CardHeading
            id={`${ids}-hours`}
            aside={
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => change({ weekly: copyMondayToAll(values.weekly) })}
              >
                Copy Monday to all
              </GlassButton>
            }
          >
            Your hours
          </CardHeading>
          <ul className="divide-y divide-(--glass-rim)">
            {WEEK_ORDER.map((day) => {
              const name = DAY_NAMES[day] ?? "";
              const ranges = values.weekly[day] ?? [];
              const open = ranges.length > 0;
              const second = ranges[0] ? secondRangeAfter(ranges[0]) : null;
              return (
                <li key={day} className="grid gap-2 py-3 sm:grid-cols-[9.5rem_1fr] sm:gap-4">
                  <label className="flex min-h-11 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={open}
                      onChange={(event) =>
                        setDay(day, event.target.checked ? [{ start: "09:00", end: "17:00" }] : [])
                      }
                      className="size-5 shrink-0 accent-brand"
                    />
                    <span className="text-[15px] font-semibold text-ink">{name}</span>
                    {!open && <span className="text-[15px] text-slate-600">Closed</span>}
                  </label>
                  {open && (
                    <div className="grid gap-2">
                      {ranges.map((range, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-2">
                          <input
                            type="time"
                            aria-label={`${name} block ${index + 1} opens`}
                            value={range.start}
                            onChange={(event) =>
                              setDay(
                                day,
                                ranges.map((item, i) =>
                                  i === index ? { ...item, start: event.target.value } : item,
                                ),
                              )
                            }
                            className={`${fieldClass} h-11 w-36 tabular-nums`}
                          />
                          <span aria-hidden="true" className="text-slate-600">
                            to
                          </span>
                          <input
                            type="time"
                            aria-label={`${name} block ${index + 1} closes`}
                            value={range.end}
                            onChange={(event) =>
                              setDay(
                                day,
                                ranges.map((item, i) =>
                                  i === index ? { ...item, end: event.target.value } : item,
                                ),
                              )
                            }
                            className={`${fieldClass} h-11 w-36 tabular-nums`}
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => setDay(day, ranges.slice(0, 1))}
                              className={textButtonClass}
                            >
                              <TrashIcon />
                              <span className="sr-only">Remove {name} second block</span>
                              <span aria-hidden="true">Remove</span>
                            </button>
                          )}
                        </div>
                      ))}
                      {ranges.length === 1 && second && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setDay(day, [...ranges, second])}
                            className={textButtonClass}
                          >
                            <PlusIcon />
                            Add a break (second block)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={hintClass}>
            Times are in your business time zone (Settings &rarr; Schedule).
          </p>
        </GlassCard>

        <GlassCard as="section" aria-labelledby={`${ids}-rules`}>
          <CardHeading id={`${ids}-rules`}>Booking rules</CardHeading>
          <div className="grid gap-5">
            <div>
              <p id={`${ids}-step`} className={labelClass}>
                Time between start times
              </p>
              <div className="mt-1.5">
                <GlassSegmented
                  aria-label="Time between start times"
                  options={stepOptions}
                  value={String(values.slotStepMinutes)}
                  onChange={(value) => change({ slotStepMinutes: Number(value) })}
                />
              </div>
              <p className={hintClass}>How often a new start time is offered, like 9:00, 9:30.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Select
                id={`${ids}-buffer`}
                label="Buffer after each visit"
                value={values.bufferMinutes}
                options={BUFFERS}
                format={(value) => (value === 0 ? "None" : `${value} min`)}
                onChange={(value) => change({ bufferMinutes: value })}
              />
              <Select
                id={`${ids}-notice`}
                label="Minimum notice"
                value={values.minNoticeHours}
                options={NOTICES}
                format={formatHours}
                onChange={(value) => change({ minNoticeHours: value })}
              />
              <Select
                id={`${ids}-ahead`}
                label="How far ahead"
                value={values.maxDaysAhead}
                options={AHEAD}
                format={(value) => `${value} days`}
                onChange={(value) => change({ maxDaysAhead: value })}
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard as="section" aria-labelledby={`${ids}-closed`}>
          <CardHeading id={`${ids}-closed`}>Days off</CardHeading>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor={`${ids}-closed-date`} className={labelClass}>
                Closed on
              </label>
              <input
                id={`${ids}-closed-date`}
                type="date"
                value={newClosed}
                onChange={(event) => setNewClosed(event.target.value)}
                className={`${fieldClass} mt-1.5 h-11 w-44`}
              />
            </div>
            <GlassButton
              variant="secondary"
              icon={<PlusIcon />}
              disabled={!newClosed || values.closedDates.length >= 366}
              onClick={() => {
                change({ closedDates: addClosedDate(values.closedDates, newClosed) });
                setNewClosed("");
              }}
            >
              Add day off
            </GlassButton>
          </div>
          {values.closedDates.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {values.closedDates.map((date) => (
                <li
                  key={date}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-(--glass-groove) pr-1 pl-4 text-[15px] text-ink"
                >
                  <span className="tabular-nums">{formatClosedDate(date)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      change({ closedDates: values.closedDates.filter((item) => item !== date) })
                    }
                    aria-label={`Remove ${formatClosedDate(date)}`}
                    className={`inline-flex size-9 items-center justify-center rounded-full text-slate-600 hover:text-ink ${focusRing}`}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={hintClass}>Holidays and days you can&rsquo;t take bookings.</p>
          )}
        </GlassCard>

        <GlassCard as="section" aria-labelledby={`${ids}-note-title`}>
          <CardHeading id={`${ids}-note-title`}>Note to customers</CardHeading>
          <label htmlFor={`${ids}-note`} className="sr-only">
            Note to customers
          </label>
          <textarea
            id={`${ids}-note`}
            value={values.note}
            onChange={(event) => change({ note: event.target.value })}
            rows={2}
            maxLength={300}
            placeholder="Please arrive 5 minutes early."
            className={`${fieldClass} resize-y py-2.5 leading-[1.55]`}
          />
          <p className={hintClass}>Shown above the times when someone books. Optional.</p>
        </GlassCard>
      </fieldset>

      <GlassCard as="section" aria-labelledby={`${ids}-link`} className="mt-4">
        <CardHeading id={`${ids}-link`}>Your booking link</CardHeading>
        {bookingUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 basis-64 truncate rounded-xl bg-(--glass-groove) px-3 py-2.5 text-[14px] text-ink">
              {bookingUrl}
            </code>
            <GlassButton variant="secondary" icon={<CopyIcon />} onClick={() => void copyLink()}>
              {copied ? "Copied" : "Copy link"}
            </GlassButton>
          </div>
        ) : (
          <p className={`${hintClass} mt-0`}>
            Publish your site to get a link you can share. It opens a page where customers book.
          </p>
        )}
        <p className={hintClass}>
          Add the Booking section to your site in the editor (Sections &rarr; Add).
        </p>
      </GlassCard>

      {problem && (
        <Notice tone="error" size="sm" className="mt-5">
          {problem}
        </Notice>
      )}
      {error && <ErrorNote error={error} className="mt-5" />}

      {!readOnly && (
        <div className="sticky bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-20 mt-6 flex items-center justify-end gap-3 lg:bottom-4">
          <p role="status" className="text-[15px] font-semibold text-emerald-700 empty:hidden">
            {notice}
          </p>
          <GlassButton type="submit" variant="primary" loading={pending} disabled={!dirty}>
            {pending ? "Saving…" : "Save changes"}
          </GlassButton>
        </div>
      )}
    </form>
  );
}
