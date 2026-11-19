"use client";

import { useActionState, useState, useTransition } from "react";
import { GlassButton, Notice } from "@/components/glass";
import { fieldClass, labelClass } from "@/app/(admin)/admin/AdminUi";
import { startEnrollment, verifyMfaCode, type EnrollState, type VerifyState } from "./actions";

// Formulários do /admin/mfa: o código de 6 dígitos (login) e o cadastro do autenticador.

const initialVerify: VerifyState = { error: null };

function CodeForm({ factorId, submitLabel }: { factorId?: string; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(verifyMfaCode, initialVerify);
  return (
    <form action={formAction} className="mt-5 grid gap-3">
      {factorId && <input type="hidden" name="factorId" value={factorId} />}
      <label className={labelClass}>
        6-digit code
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          placeholder="123 456"
          className={`${fieldClass} font-mono tracking-[0.2em]`}
        />
      </label>
      <GlassButton type="submit" variant="primary" loading={pending}>
        {pending ? "Checking…" : submitLabel}
      </GlassButton>
      {state.error && (
        <Notice tone="error" size="sm">
          {state.error}
        </Notice>
      )}
    </form>
  );
}

/** Login: a conta já tem autenticador; falta o código desta sessão. */
export function ChallengeForm() {
  return <CodeForm submitLabel="Verify" />;
}

/** Cadastro: QR + segredo, e o primeiro código confirma. */
export function EnrollFlow() {
  const [state, setState] = useState<EnrollState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  function begin() {
    startTransition(async () => {
      setState(await startEnrollment());
    });
  }

  if (state.status !== "enrolling") {
    return (
      <div className="mt-5 grid gap-3">
        <GlassButton type="button" variant="primary" loading={pending} onClick={begin}>
          {pending ? "Starting…" : "Set up authenticator"}
        </GlassButton>
        {state.status === "error" && (
          <Notice tone="error" size="sm">
            {state.message}
          </Notice>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5">
      <ol className="grid gap-2 text-[15px] leading-[1.6] text-(--glass-fg-muted)">
        <li>1. Scan this QR code with your authenticator app.</li>
        <li>2. Type the 6-digit code it shows.</li>
      </ol>
      <div className="mt-4 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR em data URL gerado no servidor */}
        <img
          src={state.qrDataUrl}
          alt="QR code for your authenticator app"
          width={220}
          height={220}
          className="rounded-xl bg-white p-2"
        />
      </div>
      <details className="mt-3 text-[13px] text-(--glass-fg-muted)">
        <summary className="cursor-pointer font-semibold">Can&rsquo;t scan? Enter this key</summary>
        <code className="mt-2 block rounded-lg bg-white/60 px-3 py-2 font-mono text-[13px] break-all text-(--glass-fg)">
          {state.secret}
        </code>
      </details>
      <CodeForm factorId={state.factorId} submitLabel="Turn on two-step verification" />
    </div>
  );
}
