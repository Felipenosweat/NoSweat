"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { StatusBadge, focusRing, textButton } from "@/components/DashboardUi";
import { deleteSitesAction, unpublishSiteAction, type AdminActionResult } from "./actions";
import { ConfirmDialog } from "./ConfirmDialog";

// Lista de sites do admin (no /admin e na ficha da conta): ações por site (editar, abrir no ar,
// gerenciar, tirar do ar, apagar) e seleção em massa para apagar sites de teste. Tabela no
// computador, cartões no celular. Cada ação pede confirmação com o nome do site.

export type AdminSiteRow = {
  id: string;
  name: string;
  template: string;
  published: boolean;
  badge: { label: string; tone: "live" | "draft" | "pending" };
  /** `null` = site de visitante (sem conta). */
  owner: { id: string; label: string; test: boolean } | null;
  /** Endereço para mostrar (domínio ou /s/<slug>), mesmo fora do ar. */
  address: string | null;
  /** Link do site no ar (`null` = fora do ar). */
  liveHref: string | null;
  created: string;
};

type Pending =
  | { kind: "offline"; id: string; name: string }
  | { kind: "delete"; ids: string[]; names: string[] };

const linkClass = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;
const dangerLink = `rounded-sm font-semibold text-red-700 underline-offset-4 hover:underline ${focusRing}`;
const plainLink = `rounded-sm font-semibold text-slate-700 underline-offset-4 hover:underline ${focusRing}`;
const th = "px-4 py-3 font-medium whitespace-nowrap";
const td = "px-4 py-3 align-top";
const checkbox = `size-4 rounded border-slate-300 accent-brand ${focusRing}`;
const SHOWN_NAMES = 8;

function Actions({
  row,
  onOffline,
  onDelete,
}: {
  row: AdminSiteRow;
  onOffline: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
      <Link href={`/sites/${row.id}/edit`} className={linkClass}>
        Edit
      </Link>
      {row.liveHref && (
        <a href={row.liveHref} target="_blank" rel="noreferrer" className={linkClass}>
          Open live<span className="sr-only"> (opens in a new tab)</span> ↗
        </a>
      )}
      <Link href={`/sites/${row.id}`} className={linkClass}>
        Manage
      </Link>
      {row.published && (
        <button type="button" onClick={onOffline} className={plainLink}>
          Take offline
        </button>
      )}
      <button type="button" onClick={onDelete} className={dangerLink}>
        Delete
      </button>
    </div>
  );
}

function Owner({ owner }: { owner: AdminSiteRow["owner"] }) {
  if (!owner) return <span className="text-slate-500">Visitor (no account)</span>;
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
      <Link href={`/admin/clients/${owner.id}`} className={`${linkClass} break-all`}>
        {owner.label}
      </Link>
      {owner.test && <StatusBadge tone="pending">Test</StatusBadge>}
    </span>
  );
}

function Address({ row }: { row: AdminSiteRow }) {
  if (!row.address) return <span className="text-slate-400">—</span>;
  return <span className="font-mono text-xs break-all text-slate-600">{row.address}</span>;
}

