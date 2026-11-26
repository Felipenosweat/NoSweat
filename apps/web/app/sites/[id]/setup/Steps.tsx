"use client";

import {
  PAYMENT_HANDLE_HINTS,
  PAYMENT_LABELS,
  PAYMENT_METHODS,
  type AcceptedPaymentMethod,
} from "@nosweat/schema";
import { useId, useState, type ReactNode } from "react";
import { PlusIcon, TrashIcon } from "@/app/(dashboard)/office/_ui/ui";
import {
  DAY_NAMES,
  addClosedDate,
  formatClosedDate,
  formatHours,
  withCurrent,
} from "@/app/(dashboard)/office/booking/hours";
import { fieldClass, hintClass, labelClass } from "@/components/DashboardUi";
import { GlassButton, cx, focusRing } from "@/components/glass";
import {
  DURATION_CHIPS,
  WINDOW_PRESETS,
  clockLabel,
  emptyPerson,
  emptyService,
  formatDuration,
  formatPriceText,
  listWindows,
  nameKey,
  policyPresets,
  rangesForDay,
  rangesForWindows,
  windowCount,
  type DayHours,
  type PolicyPreset,
  type WizardService,
  type WizardState,
} from "@/lib/setup/wizard";
import { parseDollars } from "@/lib/clients";
import {
  US_STATES,
  US_TIME_ZONES,
  cleanZip,
  formatUsPhone,
  timeZoneLabel,
  usHolidays,
} from "@/lib/setup/us";

// Telas do assistente de configuração. Cada uma recebe o estado inteiro e um `update` que mexe
// só em alguns campos. Campos com 16 px (o Safari do iPhone não dá zoom) e alvos de toque de 44 px.

export type StepProps = {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
};

// Mesmo campo do painel, mas sempre com 16 px (o padrão cai para 15 px em telas largas).
const field = cx(fieldClass.replace("sm:text-[15px]", ""), "h-11");
const area = cx(fieldClass.replace("sm:text-[15px]", ""), "resize-y py-2.5 leading-[1.55]");

const chip = (on: boolean) =>
  cx(
    "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[15px] font-semibold",
    on
      ? "glass-tint text-white [--glass-tint:#071b33]"
      : "glass glass-flat glass-interactive text-(--glass-fg)",
    focusRing,
  );

const rowButton = `inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[15px] font-semibold text-brand hover:text-brand-dark ${focusRing}`;

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h3>
        {hint && <p className="mt-1 text-[15px] leading-6 text-slate-600">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function NumberSelect({
  label,
  hint,
  value,
  options,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  options: readonly number[];
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cx(field, "mt-1.5 cursor-pointer")}
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

// ---------- fuso e dias de folga (usados em "hours" e "days") ----------

function TimeZoneField({ state, update }: StepProps) {
  const id = useId();
  const zones = US_TIME_ZONES.some((zone) => zone.id === state.timeZone)
    ? US_TIME_ZONES
    : [...US_TIME_ZONES, { id: state.timeZone, label: timeZoneLabel(state.timeZone) }];
  return (
    <Group
      title="Your time zone"
      hint="Every time you set here, and every time customers see, uses it."
    >
      <label htmlFor={id} className="sr-only">
        Time zone
      </label>
      <select
        id={id}
        value={state.timeZone}
        onChange={(event) => update({ timeZone: event.target.value })}
        className={cx(field, "max-w-sm cursor-pointer")}
      >
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.label}
          </option>
        ))}
      </select>
    </Group>
  );
}

