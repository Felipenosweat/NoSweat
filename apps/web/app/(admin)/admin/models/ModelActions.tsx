"use client";

import { ApiError, TemplateId } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ConfirmDialog,
  GlassButton,
  GlassMenu,
  GlassSheet,
  type GlassMenuItem,
} from "@/components/glass";
import {
  CATEGORY_LABELS,
  ModelResponse,
  parseKeywordList,
  type ModelSummary,
} from "@/lib/model-studio";
import { fieldClass, labelClass, textareaClass } from "../AdminUi";

// Ações de um cartão do /admin/models: "Edit" à vista e o resto num menu "⋯" (Preview, Approve,
// Duplicate, Keywords, Reset/Delete). Tudo pelas rotas /api/admin/models/* (cada uma confere se
// é admin e valida com o Zod). Duplicar e palavras abrem uma folha de vidro; voltar ao original
// (ou apagar) pede confirmação. Erros aparecem embaixo dos botões.

const OFFLINE = "We couldn't reach our servers. Please try again.";

type Busy = "status" | "reset" | "duplicate" | "keywords" | null;
type Sheet = "duplicate" | "keywords" | "reset" | null;

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
  const [sheet, setSheet] = useState<Sheet>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [category, setCategory] = useState<TemplateId>(model.category);
  const [keywords, setKeywords] = useState(model.keywords.join(", "));
  const slug = encodeURIComponent(model.slug);
  const api = `/api/admin/models/${slug}`;
  const canReset = model.source === "studio" || model.updatedAt !== null;
  const isStudio = model.source === "studio";

  /** Roda uma ação; o erro vai para a folha aberta (se houver) ou embaixo dos botões. */
  async function run(kind: Exclude<Busy, null>, action: () => Promise<string | null>) {
    if (busy) return;
    setBusy(kind);
    setError(null);
    setSheetError(null);
    setNote(null);
    try {
      const message = await action();
      if (message) {
        if (sheet) setSheetError(message);
        else setError(message);
      }
    } finally {
      setBusy(null);
    }
  }

  const openSheet = (next: Exclude<Sheet, null>) => {
    setSheetError(null);
    setSheet(next);
  };
  const closeSheet = () => {
    if (busy) return;
    setSheet(null);
    setSheetError(null);
  };

  const toggleApproval = () =>
    run("status", async () => {
      const next = model.status === "approved" ? "draft" : "approved";
      const result = await call(`${api}/status`, {
        method: "POST",
        body: JSON.stringify({ status: next }),
      });
      if (!result.ok) return result.message;
      ModelResponse.parse(result.body);
      setNote(next === "approved" ? "Approved: new sites use this version." : "Back to draft.");
      router.refresh();
      return null;
    });

  const reset = () =>
    run("reset", async () => {
      const result = await call(api, { method: "DELETE" });
      if (!result.ok) return result.message;
      setSheet(null);
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
      setSheet(null);
      setNote("Keywords saved.");
      router.refresh();
      return null;
    });

  const items: GlassMenuItem[] = [
    { type: "link", label: "Preview", href: `/admin/models/${slug}/preview`, key: "preview" },
    {
      label: model.status === "approved" ? "Unapprove" : "Approve",
      onSelect: () => void toggleApproval(),
      disabled: busy !== null,
      key: "status",
    },
    {
      label: "Duplicate…",
      onSelect: () => openSheet("duplicate"),
      disabled: busy !== null,
      key: "duplicate",
    },
    {
      label: `Keywords (${model.keywords.length})…`,
      onSelect: () => openSheet("keywords"),
      disabled: busy !== null,
      key: "keywords",
    },
    ...(canReset
      ? ([
          { type: "separator", key: "sep" },
          {
            label: isStudio ? "Delete…" : "Reset to original…",
            destructive: true,
            onSelect: () => openSheet("reset"),
            disabled: busy !== null,
            key: "reset",
          },
        ] satisfies GlassMenuItem[])
      : []),
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <GlassButton href={`/admin/models/${slug}/edit`} variant="secondary" className="flex-1">
          Edit
        </GlassButton>
        <GlassMenu
          items={items}
          label={`More actions for ${model.name}`}
          triggerVariant="secondary"
        />
      </div>
      {busy === "status" && (
        <p role="status" className="text-sm text-(--glass-fg-muted)">
          Saving…
        </p>
      )}
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

      <GlassSheet
        open={sheet === "duplicate"}
        onClose={closeSheet}
        dismissible={busy === null}
        size="sm"
        title={`Duplicate ${model.name}`}
        description="The copy opens in the editor as a draft. It joins the pool only when approved."
        footer={
          <>
            <GlassButton variant="secondary" onClick={closeSheet} disabled={busy !== null}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              loading={busy === "duplicate"}
              onClick={() => void duplicate()}
            >
              {busy === "duplicate" ? "Copying…" : "Duplicate"}
            </GlassButton>
          </>
        }
      >
        <label className={labelClass}>
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
        {sheetError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {sheetError}
          </p>
        )}
      </GlassSheet>

      <GlassSheet
        open={sheet === "keywords"}
        onClose={closeSheet}
        dismissible={busy === null}
        size="sm"
        title="Keywords"
        description="Trade words that pick this model for a new site, separated by commas."
        footer={
          <>
            <GlassButton variant="secondary" onClick={closeSheet} disabled={busy !== null}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              loading={busy === "keywords"}
              onClick={() => void saveKeywords()}
            >
              {busy === "keywords" ? "Saving…" : "Save keywords"}
            </GlassButton>
          </>
        }
      >
        <label className={labelClass}>
          Keywords
          <textarea
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            rows={4}
            className={textareaClass}
            placeholder="plumb, drain, water heater"
          />
        </label>
        {sheetError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {sheetError}
          </p>
        )}
      </GlassSheet>

      <ConfirmDialog
        open={sheet === "reset"}
        title={isStudio ? `Delete the model “${model.name}”?` : `Reset “${model.name}”?`}
        confirmLabel={isStudio ? "Delete model" : "Reset to original"}
        pendingLabel={isStudio ? "Deleting…" : "Resetting…"}
        pending={busy === "reset"}
        error={sheetError}
        onConfirm={() => void reset()}
        onCancel={closeSheet}
      >
        <p>
          {isStudio
            ? "It leaves the pool for new sites. This can’t be undone."
            : "Your edits and approval are lost and new sites go back to the original version."}
        </p>
      </ConfirmDialog>
    </div>
  );
}
