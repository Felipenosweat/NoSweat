import type { SocialPostStatus } from "@nosweat/schema";
import type { ReactNode } from "react";
import { GlassBadge, GlassButton, GlassCard } from "@/components/glass";
import type { SocialAccountRecord, SocialSettingsRecord } from "@/server/social/types";
import { labelClass, panelTitle } from "../../AdminUi";
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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 border-t border-(--glass-rim) py-2.5 first:border-t-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className={labelClass}>{label}</dt>
      <dd className="text-[15px] break-words text-(--glass-fg)">{children}</dd>
    </div>
  );
}

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
    <GlassCard as="section" aria-labelledby="social-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="social-heading" className={panelTitle}>
          Social (Instagram)
        </h2>
        <GlassBadge tone={settings.tester ? "info" : "neutral"}>
          {settings.tester ? "Instagram tester" : "Not a tester"}
        </GlassBadge>
      </div>

      <dl className="mt-3">
        <Row label="Account">
          {account
            ? `@${account.username} · ${account.status}${account.accountType ? ` · ${account.accountType}` : ""}`
            : "Not connected"}
        </Row>
        {account?.tokenExpiresAt && (
          <Row label="Access expires">{dateFormat.format(new Date(account.tokenExpiresAt))}</Row>
        )}
        {account?.lastError && (
          <Row label="Last error">
            <span className="text-red-700">{account.lastError}</span>
          </Row>
        )}
        <Row label="Time zone">{settings.timezone}</Row>
        <Row label="Posts">
          {rows.length === 0
            ? "None"
            : rows.map((status) => `${STATUS_LABELS[status]}: ${counts[status]}`).join(" · ")}
        </Row>
      </dl>

      <form
        action={toggleSocialTester.bind(null, userId)}
        className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-(--glass-rim) pt-4"
      >
        <GlassButton type="submit" variant="secondary">
          {settings.tester ? "Remove Instagram tester" : "Make Instagram tester"}
        </GlassButton>
        <span className="min-w-0 flex-1 basis-56 text-[13px] text-(--glass-fg-muted)">
          {settings.tester
            ? "Can connect and auto-post while the Meta app is in testing."
            : "Add their Instagram as a tester in the Meta app too."}
        </span>
      </form>
    </GlassCard>
  );
}
