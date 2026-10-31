# Estudo de caso: Fade & Co. Barbers

Demonstração de uma barbearia **fictícia** de Chicago em `/demos/fade-and-co-barbers` (fora do
índice de busca: `robots: noindex`). Código em `apps/web/app/demos/fade-and-co-barbers/` e
`apps/web/components/demos/fade-and-co/`. Todos os fatos (barbeiros, endereço, horário, preços,
política de walk-in, telefone 555, as duas frases de clientes) vêm do site-modelo
`packages/fixtures/src/library/fade-and-co-barbers.ts`, lido direto em `content.ts`: nada é
reescrito à mão.

## Pedido e direção dada

Arquétipo **kinetic-type**: composição `type-poster` (a letra é a imagem), tipo
`variable-expressive` (uma fonte variável com mudança de largura e peso + uma face de texto
simples), hierarquia `headline-led`, fotos `duotone`, navegação `floating-pill`, movimento
`kinetic`, superfície `brand-block`. Precisa ter: a tabela de preços, os barbeiros, um fluxo
"book a chair" (serviço → barbeiro → horário, dizendo que nada é enviado), horário, walk-ins
(o dono diz que aceita) e reservar/ligar a um toque no celular. Não pode parecer o Aurelia nem o
molde Signature.

## Referências (pesquisa de 2026-10-26)

| id                 | Prêmio (evidência)                                                                                       | O que pegamos                                                                                                                                                                               | O que não pegamos                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `crisp-barbershop` | Honorable Mention, 11/08/2026 (resultado de busca da página awwwards.com/sites; não aberta)              | uma voz larga e pesada em caixa-alta para todo título; preços como o quadro da parede; "Book" no topo e de novo após cada bloco; endereço e horário num bloco escuro antes da marca gigante | rolagem dentro de um `div` (quebra âncoras), sem `tel:`, ignora "reduzir movimento" |
| `safari-riot`      | Site of the Day, 03/07/2020 (resultado de busca; site atualizado depois, versão premiada não confirmada) | o eixo de largura (`wdth`) como resposta ao ponteiro, letra a letra; ajustar a palavra à linha pela largura, não pelo tamanho                                                               | tela só com duas palavras, h1 escondido, navegação por hover                        |

Registros em `docs/design/research-inbox/fade-and-co-barbers.json`; estudos em
`studies/crisp-barbershop.md` e `studies/safari-riot.md`. A Awwwards segue inacessível daqui;
os dois sites foram abertos ao vivo (1440, 390 e "reduzir movimento").

## Três direções

**A. The Fade (escolhida).** O nome faz um degradê. "FADE & CO." em Anybody peso 900 e, embaixo,
três linhas "FADE" cada vez mais finas e estreitas (peso 640 → 380 → 140, largura 100 → 88 → 74),
marcadas "No. 2 / No. 1 / No. 0" como os pentes da máquina: um corte degradê desenhado com letra.
Blocos chapados de vermelho de barbearia, osso e quase-preto alternam por seção; as fotos entram
todas no mesmo duotone vinho/osso. O movimento é o próprio corte: as linhas afinam ao carregar e
o ponteiro passa como uma máquina, afinando as letras perto dele.

**B. Sign painter.** A barbearia como letreiro pintado à mão: títulos com sombra projetada,
filetes, um selo redondo com o ano, preços num quadro-negro. Bonito, mas puxa para ornamento
(selos, sombras), arrisca o "selo fixo" que a regra 8 proíbe e fica perto do clássico
"vintage barbershop" que todo modelo pronto tem.

**C. Price board kinetic.** A página inteira é o quadro de preços: linhas que correm de lado
como um placar de estação, cada serviço uma linha que se abre ao toque. Muito útil, mas a
primeira dobra vira tabela e perde o "dá vontade de mostrar"; o nome some.

**Por que A:** é a única em que a primeira dobra só serve a esta casa (a palavra do nome é o
serviço que ela vende, e a forma da tipografia é o corte), e funciona sem foto. De B ficou a
ideia de letreiro (caixa-alta larga, osso sobre vermelho); de C, o quadro de preços preto com
linhas que mudam de largura no hover e o botão "Book" em cada linha.

