import type { Metadata } from "next";
import { contactHref, type SalesContact } from "@/lib/sales-contact";
import { aiEnabled } from "@/server/ai";
import { getCurrentUser } from "@/server/auth/session";
import { checkoutReady } from "@/server/billing";
import { offerAt, PLANS, promoActive, promoPercentOff } from "@/server/billing/plans";
import { creditCost, getBalance, monthlyAllowance } from "@/server/credits";
import { RememberPlan } from "@/components/RememberPlan";
import { landingName } from "./brief";
import { CreateFlow, type CreateCredits } from "./CreateFlow";
import type { LaunchOffer } from "./PlansPopup";

export const metadata: Metadata = { title: "Create your website" };

type CreatePageProps = {
  searchParams: Promise<{
    brief?: string | string[];
    name?: string | string[];
    start?: string | string[];
    plan?: string | string[];
  }>;
};

/**
 * Custo de criar um site e o saldo, para avisar antes de criar. Só contas com créditos e com a IA
 * ligada (sem IA o site sai de modelo, sem cobrança). Admin (sem limite) ou erro: sem aviso.
 */
async function createCredits(userId: string): Promise<CreateCredits | null> {
  if (!aiEnabled()) return null;
  try {
    const balance = await getBalance({ id: userId });
    if (balance.unlimited) return null;
    return { cost: creditCost("generate"), left: balance.total };
  } catch (error) {
    console.error("[credits] could not read the balance for /create", error);
    return null;
  }
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const dollars = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;

/** Planos do pop-up "pick a plan" e, enquanto vale, a oferta de lançamento (nome e preço normal). */
function launchOffer(contact: SalesContact | null): LaunchOffer {
  const promo = promoActive();
  return {
    name: promo ? offerAt().name : null,
    bonusCredits: offerAt().bonusCredits,
    checkout: checkoutReady(),
    plans: Object.values(PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: dollars(plan.monthlyCents),
      // Preço riscado só onde há desconto de verdade (hoje, só o Starter).
      regular: promo && promoPercentOff(plan) > 0 ? dollars(plan.regularMonthlyCents) : null,
      percentOff: promo && promoPercentOff(plan) > 0 ? promoPercentOff(plan) : null,
      features: [
        plan.publishedSitesLimit === 1
          ? "1 live website"
          : `${plan.publishedSitesLimit} live websites`,
        `${monthlyAllowance(plan.id).toLocaleString("en-US")} AI credits a month`,
        `${plan.socialPostsPerMonth} Instagram posts a month`,
        "Bookings, clients and your own domain",
        ...(plan.features.aiAssistant ? ["AI assistant that answers your customers 24/7"] : []),
        ...(plan.features.freeDomain ? ["Free .com domain for the first year"] : []),
        ...(plan.features.autoReviewRequests && !plan.features.aiAssistant
          ? ["Google review requests sent for you"]
          : []),
      ],
      recommended: plan.id === "premium",
      contactHref: contact
        ? contactHref(contact, `Hi! I'd like the ${plan.name} plan (monthly) for my website.`)
        : null,
    })),
  };
}

// A landing manda o visitante para /create?brief=…&name=…&start=1 (o mesmo texto e o nome
// também ficam no sessionStorage `ns-brief`/`ns-brief-name`, lidos no cliente quando não há
// parâmetro). O nome vai à parte: é o nome do site, seja qual for o gerador. Com `start=1` o
// site começa a ser montado na hora, com layout e cores escolhidos pela No Sweat (um clique só).
// `plan` (botões da /pricing): guardado num cookie para o /billing destacar o plano escolhido.
export default async function CreatePage({ searchParams }: CreatePageProps) {
  const { brief, name, start, plan } = await searchParams;
  const initialBrief = first(brief)?.trim().slice(0, 2000) ?? "";
  const initialName = landingName(first(name));
  // Visitante ou conta: muda a mensagem do limite diário e o aviso do rascunho no fim.
  const user = await getCurrentUser();
  const autoStart = first(start) === "1";
  return (
    <>
      <RememberPlan plan={first(plan)} />
      <CreateFlow
        initialBrief={initialBrief}
        initialName={initialName}
        signedIn={Boolean(user)}
        autoStart={autoStart}
        credits={user ? await createCredits(user.id) : null}
        offer={launchOffer(
          user
            ? {
                whatsapp: process.env.SALES_WHATSAPP?.replace(/\D/g, "") || null,
                email: process.env.SALES_EMAIL || "hello@nosweatfd.com",
                accountEmail: user.email,
                accountId: user.id,
              }
            : null,
        )}
      />
    </>
  );
}
