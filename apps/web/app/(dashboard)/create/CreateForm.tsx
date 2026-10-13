"use client";

import { ApiError, GenerateSiteRequest, GenerateSiteResponse } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const EXAMPLES = [
  "Family-owned plumbing company in Austin, TX. 24/7 emergency repairs and water heaters.",
  "Hair salon in Miami specializing in balayage, keratin treatments, and bridal styling.",
  "Mexican restaurant in San Diego with handmade tortillas, fish tacos, and weekend brunch.",
];

/** Mensagens amigáveis para cada `error.code` da API. */
function messageFor(code: string, fallback: string): string {
  switch (code) {
    case "invalid_request":
      return fallback || "Please tell us a bit more about your business.";
    case "unauthorized":
      return "Your session has expired. Please refresh the page and log in again.";
    case "generation_failed":
      return "Our AI had trouble building your site. Please try again in a moment.";
    case "network_error":
      return "We couldn't reach our servers. Check your connection and try again.";
    default:
      return "Something went wrong on our end. Please try again.";
  }
}

export function CreateForm() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input = GenerateSiteRequest.safeParse({ brief });
    if (!input.success) {
      setError(messageFor("invalid_request", input.error.issues[0]?.message ?? ""));
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
        setError(messageFor(code, message));
        setLoading(false);
        return;
      }

      const { siteId } = GenerateSiteResponse.parse(body);
      // Mantém o estado de carregamento até a navegação terminar.
      router.push(`/sites/preview/${siteId}`);
    } catch {
      setError(messageFor("network_error", ""));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8" aria-busy={loading}>
      <label htmlFor="brief" className="sr-only">
        Describe your business
      </label>
      <textarea
        id="brief"
        name="brief"
        rows={5}
        value={brief}
        onChange={(event) => setBrief(event.target.value)}
        disabled={loading}
        placeholder="e.g. We're a family-owned plumbing company in Austin, TX..."
        className="block w-full resize-y rounded-2xl border border-slate-300 bg-white p-5 text-lg shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-sm text-slate-500">Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            disabled={loading}
            onClick={() => setBrief(example)}
            title={example}
            className="max-w-full truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition hover:border-slate-400 disabled:opacity-60"
          >
            {example.split(" in ")[0]}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-80 sm:w-auto"
      >
        {loading && (
          <span
            aria-hidden="true"
            className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
        )}
        {loading ? "Building your website..." : "Generate my website"}
      </button>
      {loading && (
        <p className="mt-3 text-sm text-slate-500" aria-live="polite">
          Picking a design, writing your pages, and choosing colors. This takes a few seconds.
        </p>
      )}
    </form>
  );
}
