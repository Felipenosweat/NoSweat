import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactElement, SVGProps } from "react";
import { ChevronRightIcon, IconTile, PageHeader, sectionTitle } from "@/components/DashboardUi";
import { GlassButton, GlassCard, cx, focusRing, glassButtonClass } from "@/components/glass";
import { GUIDE_FAQ, GUIDE_SECTIONS, type GuideSectionId } from "@/lib/guide";
import { getViewer } from "@/server/auth/viewer";
import { supportHref } from "../AccountShell";
import {
  BillingIcon,
  ClientsIcon,
  EstimatesIcon,
  HelpIcon,
  HomeIcon,
  InvoicesIcon,
  ScheduleIcon,
  SettingsIcon,
  SocialIcon,
  StarIcon,
  TeamIcon,
  WebsiteIcon,
} from "../NavIcons";
import { TakeTourButton } from "./TakeTourButton";

export const metadata: Metadata = { title: "How No Sweat works", robots: { index: false } };

// Guia do painel: uma seção curta por área (o que é, botão para abrir, 3 passos) e as perguntas
// que os donos mais fazem. O conteúdo fica em lib/guide.ts; as âncoras (#clients...) são usadas
// pelos estados vazios das páginas ("New here? See how it works").

/** Ícone de cada seção: o mesmo da navegação. */
const SECTION_ICONS: Record<GuideSectionId, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  home: HomeIcon,
  website: WebsiteIcon,
  clients: ClientsIcon,
  schedule: ScheduleIcon,
  estimates: EstimatesIcon,
  invoices: InvoicesIcon,
  social: SocialIcon,
  reviews: StarIcon,
  settings: SettingsIcon,
  team: TeamIcon,
  billing: BillingIcon,
};

/** Cápsula do índice (pula para a seção). */
const topicLink = `inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-semibold text-(--glass-fg-muted) glass glass-interactive hover:text-(--glass-fg) ${focusRing}`;

export default async function GuidePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/guide");
  const help = supportHref(viewer.user.email);
  const helpIsMail = help.startsWith("mailto:");

  return (
    <div>
      <PageHeader
        title="How No Sweat works"
        description="A quick guide to every part of your account. Tap a topic to jump to it."
        actions={<TakeTourButton />}
      />

      <nav aria-label="Guide topics" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {GUIDE_SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className={topicLink}>
                {section.title}
              </a>
            </li>
          ))}
          <li>
            <a href="#faq" className={topicLink}>
              Questions
            </a>
          </li>
        </ul>
      </nav>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {GUIDE_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.id];
          const headingId = `guide-${section.id}`;
          return (
            <GlassCard
              key={section.id}
              as="section"
              id={section.id}
              aria-labelledby={headingId}
              className="flex scroll-mt-24 flex-col"
            >
              <div className="flex items-center gap-3">
                <IconTile>
                  <Icon className="size-5" />
                </IconTile>
                <h2
                  id={headingId}
                  className="font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink"
                >
                  {section.title}
                </h2>
              </div>
              <p className="mt-3 text-[15px] leading-[1.6] text-slate-600">{section.body}</p>
              <ol className="mt-4 grid gap-2">
                {section.steps.map((text, index) => (
                  <li key={text} className="flex gap-3 text-[14px] leading-[1.5] text-slate-700">
                    <span
                      aria-hidden="true"
                      className="glass-edge grid size-6 shrink-0 place-items-center rounded-full bg-brand/10 text-[12px] font-semibold text-brand"
                    >
                      {index + 1}
                    </span>
                    <span className="pt-0.5">
                      <span className="sr-only">Step {index + 1}: </span>
                      {text}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-auto pt-5">
                <GlassButton
                  href={section.cta.href}
                  variant="secondary"
                  size="sm"
                  trailingIcon={<ChevronRightIcon />}
                >
                  {section.cta.label}
                </GlassButton>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <section id="faq" aria-labelledby="faq-heading" className="mt-12 scroll-mt-24">
        <h2 id="faq-heading" className={sectionTitle}>
          Questions owners ask
        </h2>
        <GlassCard padding="none" className="mt-4 divide-y divide-(--glass-rim)">
          {GUIDE_FAQ.map((faq) => (
            <details key={faq.id} id={faq.id} className="group scroll-mt-24">
              <summary
                className={cx(
                  "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-3 text-[15px] font-semibold text-ink sm:px-6 [&::-webkit-details-marker]:hidden",
                  focusRing,
                )}
              >
                {faq.question}
                <ChevronRightIcon className="size-4 shrink-0 text-slate-400 group-open:rotate-90 motion-safe:transition-transform motion-safe:duration-150" />
              </summary>
              <p className="max-w-[70ch] px-5 pb-5 text-[15px] leading-[1.6] text-slate-600 sm:px-6">
                {faq.answer}
              </p>
            </details>
          ))}
        </GlassCard>
      </section>

      <GlassCard
        as="section"
        aria-labelledby="guide-help"
        className="mt-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <IconTile>
            <HelpIcon className="size-5" />
          </IconTile>
          <div className="min-w-0">
            <h2 id="guide-help" className="text-[15px] font-semibold text-ink">
              Still stuck?
            </h2>
            <p className="text-[14px] leading-[1.5] text-slate-600">
              Our team will help you {helpIsMail ? "by email" : "on WhatsApp"}.
            </p>
          </div>
        </div>
        <a
          href={help}
          {...(helpIsMail ? {} : { target: "_blank", rel: "noreferrer" })}
          className={glassButtonClass({ variant: "secondary" })}
        >
          Message our team
        </a>
      </GlassCard>
    </div>
  );
}
