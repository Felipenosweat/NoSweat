import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { BrowserFrame } from "@/components/marketing/BrowserFrame";
import { HeroPrompt } from "@/components/marketing/HeroPrompt";
import {
  ArrowRightIcon,
  ChatIcon,
  CheckIcon,
  DeviceMobileIcon,
  GlobeIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
} from "@/components/marketing/icons";
import { ScaledFrame } from "@/components/marketing/ScaledFrame";
import { SectionIndex } from "@/components/marketing/SectionIndex";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import { container, primaryButton, textLink } from "@/components/marketing/styles";
import { formatUsd, PLANS } from "@/lib/plans";

// Só afirmações que o produto cumpre hoje (lista verificada em .design-shots/saas-context.md).
// Nada de números, logos ou depoimentos inventados (regra da FTC sobre avaliações falsas).
// Todo exemplo é um negócio fictício e aparece rotulado como tal.

// Frase que gerou o site de exemplo mostrado no hero (encanador fictício).
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
    body: "We pick one of five industry templates, write your headline, services and FAQ, and choose colors and fonts. It takes seconds.",
    caption: "Private preview. Only you can see it.",
  },
  {
    title: "Edit, publish, get messages",
    body: "Edit your headline, services, FAQ, colors and section order with a live preview. Publish to nosweatfd.com/s/your-business or your own domain.",
    caption: "Contact-form messages land in your dashboard.",
  },
];

