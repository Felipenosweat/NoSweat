# Escape Coffee Company: torrefação de especialidade (Montreal)

- Ao vivo: https://escape.cafe/ (escapecoffee.ca redireciona para lá)
- Prêmio: Site of the Day da Awwwards em 15/05/2024, segundo o resumo da busca da página
  awwwards.com/sites/escape-coffee. O rodapé do site diz "Website by TUX" (conferido no HTML); a
  busca não nomeou a agência. A página do prêmio não abriu daqui, então a evidência é `partial`.
- Método: o mesmo do estudo `coffee-collective.md` (Playwright, 1440×900 e 390×844, "reduzir
  movimento", estilo computado, `document.fonts`, animações, Tab). Prints fora do repositório.

## Observação

- ~7 700 px. Herói de foto inteira (onda) com "GO AGAINST THE GRAIN" em caixa-alta condensada
  enorme; as letras caem no lugar ao carregar.
- Sobre o herói, uma fileira de **cartões de ficha técnica** contornados: nome, preço e linhas
  TYPE / ORIGIN / PROCESS em caixa-alta pequena.
- Depois: um quiz ("Do you prefer your coffee… Caffeinated / Decaf", barra de progresso) →
  carrossel de coleções → "Limited Series" (foto de rocha com um selo carimbado + texto) →
  parágrafo da missão em sans leve grande → foto com coordenadas "48.8532° N — 66.0385° W" →
  "NEVER RUN OUT" com as palavras espalhadas → rodapé preto com o endereço do laboratório.
- Uma faixa vertical (frete grátis) corre pela borda direita no computador.
- Fontes (computadas): Molitor (display condensado; nomes 26 px, "Follow us" 75 px), TWK
  Lausanne 200–400 (texto 16 px, +0,96 px), Garaje (rótulos). O h1 é dividido em spans por letra.
- Movimento: GSAP + ScrollTrigger + Lenis (`html.lenis-smooth`). Com "reduzir movimento" o site
  ficou igual (nenhum tratamento observado).
- Barra de cookies cobre ~10% da tela no computador e ~35% no celular até ser respondida.
- 63 imagens, todas com `alt`. Sem `tel:`. O link "Skip to content" existe mas o foco tem
  `outline: none`. ~4,2 MB e ~320 pedidos.

## Interpretação

- A letra é a marca; o que torna a loja convincente, porém, é a ficha técnica em cada cartão. O
  cliente lê fatos (tipo, origem, processo, preço) em vez de adjetivos.
- As coordenadas são um ornamento que vem do lugar. Barato e próprio.

## O que levei para a North Loop

- Cada item do cardápio como uma pequena ficha: nome, descrição, fatos em mono pequeno (12 OZ,
  NO OAT UPCHARGE, UNTIL 1 PM, GONE BY 10 ON SATURDAYS) e o preço em mono.
- Um ornamento que vem do lugar: no lugar de coordenadas, as marcas de impressão do prédio (antiga
  gráfica), na marca e nos cantos dos blocos.
- O pedido visível desde o herói (botão "Order ahead" e o bilhete "Today").

## Não trazer

- Rolagem sequestrada e movimento que ignora "reduzir movimento"; título partido por letra;
  barra de cookies enorme no celular; sem telefone; contorno de foco removido; as fontes, o slogan
  e as fotos deles.

## Não verificado

- A página do prêmio e a nota; o quiz até o fim; o checkout.
