"use client";

import { ApiError, DomainResponse, type DomainResponse as DomainState } from "@nosweat/schema";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  StatusBadge,
  fieldClass,
  labelClass,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";
import { Notice, glassButtonClass } from "@/components/glass";
import { DnsGuidePanel } from "./DnsGuidePanel";
import type { DnsGuideId } from "./dnsGuides";

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
    help: "Add the two records below where you bought your domain. Changes usually take a few minutes, sometimes up to a few hours. Your free address keeps working in the meantime.",
  },
  unverified: {
    label: "Confirm it's yours",
    tone: "pending",
    help: "First, prove you own this domain: add the TXT record below where you bought it, then click Check again. Next we'll show the two records that point it to your website.",
  },
  manual: {
    label: "Being set up",
    tone: "draft",
    help: "Add the two records below where you bought your domain. Our team will finish the connection for you. Your free address keeps working in the meantime.",
  },
};

/** Enquanto espera o DNS, confere sozinho a cada 30 s, por no máximo 10 minutos. */
const POLL_EVERY_MS = 30_000;
const POLL_FOR_MS = 10 * 60_000;

/** Domínio digitado que ainda espera a prova de dono (TXT): sobrevive a sair e voltar. */
const storageKey = (siteId: string) => `ns-domain-${siteId}`;

function rememberDomain(siteId: string, domain: string | null) {
  try {
    if (domain) window.localStorage.setItem(storageKey(siteId), domain);
    else window.localStorage.removeItem(storageKey(siteId));
  } catch {
    // Navegação privada sem localStorage: só não lembra o domínio.
  }
}

/** Também usado pela seção recolhida (DomainSection): com domínio esperando o TXT, já abre. */
export function rememberedDomain(siteId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(siteId));
  } catch {
    return null;
  }
}

