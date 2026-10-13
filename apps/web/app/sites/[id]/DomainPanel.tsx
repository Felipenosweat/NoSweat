"use client";

import { ApiError, DomainResponse, type DomainResponse as DomainState } from "@nosweat/schema";
import { useState, type FormEvent } from "react";

const STATUS: Record<
  NonNullable<DomainState["status"]>,
  { label: string; className: string; help: string }
> = {
  active: {
    label: "Connected",
    className: "bg-emerald-100 text-emerald-800",
    help: "Your domain is live with a free secure certificate (HTTPS).",
  },
  pending: {
    label: "Waiting for DNS",
    className: "bg-amber-100 text-amber-800",
    help: "Add the two records below where you bought your domain. Changes usually take a few minutes, sometimes up to a few hours.",
  },
  manual: {
    label: "Being set up",
    className: "bg-sky-100 text-sky-800",
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
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Sem permissão de área de transferência: a pessoa copia na mão.
    }
  }

  if (!state.domain) {
    return (
      <form onSubmit={connect} className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="yourbusiness.com"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || input.trim().length === 0}
            className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "Connecting..." : "Connect domain"}
          </button>
        </div>
        {!isPublished && (
          <p className="mt-2 text-sm text-slate-500">
            Tip: publish your website first so it shows up as soon as the domain is ready.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    );
  }

  const status = state.status ? STATUS[state.status] : null;

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
        <span className="font-mono text-sm font-semibold">{state.domain}</span>
        {status && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        )}
      </div>
      {status && <p className="text-sm text-slate-600">{status.help}</p>}

      {state.status !== "active" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Name / Host</th>
                <th className="px-4 py-2 font-medium">Value / Points to</th>
              </tr>
            </thead>
            <tbody>
              {state.records.map((record) => (
                <tr key={`${record.type}-${record.name}`} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-semibold">{record.type}</td>
                  <td className="px-4 py-3 font-mono">{record.name}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => copy(record.value)}
                      className="font-mono text-sky-700 hover:underline"
                      title="Copy"
                    >
                      {record.value}
                    </button>
                    {copied === record.value && (
                      <span className="ml-2 text-xs text-emerald-700">Copied!</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            Delete any other A record for &ldquo;@&rdquo; and CNAME record for &ldquo;www&rdquo;
            first. Keep your email (MX) records as they are.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {state.status !== "active" && (
          <button
            type="button"
            onClick={() => call("GET")}
            disabled={pending}
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "Checking..." : "Check again"}
          </button>
        )}
        <button
          type="button"
          onClick={() => call("DELETE")}
          disabled={pending}
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-60"
        >
          Remove domain
        </button>
      </div>
    </div>
  );
}
