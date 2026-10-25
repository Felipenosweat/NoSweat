import { GlassBadge, GlassCard } from "@/components/glass";
import { isGrantActive, PLANS, type AccessGrant } from "@/server/billing";
import type { SubscriptionRecord } from "@/server/billing/store";
import { accessEmailConfigured } from "@/server/notify/access-email";
import { Notice, labelClass, panelText, panelTitle } from "../../AdminUi";
import { grantAccess, revokeAccess } from "./actions";
import { GrantAccessForm } from "./GrantAccessForm";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/** As notas ficam num campo só, a mais nova primeiro ("2026-10-13: Pix $69 | 2026-09-10: ..."). */
function noteHistory(note: string | null): string[] {
  if (!note) return [];
  return note
    .split(" | ")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Caixa do admin para liberar o plano do cliente por X dias (pagamento por Pix/WhatsApp). */
export function AccessPanel({
  userId,
  grant,
  subscription,
  enforced,
}: {
  userId: string;
  grant: AccessGrant | null;
  subscription: SubscriptionRecord | null;
  enforced: boolean;
}) {
  const active = isGrantActive(grant);
  const history = noteHistory(grant?.note ?? null);

  return (
    <GlassCard as="section" aria-labelledby="access-heading">
      <h2 id="access-heading" className={panelTitle}>
        Plan access
      </h2>
      <p className={`mt-1 ${panelText}`}>
        Give a plan for a number of days when a client pays by Pix or WhatsApp.
      </p>
      {!enforced && (
        <Notice tone="warning" className="mt-3">
          Plans are off right now (no REQUIRE_PLAN or Stripe key), so everyone can publish.
        </Notice>
      )}

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="glass glass-flat rounded-xl px-4 py-3">
          <dt className={labelClass}>Manual access</dt>
          <dd className="mt-1.5 flex flex-wrap items-center gap-2 text-[15px] text-(--glass-fg)">
            {grant ? (
              <>
                <GlassBadge tone={active ? "live" : "neutral"} size="sm">
                  {PLANS[grant.plan].name}
                </GlassBadge>
                {active ? "until" : "expired on"} {dateFormat.format(new Date(grant.expiresAt))}
              </>
            ) : (
              "None"
            )}
          </dd>
        </div>
        <div className="glass glass-flat rounded-xl px-4 py-3">
          <dt className={labelClass}>Card subscription (Stripe)</dt>
          <dd className="mt-1.5 text-[15px] text-(--glass-fg)">
            {subscription?.status
              ? `${subscription.plan ? PLANS[subscription.plan].name : "—"} · ${subscription.status}`
              : "None"}
          </dd>
        </div>
      </dl>

      {history.length > 0 && (
        <details className="group mt-4 text-sm" open={history.length <= 3}>
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg font-semibold text-(--glass-fg) sm:min-h-9">
            Notes{" "}
            <span className="font-normal text-(--glass-fg-muted) tabular-nums">
              · {history.length}
            </span>
          </summary>
          <ul className="mt-1 space-y-1 border-l-2 border-(--glass-rim) pl-3 text-(--glass-fg-muted)">
            {history.map((entry, index) => (
              <li key={`${index}-${entry}`} className="break-words">
                {entry}
              </li>
            ))}
          </ul>
        </details>
      )}

      <GrantAccessForm
        grantAction={grantAccess.bind(null, userId)}
        revokeAction={revokeAccess.bind(null, userId)}
        active={active}
        grantPlan={grant?.plan ?? null}
        grantExpiresAt={grant?.expiresAt ?? null}
        plans={Object.values(PLANS).map((plan) => ({ id: plan.id, name: plan.name }))}
        enforced={enforced}
        emailOn={accessEmailConfigured()}
      />
    </GlassCard>
  );
}
