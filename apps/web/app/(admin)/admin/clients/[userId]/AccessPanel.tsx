import { isGrantActive, PLANS, type AccessGrant } from "@/server/billing";
import type { SubscriptionRecord } from "@/server/billing/store";
import { accessEmailConfigured } from "@/server/notify/access-email";
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
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-display text-lg font-bold">Access</h2>
      {!enforced && (
        <p className="mt-1 text-sm text-amber-800">
          Plans are off right now (no REQUIRE_PLAN or Stripe key), so everyone can publish.
        </p>
      )}

      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Manual access: </span>
          {grant
            ? `${PLANS[grant.plan].name} · ${active ? "until" : "expired on"} ${dateFormat.format(new Date(grant.expiresAt))}`
            : "none"}
        </p>
        <p>
          <span className="font-semibold">Card subscription (Stripe): </span>
          {subscription?.status
            ? `${subscription.plan ? PLANS[subscription.plan].name : "—"} · ${subscription.status}`
            : "none"}
        </p>
      </div>

      {history.length > 0 && (
        <details className="mt-3 text-sm text-slate-700" open={history.length <= 3}>
          <summary className="cursor-pointer font-semibold">
            Notes <span className="font-normal text-slate-500">· {history.length}</span>
          </summary>
          <ul className="mt-2 space-y-1 border-l-2 border-slate-100 pl-3 text-slate-600">
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
    </section>
  );
}
