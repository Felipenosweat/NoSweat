# Estudo de caso: Sunrise Bakery

Demonstração de uma padaria **fictícia** de Sacramento em `/demos/sunrise-bakery` (fora do
índice: `robots: noindex`). Código em `apps/web/app/demos/sunrise-bakery/` e
`apps/web/components/demos/sunrise-bakery/`. Todos os fatos (padeira, endereço, horários,
cardápio e preços, encomendas, telefone 555, e-mail, as duas falas de clientes) vêm do
site-modelo `packages/fixtures/src/library/sunrise-bakery.ts`; nada foi acrescentado (regra 8).

## Pedido e direção atribuída

Arquétipo `warm-hospitality` com os eixos: composição `full-bleed-photo`, tipos `slab+grotesk`,
hierarquia `image-led`, imagem `full-bleed`, navegação `bottom-bar-mobile`, movimento `playful`,
superfície `single-paper`. Tinha de ter: cardápio com preços, horário com "aberto agora", como
encomendar (fluxo de demonstração que diz que nada é enviado), endereço + como chegar, ligar no
celular. Não podia lembrar o Aurelia (palácio escuro, arcos, ouro), a Mercer Law (jornal, fio
vinho) nem a Fade & Co. (blocos vermelhos, tipo variável).

## Referências (pesquisa nova, `docs/design/research-inbox/sunrise-bakery.json`)

| id                           | Prêmio (evidência)                                                                                         | O que levei                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `bernice-bakery`             | Honorable Mention, 28/02/2025 (título e resumo da busca; rodapé ao vivo "Made by Casa Media" confere)      | uma forma comestível repetida (o meio sol/pão), um acento só, regras de retirada em frases simples junto do pedido |
| `sonoma-bakery`              | Honorable Mention, 06/06/2022 (título e resumo da busca; comentário "Site by nightjar.co" no HTML confere) | a casca/luz como primeira dobra, preço em "bilhete" com números tabulares, o número do processo (48 h) como título |
| `enoteca-della-valpolicella` | Honorable Mention, 25/07/2025 (só resumo de página de listagem; sem crédito no site: `partial`)            | fotos como cópias impressas e inclinadas sobre a mesa; índice + ação principal fixos no topo                       |

Estudos: `studies/bernice-bakery.md`, `studies/sonoma-bakery.md`,
`studies/enoteca-della-valpolicella.md`. A Awwwards continua inacessível daqui; os sites foram
abertos ao vivo (1440×900, 390×844, "reduzir movimento"), sem prints no repositório.

## Três direções

**A. Morning Counter (escolhida).** A padaria vive pelo relógio da manhã: o primeiro pão sai às
7, o de fim de semana acaba ao meio-dia, a caixa de sábado fecha quinta ao meio-dia. A página
inteira é esse relógio: foto de página inteira de uma janela com sol da manhã sobre pães, uma
tirinha de plaquetas que vira para o estado de agora ("TOMORROW AT 7 AM"), um céu em que o sol
atravessa a manhã da padaria com a rolagem, e um quadro da semana em letras que viram. Papel de
farinha, Zilla Slab (slab quente, itálico com voz) + Familjen Grotesk, um acento de casca
(`#a8481a`) e um damasco só para preenchimentos.

**B. Bakery Ticket.** Tudo como bilhete de balcão: página estreita de papel térmico, preços em
mono, carimbos, número de pedido; foto pequena e recortada. Muito própria e barata, mas perde o
`image-led`/`full-bleed` atribuído e fica fria para "warm".

**C. Market Table.** A história da feira de 2016 como fio: colagem de fotos recortadas sobre
lona listrada, letras pintadas à mão. Calorosa, mas depende de fotos próprias (as do banco são
de outras feiras e de outros países) e cairia no `collage`, não no `full-bleed-photo` pedido.

**Por que A:** é a única em que a ideia só serve a esta padaria e aparece na primeira dobra (a
tirinha do herói diz se dá para ir agora), cumpre os sete eixos atribuídos sem desvio, e cada
peça de movimento informa algo real (aberto/fechado, o que tem em cada dia, quando o pão acaba).
De B ficaram o carimbo "Demonstration · nothing is sent", o recibo da encomenda e os preços com
pontilhado; de C, a seção da história (2016 → 2020) com uma foto de feira recortada.

## Decisões

- **Estrutura:** herói (janela ao sol + cartão "hoje" com a tirinha) → 01 o pão de 48 horas
  (o número conta até 48) e o céu da manhã (−48 h, 7 AM, meio-dia, 1·2 PM) → 02 o quadro da
  semana → 03 cardápio e preços (fotos como cópias inclinadas) → 04 bolos da Elena (data mínima
  calculada) → 05 história → 06 encomenda (demo) → faixa de foto "See you at seven." → 07 visita,
  horários, perguntas → rodapé escuro (créditos) → selo da No Sweat.
- **Relógio de Sacramento** (`time.ts`): aberto agora, próxima abertura, sábado certo da caixa
  (pedidos até quinta ao meio-dia) com contagem regressiva, primeira data do bolo (5 dias e só
  em dia aberto). No servidor sai neutro e ganha valor depois da hidratação.
- **Quadro da semana** (`BakeBoard.tsx` + `flip.ts`): 8×20 plaquetas, sai com os horários e vira
  para hoje quando aparece; botões de dia (aria-pressed), texto escondido com o dia inteiro em
  `aria-live`. Croissant e morning bun aparecem em todo dia aberto (no fixture só o kouign-amann
  e o centeio têm dia marcado); centeio sex–dom, kouign-amann sáb–dom, caixa na quinta/sábado.
