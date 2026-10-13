import { Fragment } from "react";

// Em tamanhos de display, "." e "," ficam com um vão visível depois da letra anterior.
// Este helper puxa a pontuação de fim de palavra 0.04em para a esquerda (ajuste óptico).
// O texto continua idêntico para leitores de tela: só envolve o caractere num <span>.
const PUNCTUATION = /([.,])(?=\s|$)/;

export function TightPunctuation({ children }: { children: string }) {
  const parts = children.split(PUNCTUATION);
  return (
    <>
      {parts.map((part, index) =>
        // split com grupo de captura: índices ímpares são a pontuação capturada.
        index % 2 === 1 ? (
          <span key={index} className="-ml-[0.04em]">
            {part}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
