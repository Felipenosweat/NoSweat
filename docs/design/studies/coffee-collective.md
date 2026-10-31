# Coffee Collective: torrefação, cafés e padaria (Copenhague)

- Ao vivo: https://coffeecollective.dk/
- Prêmio: Honorable Mention da Awwwards em 26/09/2025, segundo o resumo da busca da página
  awwwards.com/sites/coffee-collective. A página do prêmio não abriu (Awwwards inacessível daqui) e o
  site não tem crédito de agência, então a evidência é `partial`.
- Método: Playwright (Chromium), 2026-10-27. 1440×900 e 390×844 (UA de iPhone, toque); prints aos
  600 ms e aos 6 s, depois a cada ~1,1 tela com a roda do mouse; uma rodada com
  `reducedMotion: "reduce"`; 4 Tabs + print; estilo computado de h1/h2/h3/p; `document.fonts`;
  `document.getAnimations()`; bytes por `requestfinished`. Prints ficaram fora do repositório.

## Observação

- Página de ~7 470 px. Herói de foto inteira (fazenda de café) com o saco do produto no meio,
  h1 "Clean and fruity" à esquerda, notas de sabor embaixo à esquerda, botão contornado embaixo à
  direita.
- Depois: fileira "Selected coffees" em ladrilhos cinza-claro → **blocos de cor inteiros** (verde
  escuro com lista + foto; vermelho-amora com foto macro de cerejas e "Fruity and sweet"; malva
  com a newsletter) → equipamentos → atacado → "Visit our shops" com 8 fotos e o nome do bairro
  de cada loja → rodapé em colunas com a marca condensada.
- Tipografia: uma família só, NB International Pro 400. h1 54 px (30–40 px no celular), entrelinha
  0,9–1, −0,46 px; h2 48 px; texto 16/24 px. Sem itálico nem negrito.
- Fundo papel `rgb(250 246 237)`, tinta `rgb(76 67 65)`.
- Movimento: sem GSAP nem rolagem suave; carrosséis Swiper. 0 animações com "reduzir movimento".
- Um modal de newsletter ("Stories from the collective") abre segundos depois da carga e fica
  sobre o conteúdo no computador e no celular até ser fechado.
- 57 imagens, 2 sem `alt`. Nenhum link `tel:`. ~6,5 MB e ~300 pedidos no computador.
- Foco visível (contorno de 1 px + anel de 3 px), sem rolagem lateral.

## Interpretação

- A calma vem da contenção: uma família, papel, e de tempos em tempos um bloco grande de **uma**
  cor de marca dividido com uma foto. Os blocos fazem o ritmo que, num site mais enfeitado, viria
  de ornamento ou movimento.
- O título curto e sensorial ("Clean and fruity") com os fatos pequenos embaixo é a hierarquia
  certa para café: o gosto primeiro, o preço logo depois.

## O que levei para a North Loop

- Superfície "brand-block": blocos inteiros de azul de inverno (herói à direita, o dia, as falas,
  a visita) alternando com papel, cada um com um objeto ou foto.
- "Visit" como bloco próprio, com endereço grande.

## Não trazer

- Modal de newsletter sobre o conteúdo; ausência de telefone; a fonte (comercial), a paleta e as
  fotos deles.

## Não verificado

- A página do prêmio e a agência; o fluxo da loja (carrinho, pagamento).
