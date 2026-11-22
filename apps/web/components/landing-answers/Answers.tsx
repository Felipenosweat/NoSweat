import Link from "next/link";
import { Spread } from "./Spread";
import { costAnswer } from "./facts";
import { ClientsProof, ContactProof, ExampleSiteProof, PriceProof, TermsProof } from "./proofs";
import { bodyClass, primaryButton, textLink } from "./ui";

// As cinco perguntas que o dono faz, nesta ordem: quanto custa, se precisa escrever, o que
// acontece com um pedido, se pode sair, com quem fala. Cada resposta é um fato que o produto
// cumpre hoje (ver facts.ts e facts.test.ts) com uma prova ao lado.

type AnswersProps = {
  /** Stripe Checkout ligado (renova sozinho, cancela na conta); senão, venda manual. */
  checkout: boolean;
  promo: boolean;
  offerName: string;
  whatsapp: string | null;
};

export function Answers({ checkout, promo, offerName, whatsapp }: AnswersProps) {
  return (
    <>
      <Spread
        id="pricing"
        side="left"
        headingLevel={1}
        hideMobileCta
        intro={
          <p className="mb-8 max-w-[44ch] text-[17px] leading-[1.55] text-balance text-slate-600 sm:mb-10 lg:text-lg">
            No Sweat builds the website for your small business. Here are straight answers to what
            owners ask us first.
          </p>
        }
        question="What does a website cost me?"
        answer={costAnswer}
        detail={
          <>
            <p className={bodyClass}>
              Describing your business and answering a few quick questions is free, with no credit
              card. You pick a plan when you build your site.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Link href="/create" className={`w-full sm:w-auto ${primaryButton}`}>
                Start my website
              </Link>
              <Link href="/pricing" className={`justify-center sm:justify-start ${textLink}`}>
                Compare plans
              </Link>
            </div>
          </>
        }
        proof={<PriceProof promo={promo} offerName={offerName} />}
      />

      <Spread
        id="story"
        side="right"
        proofWidth="wide"
        question="Do I have to write anything?"
        answer="No. Tell us what you do and where in a sentence or two. We write the headline, the services and the FAQ."
        detail={
          <p className={bodyClass}>
            You read it in a private preview and change any word before it goes live. Nothing is
            published until you say so.
          </p>
        }
        proof={<ExampleSiteProof />}
      />

      <Spread
        id="clients"
        side="left"
        tinted
        proofWidth="wide"
        question="What happens when someone fills out the form?"
        answer="You get an email, and the request lands in your Clients list."
        detail={
          <p className={bodyClass}>
            Move each person from New to Contacted, Quoted, then Won or Lost. Add notes, reply by
            email, or tap to call or text them.
          </p>
        }
        proof={<ClientsProof />}
      />

      <Spread
        id="leave"
        side="right"
        question="Can I leave?"
        answer="Yes. There’s no contract. You keep your plan until the end of the month or year you paid for."
        detail={
          <p className={bodyClass}>
            It doesn’t continue after you cancel or choose not to renew. You can also delete a
            website from your dashboard at any time.
          </p>
        }
        proof={<TermsProof checkout={checkout} />}
      />

      <Spread
        id="contact"
        side="left"
        tinted
        question="Who do I call?"
        answer="Write to us. A person on the team reads it and writes back."
        detail={
          <p className={bodyClass}>
            We answer by email, so you can ask from anywhere, including the job site.
          </p>
        }
        proof={<ContactProof whatsapp={whatsapp} />}
      />
    </>
  );
}
