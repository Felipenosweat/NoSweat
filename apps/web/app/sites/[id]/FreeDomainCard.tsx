"use client";

import {
  ApiError,
  FreeDomainClaimResponse,
  FreeDomainRegistrant,
  FreeDomainSearchResponse,
  type DomainResponse,
  type FreeDomainOption,
  type FreeDomainSearchResponse as SearchResult,
  FreeDomainStatusResponse,
} from "@nosweat/schema";
import Link from "next/link";
import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { US_STATE_NAMES } from "@/app/(dashboard)/create/brief";
import {
  StatusBadge,
  fieldClass,
  fieldErrorClass,
  focusRing,
  hintClass,
  labelClass,
  primaryButton,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";
import { Notice, SpinnerIcon } from "@/components/glass";

// Domínio grátis do Premium em /sites/[id] (dentro de "Use your own domain"): buscar → escolher →
// dados do dono do domínio → confirmar → pronto. O domínio fica no NOME DO CLIENTE; endereço e
// telefone vão direto para o registro (a No Sweat não guarda). Um por conta, para sempre.

type Registrant = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
};

type Field = keyof Registrant;

const STATE_OPTIONS = Object.entries(US_STATE_NAMES).sort(([, a], [, b]) => a.localeCompare(b));

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** "Normally $12.03/year" (o preço real do registro; nada de preço de referência inventado). */
function normalPrice(option: FreeDomainOption): string | null {
  return option.priceCents === null
    ? null
    : `Normally ${money.format(option.priceCents / 100)}/year`;
}