- **Navegação:** barra simples no topo (4 seções, estado, telefone, "Preorder"); abaixo de 768 px
  a barra de baixo "Order / Call / Directions". O selo tem 5,5 rem de respiro embaixo nessa
  largura, então a barra não o cobre.
- **Superfície:** papel do começo ao fim; o rodapé é a casca de baixo (escuro). Desvio
  consciente do `single-paper`: o selo "Website by nosweatfd" usa 55% de opacidade, e sobre o
  papel ficaria em 3,6:1 (falha); sobre o escuro dá 5,3:1.
- **Movimento** (`SunriseMotion.tsx`, GSAP): crescer como massa (achatado → normal com
  `back.out`), fotos que caem na mesa, o corte da massa que se desenha, contagem até 48, sol
  ligado à rolagem e afastamento da foto do herói. Reduzir movimento: estado final, sem molas,
  quadro troca direto. Modo leve: sem scrub (o sol só nasce até as 7).
- **Fotos:** 8 do Unsplash (6 buscas), hotlink com `srcset`, crédito + UTM no rodapé,
  `download_location` na fila do coordenador. São cenas ("Photography (scenes, not this
  bakery)"). A foto da feira é recortada no servidor (`rect`) para tirar a placa de preço e os
  potes com rótulo de outra banca.

## Validação (build de produção, `next start` na 3705)

- 1440×900, 834×1112 e 390×844: `scrollWidth - innerWidth = 0`, zero erros no console.
- axe-core (WCAG 2.2 AA + boas práticas, "reduzir movimento") em 1440 e 390: **0 violações**.
- Playwright: quadro vira para hoje e para sábado (letras de passagem no meio, texto final certo
  e anunciado); encomenda de bolo pelo link da seção de bolos, erros por campo com foco no
  primeiro, segunda-feira recusada ("closed Monday and Tuesday"), recibo em `role="status"` que
  diz que nada foi enviado; Tab do começo ao fim com contorno visível em tudo; "reduzir
  movimento": 0 animações, nada escondido (só o "−" desativado e o selo, de propósito); modo leve
  (4 núcleos): nada escondido.
- `tsc`, `eslint`, `prettier --check`, `next build` sem erro.
- Vídeo: 70 s, 30 fps, quadro a quadro com o relógio virtual (`kit/videos/sunrise-bakery.mp4` e
  `-light.mp4`). Achado no caminho: o `setInterval` do `vtime.js` do kit só dispara uma vez (o
  passo apaga o timer antes de chamar o `tick`, que então não se reagenda); o motor das plaquetas
  usa uma cadeia de `setTimeout`, que se comporta igual no navegador.

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Nota                                                                                                       |
| -------------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| Ideia          | 4    | "a padaria que vive pelo relógio da manhã": tirinha, céu e quadro só servem a uma padaria de horário curto |
| Primeira dobra | 3    | foto e tirinha fortes; título embaixo à esquerda + cartão à direita ainda é um arranjo conhecido           |
| Hierarquia     | 3    | um foco por tela quase sempre; o cabeçalho do quadro divide atenção com o seletor de dias                  |
| Tipografia     | 3    | par bom, números tabulares, pontilhado nos preços; as plaquetas espaçam demais as palavras                 |
| Ritmo          | 3    | cada seção tem forma própria, mas várias abrem com o mesmo rótulo + título grande                          |
| Imagem         | 3    | cortes deliberados e coerentes no tom; fotos de banco de lugares diferentes                                |
| Movimento      | 4    | um temperamento (mola leve), cada efeito informa algo, nada bloqueia                                       |
| Ação principal | 4    | "Preorder" no topo; no celular Order/Call/Directions sempre no polegar                                     |
| Celular        | 4    | desenhado para 390 (barra de baixo, quadro em plaquetas pequenas, marca sem quebrar)                       |
| Acessibilidade | 4    | axe 0, teclado, reduzir movimento testado; sem leitor de tela real                                         |
| Desempenho     | 3    | 8 fotos, herói `eager`, resto `lazy`; LCP/CLS não medidos com Lighthouse                                   |
| Honestidade    | 4    | só fatos do fixture; demo e ficção rotuladas; fotos como cenas, com crédito                                |
| Não repete     | 4    | outro arquétipo e outra combinação de eixos que Aurelia, Mercer e Fade & Co.                               |

Média 3,5; nenhum critério abaixo de 3; as travas (celular, acessibilidade, honestidade) em 4.

## Correções feitas na revisão

- Utilitários do Tailwind perdiam para as classes da demo (CSS fora de camada): "Preorder"
  aparecia cortado no celular. Tudo foi para `@layer components`.
- Marca quebrava em duas linhas no celular e no tablet; estado escondido só entre 768 e 1024 px.
- Rótulo do herói ilegível sobre a janela clara: véu mais forte no topo e à esquerda + sombra.
- A legenda "Mai Tran… since the farmers market days" ficava embaixo de uma foto de outra feira,
  como se fosse a banca dela: a frase foi para a linha de 2016 e a foto ficou só como cena.
- Recorte da feira trocado (placa de preço e potes com rótulo de outra banca fora).
- Herói sem a ideia da página: entrou a tirinha de plaquetas que vira para o estado de agora.
- Plaquetas paradas no vídeo (ver "Validação"): `setInterval` → cadeia de `setTimeout`.

## Limites

- Com a página aberta numa segunda ou terça, o quadro de hoje mostra "CLOSED" (é verdade, mas é
  a versão menos rica); o vídeo clica em sábado e sexta.
- Fotos de banco não mostram uma padaria só; um cliente real precisaria de 8–10 fotos próprias.
- As falas de clientes vêm do fixture e são marcadas "a customer"; não há notas nem estrelas.
- Sem teste com leitor de tela real e sem medição de LCP.