type Method = "GET" | "PUT" | "DELETE";

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
  /** "Remove domain" pede confirmação antes (tira o site do domínio na hora). */
  const [confirmRemove, setConfirmRemove] = useState(false);
  /** Aviso para leitores de tela (ex.: "Connected!" quando a conferência automática acha o DNS). */
  const [announcement, setAnnouncement] = useState("");
  /** Conferência automática que já acabou (os 10 minutos passaram ou deu erro). */
  const [pollDone, setPollDone] = useState<string | null>(null);
  /** Empresa escolhida no guia de DNS, amarrada ao domínio (domínio novo = volta à descoberta). */
  const [guidePick, setGuidePick] = useState<{ domain: string; id: DnsGuideId } | null>(null);
  /** Um pedido de cada vez: a conferência automática nunca se sobrepõe a outro pedido. */
  const busy = useRef(false);

  const request = useCallback(
    async (method: Method, body?: unknown, background = false): Promise<boolean> => {
      if (busy.current) return true;
      busy.current = true;
      setPending(true);
      if (!background) setError(null);
      try {
        const res = await fetch(`/api/sites/${siteId}/domain`, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const json: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          // Na conferência automática, um erro só para de conferir (sem alerta na tela).
          if (background) return false;
          const apiError = ApiError.safeParse(json);
          setNeedsPlan(apiError.success && apiError.data.error.code === "payment_required");
          setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
          return false;
        }
        const next = DomainResponse.parse(json);
        setState(next);
        setInput("");
        setConfirmRemove(false);
        if (next.status === "active" && next.domain) {
          setAnnouncement(`Connected! Your website now shows at ${next.domain}.`);
        }
        // Só o domínio que ainda espera o TXT precisa ser lembrado (o resto já está salvo).
        rememberDomain(siteId, next.status === "unverified" ? next.domain : null);
        return true;
      } catch {
        if (!background) setError("We couldn't reach our servers. Please try again.");
        return false;
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
    [siteId],
  );

  // Ao abrir: preenche o campo com o domínio que esperava a prova de dono (saiu para criar o TXT).
  useEffect(() => {
    if (initial.domain) return;
    const saved = rememberedDomain(siteId);
    if (!saved) return;
    // Fora do corpo do efeito (regra react-hooks/set-state-in-effect).
    const frame = requestAnimationFrame(() => setInput((current) => current || saved));
    return () => cancelAnimationFrame(frame);
  }, [siteId, initial.domain]);

  // Esperando o TXT (PUT de novo) ou o DNS (GET): confere sozinho a cada 30 s por até 10 min.
  const pollStatus =
    state.domain && (state.status === "unverified" || state.status === "pending")
      ? state.status
      : null;
  const pollDomain = state.domain;
  const pollKey = pollStatus && pollDomain ? `${pollStatus}:${pollDomain}` : null;
  useEffect(() => {
    if (!pollStatus || !pollDomain || !pollKey) return;
    const startedAt = Date.now();
    let stopped = false;
    const timer = window.setInterval(() => {
      if (stopped) return;
      if (Date.now() - startedAt > POLL_FOR_MS) {
        stopped = true;
        window.clearInterval(timer);
        setPollDone(pollKey);
        return;
      }
      if (document.hidden) return;
      const check =
        pollStatus === "unverified"
          ? request("PUT", { domain: pollDomain }, true)
          : request("GET", undefined, true);
      void check.then((ok) => {
        if (ok || stopped) return;
        stopped = true;
        window.clearInterval(timer);
        setPollDone(pollKey);
      });
    }, POLL_EVERY_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [pollStatus, pollDomain, pollKey, request]);
  const autoChecking = pollKey !== null && pollDone !== pollKey;

  function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void request("PUT", { domain: input });
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
        <label htmlFor="domain-input" className={labelClass}>
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
            className={`${fieldClass} h-11 min-w-0 sm:flex-1`}
          />
          {/* Na linha (computador) o botão estica até a altura do campo. */}
          <button
            type="submit"
            disabled={pending || input.trim().length === 0}
            className={secondaryButton}
          >
            {pending ? "Connecting…" : "Connect domain"}
          </button>
        </div>
        {!isPublished && (
          <p id="domain-tip" className="mt-2 text-[13px] text-(--glass-fg-muted)">
            Tip: publish your website first so it shows up as soon as the domain is ready.
          </p>
        )}
        {error && (
          <Notice tone="error" size="sm" className="mt-3">
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
          </Notice>
        )}
      </form>
    );
  }

  const status = state.status ? STATUS[state.status] : null;
  const currentDomain = state.domain;
  const guideId: DnsGuideId | null =
    guidePick?.domain === currentDomain ? guidePick.id : (state.dnsProvider ?? null);
  // Com o passo a passo aberto, os registros (com "Copy") aparecem só nele, sem a tabela.
  const showTable = state.status !== "active" && guideId === null;
  const recordsWarning =
    state.status === "unverified"
      ? "Adding a TXT record doesn’t change your website or email. It can take a few minutes to show up."
      : "Delete any other A record for “@” and CNAME record for “www” first. Keep your email (MX) records as they are.";

  return (
    <div className="mt-5 space-y-5">
      <div className="glass-inset flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
        <span className="font-display text-[15px] font-semibold break-all text-ink">
          {state.domain}
        </span>
        {status && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      </div>
      {status && <p className="text-[15px] leading-[1.6] text-slate-600">{status.help}</p>}

      {showTable && (
        <div className="glass-inset overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/[0.03] text-[13px] text-(--glass-fg-muted)">
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
                  <tr
                    key={`${record.type}-${record.name}`}
                    className="border-t border-(--glass-rim)"
                  >
                    <td className="px-4 py-3 font-semibold text-ink">{record.type}</td>
                    <td className="px-4 py-3 font-mono text-ink">{record.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono break-all text-ink">{record.value}</span>
                        <button
                          type="button"
                          onClick={() => copy(record.value)}
                          className={glassButtonClass({ variant: "secondary", size: "sm" })}
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
          <p className="border-t border-(--glass-rim) px-4 py-3 text-[13px] leading-normal text-(--glass-fg-muted)">
            {recordsWarning}
          </p>
        </div>
      )}
      {state.status !== "active" && !showTable && (
        <p className="text-[13px] leading-normal text-(--glass-fg-muted)">{recordsWarning}</p>
      )}
      {state.status !== "active" && (
        <DnsGuidePanel
          domain={currentDomain}
          records={state.records}
          detected={state.dnsProvider ?? null}
          selected={guideId}
          onSelect={(id) => setGuidePick({ domain: currentDomain, id })}
          copied={copied}
          onCopy={(value) => void copy(value)}
        />
      )}
      <p aria-live="polite" className="sr-only">
        {copied ? "Copied" : announcement}
      </p>

      {error && (
        <Notice tone="error" size="sm">
          {error}
        </Notice>
      )}

      {confirmRemove ? (
        <div
          role="alertdialog"
          aria-label={`Remove ${state.domain}?`}
          className="glass-inset rounded-xl p-4 text-sm"
        >
          <p className="font-medium text-ink">
            Your site will stop showing at <span className="font-semibold">{state.domain}</span>.
          </p>
          <p className="mt-1 text-slate-600">Your free address keeps working.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void request("DELETE")}
              disabled={pending}
              aria-busy={pending}
              className={glassButtonClass({ variant: "destructive" })}
            >
              {pending ? "Removing…" : "Remove"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              disabled={pending}
              className={secondaryButton}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {state.status !== "active" && (
            <button
              type="button"
              // Sem verificação ainda, o domínio não foi salvo: "Check again" tenta ligar de novo.
              onClick={() =>
                void (state.status === "unverified"
                  ? request("PUT", { domain: state.domain })
                  : request("GET"))
              }
              disabled={pending}
              className={secondaryButton}
            >
              {pending ? "Checking…" : "Check again"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (state.status === "unverified") {
                rememberDomain(siteId, null);
                setState({ ...state, domain: null, status: null, records: [] });
              } else {
                setConfirmRemove(true);
              }
            }}
            disabled={pending}
            className={`${textButton} hover:text-red-700`}
          >
            {state.status === "unverified" ? "Use a different domain" : "Remove domain"}
          </button>
        </div>
      )}
      {autoChecking && !confirmRemove && (
        <p className="text-[13px] text-(--glass-fg-muted)">
          We check again automatically every 30 seconds for the next few minutes.
        </p>
      )}
    </div>
  );
}
