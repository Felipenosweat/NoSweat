"use client";

import { useActionState, useState } from "react";
import { GlassButton, GlassCard } from "@/components/glass";
import { Notice, fieldClass, labelClass, panelText, panelTitle } from "./AdminUi";
import { createTestAccountAction, type CreateTestAccountState } from "./actions";

// Caixa "Test accounts" do /admin/accounts. Depois de criar, mostra o e-mail e a senha UMA vez
// (com botões de copiar); "Create another" troca o `key` do formulário e zera o estado.

const PLAN_OPTIONS = [
  { value: "", label: "No plan" },
  { value: "starter", label: "Starter · 30 days" },
  { value: "pro", label: "Pro · 30 days" },
  { value: "premium", label: "Premium · 30 days" },
];

const PLAN_NAMES: Record<string, string> = { starter: "Starter", pro: "Pro", premium: "Premium" };

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
    <GlassButton variant="secondary" onClick={() => void copy()} aria-label={`Copy ${label}`}>
      {copied ? "Copied" : "Copy"}
    </GlassButton>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-1.5 flex items-center gap-2">
        <code className="glass glass-flat min-w-0 flex-1 rounded-xl px-3.5 py-2.5 font-mono text-[15px] break-all text-(--glass-fg) select-all">
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
      <div className="grid gap-4">
        <Notice tone="success">
          Test account created
          {state.plan ? ` with ${PLAN_NAMES[state.plan] ?? state.plan} for 30 days` : ""}. Save
          this password now: it won&rsquo;t be shown again.
        </Notice>
        <dl className="grid gap-3">
          <SecretRow label="Email" value={state.email} />
          <SecretRow label="Password" value={state.password} />
        </dl>
        <p className={`text-sm ${panelText}`}>
          Log in with it in a private window to use No Sweat as this client. The email is already
          confirmed.
        </p>
        <div className="flex flex-wrap gap-2">
          <GlassButton href={`/admin/clients/${state.userId}`} variant="primary">
            Open account
          </GlassButton>
          <GlassButton variant="secondary" onClick={onReset}>
            Create another
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_13rem_auto]">
      <label className={labelClass}>
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
      <label className={labelClass}>
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
        <GlassButton
          type="submit"
          variant="secondary"
          disabled={!enabled}
          loading={pending}
          fullWidth
        >
          {pending ? "Creating…" : "Create test account"}
        </GlassButton>
      </div>
      {state.status === "error" && (
        <Notice tone="error" className="sm:col-span-3">
          {state.message}
        </Notice>
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
    <GlassCard as="section" aria-labelledby="test-accounts">
      <h2 id="test-accounts" className={panelTitle}>
        Test accounts
      </h2>
      <p className={`mt-1 ${panelText}`}>
        Create a client account that answers to this one, then log in with it and test everything as
        a client would. Test accounts are the only ones you can delete from the list.
      </p>
      {!enabled && (
        <Notice tone="warning" className="mt-3">
          Needs Supabase: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then reload.
        </Notice>
      )}
      <div className="mt-5">
        <CreateForm key={round} enabled={enabled} onReset={() => setRound((n) => n + 1)} />
      </div>
    </GlassCard>
  );
}
