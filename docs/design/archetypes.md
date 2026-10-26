# Arquétipos e eixos de design

Os dados ficam em `archetypes.json` (lido por `tools/select.mjs`). Este arquivo explica o que
eles querem dizer e como usar.

## Por que existe

Até aqui a variedade vinha de "composição + cor + foto". Isso dá sites diferentes na
superfície, mas a mesma estrutura por baixo: o mesmo tipo de título, o mesmo ritmo, o mesmo
menu, o mesmo movimento. Um **arquétipo** é uma família de decisões que andam juntas (um
palácio pede cerimônia, uma oficina pede telefone na cara). Os **eixos** são as decisões em
si. Combinando eixos, dois projetos do mesmo ramo podem sair estruturalmente diferentes sem
deixar de servir ao negócio.

## Os 7 eixos

| Eixo          | Pergunta que responde               | Opções (id)                                                                                                                    |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `composition` | Como a página é montada?            | full-bleed-photo, split-editorial, type-poster, bento-grid, pinned-stage, horizontal-chapters, monument-centered, collage      |
| `typeSystem`  | Que família de letras e em que par? | high-contrast-serif+geometric-sans, old-style-serif+humanist-sans, grotesk-only, slab+grotesk, variable-expressive, serif-only |
| `hierarchy`   | O que carrega a página?             | headline-led, image-led, index-led, number-led                                                                                 |
| `imagery`     | Como as fotos são tratadas?         | full-bleed, arch-masks, framed-editorial, collage-cutouts, duotone, illustration, product-ui                                   |
| `navigation`  | Como se navega?                     | top-bar, floating-pill, side-rail, overlay-menu, bottom-bar-mobile                                                             |
| `motion`      | Qual o temperamento do movimento?   | ceremonial, cinematic, kinetic, quiet, playful (ver `motion.md`)                                                               |
| `surface`     | Qual o chão da página?              | night-day-alternation, single-paper, brand-block, monochrome-dark, photographic                                                |

## Os 9 arquétipos

| Arquétipo                  | Para quem                                        | Assinatura                                                                               | Nunca                                                    |
| -------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `heritage-grandeur`        | palácios, grandes hotéis, joalheiros, vinícolas  | serif de alto contraste, ouro só em filetes, capítulos noite/dia, arcos, revelação lenta | ouro em texto sobre fundo claro, brasão de casa real     |
| `quiet-luxury`             | moda, objetos, hotéis-butique, clínicas          | muito ar, uma família, letra pequena, grade precisa, quase nenhum ornamento              | gradiente decorativo, mais de um acento                  |
| `warm-hospitality`         | restaurantes, cafés, padarias, pousadas          | papel quente, serif de display, foto de comida e lugar, cardápio/reserva a um toque      | esconder cardápio ou horário, sequestro de rolagem       |
| `broadsheet-editorial`     | advogados, arquitetos, museus, editoras          | grade forte, colunas, legendas, seções numeradas                                         | tudo centralizado, cartão para cada parágrafo            |
| `kinetic-type`             | estúdios, eventos, barbearias, academias         | a letra é a imagem e se mexe: palavras enormes, linhas que entram, marquees              | letra gigante ilegível no celular                        |
| `cinematic-scrollytelling` | lançamentos, destinos, imóveis de alto padrão    | cenas: palco preso, transições pela rolagem, um assunto por tela                         | carregamento longo, história que esconde preço e contato |
| `organic-naturalist`       | spa, jardinagem, sítio, floricultura, terapia    | formas suaves, terra, texturas, deriva lenta                                             | bolhas em todo canto, verde-sálvia sem contraste         |
| `experimental-grid`        | portfólios, fotógrafos, galerias                 | o próprio layout é a ideia, com sinalização clara                                        | menu-mistério sem rótulo, quebrar no celular             |
| `service-direct`           | serviços locais e de obra (o grosso da No Sweat) | telefone e orçamento primeiro, fatos simples, área e horário sempre à vista              | selos ou avaliações inventadas, esconder o telefone      |

Cada arquétipo em `archetypes.json` lista os eixos que prefere **em ordem**. A primeira opção é
o "padrão"; as seguintes são variações que continuam fiéis ao arquétipo. É daí que o seletor
tira alternativas quando a primeira já foi usada há pouco (`selection.md`).

## Relação com o gerador em produção

O app em produção ainda escolhe só `composition` (5 composições em
`packages/templates/src/compositions`) pelo `server/design/plan.ts`. Os arquétipos são, por
enquanto, ferramenta de quem desenha à mão (landing, demos, novos templates). Para levá-los ao
gerador: mapear cada arquétipo para as composições que existem, acrescentar o campo opcional
`design.archetype` ao schema (regra 2 do time: os dois devs combinam) e mandar o `avoid` do
arquétipo no `<design_plan>`.
