import type { SocialPostStatus } from "@nosweat/schema";
import {
  StatusBadge,
  cardClass,
  panelClass,
  panelText,
  panelTitle,
} from "@/components/DashboardUi";
import { LocalTime } from "@/components/LocalTime";
import { getSocialStore } from "@/server/social/store";
import type {
  SocialAccountRecord,
  SocialPostRecord,
  SocialSettingsRecord,
} from "@/server/social/types";

// /social no modo "ver como" do admin: o calendário normal busca os dados pela API com a conta
// logada (seria a do admin). Aqui o servidor lê os dados da conta vista e mostra só a lista,
// sem botões (o proxy.ts bloqueia qualquer escrita enquanto o modo estiver ligado).

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CAPTION = 160;

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

type Tone = "live" | "draft" | "pending" | "info" | "neutral";

const STATUS_TONES: Record<SocialPostStatus, Tone> = {
  draft: "draft",
  approved: "info",
  scheduled: "info",
  publishing: "info",
  needs_check: "pending",
  published: "live",
  manual_published: "live",
  failed: "pending",
  paused: "pending",
  missed: "pending",
  canceled: "neutral",
};

export type ReadOnlySocialData = {
  account: SocialAccountRecord | null;
  settings: SocialSettingsRecord;
  posts: SocialPostRecord[];
};

/** Conta, preferências e posts de 30 dias atrás a 60 à frente. `null` = erro ao ler. */
export async function loadReadOnlySocial(ownerId: string): Promise<ReadOnlySocialData | null> {
  const now = Date.now();
  try {
    const social = getSocialStore();
    const [account, settings, posts] = await Promise.all([
      social.getAccountForOwner(ownerId, "instagram"),
      social.getSettings(ownerId),
      social.listPosts(
        ownerId,
        new Date(now - 30 * DAY_MS).toISOString(),
        new Date(now + 60 * DAY_MS).toISOString(),
      ),
    ]);
    return { account, settings, posts };
  } catch (error) {
    console.error("[view-as] could not load social data", error);
    return null;
  }
}

function caption(post: SocialPostRecord): string {
  const text = post.caption.trim().replace(/\s+/g, " ");
  if (!text) return "No caption yet";
  return text.length > MAX_CAPTION ? `${text.slice(0, MAX_CAPTION - 1)}…` : text;
}

export function ReadOnlySocial({ data }: { data: ReadOnlySocialData | null }) {
  if (!data) {
    return (
      <p
        role="alert"
        className="glass-edge mt-8 rounded-2xl bg-red-50/85 px-4 py-3 text-[15px] text-red-700"
      >
        We couldn&rsquo;t load this account&rsquo;s posts. Please refresh the page.
      </p>
    );
  }
  const { account, settings, posts } = data;

  return (
    <div className="mt-8 grid gap-6">
      <section aria-labelledby="ro-account" className={panelClass}>
        <h2 id="ro-account" className={panelTitle}>
          Instagram
        </h2>
        <p className={`mt-1 ${panelText}`}>
          {account
            ? `@${account.username} · ${account.status === "active" ? "connected" : account.status.replace(/_/g, " ")}`
            : "Not connected."}{" "}
          Time zone: {settings.timezone}.
        </p>
      </section>

      <section aria-labelledby="ro-posts">
        <h2 id="ro-posts" className={panelTitle}>
          Posts · last 30 days and next 60 days
        </h2>
        {posts.length === 0 ? (
          <p className={`mt-3 px-4 py-6 text-[15px] text-slate-600 sm:px-5 ${cardClass}`}>
            No posts in this period.
          </p>
        ) : (
          <ul className={`mt-3 divide-y divide-(--glass-rim) overflow-hidden ${cardClass}`}>
            {posts.map((post) => (
              <li key={post.id} className="flex flex-col gap-1.5 px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] text-slate-500 tabular-nums">
                    {post.scheduledAt ? <LocalTime iso={post.scheduledAt} /> : "No date yet"}
                    {post.media.length > 0 &&
                      ` · ${post.media.length} ${post.media.length === 1 ? "photo" : "photos"}`}
                  </span>
                  <StatusBadge tone={STATUS_TONES[post.status]}>
                    {STATUS_LABELS[post.status]}
                  </StatusBadge>
                </div>
                <p className="text-[15px] leading-6 break-words text-ink">{caption(post)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
