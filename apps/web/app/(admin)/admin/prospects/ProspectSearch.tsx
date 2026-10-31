"use client";

import { ApiError, PlaceSearchResponse, type PlaceSuggestion } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { GlassButton } from "@/components/glass";
import { ProspectSearchResponse, TRADE_SUGGESTIONS } from "@/lib/prospects";
import { Notice } from "@/components/glass";
import { fieldClass, labelClass, panelText, panelTitle } from "../AdminUi";

// Busca de prospects: ramo (texto livre com sugestões) + cidade (sugestões de cidades dos EUA,
// as mesmas do /create, via GET /api/places) + estado. Uma busca grava até 60 empresas.

type Result = { tone: "success" | "error" | "warning"; text: string };

const SOURCE_NOTE = {
  google: "Searching Google Places.",
  osm: "Searching OpenStreetMap (free). Coverage of small trades is incomplete, so expect fewer results than Google.",
  mock: "Sample data (PROSPECTS_SOURCE=mock): fake businesses for testing.",
} as const;

export function ProspectSearch({ source }: { source: keyof typeof SOURCE_NOTE }) {
  const router = useRouter();
  const id = useId();
  const [trade, setTrade] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cities, setCities] = useState<PlaceSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Sugestões de cidade enquanto digita (pequena pausa entre as teclas).
  useEffect(() => {
    const q = city.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q });
        if (/^[A-Za-z]{2}$/.test(state)) params.set("state", state.toUpperCase());
        const res = await fetch(`/api/places?${params}`, { signal: controller.signal });
        const parsed = PlaceSearchResponse.safeParse(await res.json());
        if (parsed.success) setCities(parsed.data.places);
      } catch {
        // Sem sugestões: o campo continua aceitando texto livre.
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [city, state]);

  // Escolher "Austin, TX" na lista preenche cidade e estado.
  function onCity(value: string) {
    const match = /^(.+?),\s*([A-Za-z]{2})$/.exec(value);
    if (match && cities.some((c) => c.name === match[1] && c.state === match[2])) {
      setCity(match[1]!);
      setState(match[2]!);
      return;
    }
    setCity(value);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/prospects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade, city, state }),
      });
      const body: unknown = await res.json().catch(() => null);
      const ok = ProspectSearchResponse.safeParse(body);
      if (res.ok && ok.success) {
        const r = ok.data;
        setResult({
          tone: r.found ? "success" : "warning",
          text: r.found
            ? `“${r.query}”: ${r.found} found · ${r.added} new · ${r.updated} updated${r.mock ? " (sample data)" : ""}.`
            : `“${r.query}”: nothing found. Try a nearby bigger city or another trade.`,
        });
        router.refresh();
      } else {
        const error = ApiError.safeParse(body);
        setResult({
          tone: "error",
          text: error.success ? error.data.error.message : "Search failed. Try again.",
        });
      }
    } catch {
      setResult({ tone: "error", text: "We couldn't reach our servers. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-4 sm:p-5" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={panelTitle}>
        Find businesses
      </h2>
      <p className={`mt-1 ${panelText}`}>{SOURCE_NOTE[source]}</p>
      <form
        onSubmit={submit}
        className="mt-4 grid grid-cols-[1fr_5.5rem] gap-3 sm:grid-cols-[1.2fr_1.2fr_6rem_auto] sm:items-end"
      >
        <label className="col-span-2 sm:col-span-1">
          <span className={labelClass}>Trade</span>
          <input
            className={fieldClass}
            list={`${id}-trades`}
            value={trade}
            onChange={(event) => setTrade(event.target.value)}
            placeholder="plumber"
            maxLength={60}
            required
            autoComplete="off"
          />
          <datalist id={`${id}-trades`}>
            {TRADE_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </label>
        <label>
          <span className={labelClass}>City</span>
          <input
            className={fieldClass}
            list={`${id}-cities`}
            value={city}
            onChange={(event) => onCity(event.target.value)}
            placeholder="Austin"
            maxLength={60}
            required
            autoComplete="off"
          />
          <datalist id={`${id}-cities`}>
            {cities.map((c) => (
              <option key={`${c.name}|${c.state}`} value={`${c.name}, ${c.state}`} />
            ))}
          </datalist>
        </label>
        <label>
          <span className={labelClass}>State</span>
          <input
            className={`${fieldClass} uppercase`}
            value={state}
            onChange={(event) => setState(event.target.value.slice(0, 2).toUpperCase())}
            placeholder="TX"
            maxLength={2}
            required
            autoComplete="off"
          />
        </label>
        <GlassButton
          type="submit"
          variant="primary"
          loading={busy}
          className="col-span-2 sm:col-span-1"
        >
          {busy ? "Searching…" : "Search"}
        </GlassButton>
      </form>
      {busy && (
        <p className={`mt-3 ${panelText}`} role="status">
          Looking up businesses and checking their websites. This can take a minute.
        </p>
      )}
      {result && (
        <Notice tone={result.tone} onDismiss={() => setResult(null)} className="mt-4">
          {result.text}
        </Notice>
      )}
    </section>
  );
}
