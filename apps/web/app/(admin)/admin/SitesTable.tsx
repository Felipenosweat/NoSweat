"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ConfirmDialog,
  EmptyState,
  GlassBadge,
  GlassButton,
  GlassMenu,
  GlassToolbar,
  cx,
  focusRing,
  type GlassMenuItem,
} from "@/components/glass";
import { Notice, linkClass, mobileCard, rowClass, td, th } from "./AdminUi";
import { deleteSitesAction, unpublishSiteAction, type AdminActionResult } from "./actions";

// Lista de sites do admin (em /admin/websites e na ficha da conta). Cada linha tem UM menu "⋯"
// (Edit, Open live, Manage, Take offline, Delete); o que tira do ar ou apaga pede confirmação na
// folha de vidro com o nome do site. Seleção em massa: aparece uma barra flutuante embaixo
// ("3 selected · Delete · Clear"). Tabela no computador, cartões no celular.

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

const SHOWN_NAMES = 8;

/** Caixa de seleção com área de toque de 44px (a caixinha continua pequena). */
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
    <label className="-m-2.5 inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl hover:bg-(--glass-ghost-hover) md:size-9 md:-m-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        // `indeterminate` só existe como propriedade do DOM (não há atributo HTML).
        ref={(node) => {
          if (node) node.indeterminate = indeterminate;
        }}
        className={cx("size-[18px] cursor-pointer rounded-md accent-brand", focusRing)}
      />
    </label>
  );
}

function Owner({ owner }: { owner: AdminSiteRow["owner"] }) {
  if (!owner) return <span className="text-(--glass-fg-muted)">Visitor (no account)</span>;
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
      <Link href={`/admin/clients/${owner.id}`} className={cx(linkClass, "break-all")}>
        {owner.label}
      </Link>
      {owner.test && (
        <GlassBadge tone="pending" size="sm">
          Test
        </GlassBadge>
      )}
    </span>
  );
}

function Address({ row }: { row: AdminSiteRow }) {
  if (!row.address) return <span className="text-(--glass-fg-muted)">—</span>;
  return <span className="font-mono text-xs break-all text-(--glass-fg-muted)">{row.address}</span>;
}