type Capability = {
  title: string;
  body: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const CAPABILITIES: Capability[] = [
  {
    title: "Tap to call",
    body: "Visitors on a phone can call you with one tap.",
    icon: PhoneIcon,
  },
  {
    title: "A contact form that works",
    body: "Requests from your site are saved under “Messages from your website” in your dashboard.",
    icon: ChatIcon,
  },
  {
    title: "Your address",
    body: "Publish on nosweatfd.com/s/your-business, or connect a domain you already own.",
    icon: GlobeIcon,
  },
  {
    title: "Edit without a developer",
    body: "Text, services, FAQ, colors, fonts and section order, with a live preview before you publish.",
    icon: PencilIcon,
  },
  {
    title: "Looks right on phones",
    body: "Every template is mobile-friendly, because that’s where most people will find you.",
    icon: DeviceMobileIcon,
  },
];

const EXAMPLES: { slug: FixtureSlug; industry: string }[] = [
  { slug: "joes-plumbing", industry: "Home services" },
  { slug: "glow-salon", industry: "Beauty & salons" },
  { slug: "rosas-kitchen", industry: "Restaurants" },
];

// Preços vêm de lib/plans.ts (mesma fonte da página /pricing): mudar lá muda aqui.
const PAID_PLAN = PLANS.find((plan) => plan.id === "pro");
const SETUP_PRICE = PAID_PLAN?.setupPrice ?? null;
const MONTHLY_PRICE = PAID_PLAN?.monthlyPrice ?? 0;

// Rótulo curto + legenda embaixo, para caber com a linha pontilhada em 390px.
const RECEIPT = [
  ...(SETUP_PRICE !== null
    ? [{ label: "Setup", caption: "One time", amount: formatUsd(SETUP_PRICE), unit: "" }]
    : []),
  {
    label: "Monthly",
    caption: "Hosting and editing",
    amount: formatUsd(MONTHLY_PRICE),
    unit: "/mo",
  },
  { label: "Long-term contract", caption: "", amount: "None", unit: "" },
];

const PRICE_SENTENCE =
  SETUP_PRICE !== null
    ? `${formatUsd(SETUP_PRICE)} one-time setup and ${formatUsd(MONTHLY_PRICE)} per month.`
    : `${formatUsd(MONTHLY_PRICE)} per month.`;

const INCLUDED = [
  "First draft written for your business",
  "Editor with live preview",
  "Your nosweatfd.com/s/ address",
  "Connect a domain you own",
  "Contact form with messages in your dashboard",
  "Mobile-friendly design with tap-to-call",
];

const STRAIGHT_ANSWERS = [
  "Every example on this page is a fictional business, labeled as one.",
  "You see your full site before you pay anything.",
  "Month to month. No long-term contract.",
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
      "Yes. Edit your business details, hero text, services, reviews you provide, and FAQ. Change colors and fonts, switch templates, and add, remove or reorder sections, all with a live preview.",
  },
  {
    question: "What happens after I publish?",
    answer:
      "Your site goes live at nosweatfd.com/s/your-business or on your own domain. Messages from your contact form appear in your dashboard, and you can keep editing anytime.",
  },
  {
    question: "How much does it cost?",
    answer: `${PRICE_SENTENCE} Trying it and previewing your site are free, no account needed; pricing applies when you go live.`,
  },
  {
    question: "Can I cancel?",
    answer: "Yes. It’s month to month with no long-term contract.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, if you already own one (from any domain registrar). On your site’s page we show the DNS records to add and verify the connection. You can also publish on a free nosweatfd.com/s/ address.",
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
      {/* HERO: a caixa de descrição é o próprio produto (escreve aqui e já vai para o /create).
          Embaixo, o resultado real de um exemplo, com a frase que o gerou. */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-white">
        {/* Brilho suave atrás da caixa: um radial da cor da marca em baixa opacidade, com um
            movimento lento que só roda sem prefers-reduced-motion. Sem imagem, sem biblioteca. */}
        <div
          aria-hidden="true"
          className="ns-hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(55%_45%_at_50%_30%,rgb(0_102_255/0.10),transparent_70%),radial-gradient(35%_30%_at_70%_20%,rgb(0_194_255/0.10),transparent_70%)]"
        />
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .ns-hero-glow { animation: ns-hero-drift 16s ease-in-out infinite alternate; }
          }
          @keyframes ns-hero-drift {
            from { transform: translate3d(-2%, 0, 0) scale(1); opacity: 0.85; }
            to { transform: translate3d(2%, 2%, 0) scale(1.06); opacity: 1; }
          }
        `}</style>

        <div className={`${container} pt-12 pb-16 sm:pt-16 lg:pt-24 lg:pb-24`}>
          <div className="mx-auto max-w-3xl text-center">
            <h1
              id="hero-title"
              className="mx-auto max-w-[16ch] font-display text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink sm:text-5xl lg:text-6xl lg:leading-[1.02]"
            >
              <TightPunctuation>Your business website, built from one sentence.</TightPunctuation>
            </h1>
            <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600 lg:text-xl">
              Tell us what you do and where you work. We pick a design made for your industry and
              write your headline, services and FAQ. You edit it, publish it, and get customer
              messages in your dashboard.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl lg:mt-10">
            <HeroPrompt />
            <p className={`mt-5 text-center ${captionClass}`}>
              Free to try. No account needed.{" "}
              <a href="#pricing" className={textLink}>
                See pricing
              </a>
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl lg:mt-24">
            {/* A frase de exemplo e o que a IA decidiu, ligadas ao site que saiu dela. */}
            <div className="flex gap-4 pl-8">
              <span aria-hidden="true" className="w-px shrink-0 bg-slate-300" />
              <div className="py-4">
                <p className="max-w-[60ch] text-sm leading-relaxed text-pretty text-ink">
                  <span className="font-semibold">Example input:</span> &ldquo;{HERO_INPUT}&rdquo;
                </p>
                <p className={`mt-1 ${captionClass}`}>
                  Template: Home services · Headline, services and FAQ written · Colors and fonts
                  picked
                </p>
              </div>
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
              />
            </BrowserFrame>
            <div className="mt-3 flex flex-col gap-x-6 gap-y-2 sm:flex-row sm:items-baseline sm:justify-between">
              <p className={captionClass}>
                Example site. Joe’s Plumbing is a fictional business; reviews on real sites come
                from the owner.
              </p>
              <Link
                href="/examples/joes-plumbing"
                className={`inline-flex min-h-11 shrink-0 items-center text-sm ${textLink}`}
              >
                See the full example&nbsp;<span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="mt-8 max-w-[60ch] border-t border-slate-200 pt-6 text-sm leading-relaxed text-pretty text-slate-600">
              For cleaning services, plumbers, landscapers, contractors, salons, restaurants,
              consultants and photographers.
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
              from a template built for your industry, and you can switch templates anytime.
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

      {/* 04 — PREÇO, em formato de recibo */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="scroll-mt-20 bg-white py-20 lg:py-28"
      >
        <div className={container}>
          <SectionIndex number="04" label="Pricing" />
          <div className="mt-8 grid gap-y-12 lg:mt-12 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-5">
              <h2 id="pricing-title" className={`max-w-[20ch] ${h2Class}`}>
                <TightPunctuation>One setup fee. One monthly price. No contract.</TightPunctuation>
              </h2>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600 lg:text-xl">
                Create and preview your site free. Pricing applies when you go live.
              </p>
              <p className="mt-10 text-sm font-semibold text-ink">Straight answers</p>
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

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7">
              <dl className="divide-y divide-slate-200">
                {RECEIPT.map((line) => (
                  <div key={line.label} className="flex items-baseline gap-3 py-4 first:pt-0">
                    <dt className="text-base text-ink">
                      {line.label}
                      {line.caption && (
                        <span className={`block ${captionClass}`}>{line.caption}</span>
                      )}
                    </dt>
                    <span
                      aria-hidden="true"
                      className="min-w-4 flex-1 border-b-2 border-dotted border-slate-300"
                    />
                    <dd className="shrink-0 font-display text-xl font-semibold tracking-[-0.01em] text-ink tabular-nums lg:text-2xl">
                      {line.amount}
                      {line.unit && (
                        <span className="text-base font-normal text-slate-500">{line.unit}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className={h3Class}>Included</h3>
                <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex gap-3 text-base leading-snug text-slate-600">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className={`mt-4 ${captionClass}`}>Domain registration is not included.</p>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:gap-5">
                <Link href="/create" className={primaryButton}>
                  Build my website
                </Link>
                <p className={captionClass}>Free to try. No long-term contract.</p>
              </div>
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
              <p className={captionClass}>Free to try. No long-term contract.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
