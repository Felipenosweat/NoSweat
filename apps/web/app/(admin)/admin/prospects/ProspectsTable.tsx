"use client";

import { ApiError } from "@nosweat/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EmptyState,
  GlassBadge,
  GlassButton,
  cx,
  focusRing,
  type GlassBadgeTone,
} from "@/components/glass";
import {
  MAX_PREVIEWS_PER_RUN,
  PROSPECT_STATUS_LABELS,
  ProspectPreviewResponse,
  ProspectStatus,
  WEBSITE_STATUS_LABELS,
  type ProspectView,
  type WebsiteStatus,
} from "@/lib/prospects";
import { Notice } from "@/components/glass";
import { linkClass, mobileCard, rowClass, td, th } from "../AdminUi";

// Tabela de prospects: seleção em massa → "Create preview sites" (um por vez, mostrando o
// progresso; no máximo 10 por clique, custo da IA), "Mark contacted" e "Do not contact".
// Tabela no computador, cartões no celular.

const WEBSITE_TONES: Record<WebsiteStatus, GlassBadgeTone> = {
  none: "danger",
  weak: "pending",
  ok: "live",
  unknown: "neutral",
};

const STATUS_TONES: Record<ProspectStatus, GlassBadgeTone> = {
  new: "neutral",
  preview_ready: "info",
  contacted: "pending",
  replied: "info",
  won: "live",
  lost: "draft",
  do_not_contact: "danger",
};

type Result = { tone: "success" | "error" | "warning"; text: string };

async function errorText(res: Response, fallback: string): Promise<string> {
  const parsed = ApiError.safeParse(await res.json().catch(() => null));
  return parsed.success ? parsed.data.error.message : fallback;
}

function SelectBox({
  checked,
  onChange,
  label,
  indeterminate = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  indeterminate?: boolean;
}) {
  return (
    <label className="-m-2.5 inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl hover:bg-(--glass-ghost-hover) md:-m-1.5 md:size-9">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        ref={(node) => {
          if (node) node.indeterminate = indeterminate;
        }}
        className={cx("size-[18px] cursor-pointer rounded-md accent-brand", focusRing)}
      />
    </label>
  );
}

function WebsiteCell({ row }: { row: ProspectView }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <GlassBadge tone={WEBSITE_TONES[row.websiteStatus]} size="sm">
        {WEBSITE_STATUS_LABELS[row.websiteStatus]}
      </GlassBadge>
      {row.website && (
        <a
          href={row.website}
          target="_blank"
          rel="noreferrer nofollow"
          title={row.websiteNotes ?? undefined}
          className={cx(
            "max-w-44 truncate text-xs text-(--glass-fg-muted) hover:underline",
            focusRing,
          )}
        >
          {row.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
        </a>
      )}
      {row.websiteNotes && (
        <span className="max-w-44 text-xs leading-4 text-(--glass-fg-muted)">
          {row.websiteNotes}
        </span>
      )}
    </div>
  );
}

function Rating({ row }: { row: ProspectView }) {
  if (row.rating === null) return <span className="text-(--glass-fg-muted)">—</span>;
  return (
    <span className="whitespace-nowrap tabular-nums">
      {row.rating.toFixed(1)}{" "}
      <span className="text-(--glass-fg-muted)">({row.reviewCount ?? 0})</span>
    </span>
  );
}

function Preview({ row }: { row: ProspectView }) {
  if (!row.previewPath) return <span className="text-(--glass-fg-muted)">—</span>;
  return (
    <a
      href={row.previewPath}
      target="_blank"
      rel="noreferrer"
      className={cx(linkClass, "whitespace-nowrap")}
    >
      Open preview
    </a>
  );
}

