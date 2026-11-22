import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import {
  container,
  focusRing,
  primaryButton,
  secondaryButton,
} from "@/components/marketing/styles";

// Contato e suporte (auditoria: página faltando). E-mail sempre; WhatsApp só com SALES_WHATSAPP
// (mesma regra do rodapé e da landing). Sem prazo de resposta prometido: nada no produto garante
// um prazo, então a frase é "as soon as we can". Azul só no botão principal (o e-mail).

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about No Sweat, your website or a payment? Email us and a person on the team writes back.",
  alternates: { canonical: "/contact" },
};

const LINKS = [
  { href: "/pricing", label: "Pricing", note: "Plans, AI credits and what’s included." },
  {
    href: "/refund",
    label: "Refund Policy",
    note: "The 30-day money-back guarantee and how to ask for it.",
  },
  { href: "/terms", label: "Terms of Service", note: "Renewal, cancellation and the rules." },
  { href: "/privacy", label: "Privacy Policy", note: "What we collect and why." },
];

export default function ContactPage() {
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      <section aria-labelledby="contact-title" className="border-b border-slate-200 bg-surface">
        <div className={`${container} pt-14 pb-14 lg:pt-24 lg:pb-20`}>
          <p className="font-display text-sm font-semibold text-slate-600">Contact</p>
          <h1
            id="contact-title"
            className="mt-4 max-w-[16ch] font-display text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink lg:text-6xl lg:leading-[1.02]"
          >
            <TightPunctuation>Questions? Write to us.</TightPunctuation>
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600">
            About your website, a plan, a payment or a refund. A person on the team reads every
            message. We reply as soon as we can.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={`mailto:${CONTACT_EMAIL}`} className={`w-full sm:w-auto ${primaryButton}`}>
              Email {CONTACT_EMAIL}
            </a>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full sm:w-auto ${secondaryButton}`}
              >
                Message us on WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
          <p className="mt-4 max-w-[60ch] text-[13px] leading-relaxed text-(--glass-fg-muted)">
            No email app on this device? Copy the address:{" "}
            <span className="font-semibold break-all text-ink select-all">{CONTACT_EMAIL}</span>. If
            you have an account, write from the email you signed up with so we can find it.
          </p>
        </div>
      </section>

      <section aria-labelledby="contact-links-title" className="bg-white py-14 lg:py-20">
        <div className={`${container} grid gap-y-8 lg:grid-cols-12 lg:gap-x-8`}>
          <h2
            id="contact-links-title"
            className="font-display text-2xl leading-tight font-bold tracking-[-0.02em] text-ink lg:col-span-4"
          >
            Answers you might need
          </h2>
          <ul className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`group flex min-h-11 flex-col gap-0.5 rounded-sm py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 ${focusRing}`}
                >
                  <span className="font-display text-lg font-semibold tracking-[-0.01em] text-ink group-hover:underline group-hover:underline-offset-4">
                    {link.label}
                  </span>
                  <span className="text-[15px] text-slate-600">{link.note}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/#faq"
                className={`group flex min-h-11 flex-col gap-0.5 rounded-sm py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 ${focusRing}`}
              >
                <span className="font-display text-lg font-semibold tracking-[-0.01em] text-ink group-hover:underline group-hover:underline-offset-4">
                  FAQ
                </span>
                <span className="text-[15px] text-slate-600">How No Sweat works, in short.</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
