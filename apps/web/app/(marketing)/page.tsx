import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { BrowserFrame } from "@/components/marketing/BrowserFrame";
import {
  ArrowRightIcon,
  ChatIcon,
  CheckIcon,
  DeviceMobileIcon,
  EnvelopeIcon,
  GlobeIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
} from "@/components/marketing/icons";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { ScaledFrame } from "@/components/marketing/ScaledFrame";
import { SectionIndex } from "@/components/marketing/SectionIndex";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import { container, primaryButton, secondaryButton, textLink } from "@/components/marketing/styles";

const TITLE = "No Sweat · Your business website, built from one sentence";
const DESCRIPTION =
  "Describe your business in plain English and get a website made for your industry: headline, services, FAQ, colors and fonts. Edit it or ask AI for changes, then publish. Plans from $39/month.";

// Sem imagem de divulgação própria ainda: usa a marca (PNG quadrado) e o cartão "summary".
const SHARE_IMAGE = {
  url: "/brand/nosweat-mark-256.png",
  width: 256,
  height: 256,
  alt: "No Sweat logo",
};

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
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: [SHARE_IMAGE],
  },
};

// Só afirmações que o produto cumpre hoje (lista verificada em .design-shots/saas-context.md).
// Nada de números, logos ou depoimentos inventados (regra da FTC sobre avaliações falsas).
// Todo exemplo é um negócio fictício e aparece rotulado como tal.

// Texto real de um dos chips de exemplo do /create, para a entrada combinar com a saída (encanador).
const HERO_INPUT =
  "Family-owned plumbing company in Austin, TX. 24/7 emergency repairs and water heaters.";

const STEPS = [
  {
    title: "Describe your business",
    body: "A sentence or two in plain English: what you do, where, and how customers reach you.",
    caption: "Example: “House cleaning in Worcester, MA. Weekly, biweekly and move-out cleans.”",
  },
  {
    title: "We build the first draft",
    body: "We pick one of five industry templates and one of ten font pairings, write your headline, services and FAQ, and choose your colors. It takes seconds.",
    caption: "Private preview. Only you can see it.",
  },
  {
    title: "Edit, publish, get requests",
    body: "Change things in the editor with a live preview, or ask in plain English — “add a deep-cleaning service,” “make it warmer.” Publish to nosweatfd.com/s/your-business or your own domain.",
    caption: "Contact-form requests arrive by email and in your dashboard.",
  },
];

type Capability = {
  title: string;
  body: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// No máximo 6 linhas (brief). Fotos e edição por IA são recursos reais desde 2026-10-13.
const CAPABILITIES: Capability[] = [
  {
    title: "Made for phones, with tap to call",
    body: "Every template is mobile-friendly, and visitors on a phone can call you with one tap.",
    icon: DeviceMobileIcon,
  },
  {
    title: "Requests by email and in your dashboard",
    body: "Get an email when someone sends a request through your contact form. Every request is also saved under “Messages from your website.”",
    icon: EnvelopeIcon,
  },
  {
    title: "Ask for changes in plain English",
    body: "Type “add a deep-cleaning service” or “make it warmer” and get a new draft to review. Nothing goes live until you publish.",
    icon: ChatIcon,
  },
  {
    title: "Photos",
    body: "A hero photo picked for your industry from a stock library, credited to the photographer. On Pro and Premium, upload your own photos and show them in a gallery.",
    icon: PhotoIcon,
  },
  {
    title: "Edit without a developer",
    body: "Text, services, FAQ, colors, ten font pairings and section order, with a live preview. Changes stay in a draft until you publish.",
    icon: PencilIcon,
  },
  {
    title: "Your address",
    body: "Publish on nosweatfd.com/s/your-business, or connect a domain you already own on Pro and Premium.",
    icon: GlobeIcon,
  },
];

const EXAMPLES: { slug: FixtureSlug; industry: string }[] = [
  { slug: "joes-plumbing", industry: "Home services" },
  { slug: "glow-salon", industry: "Beauty & salons" },
  { slug: "rosas-kitchen", industry: "Restaurants" },
];

const STRAIGHT_ANSWERS = [
  "Every example on this page is a fictional business, labeled as one.",
  "You see your full site before you pay anything.",
  "Monthly plans are month to month. No long-term contract.",
  "Annual plans: no setup fee, and we email you before they renew.",
];

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
      "Monthly plans are month to month. Annual plans renew yearly and you can turn off renewal anytime.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on Pro and Premium, if you already own one (from any domain registrar). On your site’s page we show the DNS records to add and verify the connection. Every plan can publish on a free nosweatfd.com/s/ address.",
  },
];