export function SitesTable({
  rows,
  showOwner = true,
  emptyText = "No websites.",
  emptyDescription,
}: {
  rows: AdminSiteRow[];
  /** Coluna do dono (na ficha da conta não precisa). */
  showOwner?: boolean;
  emptyText?: string;
  emptyDescription?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  // Só conta o que ainda está na lista (sites apagados somem quando a página recarrega).
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

  const menuItems = (row: AdminSiteRow): GlassMenuItem[] => [
    { type: "link", label: "Edit", href: `/sites/${row.id}/edit`, key: "edit" },
    ...(row.liveHref
      ? [
          {
            type: "link" as const,
            label: "Open live",
            href: row.liveHref,
            external: true,
            key: "live",
          },
        ]
      : []),
    { type: "link", label: "Manage", href: `/sites/${row.id}`, key: "manage" },
    ...(row.published
      ? [
          {
            label: "Take offline",
            onSelect: () => open({ kind: "offline", id: row.id, name: row.name }),
            key: "offline",
          },
        ]
      : []),
    { type: "separator", key: "sep" },
    {
      label: "Delete…",
      destructive: true,
      onSelect: () => askDelete([row.id], [row.name]),
      key: "delete",
    },
  ];

  const deleteCount = confirming?.kind === "delete" ? confirming.names.length : 0;

  return (
    <div className="grid gap-3">
      {result && (
        <Notice tone={result.ok ? "success" : "error"} onDismiss={() => setResult(null)}>
          {result.message}
        </Notice>
      )}

      {rows.length === 0 ? (
        <EmptyState title={emptyText} description={emptyDescription} />
      ) : (
        <>
          {/* Computador: tabela num cartão de vidro. */}
          <div className="glass hidden overflow-x-auto rounded-2xl md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className={cx(th, "w-12")}>
                    <SelectBox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                      label="Select all shown websites"
                    />
                  </th>
                  <th className={th}>Business</th>
                  {showOwner && <th className={th}>Owner</th>}
                  <th className={th}>Status</th>
                  <th className={th}>Address</th>
                  <th className={th}>Created</th>
                  <th className={cx(th, "w-14")}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cx(rowClass, selected.has(row.id) && "bg-brand/[0.06]")}
                  >
                    <td className={td}>
                      <SelectBox
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                        label={`Select ${row.name}`}
                      />
                    </td>
                    <td className={cx(td, "min-w-[11rem]")}>
                      <span className="block font-semibold break-words text-(--glass-fg)">
                        {row.name}
                      </span>
                      <span className="block text-[13px] text-(--glass-fg-muted)">
                        {row.template}
                      </span>
                    </td>
                    {showOwner && (
                      <td className={cx(td, "max-w-[16rem]")}>
                        <Owner owner={row.owner} />
                      </td>
                    )}
                    <td className={td}>
                      <GlassBadge tone={row.badge.tone}>{row.badge.label}</GlassBadge>
                    </td>
                    <td className={cx(td, "max-w-[14rem]")}>
                      <Address row={row} />
                    </td>
                    <td className={cx(td, "whitespace-nowrap text-(--glass-fg-muted)")}>
                      {row.created}
                    </td>
                    <td className={cx(td, "text-right")}>
                      <GlassMenu items={menuItems(row)} label={`Actions for ${row.name}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: um cartão por site, com o mesmo menu "⋯". */}
          <div className="md:hidden">
            <div className="flex min-h-11 items-center gap-3 px-1">
              <SelectBox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
                label="Select all shown websites"
              />
              <span className="text-sm font-medium text-(--glass-fg-muted)">Select all</span>
            </div>
            <ul className="mt-1 grid gap-2.5">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className={cx(
                    mobileCard,
                    "flex items-start gap-3",
                    selected.has(row.id) && "ring-2 ring-brand/40",
                  )}
                >
                  <div className="pt-0.5">
                    <SelectBox
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      label={`Select ${row.name}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold break-words text-(--glass-fg)">{row.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <GlassBadge tone={row.badge.tone} size="sm">
                        {row.badge.label}
                      </GlassBadge>
                      <span className="text-[13px] text-(--glass-fg-muted)">
                        {row.template} · {row.created}
                      </span>
                    </div>
                    {showOwner && (
                      <p className="mt-2 text-sm">
                        <Owner owner={row.owner} />
                      </p>
                    )}
                    {row.address && (
                      <p className="mt-1">
                        <Address row={row} />
                      </p>
                    )}
                  </div>
                  <div className="-mt-1 -mr-1">
                    <GlassMenu items={menuItems(row)} label={`Actions for ${row.name}`} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Barra flutuante da seleção em massa (vidro por cima do conteúdo). */}
      {selectedRows.length > 0 && (
        <GlassToolbar
          role="region"
          aria-label="Selected websites"
          sticky={false}
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto w-auto max-w-md flex-nowrap! sm:inset-x-0 sm:w-fit sm:max-w-none"
          actions={
            <>
              <GlassButton
                variant="ghost"
                onClick={() =>
                  askDelete(
                    selectedRows.map((row) => row.id),
                    selectedRows.map((row) => row.name),
                  )
                }
                className="text-red-700! hover:text-red-800!"
              >
                Delete
              </GlassButton>
              <GlassButton variant="secondary" onClick={() => setSelected(new Set())}>
                Clear
              </GlassButton>
            </>
          }
        >
          <span
            aria-live="polite"
            className="pl-3 text-[15px] font-semibold whitespace-nowrap text-(--glass-fg) tabular-nums"
          >
            {selectedRows.length} selected
          </span>
        </GlassToolbar>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title={
          confirming?.kind === "offline"
            ? `Take ${confirming.name} offline?`
            : deleteCount === 1
              ? `Delete ${confirming?.kind === "delete" ? (confirming.names[0] ?? "this website") : "this website"}?`
              : `Delete ${deleteCount} websites?`
        }
        confirmLabel={confirming?.kind === "offline" ? "Take offline" : "Delete forever"}
        pendingLabel={confirming?.kind === "offline" ? "Taking offline…" : "Deleting…"}
        tone={confirming?.kind === "offline" ? "primary" : "destructive"}
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
              {deleteCount === 1
                ? "It goes offline, its custom domain is released and its versions and messages are erased."
                : "They go offline, custom domains are released and their versions and messages are erased."}{" "}
              This can&rsquo;t be undone.
            </p>
            {deleteCount > 1 && (
              <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-sm">
                {confirming.names.slice(0, SHOWN_NAMES).map((name, index) => (
                  <li key={`${index}-${name}`} className="break-words">
                    {name}
                  </li>
                ))}
                {deleteCount > SHOWN_NAMES && <li>and {deleteCount - SHOWN_NAMES} more</li>}
              </ul>
            )}
          </>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
