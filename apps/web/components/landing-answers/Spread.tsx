import type { ReactNode } from "react";
import { answerClass, questionClass, shell } from "./ui";

// Um bloco da página: a pergunta do dono em letra enorme, embaixo a resposta (um fato) e a prova
// (captura de verdade, preço do plans.ts, trecho dos Termos). Os blocos alternam: no computador,
// "left" põe a pergunta e a resposta à esquerda e a prova à direita; "right" espelha (a
// pergunta começa na 3ª coluna, sempre alinhada à esquerda). No celular
// é sempre pergunta → resposta → prova.

type SpreadProps = {
  id: string;
  side: "left" | "right";
  question: string;
  /** O fato, em uma ou duas frases curtas. */
  answer: ReactNode;
  /** Texto de apoio, links e botões embaixo do fato. */
  detail?: ReactNode;
  proof: ReactNode;
  /** A primeira pergunta é o título da página (h1). */
  headingLevel?: 1 | 2;
  /** Fundo cinza-claro para variar o ritmo. */
  tinted?: boolean;
  /** Proporção da prova no computador: "wide" = 8 de 12 colunas. */
  proofWidth?: "wide" | "half";
  /** Some com a barra fixa do celular enquanto o bloco está na tela (o hero). */
  hideMobileCta?: boolean;
  intro?: ReactNode;
};

export function Spread({
  id,
  side,
  question,
  answer,
  detail,
  proof,
  headingLevel = 2,
  tinted = false,
  proofWidth = "half",
  hideMobileCta = false,
  intro,
}: SpreadProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const titleId = `${id}-title`;
  const right = side === "right";
  const wide = proofWidth === "wide";

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      data-hide-mobile-cta={hideMobileCta ? "" : undefined}
      className={`scroll-mt-16 ${tinted ? "bg-surface" : "bg-white"} ${
        headingLevel === 1 ? "pt-10 pb-20 sm:pt-16 lg:pt-20 lg:pb-32" : "py-20 lg:py-32"
      }`}
    >
      <div className={shell}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-10">
          <div className={right ? "lg:col-span-10 lg:col-start-3" : "lg:col-span-11"}>
            {intro}
            <Heading id={titleId} className={`${questionClass} max-w-[13ch]`}>
              {question}
            </Heading>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-y-10 sm:mt-14 lg:mt-20 lg:grid-cols-12 lg:gap-x-10">
          <div
            className={`min-w-0 ${wide ? "lg:col-span-4" : "lg:col-span-5"} ${
              right ? `lg:order-2 ${wide ? "lg:col-start-9" : "lg:col-start-8"}` : ""
            }`}
          >
            {/* Fio curto acima do fato: marca onde a resposta começa. */}
            <span aria-hidden="true" className="block h-px w-10 bg-ink" />
            <p className={`mt-6 ${answerClass}`}>{answer}</p>
            {detail && <div className="mt-6">{detail}</div>}
          </div>
          <div
            className={`min-w-0 ${wide ? "lg:col-span-8" : "lg:col-span-7"} ${
              right ? "lg:order-1 lg:col-start-1 lg:row-start-1" : ""
            }`}
          >
            {proof}
          </div>
        </div>
      </div>
    </section>
  );
}
