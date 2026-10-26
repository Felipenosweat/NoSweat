# Tipografia e espaçamento

Números medidos (estilo computado) nos sites da pesquisa de 2026-10-26 e regras que tiramos
deles. Os estudos estão em `studies/`; os ids entre parênteses são de `references.json`.

## Famílias

- **Cada família tem um trabalho.** Nome/manchete, texto corrido e fatos (rótulos, números,
  horários). Mosby's Files usa caixa-alta condensada para nomes, um serif para a história e um
  mono para fatos (`mosbys-files`); Explora usa um serif de masthead, outro para títulos e um
  sans para o texto (`explora-journal`).
- **Duas famílias bastam, três no máximo.** JOSHUA'S usa 2, a-lign 1, Mat Voyce 1 variável.
  Disciplina é o que parece caro, não a quantidade de fontes.
- **Pares por arquétipo** (eixo `typeSystem`):
  - `heritage-grandeur`: Didone/Bodoni de alto contraste (itálico para o nome) + sans
    geométrico leve para rótulos (Aurelia: Bodoni Moda + Jost).
  - `quiet-luxury`: um grotesco só, ou um serif só.
  - `broadsheet-editorial`: serif de texto (Garamond/Caslon) + sans humanista.
  - `kinetic-type`: uma variável expressiva, e um momento só de variação.

## Escala

- **A razão display:texto define o clima.** Explora ≈ 2,2× (calmo), JOSHUA'S 4,3×, a-lign 6×,
  Mosby 7×, Mat Voyce 34× (o nome é o site). Palácio/hotel: **4–6× no herói** (o Aurelia passa
  disso no nome, de propósito: é o "monumento" da abertura) e degraus de ~1,4 entre títulos.
- **Títulos em `clamp()`** pela largura, com teto: `clamp(2.4rem, 4.2vw, 4rem)`.
- **Masthead de luxo:** caixa-alta ou itálico de alto contraste, entrelinha 0,85–0,95
  (JOSHUA'S: 86 px, 0,85, −0,025em; 42,5 px no celular), sobre foto escura e quente.

## Espaçamento entre letras

- **Aperta quando cresce:** a-lign vai de −0,016em em 16 px a −0,065em acima de 96 px.
- **Abre quando é pequeno e em caixa-alta:** rótulos de 10–11 px com +0,12em a +0,24em
  (Explora: 11 px, +0,12em). No Aurelia, `.a-caps` usa +0,24em.

## Texto corrido

- **18–20 px, 55–70 caracteres por linha.** Explora: 18 px numa coluna de 600 px; JOSHUA'S:
  20 px em 720 px. Mosby: 24 px em 504 px (~40 caracteres), parece página de livro. Nunca
  12 px no celular (a-lign).
- Entrelinha 1,6–1,75 em texto, 0,9–1,05 em títulos. `text-wrap: balance` em títulos,
  `pretty` em parágrafos.
- Duas colunas (`columns: 2`) só no computador e só em texto curto e contínuo (introdução do
  Aurelia), nunca em texto que obriga a voltar para cima.

## Rótulos e números

- **Rótulo sobre o título carrega fato, não adjetivo:** "THE DESTINATIONS • 7 MIN READ",
  "02 · FROM €1,450 A NIGHT". Escurecer o acento até 4,5:1 sobre fundo claro (o bronze da
  Explora fica em 4,37:1, quase).
- Números de capítulo em romano itálico (I–V) ou em `tabular-nums` com zero à esquerda (01–04).
- Preços com `tabular-nums` e moeda explícita.

## Um recurso de impressão por página

Escolha **um**: capitular de 4–5 linhas + lista de fatos (Mosby, Aurelia), abertura gigante
em caixa-alta (JOSHUA'S, 57,6 px), uma palavra na vertical, moldura com canto cortado. Dois
recursos competem; três viram fantasia.

## Espaçamento

- Ritmo de 8 px. Seções variam pelo peso do conteúdo (no Aurelia: herói 100svh, introdução
  com respiro grande, suítes mais apertadas, galeria presa), nunca o mesmo `py-24` em tudo.
- Margens laterais: 20 px no celular, 40 px no tablet, 40 px+ no computador com conteúdo
  limitado a ~1400 px. Grade de 12 colunas; desalinhe de propósito (Explora: 2 colunas de
  imagens desiguais e deslocadas numa grade de 10 com margem de 96 px).
- Fios de 1 px (ouro a 30–40% sobre escuro, tinta a 15% sobre claro) organizam melhor que
  cartões e sombras.
