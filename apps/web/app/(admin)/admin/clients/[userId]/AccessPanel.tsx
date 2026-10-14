import { isGrantActive, PLANS, type AccessGrant } from "@/server/billing";
import type { SubscriptionRecord } from "@/server/billing/store";
import { grantAccess, revokeAccess } from "./actions";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

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
  const field =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

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
          {grant?.note ? ` · ${grant.note}` : ""}
        </p>
        <p>
          <span className="font-semibold">Card subscription (Stripe): </span>
          {subscription?.status
            ? `${subscription.plan ? PLANS[subscription.plan].name : "—"} · ${subscription.status}`
            : "none"}
        </p>
      </div>

      <form action={grantAccess.bind(null, userId)} className="mt-5 grid gap-4 sm:grid-cols-4">
        <label className="text-sm font-medium text-slate-700">
          Plan
          <select name="plan" defaultValue={grant?.plan ?? "pro"} className={field}>
            {Object.values(PLANS).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Days
          <input
            name="days"
            type="number"
            min={1}
            max={3660}
            defaultValue={30}
            required
            className={field}
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Note (optional)
          <input
            name="note"
            maxLength={200}
            placeholder="e.g. Pix received Oct 13, $69"
            className={field}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {active ? "Add days" : "Grant access"}
          </button>
          <span className="text-xs text-slate-500">
            {active
              ? "Days are added after the current end date."
              : "Access starts now. Their website goes live as soon as they publish."}
          </span>
        </div>
      </form>

      {grant && (
        <form action={revokeAccess.bind(null, userId)} className="mt-4">
          <button type="submit" className="text-sm font-semibold text-red-700 hover:underline">
            Remove manual access now
          </button>
        </form>
      )}
    </section>
  );
}
