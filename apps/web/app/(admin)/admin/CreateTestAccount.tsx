"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  primaryButton,
  secondaryButton,
} from "@/components/DashboardUi";
import { createTestAccountAction, type CreateTestAccountState } from "./actions";

// Caixa "Create test account" do /admin. Depois de criar, mostra o e-mail e a senha UMA vez
// (com botões de copiar); "Create another" troca o `key` do formulário e zera o estado.

const PLAN_OPTIONS = [
  { value: "", label: "No plan" },
  { value: "starter", label: "Starter · 30 days" },
  { value: "pro", label: "Pro · 30 days" },
  { value: "premium", label: "Premium · 30 days" },
];

const PLAN_NAMES: Record<string, string> = { starter: "Starter", pro: "Pro", premium: "Premium" };

const fieldClass = `mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-ink placeholder:text-slate-400 sm:h-10 ${focusRing}`;

const initialState: CreateTestAccountState = { status: "idle" };

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão para a área de transferência: dá para selecionar o texto à mão.
    }
  };
  return (
    <button type="button" onClick={copy} className={`${secondaryButton} shrink-0`}>
      {copied ? "Copied" : `Copy ${label}`}
    </button>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-[15px] break-all text-ink select-all">
          {value}
        </code>
        <CopyButton value={value} label={label.toLowerCase()} />
      </dd>
    </div>
  );
}

function CreateForm({ enabled, onReset }: { enabled: boolean; onReset: () => void }) {
  const [state, formAction, pending] = useActionState(createTestAccountAction, initialState);

  if (state.status === "created") {
    return (
      <div>
        <p role="status" className="text-[15px] font-semibold text-emerald-800">
          Test account created
          {state.plan ? ` with ${PLAN_NAMES[state.plan] ?? state.plan} for 30 days` : ""}.
        </p>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Save this password now. It won&rsquo;t be shown again.
        </p>
        <dl className="mt-4 grid gap-3">
          <SecretRow label="Email" value={state.email} />
          <SecretRow label="Password" value={state.password} />
        </dl>
        <p className={`mt-4 text-sm ${panelText}`}>
          Log in with it in a private window to use No Sweat as this client. The email is already
          confirmed.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/admin/clients/${state.userId}`} className={primaryButton}>
            Open account
          </Link>
          <button type="button" onClick={onReset} className={secondaryButton}>
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
      <label className="text-sm font-medium text-slate-700">
        Email (optional)
        <input
          name="email"
          type="email"
          maxLength={254}
          autoComplete="off"
          placeholder="test+random@nosweatfd.com"
          disabled={!enabled}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Plan
        <select name="plan" defaultValue="" disabled={!enabled} className={fieldClass}>
          {PLAN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={!enabled || pending} className={primaryButton}>
          {pending ? "Creating…" : "Create test account"}
        </button>
      </div>
      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-3"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

/**
 * `enabled = false` sem Supabase (dev local): criar conta precisa da API de administração do
 * Supabase Auth.
 */
export function CreateTestAccount({ enabled }: { enabled: boolean }) {
  const [round, setRound] = useState(0);
  return (
    <section aria-labelledby="test-accounts" className={panelClass}>
      <h2 id="test-accounts" className={panelTitle}>
        Test accounts
      </h2>
      <p className={`mt-1 ${panelText}`}>
        Create a client account that answers to this one, then log in with it and test everything as
        a client would. Test accounts are the only ones you can delete from here.
      </p>
      {!enabled && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Needs Supabase: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then reload.
        </p>
      )}
      <div className="mt-4">
        <CreateForm key={round} enabled={enabled} onReset={() => setRound((n) => n + 1)} />
      </div>
    </section>
  );
}
