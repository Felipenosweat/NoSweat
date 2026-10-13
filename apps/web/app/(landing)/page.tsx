import type { Metadata } from "next";
import Link from "next/link";
import { BuildSequence } from "@/components/landing/BuildSequence";
import { Features } from "@/components/landing/Features";
import { Gallery } from "@/components/landing/Gallery";
import { Hero } from "@/components/landing/Hero";
import { People } from "@/components/landing/People";
import { TradesBand } from "@/components/landing/TradesBand";
import { PlusIcon } from "@/components/marketing/icons";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PromptForm } from "@/components/marketing/PromptForm";
import { container } from "@/components/marketing/styles";

// Landing V5 (fundo escuro, movimento). Ordem das seções: hero com a parede de sites → faixa
// de ofícios → o site se montando com a rolagem → galeria horizontal → o que vem junto →
// fotos de quem atendemos → preço (painel claro) → dúvidas → CTA final.
// Só afirmações que o produto cumpre hoje. Nada de números, logos ou depoimentos inventados.

const TITLE = "No Sweat · Your business, online by lunch.";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade: services, phone button, contact form. Change it by asking, then publish. Plans from $39/month.";

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
    question: "How does it work?",
    answer:
      "You describe your business in a sentence or two. We choose one of five industry templates and write your headline, services and FAQ. You review it in a private preview, edit anything, then publish.",
  },
  {
    question: "Do I need technical experience?",
    answer:
      "No. If you can write a text message, you can do this. No code, no plugins, nothing to install.",
  },
  {
    question: "Can I customize my site?",
    answer:
      "Yes. Edit your business details, hero text, services, reviews you provide, and FAQ. Change colors, pick from ten font pairings, switch templates, and add, remove or reorder sections, all with a live preview.",
  },
  {
    question: "Can AI change my site for me?",
    answer:
      "Yes. Ask for changes in plain English — “add a deep-cleaning service,” “make it warmer” — and you get a new draft to review. Nothing goes live until you publish, and you can go back to an earlier version. Starter includes 30 AI edits a month, Pro 150 and Premium 500. AI edits reset monthly and don’t roll over.",
  },
  {
    question: "Can I add my own photos?",
    answer:
      "Yes, on Pro and Premium. Upload JPG, PNG or WebP photos and show them in a gallery on your site. Every site can also start with a hero photo picked for your industry from a stock library, credited to the photographer.",
  },
  {
    question: "What happens after I publish?",
    answer:
      "Your site goes live at nosweatfd.com/s/your-business or on your own domain. You get an email when someone sends a request through your contact form, and every request is saved in your dashboard. Keep editing anytime; changes stay in a draft until you publish again.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Starter is $39 a month, Pro $69 and Premium $129. Monthly Starter and Pro plans have a one-time $249 setup fee. Pay yearly and get 2 months free with no setup fee: $390, $690 or $1,290 a year. Creating an account and previewing your site are free; you pick a plan when you go live.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Yes. Plans renew automatically until you cancel, and you can cancel anytime in your account. You keep your plan until the end of the month or year you already paid for. For annual plans, we email you a reminder before each renewal. Nothing is charged today.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on Pro and Premium, if you already own one (from any domain registrar). On your site’s page we show the DNS records to add and verify the connection. Every plan can publish on a free nosweatfd.com/s/ address.",
  },
];

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TradesBand />
      <BuildSequence />
      <Gallery />
      <Features />
      <People />

      {/* PREÇO — painel claro sobre o fundo escuro (o mesmo componente da página /pricing). */}
      <section id="pricing" aria-labelledby="pricing-title" className="relative py-28 lg:py-36">
        <div className={container}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <h2
              id="pricing-title"
              data-l-reveal
              className="l-display text-[clamp(2.5rem,5.5vw,5rem)] text-white lg:col-span-7"
            >
              Build it free. <span className="l-serif l-gradient-text">Pay when it’s live.</span>
            </h2>
            <p
              data-l-reveal="0.1"
              className="text-lg leading-relaxed text-slate-300 lg:col-span-4 lg:col-start-9"
            >
              Create and preview your whole site without paying. Pick a plan when you’re ready to
              publish. Nothing is charged today.
            </p>
          </div>
          <div
            data-l-reveal
            className="mt-14 rounded-[2rem] bg-[#f8fafc] p-5 text-[#071b33] shadow-[0_60px_140px_-40px_rgb(0_102_255/.45)] sm:p-8 lg:p-12"
          >
            <PricingPlans />
          </div>
        </div>
      </section>

      {/* DÚVIDAS */}
      <section id="faq" aria-labelledby="faq-title" className="relative py-28 lg:py-36">
        <div className={`${container} grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8`}>
          <div className="lg:col-span-4">
            <h2
              id="faq-title"
              data-l-reveal
              className="l-display text-[clamp(2.5rem,5vw,4.25rem)] text-white"
            >
              Questions, <span className="l-serif l-gradient-text">answered.</span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-lg leading-relaxed text-slate-300">
              Real humans answer email. Write to{" "}
              <a
                href="mailto:hello@nosweatfd.com"
                className={`rounded-sm font-semibold text-white underline decoration-[#3d8bff] underline-offset-4 ${focus}`}
              >
                hello@nosweatfd.com
              </a>{" "}
              and a person on our team writes back.
            </p>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10 lg:col-span-8">
            {FAQS.map((faq) => (
              <details key={faq.question} className="ns-faq group">
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-6 text-lg font-semibold text-white transition-colors duration-150 hover:text-[#7fb2ff] lg:text-xl [&::-webkit-details-marker]:hidden ${focus}`}
                >
                  {faq.question}
                  <PlusIcon className="size-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" />
                </summary>
                <p className="max-w-[65ch] pr-10 pb-7 text-base leading-[1.7] text-pretty text-slate-300">
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
        className="l-grain relative isolate overflow-hidden py-32 lg:py-48"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[-40%] -z-10 mx-auto h-[80%] w-[90%] rounded-full bg-[radial-gradient(closest-side,rgb(0_102_255/.55),rgb(0_194_255/.15)_60%,transparent)] blur-3xl"
        />
        <div className={`${container} text-center`}>
          <h2
            id="final-title"
            data-l-reveal
            className="l-display mx-auto max-w-[12ch] text-[clamp(3rem,9vw,8.5rem)] text-white"
          >
            Stop sweating <span className="l-serif l-gradient-text">the website.</span>
          </h2>
          <p data-l-reveal="0.1" className="mx-auto mt-6 max-w-[40ch] text-lg text-slate-300">
            See your site before you spend a dollar.
          </p>
          <div data-l-reveal="0.2" className="mx-auto mt-10 max-w-[34rem] text-left">
            <PromptForm
              tone="dark"
              examples={false}
              caption="Free account. Create and preview free."
            />
          </div>
          <p className="mt-10 text-sm text-slate-400">
            Prefer to look around first?{" "}
            <Link
              href="/pricing"
              className={`rounded-sm font-semibold text-white underline underline-offset-4 ${focus}`}
            >
              See pricing
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