const exampleUrl = (slug: FixtureSlug) => `/examples/${slug}?embed=1`;

// Escala tipográfica do brief (§3), repetida em todas as seções.
const h2Class =
  "font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-balance text-ink lg:text-[2.5rem]";
const h3Class = "font-display text-lg font-semibold tracking-[-0.01em] text-ink lg:text-xl";
const captionClass = "text-[13px] text-slate-500";

export default function LandingPage() {
  return (
    <>
      {/* HERO: entrada real (uma frase) à esquerda do resultado real (site de exemplo). */}
      <section aria-labelledby="hero-title" className="bg-white">
        <div
          className={`${container} grid gap-y-12 pt-12 pb-16 lg:grid-cols-12 lg:gap-x-8 lg:pt-20 lg:pb-24`}
        >
          <div className="lg:col-span-5 lg:pt-4">
            <h1
              id="hero-title"
              className="max-w-[14ch] font-display text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink lg:text-6xl lg:leading-[1.02]"
            >
              <TightPunctuation>Your business website, built from one sentence.</TightPunctuation>
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600 lg:text-xl">
              Tell us what you do and where you work. AI picks a design made for your industry and
              writes your headline, services and FAQ. Change anything by asking in plain English,
              publish, and get customer requests by email.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/create" className={primaryButton}>
                Build my website
              </Link>
              <Link href="/examples/joes-plumbing" className={secondaryButton}>
                See an example
              </Link>
            </div>
            <p className={`mt-4 ${captionClass}`}>
              Free account. Create and preview free; pick a plan when you go live.{" "}
              <a href="#pricing" className={textLink}>
                See pricing
              </a>
            </p>
            <p className="mt-8 max-w-[52ch] border-t border-slate-200 pt-6 text-sm leading-relaxed text-pretty text-slate-600">
              For cleaning services, plumbers, landscapers, contractors, salons, restaurants,
              consultants and photographers.
            </p>
          </div>

          <div className="w-full max-w-2xl lg:col-span-7 lg:max-w-none">
            {/* Recriação estática do campo do /create. O cartão inteiro leva ao /create;
                o botão de dentro é só ilustração e fica neutro para não competir com o CTA. */}
            <Link
              href="/create"
              aria-label={`Try it with your business. Example description: ${HERO_INPUT}`}
              className="group block rounded-2xl border border-slate-200 bg-surface p-4 transition-colors hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5"
            >
              <span aria-hidden="true" className="block">
                <span className="block text-sm font-semibold text-ink">Describe your business</span>
                <span className="mt-3 block rounded-2xl border border-slate-300 bg-white p-5 text-lg leading-relaxed text-ink">
                  {HERO_INPUT}
                </span>
                <span className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <span className="text-sm font-semibold text-brand underline-offset-4 group-hover:underline">
                    Try it with your business&nbsp;→
                  </span>
                  <span className="ml-auto inline-flex h-10 items-center rounded-lg bg-slate-200 px-4 text-sm font-semibold text-slate-600">
                    Generate my website
                  </span>
                </span>
              </span>
            </Link>

            {/* Linha vertical ligando a entrada ao resultado, com o que a IA decidiu. */}
            <div className="flex gap-4 pl-8">
              <span aria-hidden="true" className="w-px shrink-0 bg-slate-300" />
              <p className={`py-4 ${captionClass}`}>
                Template: Home services · Headline, services and FAQ written · Colors and fonts
                picked
              </p>
            </div>

            <BrowserFrame
              address="nosweatfd.com/s/joes-plumbing"
              className="shadow-[0_1px_2px_rgb(7_27_51/0.06),0_12px_32px_-12px_rgb(7_27_51/0.18)]"
            >
              <ScaledFrame
                src={exampleUrl("joes-plumbing")}
                title="Example website: Joe’s Plumbing, desktop view"
                viewportWidth={1280}
                viewportHeight={860}
                loading="eager"
              />
            </BrowserFrame>
            <p className={`mt-3 ${captionClass}`}>
              Example site. Joe’s Plumbing is a fictional business; reviews on real sites come from
              the owner.
            </p>
          </div>
        </div>
      </section>

      {/* 01 — COMO FUNCIONA */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="scroll-mt-20 border-y border-slate-200 bg-surface py-16 lg:py-24"
      >
        <div className={container}>
          <SectionIndex number="01" label="How it works" />
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <h2 id="how-it-works-title" className={`max-w-[20ch] ${h2Class}`}>
              <TightPunctuation>Three steps from a sentence to a live site.</TightPunctuation>
            </h2>
            <Link href="/create" className={`inline-flex min-h-11 items-center ${textLink}`}>
              Start with step 1&nbsp;<span aria-hidden="true">→</span>
            </Link>
          </div>
          <ol className="mt-12 grid gap-y-10 md:grid-cols-3 md:gap-x-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-slate-200 pt-6">
                <p
                  aria-hidden="true"
                  className="font-display text-4xl font-semibold tracking-[-0.02em] text-ink tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className={`mt-4 ${h3Class}`}>{step.title}</h3>
                <p className="mt-2 text-base leading-[1.65] text-pretty text-slate-600">
                  {step.body}
                </p>
                <p className={`mt-4 ${captionClass}`}>{step.caption}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 02 — O QUE O SITE FAZ */}
      <section
        id="what-it-does"
        aria-labelledby="what-it-does-title"
        className="scroll-mt-20 bg-white py-24 lg:py-32"
      >
        <div className={container}>
          <SectionIndex number="02" label="What your site does" />
          <div className="mt-8 grid gap-y-10 lg:mt-12 lg:grid-cols-12 lg:gap-x-8">
            <h2
              id="what-it-does-title"
              className={`max-w-[20ch] lg:col-span-7 lg:col-start-6 lg:row-start-1 ${h2Class}`}
            >
              <TightPunctuation>Built for the way customers reach you.</TightPunctuation>
            </h2>

            {/* Celular "grudado" no desktop enquanto a lista rola; estático no mobile. */}
            <div className="lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <div className="max-w-[280px] lg:sticky lg:top-24 lg:max-w-[320px]">
                <div className="overflow-hidden rounded-2xl border-[6px] border-ink bg-ink">
                  <ScaledFrame
                    src={exampleUrl("joes-plumbing")}
                    title="Example website: Joe’s Plumbing, phone view"
                    viewportWidth={390}
                    viewportHeight={800}
                  />
                </div>
                <p className={`mt-3 ${captionClass}`}>Example. Fictional business.</p>
              </div>
            </div>

            <ul className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-7 lg:col-start-6 lg:row-start-2">
              {CAPABILITIES.map(({ title, body, icon: CapabilityIcon }) => (
                <li key={title} className="flex gap-4 py-6">
                  <CapabilityIcon className="mt-0.5 size-5 shrink-0 text-slate-500 lg:mt-1" />
                  <div>
                    <h3 className={h3Class}>{title}</h3>
                    <p className="mt-1 max-w-[65ch] text-base leading-[1.65] text-pretty text-slate-600">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 03 — EXEMPLOS (a única seção escura da página) */}
      <section
        id="examples"
        aria-labelledby="examples-title"
        className="scroll-mt-20 bg-ink py-24 text-white lg:py-32"
      >
        <div className={container}>
          <SectionIndex number="03" label="Examples" tone="dark" />
          <div className="mt-8 grid gap-y-6 lg:grid-cols-12 lg:gap-x-8">
            <h2
              id="examples-title"
              className="max-w-[20ch] font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-balance lg:col-span-6 lg:text-[2.5rem]"
            >
              <TightPunctuation>Designs made for your line of work.</TightPunctuation>
            </h2>
            <p className="max-w-[52ch] text-base leading-[1.65] text-pretty text-slate-300 lg:col-span-5 lg:col-start-8 lg:self-end">
              A cleaning company, a salon and a restaurant need different things. Your site starts
              from a template built for your industry, with one of ten font pairings, and you can
              switch anytime.
            </p>
          </div>

          <ul className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {EXAMPLES.map(({ slug, industry }) => {
              const { business } = fixtures[slug];
              return (
                <li key={slug}>
                  <Link
                    href={`/examples/${slug}`}
                    className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  >
                    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 transition-shadow group-hover:ring-white/30">
                      <ScaledFrame
                        src={exampleUrl(slug)}
                        title={`Example website: ${business.name}`}
                        viewportWidth={1280}
                        viewportHeight={960}
                      />
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">
                          {business.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-300">
                          {industry}
                          {business.city ? ` · ${business.city}` : ""}
                        </p>
                      </div>
                      <span className="flex min-h-7 items-center gap-1 text-sm font-semibold text-accent">
                        View
                        <ArrowRightIcon className="size-4 motion-safe:transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-10 text-[13px] text-slate-400">
            Example sites for fictional businesses, built with No Sweat templates.
          </p>
          <p className="mt-10 border-t border-white/15 pt-6 text-sm leading-relaxed text-pretty text-slate-300">
            Templates for home services, beauty, restaurants, professional services and portfolios.
          </p>
        </div>
      </section>

      {/* 04 — PREÇO: três planos num painel só, em formato de recibo. */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="scroll-mt-20 bg-white py-20 lg:py-28"
      >
        <div className={container}>
          <SectionIndex number="04" label="Pricing" />
          <div className="mt-8 grid gap-y-6 lg:mt-12 lg:grid-cols-12 lg:gap-x-8">
            <h2 id="pricing-title" className={`max-w-[20ch] lg:col-span-6 ${h2Class}`}>
              <TightPunctuation>Plain prices. Pick a plan when you go live.</TightPunctuation>
            </h2>
            <p className="max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600 lg:col-span-5 lg:col-start-8 lg:self-end">
              Create and preview your site free. Every plan includes the editor, a contact form and
              AI edits; they differ in domains, photos and how much help you get.
            </p>
          </div>

          <div className="mt-10 lg:mt-12">
            <PricingPlans />
          </div>

          <div className="mt-8 grid gap-y-10 lg:grid-cols-12 lg:gap-x-8">
            {/* Letra miúda logo abaixo da tabela, legível (não escondida). */}
            <p className="max-w-[75ch] text-sm leading-relaxed text-pretty text-slate-600 lg:col-span-7">
              Create and preview your site free. You pick a plan when you go live. Annual plans cost
              10 times the monthly price (2 months free), are billed once a year and renew
              automatically; we’ll email you before renewal. Monthly plans are month to month — no
              contract. Domain registration not included. AI edits reset monthly and don’t roll
              over.
            </p>
            <div className="lg:col-span-5 lg:col-start-8">
              <p className="text-sm font-semibold text-ink">Straight answers</p>
              <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {STRAIGHT_ANSWERS.map((answer) => (
                  <li
                    key={answer}
                    className="flex gap-3 py-3 text-base leading-[1.65] text-slate-600"
                  >
                    <CheckIcon className="mt-1 size-4 shrink-0 text-slate-500" />
                    {answer}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 05 — FAQ */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className="scroll-mt-20 border-y border-slate-200 bg-surface py-16 lg:py-24"
      >
        <div className={container}>
          <SectionIndex number="05" label="FAQ" />
          <div className="mt-8 grid gap-y-10 lg:mt-12 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-4">
              <h2 id="faq-title" className={`max-w-[20ch] ${h2Class}`}>
                <TightPunctuation>Questions, answered.</TightPunctuation>
              </h2>
              <p className="mt-4 max-w-[40ch] text-base leading-[1.65] text-pretty text-slate-600">
                Still unsure?{" "}
                <Link href="/create" className={textLink}>
                  Build your site
                </Link>{" "}
                and look at it before you decide.
              </p>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-8">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-lg font-semibold tracking-[-0.01em] text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <PlusIcon className="size-5 shrink-0 text-slate-500 motion-safe:transition-transform group-open:rotate-45" />
                  </summary>
                  <p className="max-w-[65ch] pr-10 pb-6 text-base leading-[1.65] text-pretty text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL: o endereço de publicação como motivo. */}
      <section aria-labelledby="final-cta-title" className="bg-white py-16 lg:py-20">
        <div className={`${container} grid gap-y-8 lg:grid-cols-12 lg:items-center lg:gap-x-8`}>
          <div className="lg:col-span-6">
            <h2 id="final-cta-title" className={`max-w-[20ch] ${h2Class}`}>
              <TightPunctuation>See your website before you spend a dollar.</TightPunctuation>
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600">
              Describe your business and get a private preview in seconds.
            </p>
          </div>
          <div className="lg:col-span-6">
            {/* Só quebra depois da barra (390px); cada metade fica inteira. */}
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-display text-xl leading-tight font-semibold tracking-[-0.02em] text-ink sm:text-2xl lg:text-3xl">
              <span className="whitespace-nowrap">nosweatfd.com/s/</span>
              <wbr />
              <span className="whitespace-nowrap text-brand">your-business</span>
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Link href="/create" className={primaryButton}>
                Build my website
              </Link>
              <p className={captionClass}>Free account. Create and preview free.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
