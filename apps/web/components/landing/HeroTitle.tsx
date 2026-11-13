// Título do topo: um slogan fixo (pedido do fundador: nada de palavra trocando). Em Plus Jakarta
// Sans (fonte da marca), texto parado. É o LCP: o texto já vem pronto do servidor. O ponto final
// da Plus Jakarta fica solto demais no tamanho grande: `Dot` puxa ele para perto da letra (ajuste
// ótico).

function Dot() {
  return <span className="ml-[-0.07em]">.</span>;
}

export function HeroTitle() {
  return (
    <h1
      id="hero-title"
      className="lp-h lp-display lp-rise-solid text-[clamp(2.9rem,6.6vw,5.75rem)] leading-[1.02] tracking-[-0.035em]"
    >
      Small business
      <Dot />
      <br />
      Serious website
      <Dot />
    </h1>
  );
}
