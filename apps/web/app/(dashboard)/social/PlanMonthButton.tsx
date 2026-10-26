"use client";

import { PlanMonthResponse, type PlanMonthRequest, type SocialPost } from "@nosweat/schema";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { primaryButton, textButton } from "@/components/DashboardUi";
import { GlassSegmented } from "@/components/glass";
import { SparklesIcon } from "@/components/marketing/icons";
import {
  ErrorNote,
  monthLabel,
  shiftMonth,
  socialApi,
  toApiError,
  type SocialApiError,
} from "./shared";

// "Fill my month with AI": a IA escreve rascunhos para o mês escolhido. Nada sai sem aprovação.
// A geração pode levar ~1 minuto: mostramos o progresso e travamos o botão.

const PER_WEEK: PlanMonthRequest["postsPerWeek"][] = [2, 3, 5];

export function PlanMonthButton({
  thisMonth,
  shownMonth,
  remaining,
  onPlanned,
}: {
  /** Mês atual no fuso da empresa ("YYYY-MM"). */
  thisMonth: string;
  /** Mês aberto no calendário (vem pré-selecionado se não for passado). */
  shownMonth: string;
  /** Planos de IA que restam hoje (`null` = sem limite). */
  remaining: number | null;
  onPlanned: (posts: SocialPost[], month: string) => void;
}) {
  const months = [thisMonth, shiftMonth(thisMonth, 1), shiftMonth(thisMonth, 2)];
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(months.includes(shownMonth) ? shownMonth : thisMonth);
  const [perWeek, setPerWeek] = useState<PlanMonthRequest["postsPerWeek"]>(3);
  const [pending, setPending] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<SocialApiError | null>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  /** Já abriu alguma vez: ao fechar, o foco volta para o botão. */
  const wasOpen = useRef(false);
  const formId = useId();
  const out = remaining !== null && remaining <= 0;

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      firstFieldRef.current?.focus();
    } else if (wasOpen.current) {
      openerRef.current?.focus();
    }
  }, [open]);

  // Relógio do progresso enquanto a IA trabalha.
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [pending]);

  function openForm() {
    setMonth(months.includes(shownMonth) ? shownMonth : thisMonth);
    setError(null);
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSeconds(0);
    setError(null);
    try {
      const body: PlanMonthRequest = { month, postsPerWeek: perWeek };
      const result = await socialApi("/api/social/plan", PlanMonthResponse, {
        method: "POST",
        body,
      });
      setOpen(false);
      onPlanned(result.posts, month);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setPending(false);
    }
  }

  const remainingText =
    remaining === null
      ? null
      : remaining === 0
        ? "No AI month plans left. Check your AI credits in Plans and billing."
        : `${remaining} AI month plan${remaining === 1 ? "" : "s"} left`;

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          ref={openerRef}
          type="button"
          onClick={openForm}
          disabled={out}
          data-tour="social-plan"
          className={primaryButton}
        >
          <SparklesIcon className="size-4" aria-hidden="true" />
          Fill my month with AI
        </button>
        {remainingText && <p className="text-[13px] text-slate-500">{remainingText}</p>}
      </div>
    );
  }

  const fieldClass = `mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white/80 px-3 text-[15px] text-ink focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none`;

  return (
    <form
      id={formId}
      onSubmit={(event) => void submit(event)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) setOpen(false);
      }}
      aria-label="Fill my month with AI"
      className="glass-edge w-full rounded-2xl bg-white/50 p-4 sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <label className="block text-[13px] font-medium text-ink">
          Month
          <select
            ref={firstFieldRef}
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            disabled={pending}
            className={fieldClass}
          >
            {months.map((value) => (
              <option key={value} value={value}>
                {monthLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <fieldset disabled={pending}>
          <legend className="text-[13px] font-medium text-ink">Posts per week</legend>
          <GlassSegmented
            aria-label="Posts per week"
            options={PER_WEEK.map((value) => ({ value: String(value), label: String(value) }))}
            value={String(perWeek)}
            onChange={(value) => setPerWeek(PER_WEEK.find((n) => String(n) === value) ?? 3)}
            fullWidth
            className="mt-1.5 sm:max-w-[14rem]"
          />
        </fieldset>
      </div>

      <p className="mt-4 text-[13px] leading-5 text-slate-500">
        We write drafts from your website: your services, area and photos. Nothing goes out until
        you approve it.
        {remainingText ? ` ${remainingText}.` : ""}
      </p>

      <div aria-live="polite" className="mt-3">
        {pending && (
          <div>
            <p className="text-sm font-medium text-ink">
              Writing your posts… this usually takes about a minute.
            </p>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-slate-900/[0.08]"
              role="progressbar"
              aria-label="Writing your posts"
              aria-valuemin={0}
              aria-valuemax={90}
              aria-valuenow={Math.min(seconds, 90)}
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.min(95, (seconds / 75) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {error && <ErrorNote error={error} className="mt-3" />}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || out} className={primaryButton}>
          {pending ? "Writing…" : `Write ${monthLabel(month).split(" ")[0]} posts`}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className={textButton}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
