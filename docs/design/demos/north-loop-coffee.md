# Estudo de caso: North Loop Coffee

Demonstração de um café e torrefação **fictícios** de Minneapolis em `/demos/north-loop-coffee`
(fora do índice: `robots: noindex`). Código em `apps/web/app/demos/north-loop-coffee/` e
`apps/web/components/demos/north-loop/`. Todos os fatos (Hannah, Theo e Ramón, 2017, a antiga
gráfica, o torrador de 12 kg às segundas e quintas, endereço, horários, cardápio e preços, pedido
antecipado com retirada no fim do balcão, Wi-Fi e tomadas, cachorros no pátio, estacionamento e o
trem leve, as duas falas de clientes, telefone 555 e e-mail de exemplo) vêm do site-modelo
`packages/fixtures/src/library/north-loop-coffee.ts`; nada foi acrescentado (regra 8).

## Pedido e direção atribuída

Arquétipo `warm-hospitality`, numa combinação diferente da Sunrise Bakery: composição
`split-editorial`, tipos `serif-only` ou serif de texto + mono pequeno (nem slab, nem Fraunces),
hierarquia `index-led`, imagem `collage-cutouts`, navegação `top-bar`, movimento `quiet`,
superfície `brand-block`. Tinha de ter: cardápio com preços, horário com "aberto agora" (hora de
Minneapolis), endereço + como chegar, pedido antecipado de demonstração (o modelo cita o pedido
online), ligar no celular. Não podia lembrar Aurelia, Mercer Law, Fade & Co., Smoke & Rail,
Greenline nem Sunrise.

## Referências (pesquisa nova, `docs/design/research-inbox/north-loop-coffee.json`)

| id                  | Prêmio (evidência)                                                                                                                        | O que levei                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `coffee-collective` | Honorable Mention, 26/09/2025 (resumo da busca da página awwwards.com/sites/coffee-collective; sem crédito de agência no site: `partial`) | blocos inteiros de uma cor de marca divididos com foto/objeto, alternando com papel; "Visit" como bloco próprio      |
| `escape-coffee`     | Site of the Day, 15/05/2024 (resumo da busca; o rodapé ao vivo diz "Website by TUX", mas a busca não nomeou a agência: `partial`)         | cada item como ficha técnica em mono pequeno (12 OZ, UNTIL 1 PM); um ornamento que vem do lugar; pedido desde o topo |

Estudos: `studies/coffee-collective.md`, `studies/escape-coffee.md`. `cafe-binocle` e
`campos-coffee` já estavam em `references.json` (sem estudo) e foram pulados. A Awwwards continua
inacessível daqui; os dois sites foram abertos ao vivo (1440×900, 390×844, "reduzir movimento"),
sem prints no repositório. Uma terceira candidata (Apocalypse Coffee Roasters) tem página de
votação na Awwwards, mas nenhum resumo confirmou prêmio: ficou de fora.

## Três direções

**A. The Daybook (escolhida).** O café como a página do dia de um jornal impresso, porque ele
fica numa antiga gráfica. Herói dividido: papel com o título e o índice da página à esquerda,
bloco azul de inverno à direita com uma colagem de recortes (o latte e o pão de cardamomo em
círculos com borda de papel, um copo de cortado desenhado que se enche devagar com vapor, grãos)
e um bilhete "Today" que diz, na hora de Minneapolis, se está aberto, se é dia de torra e até
quando sai o ovo e cheddar. Cardápio em página de jornal com pontilhado e preços em mono + um
bilhete de retirada; "o dia no café" como régua de horas. Piazzolla (serif de texto com eixo
óptico e itálico) + DM Mono. Marcas de registro e de corte como motivo.

**B. Winter Window.** Página escura e fria, a vitrine de um café numa manhã de neve: foto de
janela de página inteira, texto branco, o cardápio como um quadro-negro de giz. Atmosférica, mas
cai em `full-bleed`/`photographic` (não é a combinação pedida), aproxima-se do escuro da Smoke &
Rail e depende de fotos de um lugar que não existe.

**C. Roast Log.** O site como o caderno de torra da Hannah: tabelas de lotes, datas de torra,
gráfico de curva de temperatura. Própria de uma torrefação, mas os dados (temperaturas, origens,
lotes) não existem no modelo: teria de inventar fatos (regra 8). E esconde o que o cliente do
bairro quer: café, preço e horário.

**Por que A:** cumpre os sete eixos sem desvio, a ideia só serve a este café (uma antiga gráfica
que torra às segundas e quintas e fecha às 3) e aparece na primeira dobra (o bilhete "Today" e o
copo que se enche), e cada interação usa só fatos do dono. De B ficou a foto de neve na visita;
de C, o "Roast day" marcado nos dias da semana e a linha de números (2017 · 12 kg · Mon · Thu).

## Decisões

- **Estrutura:** herói (papel | bloco azul) com índice "Contents" → 01 cardápio + bilhete de
  retirada → 02 o dia no café (azul) → 03 torra e pessoas (+ sacos de 5 lb para escritórios) →
  falas de clientes (azul) → 04 o salão (Wi-Fi, cachorros, retirada, estacionamento) e perguntas →
  05 visita, horários e como chegar (azul) → rodapé noite com créditos → selo da No Sweat.
- **Paleta:** papel `#f1eee6`, papel-2 `#e7e2d6`, tinta azul-preta `#14202e`, tinta-2 `#4a5563`,
  azul de inverno `#1c3a5e`, noite `#0f1e31`, gelo `#cfdce8`, creme `#e2ae68` (só sobre azul) e o
  creme-escuro `#c98b3c` só nos desenhos. Sem marrom de padaria e sem laranja.