export function SitesTable({
  rows,
  showOwner = true,
  emptyText = "No websites.",
}: {
  rows: AdminSiteRow[];
  /** Coluna do dono (na ficha da conta não precisa). */
  showOwner?: boolean;
  emptyText?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  // Só conta o que ainda está na lista (sites apagados somem quando a página recarrega).
  const selectedRows = rows.filter((row) => selected.has(row.id));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)));

  const open = (next: Pending) => {
    setDialogError(null);
    setConfirming(next);
  };
  const close = () => {
    if (pending) return;
    setConfirming(null);
    setDialogError(null);
  };

  const run = () => {
    const action = confirming;
    if (!action) return;
    startTransition(async () => {
      let response: AdminActionResult;
      try {
        response =
          action.kind === "offline"
            ? await unpublishSiteAction({ siteId: action.id })
            : await deleteSitesAction({ siteIds: action.ids });
      } catch {
        response = { ok: false, message: "We couldn't reach our servers. Try again." };
      }
      if (!response.ok) {
        setDialogError(response.message);
        return;
      }
      if (action.kind === "delete") {
        setSelected((current) => {
          const next = new Set(current);
          for (const id of action.ids) next.delete(id);
          return next;
        });
      }
      setConfirming(null);
      setResult(response);
    });
  };

  const askDelete = (ids: string[], names: string[]) => open({ kind: "delete", ids, names });

  return (
    <div>
      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={`mx-4 mt-4 flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
            result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-700"
          }`}
        >
          <span>{result.message}</span>
          <button
            type="button"
            onClick={() => setResult(null)}
            className={`shrink-0 rounded-sm font-semibold ${focusRing}`}
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">Dismiss</span>
          </button>
        </p>
      )}

      {rows.length === 0 ? (
        <p className="px-5 py-4 text-[15px] text-slate-600">{emptyText}</p>
      ) : (
        <>
          <div className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 px-4 py-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className={checkbox}
              />
              Select all shown
            </label>
            {selectedRows.length > 0 && (
              <>
                <span className="text-sm text-slate-500 tabular-nums">
                  {selectedRows.length} selected
                </span>
                <button
                  type="button"
                  onClick={() =>
                    askDelete(
                      selectedRows.map((row) => row.id),
                      selectedRows.map((row) => row.name),
                    )
                  }
                  className={`inline-flex min-h-11 items-center rounded-lg px-1 text-[15px] font-semibold text-red-700 hover:text-red-800 sm:min-h-10 ${focusRing}`}
                >
                  Delete selected
                </button>
                <button type="button" onClick={() => setSelected(new Set())} className={textButton}>
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Computador: tabela. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className={`${th} w-10`}>
                    <span className="sr-only">Select</span>
                  </th>
                  <th className={th}>Business</th>
                  {showOwner && <th className={th}>Owner</th>}
                  <th className={th}>Status</th>
                  <th className={th}>Address</th>
                  <th className={th}>Created</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className={td}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                        aria-label={`Select ${row.name}`}
                        className={`${checkbox} mt-0.5`}
                      />
                    </td>
                    <td className={td}>
                      <span className="block font-semibold text-ink">{row.name}</span>
                      <span className="block text-[13px] text-slate-500">{row.template}</span>
                    </td>
                    {showOwner && (
                      <td className={`${td} max-w-[16rem]`}>
                        <Owner owner={row.owner} />
                      </td>
                    )}
                    <td className={td}>
                      <StatusBadge tone={row.badge.tone}>{row.badge.label}</StatusBadge>
                    </td>
                    <td className={`${td} max-w-[14rem]`}>
                      <Address row={row} />
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-600`}>{row.created}</td>
                    <td className={`${td} min-w-[15rem]`}>
                      <Actions
                        row={row}
                        onOffline={() => open({ kind: "offline", id: row.id, name: row.name })}
                        onDelete={() => askDelete([row.id], [row.name])}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: cartões. */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="flex gap-3 px-4 py-4">
                <input
                  type="checkbox"
                  checked={selected.has(row.id)}
                  onChange={() => toggle(row.id)}
                  aria-label={`Select ${row.name}`}
                  className={`${checkbox} mt-1 shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold break-words text-ink">{row.name}</span>
                    <StatusBadge tone={row.badge.tone}>{row.badge.label}</StatusBadge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-slate-500">
                    {row.template} · created {row.created}
                  </p>
                  {showOwner && (
                    <p className="mt-1 text-sm">
                      <Owner owner={row.owner} />
                    </p>
                  )}
                  {row.address && (
                    <p className="mt-1">
                      <Address row={row} />
                    </p>
                  )}
                  <div className="mt-2">
                    <Actions
                      row={row}
                      onOffline={() => open({ kind: "offline", id: row.id, name: row.name })}
                      onDelete={() => askDelete([row.id], [row.name])}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title={
          confirming?.kind === "offline"
            ? `Take ${confirming.name} offline?`
            : confirming?.kind === "delete" && confirming.names.length === 1
              ? `Delete ${confirming.names[0] ?? "this website"}?`
              : `Delete ${confirming?.kind === "delete" ? confirming.names.length : 0} websites?`
        }
        confirmLabel={confirming?.kind === "offline" ? "Take offline" : "Delete forever"}
        pendingLabel={confirming?.kind === "offline" ? "Taking offline…" : "Deleting…"}
        danger={confirming?.kind !== "offline"}
        pending={pending}
        error={dialogError}
        onConfirm={run}
        onCancel={close}
      >
        {confirming?.kind === "offline" ? (
          <p>
            Visitors stop seeing it right away. Nothing is deleted: the address, custom domain and
            published version are kept, and publishing again brings it back.
          </p>
        ) : confirming?.kind === "delete" ? (
          <>
            <p>
              {confirming.names.length === 1
                ? "It goes offline, its custom domain is released and its versions and messages are erased."
                : "They go offline, custom domains are released and their versions and messages are erased."}{" "}
              This can&rsquo;t be undone.
            </p>
            {confirming.names.length > 1 && (
              <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-sm text-slate-700">
                {confirming.names.slice(0, SHOWN_NAMES).map((name, index) => (
                  <li key={`${index}-${name}`} className="break-words">
                    {name}
                  </li>
                ))}
                {confirming.names.length > SHOWN_NAMES && (
                  <li>and {confirming.names.length - SHOWN_NAMES} more</li>
                )}
              </ul>
            )}
          </>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
