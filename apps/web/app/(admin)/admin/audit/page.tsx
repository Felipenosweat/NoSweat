import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, Notice, cx } from "@/components/glass";
import { getAccount, requireAdmin } from "@/server/admin";
import { getAdminAuditStore, type AdminAuditEntry } from "@/server/admin/audit";
import { AdminPageHeader, linkClass, mobileCard, rowClass, td, th } from "../AdminUi";

export const metadata: Metadata = { title: "Audit log · Admin" };

// Registro das ações do admin (admin_audit_log, só acrescenta): as últimas 100, mais novas
// primeiro. Ninguém edita nem apaga pelo painel.

const LIMIT = 100;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const ACTION_LABELS: Record<string, string> = {
  "mfa.enroll": "Set up two-step verification",
  "mfa.verify": "Verified two-step code",
  "view_as.start": "Started view as",
  "view_as.stop": "Stopped view as",
  "site.access": "Opened a customer's website",
  "site.delete": "Deleted website",
  "site.unpublish": "Took website offline",
  "guest_drafts.delete": "Deleted guest drafts",
  "credits.adjust": "Adjusted AI credits",
  "access.grant": "Granted plan access",
  "access.revoke": "Removed plan access",
  "social.tester": "Changed Instagram tester",
  "account.login_disabled": "Disabled login",
  "account.login_enabled": "Re-enabled login",
  "account.delete": "Deleted account",
  "test_account.create": "Created test account",
  "expense.create": "Added expense",
  "expense.update": "Edited expense",
  "expense.delete": "Deleted expense",
  "prospects.status": "Changed prospect status",
  "prospects.export": "Exported prospects CSV",
  "model.create": "Created model",
  "model.delete": "Deleted/reset model",
  "model.status": "Changed model status",
};

/** Detalhes curtos para a tabela (sem o navegador, que só ocupa espaço). */
function details(entry: AdminAuditEntry): string {
  const parts = Object.entries(entry.metadata)
    .filter(([key, value]) => key !== "userAgent" && value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.length : String(value)}`);
  return parts.join(" · ").slice(0, 160);
}

function Target({ entry }: { entry: AdminAuditEntry }) {
  if (!entry.targetId)
    return <span className="text-(--glass-fg-muted)">{entry.targetType ?? "—"}</span>;
  if (entry.targetType === "user") {
    return (
      <Link href={`/admin/clients/${encodeURIComponent(entry.targetId)}`} className={linkClass}>
        <span className="font-mono text-xs break-all">{entry.targetId}</span>
      </Link>
    );
  }
  return (
    <span className="text-(--glass-fg-muted)">
      {entry.targetType}: <span className="font-mono text-xs break-all">{entry.targetId}</span>
    </span>
  );
}

async function load(): Promise<{ entries: AdminAuditEntry[]; emails: Map<string, string> } | null> {
  try {
    const entries = await getAdminAuditStore().listRecent(LIMIT);
    const adminIds = [...new Set(entries.map((entry) => entry.adminId))];
    const accounts = await Promise.all(adminIds.map((id) => getAccount(id).catch(() => null)));
    const emails = new Map<string, string>();
    accounts.forEach((account, index) => {
      const id = adminIds[index];
      if (id && account?.email) emails.set(id, account.email);
    });
    return { entries, emails };
  } catch (error) {
    console.error("[admin] could not load the audit log", error);
    return null;
  }
}

export default async function AdminAuditPage() {
  await connection();
  await requireAdmin();
  const data = await load();

  return (
    <div className="grid grid-cols-1 gap-6">
      <AdminPageHeader
        title="Audit log"
        count={data ? String(data.entries.length) : undefined}
        description={`Every sensitive admin action, newest first (last ${LIMIT}). Entries can't be edited or deleted. Times in UTC.`}
      />

      {!data ? (
        <Notice tone="error">We couldn&rsquo;t load the audit log. Reload the page.</Notice>
      ) : data.entries.length === 0 ? (
        <EmptyState title="Nothing yet" description="Admin actions show up here as they happen." />
      ) : (
        <>
          <section
            aria-labelledby="audit-heading"
            className="glass hidden overflow-x-auto rounded-2xl md:block"
          >
            <h2 id="audit-heading" className="sr-only">
              Admin actions
            </h2>
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Admin</th>
                  <th className={th}>Action</th>
                  <th className={th}>Target</th>
                  <th className={th}>Reason · details</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry.id} className={rowClass}>
                    <td className={cx(td, "whitespace-nowrap tabular-nums")}>
                      {dateFormat.format(new Date(entry.createdAt))}
                    </td>
                    <td className={cx(td, "break-all")}>
                      {data.emails.get(entry.adminId) ?? (
                        <span className="font-mono text-xs">{entry.adminId}</span>
                      )}
                    </td>
                    <td className={cx(td, "font-medium text-(--glass-fg)")}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td className={td}>
                      <Target entry={entry} />
                    </td>
                    <td className={cx(td, "max-w-[22rem]")}>
                      {entry.reason && <p className="text-(--glass-fg)">{entry.reason}</p>}
                      {details(entry) && (
                        <p className="text-xs text-(--glass-fg-muted)">{details(entry)}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <ul className="grid gap-3 md:hidden" aria-label="Admin actions">
            {data.entries.map((entry) => (
              <li key={entry.id} className={mobileCard}>
                <p className="font-medium text-(--glass-fg)">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </p>
                <p className="mt-1 text-[13px] text-(--glass-fg-muted) tabular-nums">
                  {dateFormat.format(new Date(entry.createdAt))} ·{" "}
                  {data.emails.get(entry.adminId) ?? entry.adminId}
                </p>
                <div className="mt-2 text-[13px]">
                  <Target entry={entry} />
                </div>
                {entry.reason && <p className="mt-2 text-[13px]">{entry.reason}</p>}
                {details(entry) && (
                  <p className="mt-1 text-xs text-(--glass-fg-muted)">{details(entry)}</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
