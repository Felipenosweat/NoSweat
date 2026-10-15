import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIncluded } from "@/components/landing/AlsoIncluded";
import { Hero } from "@/components/landing/Hero";
import { Story } from "@/components/landing/story/Story";
import { PlusIcon } from "@/components/marketing/icons";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PromptForm } from "@/components/marketing/PromptForm";
import { container, focusRing } from "@/components/marketing/styles";

// Landing V6 (aprovada pelo fundador): hero → tour em seis cenas sobre ink (#story, uma só
// história: a Sparkle & Co. Cleaning, fictícia) → a faixa que "acende" → o que vem junto →
// preço → dúvidas → CTA final, no claro.
// Só afirmações que o produto cumpre hoje. Nada de números, logos ou depoimentos inventados.

const TITLE = "No Sweat · Your business, online by lunch.";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. Plans from $39/month.";

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "No Sweat",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQS = [
  {
    question: "How much does it cost?",
    answer:
      "Starter is $39 a month, Pro $69 and Premium $129. Monthly Starter and Pro plans have a one-time $249 setup fee. Pay yearly and get 2 months free with no setup fee: $390, $690 or $1,290 a year. Creating an account and previewing your site are free; you pick a plan when you go live.",
  },
  {
    question: "Do I need technical experience?",
    answer:
      "No. If you can write a text message, you can do this. No code, no plugins, nothing to install.",
  },
  {
    question: "Can I customize my site?",
    answer:
      "Yes. Edit your business details, hero text, services, reviews you provide, and FAQ. Change colors, pick from ten font pairings, switch between five page layouts, and add, remove or reorder sections, all with a live preview.",
  },
  {
    question: "Can AI change my site for me?",
    answer:
      "Yes. Ask for changes in plain English — “add a deep-cleaning service,” “make it warmer” — and you get a new draft to review. Nothing goes live until you publish, and you can go back to an earlier version. AI edits are included in every plan.",
  },
  {
    question: "Can I add my own photos?",
    answer:
      "Yes, on every plan. Upload JPG, PNG or WebP photos and show them in a gallery on your site. Every site can also start with a hero photo picked for your industry from a stock library, credited to the photographer.",
  },
  {
    question: "What happens after I publish?",
    answer:
      "Your site goes live at nosweatfd.com/s/your-business or on your own domain. You get an email when someone sends a request through your contact form, and every request is saved in your dashboard and added to your Clients list. Keep editing anytime; changes stay in a draft until you publish again.",
  },
  {
    question: "What is the Clients area?",
    answer:
      "A simple list of the people who contact you. Every request from your website’s contact form becomes a client automatically. Move each one from New to Contacted, Quoted, then Won or Lost, add notes and follow-up dates, log the jobs you did and what they paid, and tap to call, text or email them.",
  },
  {
    question: "Can it post to Instagram for me?",
    answer:
      "Yes, with your approval. Connect a professional Instagram account and AI drafts a month of posts from your website. You review and approve each one, and approved posts go out on schedule. Nothing is posted without your approval.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Yes. Plans renew automatically until you cancel, and you can cancel anytime in your account. You keep your plan until the end of the month or year you already paid for. For annual plans, we email you a reminder before each renewal.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on Pro and Premium, if you already own one (from any domain registrar). On your site’s page we show the DNS records to add and verify the connection. Every plan can publish on a free nosweatfd.com/s/ address.",
  },
];

const h2Light =
  "font-display text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.04] font-bold tracking-[-0.03em] text-balance text-ink";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Story />

      {/* A faixa "acende" com a rolagem (ink → surface; ScrollStage escreve --l e data-lit). */}
      <div data-lights className="st-lights grid h-[60svh] place-items-center px-5">
        <p className="text-center font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.1] font-bold tracking-[-0.025em]">
          That’s the whole morning.
        </p>
      </div>

      <AlsoIncluded />

      {/* PREÇO — o mesmo componente da página /pricing, num painel branco. */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="border-t border-slate-200 bg-surface py-20 lg:py-28"
      >
        <div className={container}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <h2 id="pricing-title" className={`${h2Light} lg:col-span-7`}>
              Build it free. <span className="text-slate-500">Pay when it’s live.</span>
            </h2>
            <p className="max-w-[44ch] text-lg leading-relaxed text-pretty text-slate-600 lg:col-span-4 lg:col-start-9">
              Create and preview your whole site without paying. You only pay when you pick a plan
              to publish.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8 lg:mt-14 lg:p-10">
            <PricingPlans />
          </div>
        </div>
      </section>

      {/* DÚVIDAS */}
      <section id="faq" aria-labelledby="faq-title" className="bg-white py-20 lg:py-28">
        <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8`}>
          <div className="lg:col-span-4">
            <h2 id="faq-title" className={h2Light}>
              Questions, <span className="text-slate-500">answered.</span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-lg leading-relaxed text-slate-600">
              Real humans answer email. Write to{" "}
              <a
                href="mailto:hello@nosweatfd.com"
                className={`rounded-sm font-semibold text-ink underline decoration-brand underline-offset-4 hover:text-brand ${focusRing}`}
              >
                hello@nosweatfd.com
              </a>{" "}
              and a person on our team writes back.
            </p>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-8">
            {FAQS.map((faq) => (
              <details key={faq.question} className="ns-faq group">
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-5 text-lg font-semibold text-ink transition-colors duration-150 hover:text-brand lg:py-6 lg:text-xl [&::-webkit-details-marker]:hidden ${focusRing}`}
                >
                  {faq.question}
                  <PlusIcon className="size-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" />
                </summary>
                <p className="max-w-[65ch] pr-10 pb-7 text-base leading-[1.7] text-pretty text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        aria-labelledby="final-title"
        data-hide-mobile-cta
        className="border-t border-slate-200 bg-white py-20 lg:py-32"
      >
        <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end`}>
          <div className="lg:col-span-6">
            <h2 id="final-title" className={`${h2Light} max-w-[14ch] lg:text-[4rem]`}>
              Stop sweating <span className="text-slate-500">the website.</span>
            </h2>
            <p className="mt-5 max-w-[40ch] text-lg text-slate-600">
              See your site before you spend a dollar.
            </p>
          </div>
          <div className="lg:col-span-6">
            <PromptForm
              tone="light"
              examples={false}
              caption="Free account. Create and preview free."
            />
            <p className="mt-6 text-sm text-slate-600">
              Prefer to look around first?{" "}
              <Link
                href="/pricing"
                className={`rounded-sm font-semibold text-ink underline decoration-brand underline-offset-4 hover:text-brand ${focusRing}`}
              >
                See pricing
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
