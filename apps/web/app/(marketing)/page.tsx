import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Bento } from "@/components/marketing/Bento";
import { HeroPoster } from "@/components/marketing/HeroPoster";
import { ArrowRightIcon, CheckIcon, PlusIcon } from "@/components/marketing/icons";
import { Marquee } from "@/components/marketing/Marquee";
import { PhotoFigure } from "@/components/marketing/PhotoFigure";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PromptForm } from "@/components/marketing/PromptForm";
import { StoryScroll } from "@/components/marketing/StoryScroll";
import {
  belowFold,
  bodyClass,
  container,
  eyebrowClass,
  focusRing,
  h1Class,
  h2Class,
  leadClass,
  textLink,
} from "@/components/marketing/styles";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import { UrlMotif } from "@/components/marketing/UrlMotif";
import { getPhoto, type PhotoKey } from "@/components/photos";

const TITLE = "No Sweat · Describe your business. Get a website by lunch.";
const DESCRIPTION =
  "Describe your business in plain English and get a website made for your industry: headline, services, FAQ, colors and fonts. Edit it or ask AI for changes, then publish. Plans from $39/month.";

// A imagem de compartilhamento vem de app/(marketing)/opengraph-image.tsx (1200×630).
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
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Só afirmações que o produto cumpre hoje. Nada de números, logos ou depoimentos inventados
// (regra da FTC sobre avaliações falsas). Todo exemplo é um negócio fictício, rotulado.
// As fotos são ilustrativas: falam do público, nunca de "nossos clientes".

const EXAMPLES: { slug: FixtureSlug; industry: string }[] = [
  { slug: "joes-plumbing", industry: "Home services" },
  { slug: "sparkle-cleaning", industry: "Cleaning" },
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
      "Yes. Plans renew automatically until you cancel, and you can cancel anytime in your account. You keep your plan until the end of the month or year you already paid for. For annual plans, we email you a reminder before each renewal. Nothing is charged today.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on Pro and Premium, if you already own one (from any domain registrar). On your site’s page we show the DNS records to add and verify the connection. Every plan can publish on a free nosweatfd.com/s/ address.",
  },
];

// Faixa de fotos: uma larga (6 colunas) + dois retratos (3 colunas) no desktop.
const BAND: { key: PhotoKey; wide: boolean }[] = [
  { key: "plumber", wide: true },
  { key: "stylist", wide: false },
  { key: "cook", wide: false },
];

const reveal = (index: number) => ({ "--ns-i": index }) as CSSProperties;