- **Tipos:** Piazzolla para tudo que se lê (título 6,2vw com itálico numa palavra, texto 18–20 px),
  DM Mono em caixa-alta pequena para preços, horas, rótulos e o bilhete. Duas famílias.
- **Interação própria de café:** "The day at the café": escolhe-se o dia (pontos marcam os dias de
  torra) e arrasta-se a hora (6 AM–3:30 PM, de 15 em 15 min, `input range` com
  `aria-valuetext`); a régua mostra as faixas (aberto, ovo e cheddar até 1 PM, pães até ~10 aos
  sábados) e o painel diz o que acontece nas portas, na vitrine, na cozinha, no torrador e nas
  mesas. Começa no "agora" de Minneapolis.
- **Pedido antecipado (demo):** "Add" em cada item; só as opções que o dono citou (bacon +$2,
  moer de graça); subtotal "before tax"; "Send to the bar" mostra em `role="status"` que nada foi
  enviado e onde o café real recebe pedidos. Sacos de 5 lb não entram (precisam de uma semana de
  aviso): ligar ou mandar e-mail. No celular, um atalho fixo "Pickup slip · n" aparece com itens.
- **Movimento quieto:** o café enche o copo (2,4 s, uma vez), vapor em CSS, revelações de 18 px,
  fios que se desenham, marcas de corte que chegam aos cantos; recortes do herói com deriva leve
  ligada à rolagem (desligada no modo leve). "Reduzir movimento": tudo parado e completo.
- **Honestidade:** rodapé diz que o café, as pessoas, o telefone e o site de pedidos são
  fictícios; legendas das fotos dizem "a scene, not our café"; 6 fotos do Unsplash com autor e
  link (UTM), `download_location` na fila do coordenador.

## Validação (build de produção, `next start` na 3708)

- 1440×900, 834×1112 e 390×844: `scrollWidth - innerWidth = 0`, zero erros no console.
- axe-core (WCAG 2.2 AA + boas práticas, "reduzir movimento"): 0 violações em 1440 e 390, e 0
  depois de usar o bilhete, a régua e as perguntas.
- Teclado: "Skip to content" é o primeiro Tab; todos os focos com contorno visível; "Add", bacon,
  moagem, "Send to the bar", dias, régua (setas) e perguntas funcionam só com teclado; o painel
  "Index" do celular fecha com Esc e devolve o foco ao botão.
- "Reduzir movimento": nenhuma revelação escondida (0 blocos com opacidade ≠ 1), sem vapor, sem
  deriva.
- `tsc`, `eslint`, `prettier --check` e `pnpm build` passam.
- Vídeo (30 fps, relógio virtual, 8 núcleos informados): `kit/videos/north-loop-coffee.mp4` e
  `-light.mp4`.

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Nota                                                                                                             |
| -------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| Ideia          | 4    | o jornal do dia de um café numa antiga gráfica; o bilhete "Today" e a régua do dia só servem a ele               |
| Primeira dobra | 3    | no computador, forte (colagem + bilhete); no celular a primeira tela é só tipografia e a colagem vem logo abaixo |
| Hierarquia     | 4    | índice no herói, números de seção, um foco por tela                                                              |
| Tipografia     | 4    | Piazzolla com eixo óptico + DM Mono; preços tabulares; capitular só na história                                  |
| Ritmo          | 4    | papel/azul alternando, cada seção com forma própria (lista, régua, colunas, citações)                            |
| Imagem         | 3    | recortes coerentes (círculos com borda de papel); as fotos de banco são de lugares diferentes                    |
| Movimento      | 4    | quieto, um temperamento; o copo que enche e o vapor dizem "café" sem atrasar nada                                |
| Ação principal | 4    | "Order ahead" e telefone fixos no topo em todas as larguras                                                      |
| Celular        | 4    | barra própria (Order / ligar / Index), régua e bilhete desenhados para o polegar, sem rolagem lateral            |
| Acessibilidade | 4    | axe 0 antes e depois de interagir, teclado, foco, `aria-valuetext`, `role="status"`                              |
| Desempenho     | 3    | 6 fotos `lazy` (menos as do herói), fontes locais; não medi LCP com rede lenta                                   |
| Honestidade    | 4    | só fatos do modelo; demo e ficção rotuladas; créditos                                                            |
| Não repete     | 4    | primeira página com blocos azuis, serif de texto + mono, recortes e índice                                       |

Média 3,8; nenhum critério abaixo de 3.

## Correções feitas na revisão

- A barra do topo era translúcida e deixava o texto da página aparecer por baixo → fundo opaco.
- No celular a pastilha "Open · until 3 PM" aparecia na barra (a classe `hidden` perdia para
  `inline-flex` do próprio componente) e empurrava "Index" para fora → invólucro com
  `hidden xl:block`; marca menor e "Order" curto abaixo de 640 px.
- O herói passava de 900 px de altura no computador → título 6,2vw e índice mais compacto.
- A visita tinha um vão grande à esquerda → a foto da janela subiu para o topo da coluna da
  direita, os horários vieram depois.
- O recorte do torrador sobre o papel ficava sem borda → fio fino e sombra mais clara
  (`.nl-cutout-paper`).
- A régua tinha um ponto além do polegar do `range` (dois marcadores) → ficou só a linha.
- As faixas da régua tinham transição em `left/right` → removida (só `transform`/`opacity`).

## Limites

- Fotos de banco de lugares diferentes; um cliente real precisaria das próprias (a colagem pede 3
  fotos de cima: bebida, doce e o torrador).
- "Short walk" até a estação do trem leve fica sem minutos: o dono não deu o número.
- Sem leitor de tela real (só axe, teclado e Playwright).