function DaysOff({
  state,
  update,
  today,
  year,
}: StepProps & {
  today: string;
  year: number;
}) {
  const id = useId();
  const [pick, setPick] = useState("");
  const dates = state.closedDates;
  const toggle = (date: string) =>
    update({
      closedDates: dates.includes(date)
        ? dates.filter((d) => d !== date)
        : addClosedDate(dates, date),
    });
  const years = [year, year + 1];
  return (
    <Group
      title="Days off"
      hint="Tap the holidays you are closed. Customers can’t book those days."
    >
      <div className="grid gap-4">
        {years.map((y) => {
          const upcoming = usHolidays(y).filter((holiday) => holiday.date >= today);
          if (upcoming.length === 0) return null;
          return (
            <div key={y}>
              <p className="text-[13px] font-semibold text-(--glass-fg-muted) tabular-nums">{y}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {upcoming.map((holiday) => (
                  <li key={holiday.id}>
                    <button
                      type="button"
                      aria-pressed={dates.includes(holiday.date)}
                      onClick={() => toggle(holiday.date)}
                      className={chip(dates.includes(holiday.date))}
                    >
                      {holiday.label}
                      <span className="ml-1.5 text-[13px] font-normal opacity-80">
                        {formatClosedDate(holiday.date)
                          .replace(/^\w+, /, "")
                          .replace(/, \d{4}$/, "")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={id} className={labelClass}>
            Another day off
          </label>
          <input
            id={id}
            type="date"
            min={today}
            value={pick}
            onChange={(event) => setPick(event.target.value)}
            className={cx(field, "mt-1.5 w-44")}
          />
        </div>
        <GlassButton
          variant="secondary"
          icon={<PlusIcon />}
          disabled={!pick || dates.length >= 366}
          onClick={() => {
            update({ closedDates: addClosedDate(dates, pick) });
            setPick("");
          }}
        >
          Add day off
        </GlassButton>
      </div>
      {dates.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Your days off">
          {dates.map((date) => (
            <li
              key={date}
              className="inline-flex min-h-11 items-center gap-1 rounded-full bg-(--glass-groove) pr-1 pl-4 text-[15px] text-ink"
            >
              <span className="tabular-nums">{formatClosedDate(date)}</span>
              <button
                type="button"
                onClick={() => update({ closedDates: dates.filter((d) => d !== date) })}
                aria-label={`Remove ${formatClosedDate(date)}`}
                className={`inline-flex size-11 items-center justify-center rounded-full text-slate-600 hover:text-ink ${focusRing}`}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Group>
  );
}

// ---------- passo: horário da loja (shop) ----------

function setDay(state: WizardState, index: number, patch: Partial<DayHours>): DayHours[] {
  return state.days.map((day, i) => (i === index ? { ...day, ...patch } : day));
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="time"
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cx(field, "w-36 tabular-nums")}
    />
  );
}

export function HoursStep({
  state,
  update,
  today,
  year,
}: StepProps & { today: string; year: number }) {
  const firstOpen = state.days.findIndex((day) => day.open);
  return (
    <div className="grid gap-8">
      <Group
        title="Which days are you open?"
        hint="Set the hours for each day. Add a lunch break if you close for a while."
      >
        <ul className="divide-y divide-(--glass-rim)">
          {state.days.map((day, index) => {
            const name = DAY_NAMES[index] ?? "";
            return (
              <li key={name} className="grid gap-2 py-3 sm:grid-cols-[9.5rem_1fr] sm:gap-4">
                <label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={day.open}
                    onChange={(event) =>
                      update({ days: setDay(state, index, { open: event.target.checked }) })
                    }
                    className="size-5 shrink-0 accent-brand"
                  />
                  <span className="text-[15px] font-semibold text-ink">{name}</span>
                  {!day.open && <span className="text-[15px] text-slate-600">Closed</span>}
                </label>
                {day.open && (
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <TimeInput
                        label={`${name} opens`}
                        value={day.start}
                        onChange={(start) => update({ days: setDay(state, index, { start }) })}
                      />
                      <span aria-hidden="true" className="text-slate-600">
                        to
                      </span>
                      <TimeInput
                        label={`${name} closes`}
                        value={day.end}
                        onChange={(end) => update({ days: setDay(state, index, { end }) })}
                      />
                    </div>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink">
                      <input
                        type="checkbox"
                        checked={day.lunch}
                        onChange={(event) =>
                          update({ days: setDay(state, index, { lunch: event.target.checked }) })
                        }
                        className="size-5 accent-brand"
                      />
                      Lunch break
                    </label>
                    {day.lunch && (
                      <div className="flex flex-wrap items-center gap-2">
                        <TimeInput
                          label={`${name} break starts`}
                          value={day.lunchStart}
                          onChange={(lunchStart) =>
                            update({ days: setDay(state, index, { lunchStart }) })
                          }
                        />
                        <span aria-hidden="true" className="text-slate-600">
                          to
                        </span>
                        <TimeInput
                          label={`${name} break ends`}
                          value={day.lunchEnd}
                          onChange={(lunchEnd) =>
                            update({ days: setDay(state, index, { lunchEnd }) })
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {firstOpen >= 0 && state.days.filter((day) => day.open).length > 1 && (
          <div>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => {
                const source = state.days[firstOpen];
                if (!source) return;
                update({
                  days: state.days.map((day) => (day.open ? { ...source, open: true } : day)),
                });
              }}
            >
              Use {DAY_NAMES[firstOpen]}’s hours for every open day
            </GlassButton>
          </div>
        )}
      </Group>
      <TimeZoneField state={state} update={update} />
      <DaysOff state={state} update={update} today={today} year={year} />
    </div>
  );
}

// ---------- passo: dias e janelas de chegada (home) ----------

export function DaysStep({
  state,
  update,
  today,
  year,
}: StepProps & { today: string; year: number }) {
  const { windows } = state;
  const count = windowCount(windows);
  const preset = WINDOW_PRESETS.findIndex(
    (p) =>
      p.windows.start === windows.start &&
      p.windows.end === windows.end &&
      p.windows.length === windows.length,
  );
  // Ao mudar o tamanho da janela, os serviços que duravam uma janela seguem durando uma janela.
  const setWindows = (next: typeof windows) =>
    update({
      windows: next,
      services: state.services.map((service) =>
        service.durationMinutes === windows.length
          ? { ...service, durationMinutes: next.length }
          : service,
      ),
    });
  return (
    <div className="grid gap-8">
      <Group title="Which days do you work?">
        <ul className="flex flex-wrap gap-2" aria-label="Days you work">
          {state.days.map((day, index) => (
            <li key={DAY_NAMES[index]}>
              <button
                type="button"
                aria-pressed={day.open}
                aria-label={DAY_NAMES[index]}
                onClick={() => update({ days: setDay(state, index, { open: !day.open }) })}
                className={cx(chip(day.open), "min-w-14")}
              >
                {(DAY_NAMES[index] ?? "").slice(0, 3)}
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group
        title="Arrival windows"
        hint="Customers pick a window, and you arrive sometime inside it."
      >
        <ul className="flex flex-wrap gap-2" aria-label="Window presets">
          {WINDOW_PRESETS.map((p, index) => (
            <li key={p.label}>
              <button
                type="button"
                aria-pressed={preset === index}
                onClick={() => setWindows({ ...p.windows })}
                className={chip(preset === index)}
              >
                {p.label}
              </button>
            </li>
          ))}
          {preset === -1 && (
            <li>
              <span className={cx(chip(true), "cursor-default")}>Custom</span>
            </li>
          )}
        </ul>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className={labelClass}>First window starts</p>
            <div className="mt-1.5">
              <TimeInput
                label="First window starts"
                value={windows.start}
                onChange={(start) => setWindows({ ...windows, start })}
              />
            </div>
          </div>
          <div>
            <p className={labelClass}>Last window ends</p>
            <div className="mt-1.5">
              <TimeInput
                label="Last window ends"
                value={windows.end}
                onChange={(end) => setWindows({ ...windows, end })}
              />
            </div>
          </div>
          <NumberSelect
            label="Window length"
            value={windows.length}
            options={[60, 90, 120, 180, 240]}
            format={formatDuration}
            onChange={(length) => setWindows({ ...windows, length })}
          />
        </div>
        <div className="rounded-2xl bg-(--glass-groove) p-4">
          <p className="text-[13px] font-semibold text-(--glass-fg-muted)">
            What customers will see each working day
          </p>
          {count === 0 ? (
            <p className="mt-2 text-[15px] text-red-700">
              No window fits between those times. Move the end later or shorten the windows.
            </p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {listWindows(windows).map((w) => (
                <li
                  key={w.start}
                  className="rounded-full bg-white/80 px-3 py-1.5 text-[15px] font-semibold text-ink tabular-nums"
                >
                  {w.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Group>

      <TimeZoneField state={state} update={update} />
      <DaysOff state={state} update={update} today={today} year={year} />
    </div>
  );
}

// ---------- passo: serviços ----------

function ServiceRow({
  service,
  chips,
  home,
  onChange,
  onRemove,
  canRemove,
}: {
  service: WizardService;
  chips: readonly number[];
  home: boolean;
  onChange: (patch: Partial<WizardService>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const id = useId();
  return (
    <li className="grid gap-4 rounded-2xl border border-(--glass-rim) bg-white/50 p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-name`} className={labelClass}>
            Service name
          </label>
          <input
            id={`${id}-name`}
            value={service.name}
            onChange={(event) => onChange({ name: event.target.value })}
            autoComplete="off"
            autoCapitalize="words"
            maxLength={120}
            placeholder={home ? "Drain cleaning" : "Women’s haircut"}
            className={cx(field, "mt-1.5")}
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={cx(rowButton, "mt-6 shrink-0")}
            aria-label={`Remove ${service.name.trim() || "this service"}`}
          >
            <TrashIcon />
            <span className="sr-only sm:not-sr-only">Remove</span>
          </button>
        )}
      </div>

      <div>
        <p className={labelClass} id={`${id}-dur`}>
          {home ? "How long is the visit?" : "How long does it take?"}
        </p>
        <ul className="mt-1.5 flex flex-wrap items-center gap-2" aria-labelledby={`${id}-dur`}>
          {chips.map((minutes) => (
            <li key={minutes}>
              <button
                type="button"
                aria-pressed={service.durationMinutes === minutes}
                onClick={() => onChange({ durationMinutes: minutes })}
                className={chip(service.durationMinutes === minutes)}
              >
                {formatDuration(minutes)}
              </button>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <label htmlFor={`${id}-custom`} className="text-[15px] text-slate-600">
              Custom
            </label>
            <input
              id={`${id}-custom`}
              inputMode="numeric"
              pattern="[0-9]*"
              value={service.durationMinutes > 0 ? String(service.durationMinutes) : ""}
              onChange={(event) =>
                onChange({
                  durationMinutes: Number(event.target.value.replace(/\D/g, "").slice(0, 3)),
                })
              }
              className={cx(field, "w-20 text-center tabular-nums")}
            />
            <span className="text-[15px] text-slate-600">min</span>
          </li>
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_1fr] sm:items-end">
        <div>
          <label htmlFor={`${id}-price`} className={labelClass}>
            Price (optional)
          </label>
          <div className="relative mt-1.5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--glass-fg-muted)"
            >
              $
            </span>
            <input
              id={`${id}-price`}
              inputMode="decimal"
              autoComplete="off"
              value={service.price}
              onChange={(event) => onChange({ price: event.target.value })}
              placeholder="85"
              className={cx(field, "pl-7 tabular-nums")}
            />
          </div>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink">
          <input
            type="checkbox"
            checked={service.priceFrom}
            onChange={(event) => onChange({ priceFrom: event.target.checked })}
            className="size-5 accent-brand"
          />
          Show as “from” price (the final price can be higher)
        </label>
      </div>

      <div>
        <label htmlFor={`${id}-desc`} className={labelClass}>
          Short description (optional)
        </label>
        <input
          id={`${id}-desc`}
          value={service.description}
          onChange={(event) => onChange({ description: event.target.value })}
          autoComplete="off"
          maxLength={300}
          className={cx(field, "mt-1.5")}
        />
      </div>
    </li>
  );
}

export function ServicesStep({ state, update }: StepProps) {
  const home = state.kind === "home";
  const base = home ? state.windows.length : 60;
  const chips = home
    ? [1, 2, 3].map((n) => n * state.windows.length).filter((m) => m <= 480)
    : DURATION_CHIPS;
  const setService = (key: string, patch: Partial<WizardService>) =>
    update({
      services: state.services.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    });
  const remove = (service: WizardService) => {
    const name = service.name.trim();
    update({
      services: state.services.filter((s) => s.key !== service.key),
      removed: service.existing && name ? [...new Set([...state.removed, name])] : state.removed,
    });
  };
  return (
    <Group
      title={
        home ? "What services do you offer?" : "What do you offer, and how long does each take?"
      }
      hint={
        home
          ? "Add the jobs customers can book. Prices are optional; use “from” if it depends on the job."
          : "Customers pick a service and see only the times that fit. Prices are in US dollars."
      }
    >
      <ul className="grid gap-3">
        {state.services.map((service) => (
          <ServiceRow
            key={service.key}
            service={service}
            chips={chips}
            home={home}
            canRemove={state.services.length > 1}
            onChange={(patch) => setService(service.key, patch)}
            onRemove={() => remove(service)}
          />
        ))}
      </ul>
      <div>
        <GlassButton
          variant="secondary"
          icon={<PlusIcon />}
          disabled={state.services.length >= 40}
          onClick={() => update({ services: [...state.services, emptyService(base)] })}
        >
          Add a service
        </GlassButton>
      </div>
    </Group>
  );
}

// ---------- passo: equipe (shop) ----------

export function TeamStep({ state, update }: StepProps) {
  const setPerson = (key: string, patch: Partial<WizardState["people"][number]>) =>
    update({ people: state.people.map((p) => (p.key === key ? { ...p, ...patch } : p)) });
  const choose = (alone: boolean) =>
    update({
      alone,
      people: !alone && state.people.length === 0 ? [emptyPerson()] : state.people,
    });
  return (
    <Group
      title="Who works here?"
      hint="Customers can pick a person, and each person gets their own column in your schedule."
    >
      <div role="radiogroup" aria-label="Team" className="flex flex-wrap gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={state.alone}
          onClick={() => choose(true)}
          className={chip(state.alone)}
        >
          I work alone
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!state.alone}
          onClick={() => choose(false)}
          className={chip(!state.alone)}
        >
          I have a team
        </button>
      </div>
      {!state.alone && (
        <>
          <ul className="grid gap-3">
            {state.people.map((person) => (
              <PersonRow
                key={person.key}
                person={person}
                onChange={(patch) => setPerson(person.key, patch)}
                onRemove={() =>
                  update({
                    people: state.people.filter((p) => p.key !== person.key),
                  })
                }
              />
            ))}
          </ul>
          <div>
            <GlassButton
              variant="secondary"
              icon={<PlusIcon />}
              disabled={state.people.length >= 6}
              onClick={() => update({ people: [...state.people, emptyPerson()] })}
            >
              Add a person
            </GlassButton>
            {state.people.length >= 6 && (
              <p className={hintClass}>Your site shows up to 6 people.</p>
            )}
          </div>
        </>
      )}
    </Group>
  );
}

function PersonRow({
  person,
  onChange,
  onRemove,
}: {
  person: WizardState["people"][number];
  onChange: (patch: Partial<WizardState["people"][number]>) => void;
  onRemove: () => void;
}) {
  const id = useId();
  return (
    <li className="grid gap-4 rounded-2xl border border-(--glass-rim) bg-white/50 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className={labelClass}>
            Name
          </label>
          <input
            id={`${id}-name`}
            value={person.name}
            onChange={(event) => onChange({ name: event.target.value })}
            autoComplete="off"
            autoCapitalize="words"
            maxLength={80}
            className={cx(field, "mt-1.5")}
          />
        </div>
        <div>
          <label htmlFor={`${id}-role`} className={labelClass}>
            Role (optional)
          </label>
          <input
            id={`${id}-role`}
            value={person.role}
            onChange={(event) => onChange({ role: event.target.value })}
            autoComplete="off"
            maxLength={40}
            placeholder="Stylist"
            className={cx(field, "mt-1.5")}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-bio`} className={labelClass}>
          Short bio (optional)
        </label>
        <textarea
          id={`${id}-bio`}
          value={person.bio}
          onChange={(event) => onChange({ bio: event.target.value })}
          rows={2}
          maxLength={200}
          className={cx(area, "mt-1.5")}
        />
        <p className={hintClass}>
          <span className="tabular-nums">{person.bio.length}</span>/200. Only write what is true; it
          shows on your site.
        </p>
      </div>
      <div>
        <button type="button" onClick={onRemove} className={rowButton}>
          <TrashIcon />
          Remove {person.name.trim() || "this person"}
        </button>
      </div>
    </li>
  );
}

// ---------- passo: área atendida (home) ----------

export function AreaStep({ state, update }: StepProps) {
  const id = useId();
  return (
    <Group
      title="Where do you work?"
      hint="This shows on your site so customers know you cover their neighborhood."
    >
      <div className="grid gap-4">
        <div>
          <label htmlFor={`${id}-area`} className={labelClass}>
            Service area
          </label>
          <input
            id={`${id}-area`}
            value={state.serviceArea}
            onChange={(event) => update({ serviceArea: event.target.value })}
            autoComplete="off"
            maxLength={120}
            placeholder="Austin, Round Rock and nearby"
            className={cx(field, "mt-1.5")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem_8rem]">
          <div>
            <label htmlFor={`${id}-city`} className={labelClass}>
              City
            </label>
            <input
              id={`${id}-city`}
              value={state.city}
              onChange={(event) => update({ city: event.target.value })}
              autoComplete="address-level2"
              autoCapitalize="words"
              maxLength={60}
              className={cx(field, "mt-1.5")}
            />
          </div>
          <div>
            <label htmlFor={`${id}-state`} className={labelClass}>
              State
            </label>
            <select
              id={`${id}-state`}
              value={state.state}
              onChange={(event) => update({ state: event.target.value })}
              autoComplete="address-level1"
              className={cx(field, "mt-1.5 cursor-pointer")}
            >
              <option value="">Select</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-zip`} className={labelClass}>
              ZIP code
            </label>
            <input
              id={`${id}-zip`}
              value={state.zip}
              onChange={(event) => update({ zip: cleanZip(event.target.value) })}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              placeholder="78701"
              className={cx(field, "mt-1.5 tabular-nums")}
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className={labelClass}>
            Phone number
          </label>
          <input
            id={`${id}-phone`}
            type="tel"
            value={state.phone}
            onChange={(event) => update({ phone: formatUsPhone(event.target.value) })}
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(512) 555-0100"
            className={cx(field, "mt-1.5 max-w-xs tabular-nums")}
          />
          <p className={hintClass}>Customers tap it to call you.</p>
        </div>
      </div>
    </Group>
  );
}

// ---------- passo: como os clientes pagam ----------

/** Formas que pedem um identificador público, com o rótulo do campo. */
const HANDLE_LABELS: Partial<Record<AcceptedPaymentMethod, string>> = {
  zelle: "Zelle phone number or e-mail",
  venmo: "Venmo username",
  cash_app: "Cash App $cashtag",
  paypal: "PayPal.me link",
};

export function PaymentsStep({ state, update }: StepProps) {
  const id = useId();
  const { payments } = state;
  const toggle = (method: AcceptedPaymentMethod) => {
    const on = new Set(payments.methods);
    if (on.has(method)) on.delete(method);
    else on.add(method);
    // Sempre na ordem de PAYMENT_METHODS (a mesma dos pills do site).
    update({ payments: { ...payments, methods: PAYMENT_METHODS.filter((m) => on.has(m)) } });
  };
  const withHandle = PAYMENT_METHODS.filter(
    (method) => payments.methods.includes(method) && HANDLE_LABELS[method],
  );
  return (
    <div className="grid gap-8">
      <Group
        title="How do customers pay you?"
        hint="Pick everything you accept. We only show this on your website and in booking e-mails: customers pay you directly, not through No Sweat."
      >
        <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
          {PAYMENT_METHODS.map((method) => (
            <li key={method}>
              <button
                type="button"
                aria-pressed={payments.methods.includes(method)}
                onClick={() => toggle(method)}
                className={chip(payments.methods.includes(method))}
              >
                {PAYMENT_LABELS[method]}
              </button>
            </li>
          ))}
        </ul>
        {payments.methods.length === 0 && (
          <p className={hintClass}>
            Nothing selected: your website will not show a Payment section. You can skip this step.
          </p>
        )}
      </Group>

      {withHandle.length > 0 && (
        <Group
          title="Where should customers send it?"
          hint="Usernames, phone numbers and e-mails you type here are shown publicly on your website. Never enter a card or bank account number."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {withHandle.map((method) => (
              <div key={method}>
                <label htmlFor={`${id}-${method}`} className={labelClass}>
                  {HANDLE_LABELS[method]} (optional)
                </label>
                <input
                  id={`${id}-${method}`}
                  type="text"
                  value={payments.handles[method] ?? ""}
                  onChange={(event) =>
                    update({
                      payments: {
                        ...payments,
                        handles: { ...payments.handles, [method]: event.target.value },
                      },
                    })
                  }
                  inputMode={method === "zelle" ? "email" : "text"}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={80}
                  placeholder={PAYMENT_HANDLE_HINTS[method as keyof typeof PAYMENT_HANDLE_HINTS]}
                  className={cx(field, "mt-1.5")}
                />
              </div>
            ))}
          </div>
        </Group>
      )}

      {payments.methods.length > 0 && (
        <div>
          <label htmlFor={`${id}-note`} className={labelClass}>
            Note about payment (optional)
          </label>
          <textarea
            id={`${id}-note`}
            value={payments.note}
            onChange={(event) => update({ payments: { ...payments, note: event.target.value } })}
            rows={2}
            maxLength={160}
            placeholder="Payment is due when the work is finished."
            className={cx(area, "mt-1.5")}
          />
        </div>
      )}
    </div>
  );
}

// ---------- passo: regras ----------

const NOTICES = [0, 1, 2, 4, 12, 24, 48] as const;
const AHEAD = [7, 14, 30, 60, 90, 180] as const;
const BUFFERS = [0, 5, 10, 15, 30] as const;

export function RulesStep({ state, update }: StepProps) {
  const id = useId();
  const presets = policyPresets(state.kind);
  const choose = (preset: PolicyPreset) => {
    const found = presets.find((p) => p.id === preset);
    if (found) {
      update({
        policyPreset: preset,
        cancellationPolicy: found.text,
        cancellationHours: found.hours,
      });
    } else {
      update({ policyPreset: preset });
    }
  };
  const options: { id: PolicyPreset; label: string }[] = [
    ...presets.map((p) => ({ id: p.id, label: p.label })),
    { id: "custom", label: "Write my own" },
    { id: "none", label: "No policy" },
  ];
  return (
    <div className="grid gap-8">
      <Group
        title="Cancellation policy"
        hint="Customers see this when they book and must agree to it."
      >
        <ul className="flex flex-wrap gap-2" aria-label="Policy">
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={state.policyPreset === option.id}
                onClick={() => choose(option.id)}
                className={chip(state.policyPreset === option.id)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
        {state.policyPreset !== "none" && (
          <div className="grid gap-4">
            <div>
              <label htmlFor={`${id}-text`} className={labelClass}>
                Your policy
              </label>
              <textarea
                id={`${id}-text`}
                value={state.cancellationPolicy}
                onChange={(event) =>
                  update({
                    cancellationPolicy: event.target.value,
                    policyPreset: "custom",
                  })
                }
                rows={3}
                maxLength={600}
                className={cx(area, "mt-1.5")}
              />
            </div>
            <div className="max-w-xs">
              <label htmlFor={`${id}-hours`} className={labelClass}>
                Cancel for free up to (hours before)
              </label>
              <input
                id={`${id}-hours`}
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(state.cancellationHours)}
                onChange={(event) =>
                  update({
                    cancellationHours: Math.min(
                      720,
                      Number(event.target.value.replace(/\D/g, "").slice(0, 3)),
                    ),
                  })
                }
                className={cx(field, "mt-1.5 w-28 tabular-nums")}
              />
              <p className={hintClass}>0 means customers can cancel any time.</p>
            </div>
          </div>
        )}
      </Group>

      <Group
        title="Text reminders (you send them from your phone)"
        hint="Customers see an optional box to agree to text reminders. No Sweat does not send texts for you: your Schedule page lists tomorrow’s customers who agreed, with a message ready to send from your own phone. If someone replies STOP, you must stop texting them (mark them on that list)."
      >
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={state.smsReminders}
            onChange={(event) => update({ smsReminders: event.target.checked })}
            className="size-6 shrink-0 accent-brand"
          />
          <span className="text-[15px] font-semibold text-ink">
            Ask customers if they want text reminders
          </span>
        </label>
      </Group>

      <Group title="Booking rules">
        <div className="grid gap-5 sm:grid-cols-3">
          <NumberSelect
            label="Minimum notice"
            value={state.minNoticeHours}
            options={NOTICES}
            format={formatHours}
            onChange={(minNoticeHours) => update({ minNoticeHours })}
          />
          <NumberSelect
            label="How far ahead"
            value={state.maxDaysAhead}
            options={AHEAD}
            format={(value) => `${value} days`}
            onChange={(maxDaysAhead) => update({ maxDaysAhead })}
          />
          <NumberSelect
            label="Buffer after each visit"
            value={state.bufferMinutes}
            options={BUFFERS}
            format={(value) => (value === 0 ? "None" : `${value} min`)}
            onChange={(bufferMinutes) => update({ bufferMinutes })}
          />
        </div>
        <div>
          <label htmlFor={`${id}-note`} className={labelClass}>
            Note to customers (optional)
          </label>
          <textarea
            id={`${id}-note`}
            value={state.note}
            onChange={(event) => update({ note: event.target.value })}
            rows={2}
            maxLength={300}
            placeholder={
              state.kind === "home"
                ? "Please make sure someone 18 or older is home."
                : "Please arrive 5 minutes early."
            }
            className={cx(area, "mt-1.5")}
          />
        </div>
      </Group>
    </div>
  );
}

// ---------- passo: revisão ----------

/** "Mon–Fri 9 AM – 5 PM" por agrupamento simples: uma linha por dia aberto. */
function dayLine(day: DayHours, state: WizardState): string {
  const ranges = state.kind === "home" ? rangesForWindows(day, state.windows) : rangesForDay(day);
  return ranges.map((r) => `${clockLabel(r.start)} – ${clockLabel(r.end)}`).join(", ");
}

export function ReviewStep({
  state,
  goTo,
}: {
  state: WizardState;
  goTo: (step: "hours" | "days" | "services" | "team" | "area" | "payments" | "rules") => void;
}) {
  const home = state.kind === "home";
  const hoursStep = home ? "days" : "hours";
  const row = (title: string, step: Parameters<typeof goTo>[0], body: ReactNode) => (
    <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="flex items-center justify-between gap-3 text-[15px] font-semibold text-ink sm:block">
        {title}
        <button
          type="button"
          onClick={() => goTo(step)}
          className={cx(rowButton, "sm:mt-1 sm:flex")}
        >
          Change<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </dt>
      <dd className="min-w-0 text-[15px] leading-6 text-slate-700">{body}</dd>
    </div>
  );
  return (
    <Group
      title="Ready? Here’s what customers will be able to book."
      hint="Turning this on shows your free times on your site once it is published."
    >
      <dl className="divide-y divide-(--glass-rim) border-y border-(--glass-rim)">
        {row(
          home ? "Working days" : "Hours",
          hoursStep,
          <ul>
            {state.days.map((day, index) =>
              day.open ? (
                <li key={DAY_NAMES[index]}>
                  <span className="font-semibold">{(DAY_NAMES[index] ?? "").slice(0, 3)}</span>{" "}
                  <span className="tabular-nums">{dayLine(day, state)}</span>
                </li>
              ) : null,
            )}
            <li className="mt-1 text-slate-600">
              {timeZoneLabel(state.timeZone)}
              {state.closedDates.length > 0 &&
                ` · ${state.closedDates.length} ${state.closedDates.length === 1 ? "day" : "days"} off`}
            </li>
          </ul>,
        )}
        {home &&
          row(
            "Arrival windows",
            "days",
            <p>
              {listWindows(state.windows)
                .map((w) => w.label)
                .join(", ")}
            </p>,
          )}
        {row(
          "Services",
          "services",
          <ul>
            {state.services.map((service) => {
              const cents = parseDollars(service.price);
              return (
                <li key={service.key}>
                  <span className="font-semibold">{service.name.trim() || "Unnamed service"}</span>
                  {" · "}
                  {formatDuration(service.durationMinutes)}
                  {cents ? ` · ${formatPriceText(cents, service.priceFrom)}` : ""}
                </li>
              );
            })}
          </ul>,
        )}
        {!home &&
          row(
            "Team",
            "team",
            state.alone ? (
              <p>Just you</p>
            ) : (
              <ul>
                {state.people.map((person) => (
                  <li key={nameKey(person.name) || person.key}>
                    <span className="font-semibold">{person.name.trim()}</span>
                    {person.role.trim() ? `, ${person.role.trim()}` : ""}
                  </li>
                ))}
              </ul>
            ),
          )}
        {home &&
          row(
            "Where",
            "area",
            <p>
              {[
                state.serviceArea.trim(),
                [state.city.trim(), state.state].filter(Boolean).join(", "),
              ]
                .filter(Boolean)
                .join(" · ") || "Not set"}
              {state.phone ? ` · ${state.phone}` : ""}
            </p>,
          )}
        {row(
          "Payment",
          "payments",
          state.payments.methods.length === 0 ? (
            <p>Not shown on your website</p>
          ) : (
            <p>
              {state.payments.methods
                .map((method) => PAYMENT_LABELS[method])
                .join(", ")}
            </p>
          ),
        )}
        {row(
          "Rules",
          "rules",
          <ul>
            <li>
              {state.policyPreset === "none" ? "No cancellation policy" : state.cancellationPolicy}
            </li>
            {state.smsReminders && (
              <li className="text-slate-600">Customers can opt in to text reminders</li>
            )}
            <li className="text-slate-600">
              {state.minNoticeHours === 0
                ? "Customers can book right up to the start time"
                : `Customers book at least ${formatHours(state.minNoticeHours)} ahead`}
              , up to {state.maxDaysAhead} days out
            </li>
          </ul>,
        )}
      </dl>
    </Group>
  );
}
