// Título do topo: um slogan fixo (pedido do fundador: nada de palavra trocando). Em Plus Jakarta
// Sans (fonte da marca), texto parado. É o LCP: o texto já vem pronto do servidor. O ponto final
// da Plus Jakarta fica solto demais no tamanho grande: `Dot` puxa ele para perto da letra (ajuste
// ótico). No celular o tamanho acompanha a largura (até 2.75rem) para cada frase caber numa linha.

function Dot() {
  return <span className="ml-[-0.07em]">.</span>;
}

export function HeroTitle() {
  return (
    <h1
      id="hero-title"
      className="lp-rise-solid font-display text-[clamp(2.25rem,10.4vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance text-ink lg:text-[clamp(3rem,5vw,4.5rem)]"
    >
      Small business
      <Dot />
      <br />
      Serious website
      <Dot />
    </h1>
  );
}
