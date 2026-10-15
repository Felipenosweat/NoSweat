import { LANDING_FAQS, PRICING_FAQS } from "@/components/marketing/faqs";
import { siteUrl } from "@/lib/site";
import { PLANS } from "@/server/billing/plans";

// Texto do /llms.txt (ver app/llms.txt/route.ts). Resumo da No Sweat em Markdown para assistentes
// de IA, montado das mesmas fontes do site (perguntas frequentes e preços cobrados).

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;

export function llmsText(): string {
  const plans = Object.values(PLANS).map((plan) => {
    const setup = plan.setupCents
      ? `, plus a one-time ${money(plan.setupCents)} setup fee on monthly billing`
      : "";
    const domain = plan.customDomain
      ? "includes connecting your own domain"
      : "free nosweatfd.com address";
    return `- ${plan.name}: ${money(plan.monthlyCents)}/month${setup}, or ${money(plan.annualCents)}/year with no setup fee; ${domain}.`;
  });

  const faqs = [...LANDING_FAQS, ...PRICING_FAQS]
    .filter((faq, i, all) => all.findIndex((f) => f.question === faq.question) === i)
    .map((faq) => `### ${faq.question}\n\n${faq.answer}`);

  return [
    "# No Sweat",
    "",
    "> No Sweat (nosweatfd.com) is an AI website builder for small local businesses in the United States, such as plumbers, house cleaners, hair salons, restaurants and other service businesses. The owner describes the business in a sentence or two and gets a complete website: their services, a tap-to-call button, a contact form, an FAQ and basic search setup. They edit it themselves or ask the AI for changes in plain English, then publish on a free nosweatfd.com address or their own domain.",
    "",
    "Key facts:",
    "",
    "- Creating and previewing a website is free and needs no credit card; a plan is needed to publish.",
    "- Each site gets its own page layout chosen for the business, not one fixed template.",
    "- Contact-form requests arrive by email and are saved in the owner's dashboard.",
    "- AI changes are saved as drafts; nothing goes live until the owner publishes.",
    "- Sites only show facts the owner provided (no invented reviews, ratings or claims).",
    "",
    "## Pricing",
    "",
    ...plans,
    "",
    "## Pages",
    "",
    `- [Home](${siteUrl()}): how it works, examples, features and FAQ`,
    `- [Pricing](${siteUrl("/pricing")}): plans, billing and cancellation`,
    `- [Terms of Service](${siteUrl("/terms")})`,
    `- [Privacy Policy](${siteUrl("/privacy")})`,
    "",
    "## Frequently asked questions",
    "",
    ...faqs.flatMap((faq) => [faq, ""]),
    "## Contact",
    "",
    "Email hello@nosweatfd.com. A person on the team writes back.",
    "",
  ].join("\n");
}
