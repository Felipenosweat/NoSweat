"use client";

import { PublicEstimateResponse, RespondEstimateRequest } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { GlassButton } from "@/components/glass";
import {
  ErrorNote,
  officeApi,
  toOfficeError,
  type OfficeApiError,
} from "@/app/(dashboard)/office/_ui/api";
import { companyLabel } from "@/lib/office";

// Resposta do cliente final ao orçamento (sem conta): aprovar digitando o nome completo (vale como
// assinatura simples) ou recusar com um motivo opcional. Depois a página relê o orçamento e mostra
// o resultado. Vai junto o `updatedAt` da versão que o cliente está vendo: se o dono mudou o
// orçamento nesse meio-tempo, o servidor responde 409 e a tela pede para recarregar.

const input =
  "w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-ink placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none aria-invalid:border-red-500 sm:text-[15px]";

export function RespondPanel({
  token,
  companyName,
  total,
  updatedAt = null,
}: {
  token: string;
  companyName: string;
  /** Total já formatado ("$1,250.00"). */
  total: string;
  /** Versão do orçamento na tela (campo novo do contrato; `null` = servidor ainda não manda). */
  updatedAt?: string | null;
}) {
  const router = useRouter();
  const ids = useId();
  const [mode, setMode] = useState<"approve" | "decline">("approve");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<OfficeApiError | null>(null);
  const company = companyLabel(companyName);
  const companyStart = companyLabel(companyName, true);
  // 409: o orçamento mudou (ou já foi respondido) depois que a página abriu.
  const stale = error?.status === 409;

  const errorBlock = error ? (
    <div className="mt-4">
      <ErrorNote error={error} />
      {stale && (
        <GlassButton
          variant="secondary"
          className="mt-2 min-h-11"
          onClick={() => {
            setError(null);
            router.refresh();
          }}
        >
          Refresh
        </GlassButton>
      )}
    </div>
  ) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const parsed = RespondEstimateRequest.safeParse(
      mode === "approve"
        ? { decision: "approve", name }
        : { decision: "decline", reason: reason.trim() || undefined },
    );
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? "Type your full name to approve.");
      document.getElementById(`${ids}-name`)?.focus();
      return;
    }
    setNameError(null);
    setPending(true);
    try {
      await officeApi(
        `/api/public/estimates/${encodeURIComponent(token)}/respond`,
        PublicEstimateResponse,
        {
          method: "POST",
          // `updatedAt` fica fora do schema de validação local (campo novo): vai junto do corpo.
          body: updatedAt ? { ...parsed.data, updatedAt } : parsed.data,
        },
      );
      router.refresh();
    } catch (err) {
      setError(toOfficeError(err));
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby={`${ids}-heading`}
      className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgb(7_27_51/0.06),0_12px_40px_-16px_rgb(7_27_51/0.18)] ring-1 ring-slate-200/80 sm:p-8 print:hidden"
    >
      {mode === "approve" ? (
        <form onSubmit={(event) => void submit(event)} noValidate>
          <h2
            id={`${ids}-heading`}
            className="font-display text-xl leading-7 font-semibold tracking-[-0.015em] text-ink"
          >
            Ready to go ahead?
          </h2>
          <p className="mt-1 text-[15px] leading-[1.6] text-slate-600">
            Type your full name to approve this estimate for {total}. {companyStart} will see your
            approval right away.
          </p>
          <label htmlFor={`${ids}-name`} className="mt-5 block text-[13px] font-medium text-ink">
            Your full name
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            autoCapitalize="words"
            maxLength={120}
            disabled={pending}
            className={`${input} mt-1.5 h-12 font-medium`}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${ids}-name-error` : undefined}
          />
          {nameError && (
            <p id={`${ids}-name-error`} className="mt-1.5 text-[13px] text-red-700">
              {nameError}
            </p>
          )}
          {errorBlock}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <GlassButton
              type="submit"
              variant="primary"
              loading={pending}
              disabled={stale}
              className="sm:min-w-56"
            >
              {pending ? "Approving…" : "Approve estimate"}
            </GlassButton>
            <GlassButton
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setError(null);
                setMode("decline");
              }}
            >
              Decline
            </GlassButton>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-slate-500">
            Typing your name works as your signature on this estimate.
          </p>
        </form>
      ) : (
        <form onSubmit={(event) => void submit(event)} noValidate>
          <h2
            id={`${ids}-heading`}
            className="font-display text-xl leading-7 font-semibold tracking-[-0.015em] text-ink"
          >
            Decline this estimate?
          </h2>
          <p className="mt-1 text-[15px] leading-[1.6] text-slate-600">
            Let {company} know you&rsquo;re passing. A short reason helps them (optional).
          </p>
          <label htmlFor={`${ids}-reason`} className="mt-5 block text-[13px] font-medium text-ink">
            Reason <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id={`${ids}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={1000}
            disabled={pending}
            placeholder="Went with another company, price, timing…"
            className={`${input} mt-1.5 resize-y py-2.5 leading-[1.55]`}
          />
          {errorBlock}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <GlassButton type="submit" variant="secondary" loading={pending} disabled={stale}>
              {pending ? "Sending…" : "Decline estimate"}
            </GlassButton>
            <GlassButton variant="ghost" disabled={pending} onClick={() => setMode("approve")}>
              Back
            </GlassButton>
          </div>
        </form>
      )}
    </section>
  );
}