## Decisões

- **Paleta:** vermelho `#a3191e`, vermelho-escuro `#7c1116` (hover), osso `#f1e8d9`, quase-preto
  `#1a0b0b`, coral `#f07a6a` só sobre o preto (preços, rótulos). Osso sobre vermelho 6,4:1; osso
  sobre preto 15,8:1; coral sobre preto 7,0:1. O verde/latão do site-modelo ficou para o gerador:
  a direção pedia blocos de cor de marca, e vermelho + osso é o poste de barbeiro.
- **Tipo:** Anybody (variável, peso 100–900 e largura 50–150 via `next/font` com `axes: ["wdth"]`)
  é a única voz de display; Hanken Grotesk no texto. Cada letra é um `span` com `--wg`/`--wd`
  (propriedades registradas com `@property`, então animam), e `font-weight`/`font-stretch` saem
  delas com `calc()`.
- **Ordem:** herói (vermelho) → faixa de preços correndo (preto, decorativa, `aria-hidden`) →
  "Every cut ends with a neck shave and a hot towel." (osso; o peso das palavras sobe com a
  rolagem) + 3 números do dono (4 cadeiras, 3 barbeiros, 2017) → quadro de preços (preto) →
  barbeiros (vermelho; cada nome ocupa a linha inteira pela largura) → reservar (osso, cartão
  preto) → horário e endereço (vermelho, horário em letra de cartaz) → rodapé (preto, a marca
  refaz a fade) → selo No Sweat.
- **Barbeiros:** DARNELL / TONY / KEV no mesmo tamanho; a largura de cada um é achada por busca
  binária no eixo `wdth` até a palavra caber na linha (69,5% / 107% / 150%). É layout, roda até
  com "reduzir movimento". Sem foto ao lado dos nomes: as fotos são cenas de banco e o rodapé diz
  que nenhuma mostra os barbeiros.
- **Reservar (demonstração):** 4 passos sem dados pessoais. O "bilhete" no topo do cartão mostra
  o que já foi escolhido em letra grande e cada parte entra abrindo a largura. Os horários são de
  30 em 30 minutos dentro do horário do dono, terminando antes de fechar; não marcamos "ocupado"
  (seria inventado). "Book →" em cada linha do quadro abre o fluxo já com o serviço. Selo
  "Demonstration · nothing is sent" desde o primeiro passo e texto na confirmação (`role="status"`).
- **Horário:** "Open now / Closed now" pela hora de Chicago e a linha de hoje marcada, só no
  navegador. Segunda (fechado) aparece em peso 200, "apagada".
- **Pílula:** no computador, no alto (marca, seções, telefone, "Book a chair"); abaixo de 1024 px,
  embaixo, na zona do polegar (Menu, Call, Book a chair). O menu do celular é uma folha vermelha,
  com `inert` no resto, Esc e foco de volta.
- **Fotos:** 6 do Unsplash, duotone feito pelo CDN (parâmetro `duotone=4a0b0f,f1e8d9` do imgix),
  sem filtro no navegador; `srcset` de 480 a 2200; crédito com UTM no rodapé e junto de cada foto;
  `download_location` de cada uma na fila do kit. Uma foto de interior foi descartada por ter a
  marca de outra barbearia.

## Movimento (`FadeMotion.tsx` + `fade.css`)

Um momento de cada, nenhum ilegível: a fade do herói ao carregar (CSS, ~1,6 s); a "máquina" do
ponteiro no herói (só com mouse); as linhas dos títulos sobem da máscara; o peso da frase do corte
sobe com a rolagem (único scrub da página); os nomes dos barbeiros abrem de condensado até a
linha; a faixa de preços corre (CSS); hover/foco nas linhas do quadro abre a largura do nome; a
marca do rodapé refaz a fade. "Reduzir movimento": nenhuma animação (0 em
`document.getAnimations()`), faixa parada e quebrada em linhas, frase em peso final, nomes já
ajustados. Modo leve (até 4 núcleos ou 4 GB): sem scrub e sem ponteiro, revelações simples.

## Validação (build de produção, `next start`)