export default function LandingPage() {
  const band = BAND.flatMap(({ key, wide }) => {
    const photo = getPhoto(key);
    return photo ? [{ photo, wide }] : [];
  });
  const storefront = getPhoto("storefront");

  return (
    <>
      {/* 1. HERO — campo real à esquerda, resultado real (captura estática) à direita.
          Nada aqui anima a partir de opacidade 0. */}
      <section
        aria-labelledby="hero-title"
        data-hide-mobile-cta
        className="overflow-x-clip bg-white"
      >
        <div
          className={`${container} grid gap-y-10 pt-10 pb-16 lg:grid-cols-12 lg:gap-x-8 lg:pt-20 lg:pb-28`}
        >
          <div className="lg:col-span-5 lg:pt-8">
            <h1 id="hero-title" className={h1Class}>
              <TightPunctuation>Describe your business. Get a website by lunch.</TightPunctuation>
            </h1>
            <p className={`mt-5 lg:mt-6 ${leadClass}`}>
              One sentence about your work becomes a site with your services, FAQ and a contact
              form.
            </p>
            <div className="mt-8">
              <PromptForm />
            </div>
          </div>
          <div className="lg:col-span-7">
            <HeroPoster />
          </div>
        </div>
      </section>

      {/* 2. BUILT WITH NO SWEAT — faixa de capturas dos exemplos (decorativa). */}
      <div className={belowFold}>
        <Marquee />
      </div>

      {/* 3. STORYTELLING FIXO — de uma frase a um site no ar. Sem content-visibility (sticky). */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="bg-white py-24 lg:py-40"
      >
        <div className={container}>
          <div className="ns-reveal max-w-[40rem]">
            <p className={eyebrowClass}>How it works</p>
            <h2 id="how-it-works-title" className={`mt-3 ${h2Class}`}>
              <TightPunctuation>From a sentence to a live site.</TightPunctuation>
            </h2>
          </div>
          <div className="mt-12 lg:mt-8">
            <StoryScroll />
          </div>
        </div>
      </section>

      {/* 4. FAIXA DE FOTOS — o público, trabalhando. Ilustrativas, nunca "clientes". */}
      {band.length > 0 && (
        <section aria-labelledby="people-title" className={`bg-white pb-24 lg:pb-32 ${belowFold}`}>
          <div className={container}>
            <div className="ns-reveal grid gap-y-4 lg:grid-cols-12 lg:gap-x-8">
              <h2 id="people-title" className={`lg:col-span-6 ${h2Class}`}>
                <TightPunctuation>Built for people who’d rather be working.</TightPunctuation>
              </h2>
              <p className={`lg:col-span-5 lg:col-start-8 lg:self-end ${bodyClass} max-w-[52ch]`}>
                You’re on a roof, in a kitchen, behind a chair. Describe your business once; your
                site takes calls and quote requests while you work.
              </p>
            </div>
          </div>
          {/* Celular: carrossel com snap (85vw, 4:5). Desktop: grade assimétrica 6 + 3 + 3. */}
          <ul
            className={`mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 lg:mx-auto lg:mt-14 lg:grid lg:max-w-[1200px] lg:grid-cols-12 lg:items-end lg:gap-8 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden`}
          >
            {band.map(({ photo, wide }, index) => (
              <li
                key={photo.src}
                className={`w-[85vw] shrink-0 snap-start sm:w-[60vw] lg:w-auto ${
                  wide ? "lg:col-span-6" : "lg:col-span-3"
                } ${index === 2 ? "lg:mb-16" : ""}`}
              >
                <PhotoFigure
                  photo={photo}
                  aspect={wide ? "aspect-[4/5] lg:aspect-[8/5]" : "aspect-[4/5] lg:aspect-[3/4]"}
                  sizes={
                    wide ? "(min-width: 1024px) 560px, 85vw" : "(min-width: 1024px) 270px, 85vw"
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. BENTO — o que vem junto, em recortes da interface. */}
      <section
        id="what-you-get"
        aria-labelledby="what-you-get-title"
        className={`border-y border-slate-200 bg-surface py-20 lg:py-28 ${belowFold}`}
      >
        <div className={container}>
          <div className="ns-reveal grid gap-y-4 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-6">
              <p className={eyebrowClass}>What you get</p>
              <h2 id="what-you-get-title" className={`mt-3 ${h2Class}`}>
                <TightPunctuation>A site that answers the phone for you.</TightPunctuation>
              </h2>
            </div>
            <p className={`lg:col-span-5 lg:col-start-8 lg:self-end ${bodyClass} max-w-[52ch]`}>
              Every plan includes the editor, a contact form and AI edits. These are the screens
              you’ll use, shown with example data.
            </p>
          </div>
          <div className="mt-10 lg:mt-14">
            <Bento />
          </div>
        </div>
      </section>

      {/* 6. EXEMPLOS — a única faixa escura da página. Capturas estáticas, sem iframes. */}
      <section
        id="examples"
        aria-labelledby="examples-title"
        className={`bg-ink py-20 text-white lg:py-28 ${belowFold}`}
      >
        <div className={container}>
          <div className="ns-reveal grid gap-y-4 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-6">
              <p className="text-[13px] font-semibold tracking-[0.02em] text-slate-400">Examples</p>
              <h2
                id="examples-title"
                className="mt-3 max-w-[18ch] font-display text-[1.875rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance lg:text-[2.75rem]"
              >
                <TightPunctuation>Designs made for your line of work.</TightPunctuation>
              </h2>
            </div>
            <p className="max-w-[52ch] text-base leading-[1.65] text-pretty text-slate-300 lg:col-span-5 lg:col-start-8 lg:self-end lg:text-[17px]">
              A plumber, a cleaner, a salon and a restaurant need different things. Your site starts
              from a template built for your industry, with one of ten font pairings, and you can
              switch anytime.
            </p>
          </div>

          <ul className="mt-12 grid gap-12 md:grid-cols-2 md:gap-x-8 md:gap-y-14 lg:mt-16 lg:gap-x-12">
            {EXAMPLES.map(({ slug, industry }, index) => {
              const { business } = fixtures[slug];
              return (
                <li key={slug} className="ns-reveal" style={reveal(index)}>
                  <Link
                    href={`/examples/${slug}`}
                    className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  >
                    {/* Captura do desktop com a do celular sobreposta no canto. */}
                    <div className="relative pr-8 pb-8">
                      <div className="overflow-hidden rounded-xl ring-1 ring-white/10 transition-shadow duration-150 group-hover:ring-white/30">
                        <Image
                          src={`/shots/${slug}-desktop.webp`}
                          alt=""
                          width={2560}
                          height={1720}
                          sizes="(min-width: 1280px) 560px, (min-width: 768px) 45vw, 90vw"
                          className="block h-auto w-full"
                        />
                      </div>
                      <div className="absolute right-0 bottom-0 w-[28%] overflow-hidden rounded-lg border-4 border-ink bg-ink ring-1 ring-white/15">
                        <Image
                          src={`/shots/${slug}-phone.webp`}
                          alt=""
                          width={780}
                          height={1688}
                          sizes="(min-width: 768px) 160px, 110px"
                          className="block h-auto w-full"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg font-semibold tracking-[-0.015em]">
                          {business.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-300">
                          {industry}
                          {business.city ? ` · ${business.city}` : ""}
                        </p>
                      </div>
                      <span className="flex min-h-7 items-center gap-1 text-sm font-semibold text-accent">
                        View
                        <ArrowRightIcon className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-12 border-t border-white/15 pt-6 text-[13px] text-slate-400">
            Example sites for fictional businesses, built with No Sweat templates. Templates for
            home services, beauty, restaurants, professional services and portfolios.
          </p>
        </div>
      </section>

      {/* 7. SEGUNDA FAIXA DE FOTO — gente de verdade responde e-mail (sem nome inventado). */}
      {storefront && (
        <section aria-labelledby="humans-title" className={`bg-white pt-20 lg:pt-28 ${belowFold}`}>
          <div className={container}>
            <PhotoFigure
              photo={storefront}
              aspect="aspect-[4/3] lg:aspect-[21/9]"
              sizes="(min-width: 1200px) 1136px, 100vw"
            />
            <div className="ns-reveal mt-10 grid gap-y-4 lg:grid-cols-12 lg:gap-x-8">
              <h2 id="humans-title" className={`lg:col-span-6 ${h2Class}`}>
                <TightPunctuation>Real humans answer email.</TightPunctuation>
              </h2>
              <div className="lg:col-span-5 lg:col-start-8 lg:self-end">
                <p className={`${bodyClass} max-w-[52ch]`}>
                  Questions before you sign up, or stuck on something in the editor? Write to us and
                  a person on our team writes back.
                </p>
                <a
                  href="mailto:hello@nosweatfd.com"
                  className={`mt-3 inline-flex min-h-11 items-center ${textLink}`}
                >
                  hello@nosweatfd.com
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. PREÇO */}
      <section id="pricing" aria-labelledby="pricing-title" className="bg-white py-20 lg:py-28">
        <div className={container}>
          <div className="ns-reveal grid gap-y-4 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-6">
              <p className={eyebrowClass}>Pricing</p>
              <h2 id="pricing-title" className={`mt-3 ${h2Class}`}>
                <TightPunctuation>Plain prices. Pick a plan when you go live.</TightPunctuation>
              </h2>
            </div>
            <p className={`lg:col-span-5 lg:col-start-8 lg:self-end ${bodyClass} max-w-[52ch]`}>
              Create and preview your site free. Every plan includes the editor, a contact form and
              AI edits; they differ in domains, photos and how much help you get.
            </p>
          </div>

          <div className="mt-10 lg:mt-12">
            <PricingPlans />
          </div>

          <div className="mt-10 grid gap-y-10 lg:grid-cols-12 lg:gap-x-8">
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

      {/* 9. FAQ — <details> nativo; a altura anima via CSS (marketing.css). */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className="border-y border-slate-200 bg-surface py-16 lg:py-24"
      >
        <div className={`${container} grid gap-y-10 lg:grid-cols-12 lg:gap-x-8`}>
          <div className="lg:col-span-4">
            <p className={eyebrowClass}>FAQ</p>
            <h2 id="faq-title" className={`mt-3 ${h2Class}`}>
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
              <details key={faq.question} className="ns-faq group">
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-5 font-display text-lg font-semibold tracking-[-0.015em] text-ink transition-colors duration-150 hover:text-brand [&::-webkit-details-marker]:hidden ${focusRing}`}
                >
                  {faq.question}
                  <PlusIcon className="size-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" />
                </summary>
                <p className="max-w-[65ch] pr-10 pb-6 text-base leading-[1.65] text-pretty text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CTA FINAL — o endereço como motivo, grande, e o campo de novo. */}
      <section
        aria-labelledby="final-cta-title"
        data-hide-mobile-cta
        className="bg-white py-20 lg:py-32"
      >
        <div className={`${container} grid gap-y-10 lg:grid-cols-12 lg:items-end lg:gap-x-8`}>
          <div className="lg:col-span-7">
            <h2 id="final-cta-title" className={h2Class}>
              <TightPunctuation>See your website before you spend a dollar.</TightPunctuation>
            </h2>
            <p className="mt-8 font-display text-3xl leading-tight font-semibold tracking-[-0.03em] lg:text-5xl">
              <span className="sr-only">Your address could be </span>
              <UrlMotif slug="your-business" caret />
            </p>
          </div>
          <div className="lg:col-span-5">
            <PromptForm examples={false} caption="Free account. Create and preview free." />
          </div>
        </div>
      </section>
    </>
  );
}
