# SWTCH — a promessa em caixa-alta como imagem (carregamento de carros elétricos)

- Ao vivo: https://swtchenergy.com/ — carregamento de carros elétricos para prédios e empresas
  (EUA e Canadá).
- Prêmio (só busca; a Awwwards não abre deste ambiente): WebSearch
  `awwwards "EV charging" website honorable mention OR "site of the day"` → resumo de
  awwwards.com/sites/swtch: "Honorable Mention on July 3, 2023". O rodapé do site atual diz
  "Website by Locomotive"; o trecho não citava agência, então a versão premiada pode não ser
  exatamente a atual.
- Método (2026-10-27): Playwright Chromium, 1440×900 com 9 passos de roda do mouse, 390×844 com
  9 saltos, 1440×900 com `reducedMotion: "reduce"`; estilo computado (h1/h2/p, `document.fonts`),
  elementos `fixed`, links `tel:`. O Chromium do ambiente não toca o filme do herói (só o pôster
  cinza apareceu). Prints fora do repositório.

## Observação

- **Sequência:** herói em tela cheia com "EV CHARGING, SOLVED." no canto de baixo → texto curto
  à direita + botão em pílula verde-água → frase gigante "CHARGING SOLUTIONS TAILORED TO YOUR
  NEEDS" → três cartões arredondados (Multifamily / Workplace / Public & Retail) com seta redonda
  → bloco do produto (renderização do carregador e do app) → faixa preta de logos de clientes →
  foto escura de motorista no carregador de parede → histórias de clientes → bloco largo em
  degradê verde-água "READY TO ELECTRIFY YOUR PROPERTY?" → rodapé quase preto.
- **Tipos (computado):** uma família só, Akkurat Sub. h1 75 px / 86 px, caixa-alta,
  −2,25 px (≈ −0,03em); a mesma medida volta no h2 do fim; h2 de seção 30 px; parágrafo de
  abertura 22 px / 31 px. No celular o h1 cai para 29,75 px.
- **Cor:** branco, cinza-claro, quase preto e **um** verde-água, usado em botões, setas e no
  bloco de fecho.
- **Movimento:** Lenis (`html.lenis`), carregador `.c-loader`; no celular o cabeçalho vira barra
  verde-água depois do herói. Com "reduzir movimento" a página rodou igual.
- **Contato:** nenhum link `tel:` na página inicial. 6 de 41 imagens sem `alt`.

## Interpretação

- Para um serviço elétrico, a cara "engenharia" vem da letra, não de ícones de raio: um grotesco,
  caixa-alta, entrelinha apertada, nada ao lado da frase.
- O acento só aparece onde há ação, e uma vez em bloco grande no fim. É o oposto de espalhar a
  cor; por isso ela pesa.
- Falha para um eletricista de bairro: telefone escondido e conversa toda de "propriedade",
  nada de horário nem área.

## Levar (princípios)

1. A promessa simples, em caixa-alta de grotesco, como imagem do herói.
2. Uma família, hierarquia por tamanho e caixa.
3. Uma cor forte guardada para ações e um bloco de fecho que repete o pedido.

## Não levar

- Telefone ausente; carregador e rolagem suave; logos de clientes; o verde-água e a Akkurat.
