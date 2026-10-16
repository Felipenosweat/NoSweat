import { Fragment } from "react";

// Em tamanhos de display, "." e "," ficam com um vão visível depois da letra anterior.
// Este helper puxa a pontuação de fim de palavra para a esquerda (ajuste óptico): 0.04em por
// padrão; `strong` (0.1em) para o Plus Jakarta em negrito com tracking apertado (landing).
// O texto continua idêntico para leitores de tela: só envolve o caractere num <span>.
const PUNCTUATION = /([.,])(?=\s|$)/;

export function TightPunctuation({
  children,
  strong = false,
}: {
  children: string;
  strong?: boolean;
}) {
  const parts = children.split(PUNCTUATION);
  return (
    <>
      {parts.map((part, index) =>
        // split com grupo de captura: índices ímpares são a pontuação capturada.
        index % 2 === 1 ? (
          <span key={index} className={strong ? "-ml-[0.1em]" : "-ml-[0.04em]"}>
            {part}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
