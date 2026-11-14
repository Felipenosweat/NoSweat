// Título do topo: um slogan fixo (pedido do fundador: nada de palavra trocando), branco sobre o
// ink, em Plus Jakarta Sans. É o LCP: o texto já vem pronto do servidor e a entrada dele não mexe
// na opacidade. O ponto final da Plus Jakarta fica solto demais no tamanho grande: `Dot` puxa ele
// para perto da letra (ajuste ótico). No celular o tamanho acompanha a largura (até 2.75rem) para
// cada frase caber numa linha.

function Dot() {
  return <span className="ml-[-0.07em]">.</span>;
}

export function HeroTitle() {
  return (
    <h1
      id="hero-title"
      className="lp-rise-solid font-display text-[clamp(2.25rem,10.4vw,2.75rem)] leading-none font-extrabold tracking-[-0.04em] text-white sm:text-[clamp(3rem,7vw,6rem)] sm:leading-[0.98] sm:tracking-[-0.045em]"
    >
      Small business
      <Dot />
      <br />
      Serious website
      <Dot />
    </h1>
  );
}