- `tsc --noEmit`, `eslint` e `prettier --check` limpos nos arquivos da demo; `pnpm build` ok.
- 1440×900, 834×1112 e 390×844: `scrollWidth - innerWidth = 0`, zero erros no console.
- axe-core (WCAG 2.2 AA + best-practice, "reduzir movimento") em 1440 e 390: **0 violações**.
- Teclado: "Skip to content" primeiro, foco visível em osso/preto conforme o fundo; menu do
  celular abre, Esc fecha e devolve o foco; link do menu leva a `#prices` (80 px abaixo do topo).
- Fluxo: "Book" no quadro (hot towel shave) → barbeiro → sem horário não avança → horário →
  resumo → confirmação dizendo que nada foi enviado.
- "Reduzir movimento" e modo leve conferidos no Playwright (pesos finais, nada escondido).
- Vídeo: tour de 71,6 s a 30 fps (2148 quadros) com relógio virtual (8 núcleos informados), em
  `kit/videos/fade-and-co-barbers.mp4` e `-light.mp4`.

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Nota                                                                                        |
| -------------- | ---- | ------------------------------------------------------------------------------------------- |
| Ideia          | 4    | o nome faz a fade; só serve a uma barbearia                                                 |
| Primeira dobra | 4    | FADE & CO. + três FADE afinando, em osso sobre vermelho                                     |
| Hierarquia     | 3    | o vazio à direita das linhas no herói (1440) é intencional, mas pesa em telas largas        |
| Tipografia     | 4    | uma variável + uma de texto, escala 6–20×, números tabulares nos preços                     |
| Ritmo          | 4    | vermelho / preto / osso alternando, cada seção com forma própria                            |
| Imagem         | 3    | duotone deixa as 6 fotos coerentes, mas são cenas de banco e ficam em segundo plano         |
| Movimento      | 4    | um temperamento (kinetic), um momento de cada, nada atrasa o "Book"                         |
| Ação principal | 4    | "Book a chair" e telefone na pílula em toda a página; "Book" em cada preço                  |
| Celular        | 4    | herói recomposto em 2 linhas + 3 FADE, pílula embaixo, nomes ajustados à largura            |
| Acessibilidade | 4    | axe 0, teclado, reduzir movimento; sem teste com leitor de tela real                        |
| Desempenho     | 3    | herói sem foto (LCP é texto), as 6 fotos `lazy` e em duotone pelo CDN; LCP não medido em 4G |
| Honestidade    | 4    | só fatos do site-modelo; ficção e demo rotuladas; créditos                                  |
| Não repete     | 4    | arquétipo, paleta, tipo, menu e movimento diferentes do Aurelia                             |

Média 3,8; nenhum critério abaixo de 3; travas (celular, acessibilidade, honestidade) em 4.

## Correções feitas na revisão

- O título da reserva ("Pick a service, a barber and a time") ocupava 5 linhas enormes na coluna
  de 5/12 → tamanho próprio (`f-h2-s`, 3,5vw) e quebras escolhidas.
- A marca do rodapé terminava com todas as letras em peso 800: o `gsap.from` não lia a variável
  `--wg` da letra → `fromTo` com o peso final lido do `style` de cada letra.
- O ajuste de largura dos nomes podia medir antes da entrada (com `--sq` 0) → mede sempre com
  `--sq` 1 e devolve o valor.
- No celular, os botões do herói ficavam atrás da pílula (que já tem Call e Book) → só a partir de
  1024 px; no lugar, endereço e "Since 2017"; linhas da fade maiores (27vw) para ocupar a tela.
- A foto da frase do corte ocupava 1000+ px de altura no tablet → no máximo 26rem abaixo de 1024.
- `setState` dentro de efeito (lint do React) para os dias da reserva → `useMemo`.

## Limites

- Fotos de banco: um cliente real precisaria das próprias (o rodapé avisa que nenhuma é dos
  barbeiros nomeados).
- O "Book" do fluxo não chega ao `book.fadeandco.example.com` (domínio fictício).
- O eixo de largura e `@property` exigem navegadores atuais; sem `@property` a fade aparece
  pronta, sem animar.
- Não gravamos no `usage-log.json` (fora do escopo desta tarefa).
