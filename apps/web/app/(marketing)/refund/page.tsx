import type { Metadata } from "next";
import Link from "next/link";
import {
  ContactEmailLink,
  LegalPage,
  type LegalSection,
} from "@/components/marketing/legal/LegalPage";
import {
  CANCELLATION_TERMS,
  REFUND_TERMS,
  REFUND_WINDOW_DAYS,
} from "@/components/marketing/legal/policy";
import { textLink } from "@/components/marketing/styles";

// Política de reembolso (auditoria J11). Decisão do fundador (nov/2026): garantia de 30 dias com
// devolução total do PRIMEIRO pagamento de qualquer plano; renovações não são devolvidas, mas dá
// para cancelar a qualquer hora. O pedido é por e-mail e o admin faz a devolução à mão (não há
// botão de reembolso no app). As frases principais vêm de legal/policy.ts (as mesmas dos Termos e
// do FAQ). Rascunho: revisar com um advogado antes de lançar os planos pagos.

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Every No Sweat plan comes with a ${REFUND_WINDOW_DAYS}-day money-back guarantee on your first payment. Here's how to ask for a refund.`,
  alternates: { canonical: "/refund" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "guarantee",
    title: `Our ${REFUND_WINDOW_DAYS}-day guarantee`,
    content: (
      <>
        <p>{REFUND_TERMS}</p>
        <p>
          The guarantee covers the first payment on your account for any plan (Starter, Pro or
          Premium), whether you paid monthly or yearly. The {REFUND_WINDOW_DAYS} days start on the
          day of that payment.
        </p>
      </>
    ),
  },
  {
    id: "how-to-ask",
    title: "How to ask for a refund",
    content: (
      <>
        <p>
          Email us at <ContactEmailLink /> within {REFUND_WINDOW_DAYS} days of your first payment.
          Please write from the email address on your account, or tell us which address it is, so we
          can find your plan.
        </p>
        <p>
          We send the refund back to the way you paid. How long it takes to reach you depends on
          your bank or payment provider.
        </p>
      </>
    ),
  },
  {
    id: "your-website",
    title: "What happens to your website",
    content: (
      <>
        <p>
          A refund ends your plan, so <strong>your website is unpublished</strong>: it goes offline
          at its nosweatfd.com address and on your own domain, if you connected one.
        </p>
        <p>
          Your draft stays in your account. You can keep editing it, and you can publish it again
          later by choosing a plan. That later payment isn’t covered by the guarantee, because it
          isn’t your first payment.
        </p>
        <p>
          If you connected your own domain, it stays yours. You can point it somewhere else at your
          domain registrar.
        </p>
      </>
    ),
  },
  {
    id: "renewals",
    title: "Renewals and cancellation",
    content: (
      <>
        <p>
          Renewals after your first payment are not refunded. You can cancel anytime so you aren’t
          charged again:
        </p>
        <p>{CANCELLATION_TERMS}</p>
        <p>
          The full rules are in our{" "}
          <Link href="/terms#renewal" className={textLink}>
            Terms of Service
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <p>
        This policy doesn’t limit any refund rights you have under the law where you live or run
        your business.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about a payment or a refund? Email us at <ContactEmailLink />, or see our{" "}
        <Link href="/contact" className={textLink}>
          contact page
        </Link>
        .
      </p>
    ),
  },
];

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updatedIso="2026-11-17"
      updatedLabel="November 17, 2026"
      intro={
        <p>
          Try a paid plan without worrying about it. If No Sweat isn’t right for you, ask within{" "}
          {REFUND_WINDOW_DAYS} days of your first payment and we’ll refund it in full.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