function GiftIcon({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

/** Moldura do cartão: faixa de vidro com o ícone de presente na frente. */
function CardFrame({
  title,
  children,
  tone = "offer",
}: {
  title: string;
  children: ReactNode;
  tone?: "offer" | "quiet";
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={`mt-4 rounded-2xl p-4 ring-1 sm:p-5 ${
        tone === "offer" ? "bg-brand/[0.05] ring-brand/20" : "glass-inset ring-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid size-9 shrink-0 place-items-center rounded-lg ${
            tone === "offer" ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"
          }`}
        >
          <GiftIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="font-display text-[15px] leading-6 font-semibold text-ink">
            {title}
          </h3>
          {children}
        </div>
      </div>
    </section>
  );
}

async function readError(res: Response): Promise<{ code: string; message: string }> {
  const json: unknown = await res.json().catch(() => null);
  const parsed = ApiError.safeParse(json);
  return parsed.success
    ? parsed.data.error
    : { code: "internal_error", message: "Something went wrong. Please try again." };
}

export function FreeDomainCard({
  siteId,
  status: initialStatus,
  siteHasDomain,
  suggestedQuery,
  defaults,
  onConnected,
}: {
  siteId: string;
  status: FreeDomainStatusResponse;
  /** O site já tem domínio: o cartão só informa (o grátis vai para um site sem domínio). */
  siteHasDomain: boolean;
  /** Busca já preenchida (nome da empresa, ex.: "joesplumbing.com"). */
  suggestedQuery: string;
  /** Pré-preenche o formulário com o que já sabemos (e-mail da conta, telefone e cidade do site). */
  defaults: Pick<Registrant, "email" | "phone" | "city" | "state">;
  /** Comprado e ligado: a seção de domínio passa a mostrar o domínio novo. */
  onConnected: (domain: DomainResponse) => void;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [step, setStep] = useState<"search" | "details" | "done">("search");
  const [query, setQuery] = useState(suggestedQuery);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [chosen, setChosen] = useState<FreeDomainOption | null>(null);
  const [form, setForm] = useState<Registrant>({
    firstName: "",
    lastName: "",
    email: defaults.email,
    phone: defaults.phone,
    address1: "",
    address2: "",
    city: defaults.city,
    state: defaults.state,
    zip: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimedDomain, setClaimedDomain] = useState<string | null>(null);
  const formTitle = useRef<HTMLHeadingElement>(null);
  const ids = useId();

  // Acabou de pedir: a mensagem de sucesso vem antes de tudo (o estado já virou "claimed").
  if (step === "done" && claimedDomain) {
    return (
      <Notice tone="success" className="mt-4">
        <p className="font-semibold">{claimedDomain} is yours!</p>
        <p className="mt-1">
          It&rsquo;s registered in your name, free for the first year. We&rsquo;re connecting it to
          your website now. That usually takes a few minutes, and there&rsquo;s nothing for you to
          set up.
        </p>
      </Notice>
    );
  }

  // ---------- estados sem busca ----------

  if (status.state === "locked") {
    return (
      <p className="mt-4 flex flex-wrap items-center gap-x-1.5 text-[13px] leading-5 text-(--glass-fg-muted)">
        <GiftIcon className="size-4 shrink-0" />
        <span>Premium includes a free .com domain for the first year.</span>
        <Link
          href="/billing#plans"
          className={`rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
        >
          See plans
        </Link>
      </p>
    );
  }

  if (status.state === "claimed" && status.claim) {
    const claim = status.claim;
    // Já ligado a este site: o painel do domínio logo abaixo mostra tudo.
    if (siteHasDomain && claim.siteId === siteId && claim.status === "purchased") return null;
    const label =
      claim.status === "purchased"
        ? { text: "Registered", tone: "live" as const }
        : claim.status === "pending"
          ? { text: "Being set up", tone: "pending" as const }
          : { text: "Needs our help", tone: "draft" as const };
    return (
      <CardFrame title="Your free domain" tone="quiet">
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-display text-[15px] font-semibold break-all text-ink">
            {claim.domain}
          </span>
          <StatusBadge tone={label.tone}>{label.text}</StatusBadge>
        </div>
        <p className={hintClass}>
          {claim.status === "purchased"
            ? claim.siteId === siteId
              ? "Registered in your name. To show this website there again, type it in the box below."
              : "Registered in your name and connected to another one of your websites. To use it here instead, type it in the box below."
            : claim.status === "pending"
              ? "We're finishing the registration. Our team will let you know when it's ready."
              : "We couldn't register it. Please contact us and we'll sort it out."}
        </p>
      </CardFrame>
    );
  }

  if (status.state === "coming_soon" || status.state === "awaiting_payment") {
    return (
      <CardFrame
        title={status.state === "coming_soon" ? "Free domain — coming soon" : "Free domain"}
      >
        <p className={hintClass}>
          {status.state === "coming_soon"
            ? "Your Premium plan includes a free .com domain for the first year. We're putting the finishing touches on it."
            : "Your Premium plan includes a free .com domain for the first year. It unlocks as soon as your first payment goes through."}
        </p>
      </CardFrame>
    );
  }

  if (siteHasDomain) {
    return (
      <p className="mt-4 flex flex-wrap items-center gap-x-1.5 text-[13px] leading-5 text-(--glass-fg-muted)">
        <GiftIcon className="size-4 shrink-0" />
        <span>
          Your Premium plan includes one free domain. Claim it from a website that doesn&rsquo;t
          have a domain yet.
        </span>
      </p>
    );
  }

  // ---------- disponível: buscar → dados → pronto ----------

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/free-domain/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        setError((await readError(res)).message);
        return;
      }
      setResult(FreeDomainSearchResponse.parse(await res.json()));
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function choose(option: FreeDomainOption) {
    setChosen(option);
    setStep("details");
    setError(null);
    // Leva o foco para o título do formulário (leitor de tela anuncia o passo novo).
    requestAnimationFrame(() => formTitle.current?.focus());
  }

  function update(field: Field, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function claim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosen || claiming) return;
    const parsed = FreeDomainRegistrant.safeParse({
      ...form,
      address2: form.address2.trim() || undefined,
      country: "US",
    });
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && key in form && !next[key as Field]) {
          next[key as Field] = issue.message;
        }
      }
      setFieldErrors(next);
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`${ids}-${first}`)?.focus();
      return;
    }
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/free-domain/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: chosen.domain, registrant: parsed.data }),
      });
      if (!res.ok) {
        const apiError = await readError(res);
        setError(apiError.message);
        // Pedido em andamento ou já feito: o cartão passa a mostrar o estado real.
        if (apiError.code === "conflict" || res.status === 502) {
          const statusRes = await fetch(`/api/sites/${siteId}/free-domain`).catch(() => null);
          const json: unknown = statusRes?.ok ? await statusRes.json().catch(() => null) : null;
          const fresh = FreeDomainStatusResponse.safeParse(json);
          if (fresh.success && fresh.data.state === "claimed") setStatus(fresh.data);
        }
        return;
      }
      const data = FreeDomainClaimResponse.parse(await res.json());
      setClaimedDomain(chosen.domain);
      setStep("done");
      setStatus(data.status);
      onConnected(data.domain);
    } catch {
      setError("We couldn't reach our servers. Please try again.");
    } finally {
      setClaiming(false);
    }
  }

  const retryNote =
    status.claim?.status === "failed" && status.claim.canRetry
      ? `Last time the registry couldn't register ${status.claim.domain}. You can try one more time.`
      : null;

  if (step === "details" && chosen) {
    const fieldProps = (field: Field) => ({
      id: `${ids}-${field}`,
      name: field,
      value: form[field],
      onChange: (event: { target: { value: string } }) => update(field, event.target.value),
      "aria-invalid": fieldErrors[field] ? true : undefined,
      "aria-describedby": fieldErrors[field] ? `${ids}-${field}-error` : undefined,
      className: `${fieldClass} h-11`,
    });
    const errorFor = (field: Field) =>
      fieldErrors[field] ? (
        <p id={`${ids}-${field}-error`} className={fieldErrorClass}>
          {fieldErrors[field]}
        </p>
      ) : null;
    const cell = (
      field: Field,
      label: string,
      extra: InputHTMLAttributes<HTMLInputElement> = {},
      span = "",
    ) => (
      <div className={span}>
        <label htmlFor={`${ids}-${field}`} className={labelClass}>
          {label}
        </label>
        <input {...fieldProps(field)} {...extra} className={`${fieldClass} mt-1.5 h-11`} />
        {errorFor(field)}
      </div>
    );

    return (
      <CardFrame title="Claim your free domain">
        <form onSubmit={claim} noValidate className="mt-2">
          <div className="glass-inset flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="font-display text-[15px] font-semibold break-all text-ink">
                {chosen.domain}
              </p>
              <p className="text-[13px] text-(--glass-fg-muted)">
                Free for the first year
                {normalPrice(chosen) && <span> · {normalPrice(chosen)}</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("search");
                setError(null);
              }}
              disabled={claiming}
              className={textButton}
            >
              Change
            </button>
          </div>

          <h4
            ref={formTitle}
            tabIndex={-1}
            className="mt-5 font-display text-[15px] font-semibold text-ink focus:outline-none"
          >
            Who owns the domain
          </h4>
          <p className={hintClass}>
            The domain is registered in your name, so it&rsquo;s yours. The registry requires these
            details. We pass them straight to the registry and don&rsquo;t keep your address or
            phone.
          </p>

          <fieldset className="mt-4 grid gap-4 sm:grid-cols-2" disabled={claiming}>
            <legend className="sr-only">Domain owner details</legend>
            {cell("firstName", "First name", { autoComplete: "given-name" })}
            {cell("lastName", "Last name", { autoComplete: "family-name" })}
            {cell("email", "Email", { type: "email", autoComplete: "email", inputMode: "email" })}
            {cell("phone", "Phone", {
              type: "tel",
              autoComplete: "tel-national",
              inputMode: "tel",
            })}
            {cell("address1", "Street address", { autoComplete: "address-line1" }, "sm:col-span-2")}
            {cell(
              "address2",
              "Apt, suite (optional)",
              { autoComplete: "address-line2" },
              "sm:col-span-2",
            )}
            {cell("city", "City", { autoComplete: "address-level2" })}
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
              <div>
                <label htmlFor={`${ids}-state`} className={labelClass}>
                  State
                </label>
                <select
                  {...fieldProps("state")}
                  autoComplete="address-level1"
                  className={`${fieldClass} mt-1.5 h-11`}
                >
                  <option value="">Choose…</option>
                  {STATE_OPTIONS.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                {errorFor("state")}
              </div>
              <div>
                <label htmlFor={`${ids}-zip`} className={labelClass}>
                  ZIP
                </label>
                <input
                  {...fieldProps("zip")}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  className={`${fieldClass} mt-1.5 h-11`}
                />
                {errorFor("zip")}
              </div>
            </div>
            <p className="text-[13px] leading-5 text-(--glass-fg-muted) sm:col-span-2">
              Country: United States
            </p>
          </fieldset>

          {error && (
            <Notice tone="error" size="sm" className="mt-4">
              {error}
            </Notice>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={claiming}
              aria-busy={claiming}
              className={primaryButton}
            >
              {claiming ? (
                <>
                  <SpinnerIcon />
                  Registering…
                </>
              ) : (
                `Claim ${chosen.domain}`
              )}
            </button>
            <p className="text-[13px] leading-5 text-(--glass-fg-muted)">
              One free domain per account. You can&rsquo;t change it later.
            </p>
          </div>
        </form>
      </CardFrame>
    );
  }

  // Passo da busca.
  const wanted = result?.result ?? null;
  return (
    <CardFrame title="Claim your free domain">
      <p className={hintClass}>
        Your Premium plan includes a .com (or .net) free for the first year. We register it in your
        name and connect it to this website. No DNS setup.
      </p>
      {retryNote && (
        <Notice tone="warning" size="sm" className="mt-3">
          {retryNote}
        </Notice>
      )}
      <form onSubmit={search} className="mt-4" role="search">
        <label htmlFor={`${ids}-query`} className={labelClass}>
          Find your domain
        </label>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
          <input
            id={`${ids}-query`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="yourbusiness.com"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="url"
            maxLength={80}
            className={`${fieldClass} h-11 min-w-0 sm:flex-1`}
          />
          <button
            type="submit"
            disabled={searching || query.trim().length === 0}
            aria-busy={searching}
            className={secondaryButton}
          >
            {searching ? (
              <>
                <SpinnerIcon />
                Searching…
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mt-3 space-y-3 empty:hidden">
        {error && (
          <Notice tone="error" size="sm">
            {error}
          </Notice>
        )}
        {wanted &&
          (wanted.free ? (
            <OptionRow option={wanted} onChoose={choose} highlight />
          ) : (
            <>
              <p className="text-[15px] leading-6 text-slate-700">
                <span className="font-semibold break-all text-ink">{wanted.domain}</span>{" "}
                {wanted.reason === "taken"
                  ? "is already taken."
                  : "is a premium name with a special price, so it isn’t included."}
                {result && result.suggestions.length > 0
                  ? " These are available and free:"
                  : " Try another name, like your business name plus your city."}
              </p>
              {result && result.suggestions.length > 0 && (
                <ul className="space-y-2">
                  {result.suggestions.map((option) => (
                    <li key={option.domain}>
                      <OptionRow option={option} onChoose={choose} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ))}
      </div>
    </CardFrame>
  );
}

/** Uma linha de domínio disponível: nome, "Free for the first year" e "Choose". */
function OptionRow({
  option,
  onChoose,
  highlight = false,
}: {
  option: FreeDomainOption;
  onChoose: (option: FreeDomainOption) => void;
  highlight?: boolean;
}) {
  const price = normalPrice(option);
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ${
        highlight ? "bg-white/80 ring-1 ring-emerald-500/30" : "glass-inset"
      }`}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-display text-[15px] font-semibold break-all text-ink">
            {option.domain}
          </span>
          {highlight && <StatusBadge tone="live">Available</StatusBadge>}
        </p>
        <p className="mt-0.5 text-[13px] text-(--glass-fg-muted)">
          <span className="font-semibold text-emerald-700">Free for the first year</span>
          {price && <span> · {price}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChoose(option)}
        className={highlight ? primaryButton : secondaryButton}
      >
        {highlight ? "Claim this domain" : "Choose"}
        <span className="sr-only"> {option.domain}</span>
      </button>
    </div>
  );
}
