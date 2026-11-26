"use client";

import { SiteSetupResponse } from "@nosweat/schema";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ErrorNote,
  officeApi,
  toOfficeError,
  type OfficeApiError,
} from "@/app/(dashboard)/office/_ui/api";
import { GlassButton, GlassCard, Notice, cx } from "@/components/glass";
import {
  STEPS,
  buildSetupRequest,
  stepProblem,
  type StepId,
  type WizardState,
} from "@/lib/setup/wizard";
import {
  AreaStep,
  DaysStep,
  HoursStep,
  ReviewStep,
  RulesStep,
  ServicesStep,
  TeamStep,
} from "./Steps";

// Assistente de configuração do agendamento (/sites/[id]/setup). O estado fica na tela até o
// "Turn on online booking" (uma chamada só grava tudo) e também no sessionStorage da aba, para
// uma recarga não perder as respostas.

const STEP_TITLES: Record<StepId, string> = {
  hours: "Hours",
  days: "Days and windows",
  services: "Services",
  team: "Team",
  area: "Where you work",
  rules: "Rules",
  review: "Review",
};

const noopSubscribe = () => () => {};

type Props = {
  siteId: string;
  siteName: string;
  initial: WizardState;
  /** Hoje ("AAAA-MM-DD") e o ano, vindos do servidor (a tela não lê o relógio). */
  today: string;
  year: number;
  /** Veio do fim do /create: "Skip for now" segue para o editor. */
  fromCreate: boolean;
};

/** Depois da hidratação o assistente é montado de novo, já lendo o sessionStorage. */
export function SetupWizard(props: Props) {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return <Wizard key={hydrated ? "client" : "server"} canReadStorage={hydrated} {...props} />;
}

type Saved = { step: number; state: WizardState };

function readSaved(key: string, initial: WizardState): Saved | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { step, state } = data as { step?: unknown; state?: Partial<WizardState> };
    if (
      typeof step !== "number" ||
      !state ||
      state.kind !== initial.kind ||
      !Array.isArray(state.days) ||
      state.days.length !== 7 ||
      !Array.isArray(state.services) ||
      !Array.isArray(state.people)
    ) {
      return null;
    }
    return {
      step: Math.max(0, Math.min(step, STEPS[initial.kind].length - 1)),
      state: { ...initial, ...state },
    };
  } catch {
    return null;
  }
}

