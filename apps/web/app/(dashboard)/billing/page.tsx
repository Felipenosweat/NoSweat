import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  IconTile,
  PageHeader,
  panelClass,
  panelText,
  panelTitle,
  textButton,
} from "@/components/DashboardUi";
import { getViewer } from "@/server/auth/viewer";
import {
  getBillingStatus,
  getGrantStore,
  getStripeConfig,
  isGrantActive,
  PLANS,
  syncCheckoutSession,
  type AccessGrant,
} from "@/server/billing";
import { getOwnedSite } from "@/server/sites";
import { BillingIcon } from "../NavIcons";
import { BillingPlans, type EndedPlan, type PlanCard, type SalesContact } from "./BillingPlans";

export const metadata: Metadata = { title: "Plans and billing", robots: { index: false } };

type BillingPageProps = {
  searchParams: Promise<{ status?: string; site?: string; session_id?: string; reason?: string }>;
};

/** Plano manual que já acabou (`null` se não há acesso manual ou se ele ainda vale). */
function endedPlan(grant: AccessGrant | null): EndedPlan | null {
  if (!grant) return null;
  // Lido antes do `isGrantActive` (type guard: no "não", o tipo de `grant` vira `never`).
  const ended = { name: PLANS[grant.plan].name, endedOn: grant.expiresAt };
  return isGrantActive(grant) ? null : ended;
}

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 ? 2 : 0 })}`;

export default async function BillingPage({ searchParams }: BillingPageProps) {
  await connection();
  const { status, site, session_id: sessionId, reason } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent("/billing")}`);
  // No modo "ver como" do admin, o plano da conta vista (comprar fica bloqueado pelo proxy.ts).
  const user = viewer.viewingAs ?? viewer.user;
  // Voltou do Stripe: confirma o pagamento agora (o webhook pode demorar alguns segundos). Assim o
  // plano já aparece e ninguém clica em "Choose" de novo e paga duas vezes.
  const stripe = getStripeConfig();
  if (
    status === "success" &&
    sessionId &&
    /^cs_\w{1,200}$/.test(sessionId) &&
    stripe &&
    !viewer.viewingAs
  ) {
    await syncCheckoutSession(stripe, viewer.user, sessionId).catch((error: unknown) => {
      console.error("[billing] could not confirm the checkout session", error);
    });
  }
  const billing = await getBillingStatus(user);
  // Só ids no formato esperado voltam para a página do site (nada de texto solto na URL).
  const siteId = site && /^[\w-]{1,64}$/.test(site) ? site : null;

  // Veio do botão Publicar sem plano: diz qual site vai ao ar (só o nome; o site é dele ou 404).
  const pendingSite =
    billing.enabled && !billing.active && siteId
      ? await getOwnedSite(user, siteId).catch(() => null)
      : null;
  // Plano manual que acabou: a página explica que o site saiu do ar e mostra como renovar.
  const ended = endedPlan(
    billing.enabled && !billing.active ? await getGrantStore().get(user.id) : null,
  );
  // Chegou ao limite de sites no ar do plano (402 plan_limit no Publicar).
  const planLimit =
    reason === "plan_limit" && billing.active && billing.plan
      ? PLANS[billing.plan].publishedSitesLimit
      : null;

  // Número do WhatsApp de vendas só com dígitos (ex.: 14075551234), como o wa.me pede.
  const whatsapp = process.env.SALES_WHATSAPP?.replace(/\D/g, "") || null;
  const contact: SalesContact = {
    whatsapp,
    email: process.env.SALES_EMAIL || "hello@nosweatfd.com",
    accountEmail: user.email,
    accountId: user.id,
  };

  const plans: PlanCard[] = Object.values(PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    monthly: usd(plan.monthlyCents),
    annual: usd(plan.annualCents),
    setup: plan.setupCents ? usd(plan.setupCents) : null,
    customDomain: plan.customDomain,
    publishedSitesLimit: plan.publishedSitesLimit,
  }));

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Plans and billing"
        description="Building and previewing is free. A plan puts your website live and keeps it there."
      />

      {status === "success" && (
        <p role="status" className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
          {billing.active
            ? "Payment received. Your plan is active."
            : "Payment received. It can take a few seconds to show here."}
          {siteId && (
            <>
              {" "}
              <Link href={`/sites/${siteId}`} className="font-semibold underline">
                Go publish your website →
              </Link>
            </>
          )}
        </p>
      )}
      {status === "cancelled" && (
        <p role="status" className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-slate-700">
          No payment was made. You can pick a plan whenever you&rsquo;re ready.
        </p>
      )}

      {pendingSite && (
        <p role="status" className="mt-6 rounded-xl bg-sky-50 px-4 py-3 text-sky-950">
          Pick a plan to put{" "}
          <strong className="font-semibold">{pendingSite.spec.business.name}</strong> live. Your
          draft is saved; building and previewing stay free.
        </p>
      )}
      {planLimit !== null && (
        <p role="status" className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-amber-950">
          Your plan allows {planLimit} live {planLimit === 1 ? "website" : "websites"}. Switch
          plans, or take one site offline.
        </p>
      )}

      {!billing.enabled ? (
        <section className={`${panelClass} mt-8 flex items-start gap-4`}>
          <IconTile tone="emerald">
            <BillingIcon className="size-[18px]" />
          </IconTile>
          <div className="min-w-0">
            <h2 className={panelTitle}>Publishing is free for now</h2>
            <p className={`mt-1 ${panelText}`}>
              Paid plans aren&rsquo;t live yet, so nothing is charged. You can publish your website
              and connect your domain today.
            </p>
            <Link href="/dashboard" className={`${textButton} mt-2 -ml-1`}>
              Back to my sites
            </Link>
          </div>
        </section>
      ) : (
        <BillingPlans
          plans={plans}
          current={billing}
          siteId={siteId}
          contact={contact}
          ended={ended}
        />
      )}
    </div>
  );
}
