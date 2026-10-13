import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { panelClass, panelText, panelTitle, textButton } from "@/components/DashboardUi";
import { getCurrentUser } from "@/server/auth/session";
import { getBillingStatus, PLANS } from "@/server/billing";
import { BillingPlans, type PlanCard, type SalesContact } from "./BillingPlans";

export const metadata: Metadata = { title: "Plans and billing", robots: { index: false } };

type BillingPageProps = { searchParams: Promise<{ status?: string; site?: string }> };

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 ? 2 : 0 })}`;

export default async function BillingPage({ searchParams }: BillingPageProps) {
  await connection();
  const { status, site } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/billing")}`);
  const billing = await getBillingStatus(user);
  // Só ids no formato esperado voltam para a página do site (nada de texto solto na URL).
  const siteId = site && /^[\w-]{1,64}$/.test(site) ? site : null;

  // Número do WhatsApp de vendas só com dígitos (ex.: 14075551234), como o wa.me pede.
  const whatsapp = process.env.SALES_WHATSAPP?.replace(/\D/g, "") || null;
  const contact: SalesContact = {
    whatsapp,
    email: process.env.SALES_EMAIL || "hello@nosweatfd.com",
    accountEmail: user.email,
  };

  const plans: PlanCard[] = Object.values(PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    monthly: usd(plan.monthlyCents),
    annual: usd(plan.annualCents),
    setup: plan.setupCents ? usd(plan.setupCents) : null,
    customDomain: plan.customDomain,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-ink">
        Plans and billing
      </h1>
      <p className={`mt-2 max-w-[60ch] ${panelText}`}>
        Building and previewing is free. A plan puts your website live and keeps it there.
      </p>

      {status === "success" && (
        <p role="status" className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
          Payment received. It can take a few seconds to show here.
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
        <p role="status" className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-slate-700">
          No payment was made. You can pick a plan whenever you&rsquo;re ready.
        </p>
      )}

      {!billing.enabled ? (
        <section className={`${panelClass} mt-8`}>
          <h2 className={panelTitle}>Publishing is free for now</h2>
          <p className={`mt-1 ${panelText}`}>
            Paid plans aren&rsquo;t live yet, so nothing is charged. You can publish your website
            and connect your domain today.
          </p>
          <Link href="/dashboard" className={`${textButton} mt-3`}>
            Back to my sites
          </Link>
        </section>
      ) : (
        <BillingPlans plans={plans} current={billing} siteId={siteId} contact={contact} />
      )}
    </div>
  );
}
