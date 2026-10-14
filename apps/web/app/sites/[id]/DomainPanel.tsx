"use client";

import { ApiError, DomainResponse, type DomainResponse as DomainState } from "@nosweat/schema";
import { useState, type FormEvent } from "react";
import { StatusBadge, focusRing, secondaryButton, textButton } from "@/components/DashboardUi";
import { DnsGuidePanel } from "./DnsGuidePanel";

const STATUS: Record<
  NonNullable<DomainState["status"]>,
  { label: string; tone: "live" | "pending" | "draft"; help: string }
> = {
  active: {
    label: "Connected",
    tone: "live",
    help: "Your domain is live with a free secure certificate (HTTPS).",
  },
  pending: {
    label: "Waiting for DNS",
    tone: "pending",
    help: "Add the two records below where you bought your domain. Changes usually take a few minutes, sometimes up to a few hours.",
  },
  unverified: {
    label: "Confirm it's yours",
    tone: "pending",
    help: "First, prove you own this domain: add the TXT record below where you bought it, then click Check again. Next we'll show the two records that point it to your website.",
  },
  manual: {
    label: "Being set up",
    tone: "draft",
    help: "Add the two records below where you bought your domain. Our team will finish the connection for you.",
  },
};

export function DomainPanel({
  siteId,
  initial,
  isPublished,
}: {
  siteId: string;
  initial: DomainState;
  isPublished: boolean;
}) {
  const [state, setState] = useState<DomainState>(initial);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** O plano atual não inclui domínio próprio: mostra o link para os planos. */
  const [needsPlan, setNeedsPlan] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function call(method: "GET" | "PUT" | "DELETE", body?: unknown) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(json);
        setNeedsPlan(apiError.success && apiError.data.error.code === "payment_required");
        setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
        return;
      }
      setState(DomainResponse.parse(json));
      setInput("");
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void call("PUT", { domain: input });
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Sem permissão de área de transferência: a pessoa copia na mão.
    }
  }

  if (!state.domain) {
    return (
      <form onSubmit={connect} className="mt-5">
        <label htmlFor="domain-input" className="block text-[13px] font-medium text-ink">
          Your domain
        </label>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
          <input
            id="domain-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="yourbusiness.com"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="url"
            aria-describedby={!isPublished ? "domain-tip" : undefined}
            className="h-12 w-full min-w-0 rounded-xl sm:flex-1 border border-slate-300 bg-white px-4 text-base text-ink placeholder:text-slate-500 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none sm:h-11"
          />
          <button
            type="submit"
            disabled={pending || input.trim().length === 0}
            className={`${secondaryButton} min-h-12 sm:min-h-11`}
          >
            {pending ? "Connecting…" : "Connect domain"}
          </button>
        </div>
        {!isPublished && (
          <p id="domain-tip" className="mt-2 text-[13px] text-slate-500">
            Tip: publish your website first so it shows up as soon as the domain is ready.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-3 inline-flex rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
            {needsPlan && (
              <>
                {" "}
                <a
                  href={`/billing?site=${encodeURIComponent(siteId)}`}
                  className="ml-1 font-semibold underline underline-offset-4"
                >
                  See plans
                </a>
              </>
            )}
          </p>
        )}
      </form>
    );
  }

  const status = state.status ? STATUS[state.status] : null;

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-surface px-4 py-3">
        <span className="font-display text-[15px] font-semibold break-all text-ink">
          {state.domain}
        </span>
        {status && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      </div>
      {status && <p className="text-[15px] leading-[1.6] text-slate-600">{status.help}</p>}

      {state.status !== "active" && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-[13px] text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Name / Host
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Value / Points to
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.records.map((record) => (
                  <tr key={`${record.type}-${record.name}`} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-semibold text-ink">{record.type}</td>
                    <td className="px-4 py-3 font-mono text-ink">{record.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono break-all text-ink">{record.value}</span>
                        <button
                          type="button"
                          onClick={() => copy(record.value)}
                          className={`inline-flex min-h-9 shrink-0 items-center rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-semibold text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 ${focusRing}`}
                        >
                          {copied === record.value ? "Copied" : "Copy"}
                          <span className="sr-only"> {record.type} value</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-200 px-4 py-3 text-[13px] leading-normal text-slate-500">
            {state.status === "unverified"
              ? "Adding a TXT record doesn’t change your website or email. It can take a few minutes to show up."
              : "Delete any other A record for “@” and CNAME record for “www” first. Keep your email (MX) records as they are."}
          </p>
        </div>
      )}
      {state.status !== "active" && (
        // `key`: domínio novo = começa de novo com a empresa descoberta para ele.
        <DnsGuidePanel
          key={state.domain}
          domain={state.domain}
          records={state.records}
          detected={state.dnsProvider ?? null}
        />
      )}
      <p aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </p>

      {error && (
        <p role="alert" className="inline-flex rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {state.status !== "active" && (
          <button
            type="button"
            // Sem verificação ainda, o domínio não foi salvo: "Check again" tenta ligar de novo.
            onClick={() =>
              state.status === "unverified" ? call("PUT", { domain: state.domain }) : call("GET")
            }
            disabled={pending}
            className={secondaryButton}
          >
            {pending ? "Checking…" : "Check again"}
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            state.status === "unverified"
              ? setState({ ...state, domain: null, status: null, records: [] })
              : call("DELETE")
          }
          disabled={pending}
          className={`${textButton} hover:text-red-700`}
        >
          {state.status === "unverified" ? "Use a different domain" : "Remove domain"}
        </button>
      </div>
    </div>
  );
}
