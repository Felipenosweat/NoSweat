"use client";

import {
  PriceItemsResponse,
  WalkInResponse,
  type Job,
  type PriceItem,
  type TeamMember,
} from "@nosweat/schema";
import { useEffect, useId, useState, type FormEvent } from "react";
import { fieldClass, labelClass } from "@/components/DashboardUi";
import { GlassButton, GlassSheet, cx, focusRing } from "@/components/glass";
import { ErrorNote, clientsApi, toClientsError, type ClientsApiError } from "../clients/api";
import { WALK_IN_DEFAULT_MINUTES, roundUpToQuarter } from "./walkin";
import { zonedToUtc } from "./time";

// Folha "Walk-in": quem chegou sem marcar. Cria um serviço que ocupa o horário (e some do
// agendamento online na hora). Campos com 16 px; só o horário e a duração são obrigatórios.

const QUICK = [15, 30, 45, 60, 90] as const;

const field = cx(fieldClass.replace("sm:text-[15px]", ""), "h-11");

const chip = (on: boolean) =>
  cx(
    "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[15px] font-semibold",
    on
      ? "glass-tint text-white [--glass-tint:#071b33]"
      : "glass glass-flat glass-interactive text-(--glass-fg)",
    focusRing,
  );

export function WalkInSheet({
  open,
  onClose,
  onCreated,
  team,
  timeZone,
  today,
  nowMinutes,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (job: Job) => void;
  /** Só os membros ativos. */
  team: TeamMember[];
  timeZone: string;
  today: string;
  nowMinutes: number;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="Walk-in"
      description="Someone showed up without booking. This blocks the time so nobody can book it online."
      size="lg"
      dismissible={!busy}
    >
      {open && (
        <WalkInForm
          team={team}
          timeZone={timeZone}
          today={today}
          nowMinutes={nowMinutes}
          onCancel={onClose}
          onBusy={setBusy}
          onCreated={onCreated}
        />
      )}
    </GlassSheet>
  );
}

function WalkInForm({
  team,
  timeZone,
  today,
  nowMinutes,
  onCancel,
  onBusy,
  onCreated,
}: {
  team: TeamMember[];
  timeZone: string;
  today: string;
  nowMinutes: number;
  onCancel: () => void;
  onBusy: (busy: boolean) => void;
  onCreated: (job: Job) => void;
}) {
  const ids = useId();
  const [services, setServices] = useState<PriceItem[]>([]);
  const [name, setName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [minutes, setMinutes] = useState(WALK_IN_DEFAULT_MINUTES);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(() => roundUpToQuarter(nowMinutes));
  const [assignee, setAssignee] = useState(team.length === 1 ? (team[0]?.id ?? "") : "");
  const [problem, setProblem] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  // Serviços agendáveis (com duração): escolher um já preenche a duração.
  useEffect(() => {
    let live = true;
    clientsApi("/api/office/price-items", PriceItemsResponse)
      .then((result) => {
        if (live) {
          setServices(
            result.items.filter((item) => item.active && item.bookable && item.durationMinutes),
          );
        }
      })
      .catch(() => {
        // Sem a lista, o walk-in continua: só não tem serviço para escolher.
      });
    return () => {
      live = false;
    };
  }, []);

  function pickService(id: string) {
    setServiceId(id);
    const item = services.find((s) => s.id === id);
    if (item?.durationMinutes) setMinutes(item.durationMinutes);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    if (!date || !time) {
      setProblem("Pick a day and a start time.");
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
      setProblem("How long will it take? Pick between 5 minutes and 8 hours.");
      return;
    }
    setProblem("");
    setPending(true);
    onBusy(true);
    try {
      const result = await clientsApi("/api/office/walk-in", WalkInResponse, {
        method: "POST",
        body: {
          name: name.trim() || undefined,
          serviceId: serviceId || undefined,
          startAt: zonedToUtc(date, time, timeZone).toISOString(),
          durationMinutes: minutes,
          assigneeId: assignee || undefined,
        },
      });
      onCreated(result.job);
    } catch (err) {
      setError(toClientsError(err));
      setPending(false);
      onBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate aria-label="Walk-in">
      <fieldset disabled={pending} className="grid gap-5">
        <div>
          <label htmlFor={`${ids}-name`} className={labelClass}>
            Name (optional)
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            autoCapitalize="words"
            maxLength={120}
            className={cx(field, "mt-1.5")}
          />
        </div>

        {services.length > 0 && (
          <div>
            <label htmlFor={`${ids}-service`} className={labelClass}>
              Service
            </label>
            <select
              id={`${ids}-service`}
              value={serviceId}
              onChange={(event) => pickService(event.target.value)}
              className={cx(field, "mt-1.5 cursor-pointer")}
            >
              <option value="">No service</option>
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.durationMinutes} min
                </option>
              ))}
            </select>
          </div>
        )}

        <fieldset>
          <legend className={labelClass}>When</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${ids}-date`} className="sr-only">
                Day
              </label>
              <input
                id={`${ids}-date`}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor={`${ids}-time`} className="sr-only">
                Start time
              </label>
              <input
                id={`${ids}-time`}
                type="time"
                step={900}
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className={cx(field, "tabular-nums")}
              />
            </div>
          </div>
        </fieldset>

        <div>
          <p id={`${ids}-len`} className={labelClass}>
            How long
          </p>
          <ul className="mt-1.5 flex flex-wrap items-center gap-2" aria-labelledby={`${ids}-len`}>
            {QUICK.map((value) => (
              <li key={value}>
                <button
                  type="button"
                  aria-pressed={minutes === value}
                  onClick={() => setMinutes(value)}
                  className={chip(minutes === value)}
                >
                  {value} min
                </button>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <label htmlFor={`${ids}-custom`} className="text-[15px] text-slate-600">
                Custom
              </label>
              <input
                id={`${ids}-custom`}
                inputMode="numeric"
                pattern="[0-9]*"
                value={minutes > 0 ? String(minutes) : ""}
                onChange={(event) =>
                  setMinutes(Number(event.target.value.replace(/\D/g, "").slice(0, 3)))
                }
                className={cx(field, "w-20 text-center tabular-nums")}
              />
              <span className="text-[15px] text-slate-600">min</span>
            </li>
          </ul>
        </div>

        {team.length > 1 && (
          <div>
            <label htmlFor={`${ids}-who`} className={labelClass}>
              Who is taking them
            </label>
            <select
              id={`${ids}-who`}
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className={cx(field, "mt-1.5 cursor-pointer")}
            >
              <option value="">Whole shop (blocks everyone)</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </fieldset>

      {problem && (
        <p role="alert" className="mt-4 text-[15px] font-semibold text-red-700">
          {problem}
        </p>
      )}
      {error && <ErrorNote error={error} className="mt-4" />}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <GlassButton variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" variant="primary" loading={pending}>
          {pending ? "Saving…" : "Block this time"}
        </GlassButton>
      </div>
    </form>
  );
}
