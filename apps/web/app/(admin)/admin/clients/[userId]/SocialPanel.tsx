import type { SocialPostStatus } from "@nosweat/schema";
import type { SocialAccountRecord, SocialSettingsRecord } from "@/server/social/types";
import { toggleSocialTester } from "./actions";

// Caixa do admin com o Instagram do cliente: só leitura (nunca mostra token nem botão de publicar).
// A única ação é liberar/cortar o "testador" (pode conectar enquanto o app da Meta está em teste).

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const STATUS_LABELS: Record<SocialPostStatus, string> = {
  draft: "Draft",
  approved: "Approved (manual)",
  scheduled: "Scheduled",
  publishing: "Publishing",
  needs_check: "Needs check",
  published: "Published",
  manual_published: "Posted manually",
  failed: "Failed",
  paused: "Paused",
  missed: "Missed",
  canceled: "Canceled",
};

export function SocialPanel({
  userId,
  account,
  settings,
  counts,
}: {
  userId: string;
  account: SocialAccountRecord | null;
  settings: SocialSettingsRecord;
  counts: Partial<Record<SocialPostStatus, number>>;
}) {
  const rows = (Object.keys(STATUS_LABELS) as SocialPostStatus[]).filter(
    (status) => (counts[status] ?? 0) > 0,
  );

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-display text-lg font-bold">Social (Instagram)</h2>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-[max-content_1fr]">
        <dt className="font-semibold">Account</dt>
        <dd>
          {account
            ? `@${account.username} · ${account.status}${account.accountType ? ` · ${account.accountType}` : ""}`
            : "not connected"}
        </dd>
        {account?.tokenExpiresAt && (
          <>
            <dt className="font-semibold">Access expires</dt>
            <dd>{dateFormat.format(new Date(account.tokenExpiresAt))}</dd>
          </>
        )}
        {account?.lastError && (
          <>
            <dt className="font-semibold">Last error</dt>
            <dd className="text-red-700">{account.lastError}</dd>
          </>
        )}
        <dt className="font-semibold">Time zone</dt>
        <dd>{settings.timezone}</dd>
        <dt className="font-semibold">Posts</dt>
        <dd>
          {rows.length === 0
            ? "none"
            : rows.map((status) => `${STATUS_LABELS[status]}: ${counts[status]}`).join(" · ")}
        </dd>
      </dl>

      <form
        action={toggleSocialTester.bind(null, userId)}
        className="mt-5 flex flex-wrap items-center gap-3"
      >
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {settings.tester ? "Remove Instagram tester" : "Make Instagram tester"}
        </button>
        <span className="text-xs text-slate-500">
          {settings.tester
            ? "Tester: can connect and auto-post while the Meta app is in testing."
            : "Not a tester. Add their Instagram as a tester in the Meta app too."}
        </span>
      </form>
    </section>
  );
}
