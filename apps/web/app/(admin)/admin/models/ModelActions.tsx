"use client";

import { ApiError, TemplateId } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { focusRing, primaryButton, secondaryButton, textButton } from "@/components/DashboardUi";
import {
  CATEGORY_LABELS,
  ModelResponse,
  parseKeywordList,
  type ModelSummary,
} from "@/lib/model-studio";

// Ações de um card do /admin/models: aprovar, voltar ao original (ou apagar), duplicar e as
// palavras do ramo. Tudo pelas rotas /api/admin/models/* (cada uma confere se é admin e valida
// com o Zod); erros aparecem embaixo dos botões.

const OFFLINE = "We couldn't reach our servers. Please try again.";
const fieldClass = `mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-ink placeholder:text-slate-400 ${focusRing}`;

type Busy = "status" | "reset" | "duplicate" | "keywords" | null;

async function call(
  url: string,
  init: RequestInit,
): Promise<{ ok: true; body: unknown } | { ok: false; message: string }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const apiError = ApiError.safeParse(body);
      return {
        ok: false,
        message: apiError.success
          ? apiError.data.error.message
          : "Something went wrong. Try again.",
      };
    }
    return { ok: true, body };
  } catch {
    return { ok: false, message: OFFLINE };
  }
}

export function ModelActions({ model }: { model: ModelSummary }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [category, setCategory] = useState<TemplateId>(model.category);
  const [keywords, setKeywords] = useState(model.keywords.join(", "));
  const api = `/api/admin/models/${encodeURIComponent(model.slug)}`;
  const hasStudioVersion = model.updatedAt !== null;

  async function run(kind: Exclude<Busy, null>, action: () => Promise<string | null>) {
    if (busy) return;
    setBusy(kind);
    setError(null);
    setNote(null);
    try {
      const message = await action();
      if (message) setError(message);
    } finally {
      setBusy(null);
    }
  }

  const toggleApproval = () =>
    run("status", async () => {
      const next = model.status === "approved" ? "draft" : "approved";
      const result = await call(`${api}/status`, {
        method: "POST",
        body: JSON.stringify({ status: next }),
      });
      if (!result.ok) return result.message;
      ModelResponse.parse(result.body);
      router.refresh();
      return null;
    });

  const reset = () =>
    run("reset", async () => {
      const question =
        model.source === "studio"
          ? `Delete the model "${model.name}"? This can't be undone.`
          : `Reset "${model.name}" to the original version? Your edits and approval will be lost.`;
      if (!window.confirm(question)) return null;
      const result = await call(api, { method: "DELETE" });
      if (!result.ok) return result.message;
      router.refresh();
      return null;
    });

  const duplicate = () =>
    run("duplicate", async () => {
      const result = await call("/api/admin/models", {
        method: "POST",
        body: JSON.stringify({ category, fromSlug: model.slug }),
      });
      if (!result.ok) return result.message;
      const created = ModelResponse.parse(result.body);
      router.push(`/admin/models/${encodeURIComponent(created.model.slug)}/edit`);
      return null;
    });

  const saveKeywords = () =>
    run("keywords", async () => {
      const result = await call(`${api}/keywords`, {
        method: "PUT",
        body: JSON.stringify({ keywords: parseKeywordList(keywords) }),
      });
      if (!result.ok) return result.message;
      const saved = ModelResponse.parse(result.body);
      setKeywords(saved.model.keywords.join(", "));
      setNote("Keywords saved.");
      router.refresh();
      return null;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void toggleApproval()}
          disabled={busy !== null}
          className={model.status === "approved" ? secondaryButton : primaryButton}
        >
          {busy === "status" ? "Saving…" : model.status === "approved" ? "Unapprove" : "Approve"}
        </button>
        {(model.source === "studio" || hasStudioVersion) && (
          <button
            type="button"
            onClick={() => void reset()}
            disabled={busy !== null}
            className={secondaryButton}
          >
            {busy === "reset"
              ? "Working…"
              : model.source === "studio"
                ? "Delete"
                : "Reset to original"}
          </button>
        )}
      </div>

      <details className="group rounded-lg border border-slate-200 px-3 py-2">
        <summary
          className={`cursor-pointer rounded-sm text-sm font-semibold text-slate-700 ${focusRing}`}
        >
          Duplicate
        </summary>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-sm font-medium text-slate-600">
            Category of the copy
            <select
              value={category}
              onChange={(event) => setCategory(TemplateId.parse(event.target.value))}
              className={fieldClass}
            >
              {TemplateId.options.map((option) => (
                <option key={option} value={option}>
                  {CATEGORY_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void duplicate()}
            disabled={busy !== null}
            className={secondaryButton}
          >
            {busy === "duplicate" ? "Copying…" : "Duplicate"}
          </button>
        </div>
      </details>

      <details className="group rounded-lg border border-slate-200 px-3 py-2">
        <summary
          className={`cursor-pointer rounded-sm text-sm font-semibold text-slate-700 ${focusRing}`}
        >
          Keywords ({model.keywords.length})
        </summary>
        <label className="mt-2 block text-sm font-medium text-slate-600">
          Trade words that pick this model (comma separated)
          <textarea
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            rows={3}
            className={fieldClass}
            placeholder="plumb, drain, water heater"
          />
        </label>
        <button
          type="button"
          onClick={() => void saveKeywords()}
          disabled={busy !== null}
          className={`${textButton} mt-1`}
        >
          {busy === "keywords" ? "Saving…" : "Save keywords"}
        </button>
      </details>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {note && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {note}
        </p>
      )}
    </div>
  );
}