export function ProspectsTable({
  rows,
  emptyText,
  emptyDescription,
}: {
  rows: ProspectView[];
  emptyText: string;
  emptyDescription?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const selectedRows = rows.filter((row) => selected.has(row.id));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const someSelected = selectedRows.length > 0 && !allSelected;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)));

  async function createPreviews() {
    // Só quem ainda não tem prévia e pode ser contatado; no máximo 10 por clique.
    const todo = selectedRows.filter((row) => !row.previewPath && row.status !== "do_not_contact");
    const batch = todo.slice(0, MAX_PREVIEWS_PER_RUN);
    if (batch.length === 0) {
      setResult({
        tone: "warning",
        text: "Everyone selected already has a preview (or is do not contact).",
      });
      return;
    }
    setBusy(true);
    setResult(null);
    let done = 0;
    const failures: string[] = [];
    for (const [index, row] of batch.entries()) {
      setProgress(`Creating preview ${index + 1} of ${batch.length}: ${row.name}…`);
      try {
        const res = await fetch(`/api/admin/prospects/${row.id}/preview`, { method: "POST" });
        if (res.ok && ProspectPreviewResponse.safeParse(await res.json()).success) done++;
        else failures.push(await errorText(res, `${row.name}: failed.`));
      } catch {
        failures.push(`${row.name}: couldn't reach our servers.`);
      }
      // Um por um: a lista se atualiza enquanto anda.
      router.refresh();
    }
    setProgress(null);
    setBusy(false);
    const skipped = todo.length - batch.length;
    setResult({
      tone: failures.length ? (done ? "warning" : "error") : "success",
      text: [
        `${done} preview${done === 1 ? "" : "s"} created.`,
        skipped ? `${skipped} left for the next run (max ${MAX_PREVIEWS_PER_RUN} per click).` : "",
        ...failures,
      ]
        .filter(Boolean)
        .join(" "),
    });
    setSelected(new Set());
  }

  async function setStatus(ids: string[], status: ProspectStatus, label: string) {
    if (ids.length === 0) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/prospects/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (res.ok) {
        const body = (await res.json()) as { updated?: number };
        setResult({ tone: "success", text: `${body.updated ?? 0} marked ${label}.` });
        setSelected(new Set());
        router.refresh();
      } else {
        setResult({ tone: "error", text: await errorText(res, "Couldn't update. Try again.") });
      }
    } catch {
      setResult({ tone: "error", text: "We couldn't reach our servers. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const statusSelect = (row: ProspectView) => (
    <select
      aria-label={`Status of ${row.name}`}
      value={row.status}
      disabled={busy}
      onChange={(event) => {
        const status = ProspectStatus.parse(event.target.value);
        void setStatus([row.id], status, PROSPECT_STATUS_LABELS[status].toLowerCase());
      }}
      className={cx(
        "glass glass-flat h-9 rounded-lg px-2 text-[13px] text-(--glass-fg) disabled:opacity-60",
        focusRing,
      )}
    >
      {ProspectStatus.options.map((status) => (
        <option key={status} value={status}>
          {PROSPECT_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );

  if (rows.length === 0) {
    return <EmptyState title={emptyText} description={emptyDescription} />;
  }

  const ids = selectedRows.map((row) => row.id);

  return (
    <div className="grid grid-cols-1 gap-4">
      {progress && (
        <Notice tone="warning">
          <span role="status">{progress}</span>
        </Notice>
      )}
      {result && (
        <Notice tone={result.tone} onDismiss={() => setResult(null)}>
          {result.text}
        </Notice>
      )}

      {/* Barra de ações da seleção. */}
      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3">
        <span className="mr-auto text-[15px] font-semibold text-(--glass-fg) tabular-nums">
          {selectedRows.length
            ? `${selectedRows.length} selected`
            : "Select prospects to act on them"}
        </span>
        <GlassButton
          variant="primary"
          size="sm"
          disabled={busy || selectedRows.length === 0}
          loading={busy && progress !== null}
          onClick={() => void createPreviews()}
        >
          Create preview sites
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="sm"
          disabled={busy || selectedRows.length === 0}
          onClick={() => void setStatus(ids, "contacted", "contacted")}
        >
          Mark contacted
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="sm"
          disabled={busy || selectedRows.length === 0}
          onClick={() => void setStatus(ids, "do_not_contact", "do not contact")}
        >
          Do not contact
        </GlassButton>
      </div>

      {/* Computador: tabela. */}
      <div className="glass hidden overflow-x-auto rounded-2xl lg:block">
        <table className="w-full text-left text-[14px] text-(--glass-fg)">
          <thead>
            <tr>
              <th className={th}>
                <SelectBox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAll}
                  label="Select all prospects"
                />
              </th>
              <th className={th}>Business</th>
              <th className={th}>Website</th>
              <th className={th}>Email</th>
              <th className={th}>Rating</th>
              <th className={th}>Status</th>
              <th className={th}>Preview</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={rowClass}>
                <td className={td}>
                  <SelectBox
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    label={`Select ${row.name}`}
                  />
                </td>
                <td className={td}>
                  <div className="min-w-40 font-semibold">{row.name}</div>
                  <div className="text-xs text-(--glass-fg-muted)">
                    {[row.category, [row.city, row.state].filter(Boolean).join(", ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {row.phone && (
                    <a
                      href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}
                      className={cx(linkClass, "text-[13px] whitespace-nowrap tabular-nums")}
                    >
                      {row.phone}
                    </a>
                  )}
                </td>
                <td className={td}>
                  <WebsiteCell row={row} />
                </td>
                <td className={td}>
                  {row.email ? (
                    <span title={row.email} className="block max-w-44 truncate">
                      {row.email}
                    </span>
                  ) : (
                    <span className="text-(--glass-fg-muted)">—</span>
                  )}
                </td>
                <td className={td}>
                  <Rating row={row} />
                </td>
                <td className={td}>{statusSelect(row)}</td>
                <td className={td}>
                  <Preview row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular e tablet: cartões. */}
      <ul className="grid grid-cols-1 gap-3 lg:hidden">
        <li className="flex items-center gap-3 px-1">
          <SelectBox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleAll}
            label="Select all prospects"
          />
          <span className="text-[13px] font-semibold text-(--glass-fg-muted)">Select all</span>
        </li>
        {rows.map((row) => (
          <li key={row.id} className={mobileCard}>
            <div className="flex items-start gap-3">
              <SelectBox
                checked={selected.has(row.id)}
                onChange={() => toggle(row.id)}
                label={`Select ${row.name}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-(--glass-fg)">{row.name}</span>
                  <GlassBadge tone={STATUS_TONES[row.status]} size="sm">
                    {PROSPECT_STATUS_LABELS[row.status]}
                  </GlassBadge>
                </div>
                <p className="mt-0.5 text-[13px] text-(--glass-fg-muted)">
                  {[row.category, [row.city, row.state].filter(Boolean).join(", ")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-[14px] text-(--glass-fg)">
                  <WebsiteCell row={row} />
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {row.phone && (
                      <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`} className={linkClass}>
                        {row.phone}
                      </a>
                    )}
                    <span className="break-all">{row.email ?? "No email"}</span>
                    <Rating row={row} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {statusSelect(row)}
                    <Preview row={row} />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
