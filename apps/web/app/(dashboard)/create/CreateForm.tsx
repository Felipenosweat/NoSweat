"use client";

import { ApiError, GenerateSiteRequest, GenerateSiteResponse } from "@nosweat/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const MAX_LENGTH = 2000;

// Exemplos clicáveis: limpeza primeiro (nicho inicial); o clique substitui o texto.
const EXAMPLES = [
  {
    label: "House cleaning",
    text: "Family-owned house cleaning service in Worcester, MA. Weekly, biweekly and move-out cleans with eco-friendly products. Call (508) 555-0142.",
  },
  {
    label: "Plumbing",
    text: "Family-owned plumbing company in Austin, TX. 24/7 emergency repairs and water heaters.",
  },
  {
    label: "Hair salon",
    text: "Hair salon in Miami specializing in balayage, keratin treatments, and bridal styling.",
  },
  {
    label: "Restaurant",
    text: "Mexican restaurant in San Diego with handmade tortillas, fish tacos, and weekend brunch.",
  },
];

const HELP_ITEMS = [
  "What you do",
  "Where you work",
  "What makes you different",
  "Your phone number, if you want it on the site",
];

type FormError =
  | { kind: "inline"; message: string }
  | { kind: "alert"; title: string; body: string; loginLink?: boolean };

/** Mensagens amigáveis para cada `error.code` da API. */
function errorFor(code: string, fallback: string): FormError {
  switch (code) {
    case "invalid_request":
      return {
        kind: "inline",
        message: fallback || "Please tell us a bit more about your business.",
      };
    case "unauthorized":
      return {
        kind: "alert",
        title: "Your session expired.",
        body: "Log in again to continue.",
        loginLink: true,
      };
    case "generation_failed":
      return {
        kind: "alert",
        title: "We couldn’t build your site this time.",
        body: "Your description is still here, so try again in a moment.",
      };
    case "network_error":
      return {
        kind: "alert",
        title: "We couldn’t reach No Sweat.",
        body: "Check your connection and try again.",
      };
    default:
      return {
        kind: "alert",
        title: "Something went wrong on our end.",
        body: "Your description is still here, so please try again.",
      };
  }
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-slate-400"
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

function AlertIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.25v4.5M10 13.5v.25" />
    </svg>
  );
}

export function CreateForm() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [ready, setReady] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input = GenerateSiteRequest.safeParse({ brief });
    if (!input.success) {
      setError(errorFor("invalid_request", input.error.issues[0]?.message ?? ""));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.data),
      });
      const body: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        const code = apiError.success ? apiError.data.error.code : "internal_error";
        const message = apiError.success ? apiError.data.error.message : "";
        setError(errorFor(code, message));
        setLoading(false);
        return;
      }

      const { siteId } = GenerateSiteResponse.parse(body);
      // Só estado local: avisa que o rascunho ficou pronto enquanto a navegação acontece.
      setReady(true);
      // Mantém o estado de carregamento até a navegação terminar.
      router.push(`/sites/preview/${siteId}`);
    } catch {
      setError(errorFor("network_error", ""));
      setLoading(false);
    }
  }

  const invalid = error?.kind === "inline";
  const describedBy = invalid ? "brief-help brief-count brief-error" : "brief-help brief-count";

  return (
    <form onSubmit={handleSubmit} aria-busy={loading}>
      <label htmlFor="brief" className="block text-sm font-semibold text-ink">
        Describe your business
      </label>
      <ul
        id="brief-help"
        className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-slate-600 sm:grid-cols-2"
      >
        {HELP_ITEMS.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckIcon />
            {item}
          </li>
        ))}
      </ul>

      <textarea
        id="brief"
        name="brief"
        rows={6}
        maxLength={MAX_LENGTH}
        value={brief}
        onChange={(event) => setBrief(event.target.value)}
        disabled={loading}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        placeholder="e.g. House cleaning in Worcester, MA. Weekly, biweekly and move-out cleans…"
        className={`mt-4 block w-full resize-y rounded-2xl border bg-white p-5 text-lg leading-relaxed text-ink placeholder:text-slate-500 focus:ring-4 focus:outline-none disabled:opacity-60 ${
          invalid
            ? "border-red-500 ring-4 ring-red-100 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 focus:border-brand focus:ring-brand/15"
        }`}
      />

      <div className="mt-2 flex items-start justify-between gap-4">
        {error?.kind === "inline" ? (
          <p id="brief-error" className="flex gap-1.5 text-sm text-red-700">
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            {error.message}
          </p>
        ) : (
          <span />
        )}
        <p id="brief-count" className="shrink-0 text-[13px] text-slate-500 tabular-nums">
          {brief.length.toLocaleString("en-US")} / {MAX_LENGTH.toLocaleString("en-US")}
        </p>
      </div>

      <div className="mt-6">
        <p id="examples-label" className="text-sm font-semibold text-ink">
          Start from an example
        </p>
        <div
          role="group"
          aria-labelledby="examples-label"
          className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
        >
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              disabled={loading}
              onClick={() => setBrief(example.text)}
              title={example.text}
              className={`min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white ${focusRing}`}
            >
              <span className="sr-only">Use example: </span>
              {example.label}
            </button>
          ))}
        </div>
      </div>

      {error?.kind === "alert" && (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertIcon className="mt-0.5 size-5 shrink-0 text-red-700" />
          <p>
            <strong className="font-semibold">{error.title}</strong> {error.body}
            {error.loginLink && (
              <>
                {" "}
                <Link
                  href="/login?next=/create"
                  className={`font-semibold text-red-800 underline underline-offset-4 ${focusRing}`}
                >
                  Log in
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-brand px-6 font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px disabled:cursor-wait disabled:hover:bg-brand sm:w-auto lg:h-14 lg:text-lg ${focusRing}`}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="size-5 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin"
          />
        )}
        {loading ? "Building your website…" : "Generate my website"}
      </button>
      <p className="mt-3 min-h-5 text-sm text-slate-600" aria-live="polite">
        {ready
          ? "Your draft is ready. Opening the preview…"
          : loading
            ? "Picking a design, writing your pages, and choosing colors. This takes a few seconds."
            : ""}
      </p>
    </form>
  );
}
