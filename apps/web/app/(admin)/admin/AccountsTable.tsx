"use client";

import Link from "next/link";
import { EmptyState, GlassBadge, GlassMenu, cx } from "@/components/glass";
import { useAccountActions, type AccountTarget } from "./AccountActions";
import { linkClass, mobileCard, rowClass, td, th } from "./AdminUi";

// Lista de contas do /admin/accounts: tabela no computador, cartões no celular, e UM menu "⋯" por
// linha (View as, Manage, Disable login, Delete test account).

export type AdminAccountRow = AccountTarget & {
  name: string | null;
  admin: boolean;
  signedUp: string;
  lastLogin: string;
  plan: { label: string; tone: "live" | "pending" | "neutral" };
  live: number;
  /** Pedidos do formulário dos sites da conta (`null` = não deu para contar). */
  requests: number | null;
};

function AccountBadges({ row, withPlan = false }: { row: AdminAccountRow; withPlan?: boolean }) {
  if (!withPlan && !row.admin && !row.testAccount && !row.loginDisabled) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {withPlan && (
        <GlassBadge tone={row.plan.tone} size="sm">
          {row.plan.label}
        </GlassBadge>
      )}
      {row.admin && (
        <GlassBadge tone="info" size="sm">
          Admin
        </GlassBadge>
      )}
      {row.testAccount && (
        <GlassBadge tone="pending" size="sm">
          Test account
        </GlassBadge>
      )}
      {row.loginDisabled && (
        <GlassBadge tone="danger" size="sm">
          Login disabled
        </GlassBadge>
      )}
    </span>
  );
}

export function AccountsTable({
  rows,
  manageEnabled,
  emptyText,
  emptyDescription,
}: {
  rows: AdminAccountRow[];
  manageEnabled: boolean;
  emptyText: string;
  emptyDescription?: string;
}) {
  const { itemsFor, dialogs, notice } = useAccountActions({ manageEnabled });

  if (rows.length === 0) {
    return <EmptyState title={emptyText} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-3">
      {notice}

      {/* Computador: tabela num cartão de vidro. */}
      <div className="glass hidden overflow-x-auto rounded-2xl md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className={th}>Account</th>
              <th className={th}>Plan</th>
              <th className={th}>Signed up</th>
              <th className={th}>Last login</th>
              <th className={cx(th, "text-right")}>Websites</th>
              <th className={cx(th, "text-right")}>Live</th>
              <th className={cx(th, "text-right")}>Requests</th>
              <th className={cx(th, "w-14")}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={rowClass}>
                <td className={cx(td, "max-w-[20rem]")}>
                  <Link
                    href={`/admin/clients/${row.id}`}
                    className={cx(linkClass, "block break-all")}
                  >
                    {row.email ?? row.id}
                  </Link>
                  {row.name && (
                    <span className="block text-[13px] text-(--glass-fg-muted)">{row.name}</span>
                  )}
                  <span className="mt-1.5 block empty:hidden">
                    <AccountBadges row={row} />
                  </span>
                </td>
                <td className={td}>
                  <GlassBadge tone={row.plan.tone}>{row.plan.label}</GlassBadge>
                </td>
                <td className={cx(td, "whitespace-nowrap text-(--glass-fg-muted)")}>
                  {row.signedUp}
                </td>
                <td className={cx(td, "whitespace-nowrap text-(--glass-fg-muted)")}>
                  {row.lastLogin}
                </td>
                <td className={cx(td, "text-right tabular-nums")}>{row.websites}</td>
                <td className={cx(td, "text-right tabular-nums")}>{row.live}</td>
                <td className={cx(td, "text-right tabular-nums")}>{row.requests ?? "—"}</td>
                <td className={cx(td, "text-right")}>
                  <GlassMenu items={itemsFor(row)} label={`Actions for ${row.label}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular: um cartão por conta, com o mesmo menu "⋯". */}
      <ul className="grid gap-2.5 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className={cx(mobileCard, "flex items-start gap-2")}>
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/clients/${row.id}`}
                className={cx(linkClass, "inline-flex min-h-11 items-center break-all")}
              >
                {row.email ?? row.id}
              </Link>
              {row.name && (
                <span className="-mt-2 block text-sm text-(--glass-fg-muted)">{row.name}</span>
              )}
              <div className="mt-2">
                <AccountBadges row={row} withPlan />
              </div>
              <p className="mt-2 text-[13px] text-(--glass-fg-muted)">
                {row.websites} {row.websites === 1 ? "website" : "websites"} · {row.live} live ·{" "}
                {row.requests === null ? "—" : row.requests}{" "}
                {row.requests === 1 ? "request" : "requests"}
              </p>
              <p className="mt-0.5 text-[13px] text-(--glass-fg-muted)">
                Signed up {row.signedUp} · Last login {row.lastLogin}
              </p>
            </div>
            <GlassMenu items={itemsFor(row)} label={`Actions for ${row.label}`} />
          </li>
        ))}
      </ul>

      {dialogs}
    </div>
  );
}