function Wizard({
  siteId,
  siteName,
  initial,
  today,
  year,
  fromCreate,
  canReadStorage,
}: Props & { canReadStorage: boolean }) {
  const storageKey = `ns-setup-${siteId}`;
  const steps = STEPS[initial.kind];
  const [saved] = useState(() => (canReadStorage ? readSaved(storageKey, initial) : null));
  const [state, setState] = useState<WizardState>(saved?.state ?? initial);
  const [index, setIndex] = useState(saved?.step ?? 0);
  const [problem, setProblem] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const [done, setDone] = useState<SiteSetupResponse | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const step = steps[index] ?? "review";
  const skipHref = fromCreate ? `/sites/${siteId}/edit` : `/sites/${siteId}`;

  useEffect(() => {
    if (!canReadStorage || done) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ step: index, state }));
    } catch {
      // Armazenamento cheio ou bloqueado: o assistente segue sem guardar.
    }
  }, [canReadStorage, done, index, state, storageKey]);

  // Cada passo novo leva o foco para o título (leitores de tela) e volta ao topo.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [index, done]);

  function update(patch: Partial<WizardState>) {
    setState((current) => ({ ...current, ...patch }));
    setProblem("");
  }

  function goTo(target: StepId) {
    const next = steps.indexOf(target);
    if (next >= 0) {
      setIndex(next);
      setProblem("");
      setError(null);
    }
  }

  function next() {
    const found = stepProblem(state, step);
    if (found) {
      setProblem(found);
      return;
    }
    setProblem("");
    setIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  async function save() {
    if (pending) return;
    setError(null);
    // Qualquer passo com problema leva o dono até ele.
    for (const id of steps) {
      const found = stepProblem(state, id);
      if (found) {
        goTo(id);
        setProblem(found);
        return;
      }
    }
    const built = buildSetupRequest(state);
    if (!built.ok) {
      setProblem(built.error);
      return;
    }
    setPending(true);
    try {
      const result = await officeApi(
        `/api/sites/${encodeURIComponent(siteId)}/setup`,
        SiteSetupResponse,
        { method: "POST", body: built.request },
      );
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // Sem acesso ao armazenamento: nada a limpar.
      }
      setDone(result);
    } catch (err) {
      setError(toOfficeError(err));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <GlassCard as="section" aria-labelledby="setup-done" className="max-w-3xl">
        <h2
          id="setup-done"
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-2xl font-bold tracking-[-0.02em] text-ink outline-none"
        >
          Online booking is on
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-slate-600">
          {done.services} {done.services === 1 ? "service" : "services"} saved
          {done.people > 0 ? ` and ${done.people} ${done.people === 1 ? "person" : "people"}` : ""}.
          Customers will see your free times on {siteName} once the site is published, and every
          booking blocks that time in your schedule.
        </p>
        {done.notes.length > 0 && (
          <Notice tone="info" size="sm" className="mt-4">
            {done.notes.join(" ")}
          </Notice>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <GlassButton href={`/sites/preview/${siteId}`} variant="primary">
            See your site
          </GlassButton>
          <GlassButton href={`/sites/${siteId}`} variant="secondary">
            Publish or manage site
          </GlassButton>
          <GlassButton href="/schedule" variant="secondary">
            Open schedule
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  const last = index === steps.length - 1;
  const percent = Math.round(((index + 1) / steps.length) * 100);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-semibold text-(--glass-fg-muted)">
            Step {index + 1} of {steps.length}
          </p>
          <Link
            href={skipHref}
            className="inline-flex min-h-11 items-center rounded-lg px-1 text-[15px] font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Skip for now
          </Link>
        </div>
        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={index + 1}
          aria-valuetext={`Step ${index + 1} of ${steps.length}: ${STEP_TITLES[step]}`}
          className="h-2 overflow-hidden rounded-full bg-(--glass-groove)"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 font-display text-2xl font-bold tracking-[-0.02em] text-ink outline-none"
        >
          {STEP_TITLES[step]}
        </h2>
      </div>

      <GlassCard as="section" aria-label={STEP_TITLES[step]}>
        {step === "hours" && <HoursStep state={state} update={update} today={today} year={year} />}
        {step === "days" && <DaysStep state={state} update={update} today={today} year={year} />}
        {step === "services" && <ServicesStep state={state} update={update} />}
        {step === "team" && <TeamStep state={state} update={update} />}
        {step === "area" && <AreaStep state={state} update={update} />}
        {step === "rules" && <RulesStep state={state} update={update} />}
        {step === "review" && <ReviewStep state={state} goTo={goTo} />}
      </GlassCard>

      <div aria-live="polite">
        {problem && (
          <Notice tone="error" size="sm" className="mt-5" role="alert">
            {problem}
          </Notice>
        )}
        {error && <ErrorNote error={error} className="mt-5" />}
      </div>

      <div
        className={cx(
          "sticky bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-20 mt-6 flex items-center gap-3 lg:bottom-4",
          index === 0 ? "justify-end" : "justify-between",
        )}
      >
        {index > 0 && (
          <GlassButton
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setProblem("");
              setError(null);
              setIndex(index - 1);
            }}
          >
            Back
          </GlassButton>
        )}
        {last ? (
          <GlassButton variant="primary" loading={pending} onClick={() => void save()}>
            {pending ? "Saving…" : "Turn on online booking"}
          </GlassButton>
        ) : (
          <GlassButton variant="primary" onClick={next}>
            Next
          </GlassButton>
        )}
      </div>
    </div>
  );
}
