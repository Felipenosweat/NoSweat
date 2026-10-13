import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArrowRightIcon,
  BoltIcon,
  ChatIcon,
  CheckIcon,
  GlobeIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SparklesIcon,
} from "@/components/marketing/icons";
import { ScaledFrame } from "@/components/marketing/ScaledFrame";

// Só afirmações que o produto cumpre hoje. Nada de números, logos ou depoimentos inventados
// (regra da FTC sobre avaliações falsas).

const HIGHLIGHTS = ["Free to try", "No credit card", "Works on every phone", "Your own .com"];

const STEPS = [
  {
    title: "Tell us about your business",
    body: "What you do, where you work, how customers reach you. A sentence or two is plenty.",
  },
  {
    title: "We build your site",
    body: "We pick a design made for your industry and write your headline, services, and FAQ.",
  },
  {
    title: "Review it and go live",
    body: "Change anything you want with a live preview, then publish on your own domain.",
  },
];

type Feature = {
  title: string;
  body: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const FEATURES: Feature[] = [
  {
    title: "Written for you",
    body: "Clear, friendly copy about your services, your area, and your hours. No blank pages.",
    icon: SparklesIcon,
  },
  {
    title: "Looks great on phones",
    body: "Most of your customers will find you on their phone. Every site is built mobile-first.",
    icon: PhoneIcon,
  },
  {
    title: "Your own domain",
    body: "Connect yourbusiness.com, or start right away on a free No Sweat address.",
    icon: GlobeIcon,
  },
  {
    title: "Easy to reach you",
    body: "Tap-to-call buttons and a contact form so visitors become customers.",
    icon: ChatIcon,
  },
  {
    title: "Edit anytime",
    body: "Update your services, hours, or contact info yourself and see the changes before they go live.",
    icon: PencilIcon,
  },
  {
    title: "Hosting included",
    body: "Fast, secure hosting is part of the deal. Nothing to install, nothing to maintain.",
    icon: BoltIcon,
  },
];

const EXAMPLES: { slug: FixtureSlug; industry: string }[] = [
  { slug: "joes-plumbing", industry: "Home services" },
  { slug: "glow-salon", industry: "Beauty & salons" },
  { slug: "rosas-kitchen", industry: "Restaurants" },
];

const INDUSTRIES = [
  "Cleaning services",
  "Plumbing & HVAC",
  "Landscaping",
  "Contractors & remodeling",
  "Salons & barbershops",
  "Restaurants & food trucks",
  "Consultants & agencies",
  "Photographers & creatives",
];

const FAQS = [
  {
    question: "Do I need any design or tech skills?",
    answer:
      "Not at all. If you can describe your business in a text message, you can build your site. We handle the design, the writing, and the hosting.",
  },
  {
    question: "How long does it take?",
    answer:
      "Your first draft is ready in about a minute. Most people review it, make a few tweaks, and publish the same day.",
  },
  {
    question: "Can I use my own domain name?",
    answer:
      "Yes. Connect a domain you already own, like yourbusiness.com. You can also publish right away on a free No Sweat address.",
  },
  {
    question: "Can I change things after it's live?",
    answer:
      "Anytime. Edit your text, services, and contact details with a live preview, then republish with one click.",
  },
  {
    question: "Is it free to try?",
    answer: "Yes. Create your site and see exactly how it looks before you pay for anything.",
  },
];

const exampleUrl = (slug: FixtureSlug) => `/examples/${slug}?embed=1`;

/** Moldura de janela de navegador em volta de uma miniatura de site. */
function BrowserFrame({
  children,
  address,
  className = "",
}: {
  children: ReactNode;
  address: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-white shadow-2xl ring-1 shadow-slate-900/15 ring-slate-900/10 ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-xs text-slate-500 ring-1 ring-slate-200">
          {address}
        </div>
        <div className="w-10" aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_top,black_30%,transparent_70%)] bg-size-[56px_56px] opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute -top-48 left-1/2 -z-10 h-[40rem] w-[64rem] -translate-x-1/2 rounded-full bg-linear-to-tr from-sky-200/70 via-emerald-100/60 to-amber-100/60 blur-3xl"
        />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Website builder for small businesses
            </p>
            <h1 className="mt-6 font-display text-[2.75rem] leading-[1.04] font-extrabold tracking-tight text-balance text-slate-950 sm:text-6xl lg:text-[3.6rem] xl:text-[3.9rem]">
              Get your business online.{" "}
              <span className="bg-linear-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">
                No sweat.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-slate-600 sm:text-xl lg:mx-0">
              Tell us about your business in a sentence or two. We&apos;ll design your site, write
              the words, and get it ready to publish, so you can get back to work.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/create"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 sm:w-auto"
              >
                Build my free website
                <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/examples/joes-plumbing"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-slate-800 ring-1 ring-slate-300 transition hover:ring-slate-400 sm:w-auto"
              >
                See an example
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600 lg:justify-start">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckIcon className="size-4 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Prévia real: o site de exemplo em tamanho de desktop e de celular. */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <BrowserFrame address="yourbusiness.com">
              <ScaledFrame
                src={exampleUrl("joes-plumbing")}
                title="Example website: Joe's Plumbing, desktop view"
                viewportWidth={1280}
                viewportHeight={860}
                loading="eager"
              />
            </BrowserFrame>
            <div className="absolute -bottom-8 -left-4 hidden w-[30%] overflow-hidden rounded-[1.75rem] border-[6px] border-slate-950 bg-slate-950 shadow-2xl shadow-slate-900/30 sm:block lg:-left-10">
              <ScaledFrame
                src={exampleUrl("joes-plumbing")}
                title="Example website: Joe's Plumbing, phone view"
                viewportWidth={390}
                viewportHeight={800}
                loading="eager"
              />
            </div>
            <p className="mt-4 text-center text-xs text-slate-500 sm:mt-12 lg:text-right">
              Example site. Joe&apos;s Plumbing is a fictional business.
            </p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section
        id="how-it-works"
        className="scroll-mt-16 border-y border-slate-200 bg-slate-50 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-widest text-emerald-600 uppercase">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-slate-950 sm:text-4xl">
              From &ldquo;I need a website&rdquo; to live in three steps
            </h2>
          </div>
          <div className="relative mt-16">
            <div
              aria-hidden="true"
              className="absolute top-6 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-sky-300 via-emerald-300 to-sky-300 md:block"
            />
            <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white font-display text-lg font-bold text-slate-950 shadow-sm ring-1 ring-slate-200">
                    {index + 1}
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs leading-relaxed text-slate-600">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="features" className="scroll-mt-16 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-widest text-emerald-600 uppercase">
              Everything included
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-slate-950 sm:text-4xl">
              A website that works as hard as you do
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              No templates to wrestle with and no plugins to update. Just a professional site that
              helps customers find you and get in touch.
            </p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, body, icon: FeatureIcon }) => (
              <div key={title} className="bg-white p-8 transition hover:bg-slate-50/70">
                <span className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-emerald-500 text-white shadow-md shadow-emerald-500/20">
                  <FeatureIcon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXEMPLOS */}
      <section id="examples" className="scroll-mt-16 bg-slate-950 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-widest text-emerald-400 uppercase">
                Examples
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Designs made for your line of work
              </h2>
            </div>
            <p className="max-w-sm text-slate-400">
              A plumber, a salon, and a restaurant need different things. Your site starts from a
              design built for your industry.
            </p>
          </div>

          <ul className="mt-14 grid gap-8 md:grid-cols-3">
            {EXAMPLES.map(({ slug, industry }) => {
              const { business } = fixtures[slug];
              return (
                <li key={slug}>
                  <Link href={`/examples/${slug}`} className="group block">
                    <div className="overflow-hidden rounded-xl ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/30">
                      <ScaledFrame
                        src={exampleUrl(slug)}
                        title={`Example website: ${business.name}`}
                        viewportWidth={1280}
                        viewportHeight={960}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-display font-bold">{business.name}</p>
                        <p className="text-sm text-slate-400">
                          {industry}
                          {business.city ? ` · ${business.city}` : ""}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
                        View
                        <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-8 text-xs text-slate-500">
            Example sites for fictional businesses, built with No Sweat.
          </p>

          <div className="mt-16 border-t border-white/10 pt-10">
            <p className="text-sm font-medium text-slate-400">Built for businesses like yours</p>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {INDUSTRIES.map((industry) => (
                <li
                  key={industry}
                  className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10"
                >
                  {industry}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="text-sm font-semibold tracking-widest text-emerald-600 uppercase">FAQ</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Questions? We&apos;ve got answers.
            </h2>
            <p className="mt-4 text-slate-600">
              Still not sure?{" "}
              <Link
                href="/create"
                className="font-semibold text-slate-950 underline underline-offset-4"
              >
                Try it free
              </Link>{" "}
              and see your site before you decide.
            </p>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-semibold text-slate-950 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <PlusIcon className="size-5 shrink-0 text-slate-400 transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 pr-10 leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 -z-10 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-linear-to-r from-sky-500/40 to-emerald-500/40 blur-3xl"
          />
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            Your customers are searching. Be there when they look.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-slate-300">
            Build your website in minutes. It&apos;s free to try, and there&apos;s no credit card
            required.
          </p>
          <Link
            href="/create"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Build my free website
            <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
