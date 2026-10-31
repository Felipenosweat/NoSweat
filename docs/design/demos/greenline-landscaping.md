# Estudo de caso: Greenline Landscaping

Demonstração de um paisagista **fictício** de Charlotte em `/demos/greenline-landscaping` (fora
do índice de busca: `robots: noindex`). Código em `apps/web/app/demos/greenline-landscaping/` e
`apps/web/components/demos/greenline/`. Todo fato vem da fixture
`packages/fixtures/src/library/greenline-landscaping.ts` (pessoas, cidades, horário, preços,
estações, as duas frases de clientes que o dono autorizou, telefone 555).

## Pedido

Direção do seletor: arquétipo **organic-naturalist** — composição `collage`, tipos
`old-style-serif+humanist-sans`, hierarquia `image-led`, imagem `full-bleed`/`collage-cutouts`
(sem arcos: o Aurelia usa), navegação `top-bar` com "Get a quote" + telefone sempre à vista,
movimento `quiet`, superfície `single-paper`. Tem de ter serviços com preços, área atendida,
horário, ligar no celular, um pedido de orçamento de demonstração e uma interação que só sirva a
um paisagista. Não pode parecer o Aurelia (palácio escuro, arcos, ouro), a Mercer Law (jornal,
trilho vinho) nem o molde Signature.

## Referências (pesquisa desta rodada)

Registros em `research-inbox/greenline-landscaping.json`, estudos em `studies/`.

| Referência                                                         | Prêmio (evidência)                                                                                                     | O que levamos                                                                                                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [Gardenlust](../studies/gardenlust.md) (Sydney)                    | Honorable Mention, 26/08/2021, Made Agency (trecho de busca; o rodapé do site diz "Website by Made")                   | colagem de fotos em 2–3 escalas sobre um papel só; segunda voz em itálico nos títulos; paleta tirada das fotos     |
| [Cedar Springs Landscapes](../studies/cedar-springs-landscapes.md) | Honorable Mention, 20/11/2025, Ripple_CA (trecho de busca; o tema do site é `ripple-child-theme`, fontes de ripple.ca) | uma ação fixa na barra com a palavra do resultado; cidades atendidas no primeiro parágrafo; uma afirmação por tela |
| son-daven, kozowood, haven-constructions (já no `references.json`) | ver os estudos                                                                                                         | "esquema em vez de mapa embutido"; paleta de material; linhas "rótulo \| parágrafo" (lista de pessoas)             |

Não levamos: rolagem sequestrada e sem h1 (Gardenlust), telefone sem `tel:` e "Award-Winning" sem
dizer qual (Cedar Springs), carregador e páginas pesadas (son-daven, kozowood).

## Três direções

**A. Yard Almanac (escolhida).** O site como o almanaque de um quintal de Charlotte. Papel de
aveia único, fotos recortadas em escalas diferentes sobrepostas como cópias sobre a mesa, Fraunces
(serifa de estilo antigo, macia, com itálico em barro) + Source Sans 3. A primeira dobra nomeia o
problema local que o dono descreve ("red clay and a dry July") e uma etiqueta "In the yard now"
diz o que a equipe faz nesta semana; a assinatura é um calendário de 12 meses com as estações e
os serviços do brief. Risco: ficar "bonito de revista" e esconder o telefone — resolvido com a
barra fixa (telefone + "Get a quote") e o pedido de orçamento em quatro passos.

**B. Plan Sheet.** O site como a prancha de projeto que o Kevin desenha: grade de planta, cotas,
rosa dos ventos, seções numeradas como folhas ("Sheet 2 of 5"), o quintal em planta baixa
desenhada como herói. Muito própria de paisagista, mas fria (parece escritório de arquitetura) e
pediria desenhos de projetos que o dono não forneceu — seriam obras inventadas.

**C. Same Crew, Every Thursday.** Serviço direto: foto de ponta a ponta, o dia da semana gigante
como gancho ("same crew every week"), uma rota pelas seis cidades e um agendador. Forte para
conversão, mas o brief não diz em que dia cada cidade é atendida (a rota seria inventada, regra 8),
e o resultado lembra um app de agendamento, não um paisagista.

**Por que A:** é a única em que a ideia (o ano de um quintal em Charlotte) sai inteira dos fatos do
dono — estações, janelas de plantio, a seca de julho, o barro — e cabe no arquétipo atribuído sem
desvio. De B ficaram a rosa dos ventos no herói, as plantas de lote no passo "How big is the
yard?" e a grade do mapa esquemático; de C, o telefone e o "Get a quote" em toda tela e a área
atendida como peça própria.

## Decisões

- **Paleta (das fotos):** papel `#f0eadc` com fibra leve (ruído SVG fixo), tinta `#1e2a1f`,
  verde-pinho `#2d5b36` (ação), barro `#9b4527`/`#8a3e22` (itálico e rótulos), palha `#c39a4a` só
  em fios. Contraste: tinta 12,5:1; tinta a 75% 5,9:1; pinho 6,6:1; barro de texto 6,3:1. Nada de
  sálvia clara em texto. Dois painéis num tom mais fundo do mesmo papel (`#e7dfcc`: "Good to know"
  e o cartão do orçamento) — é a única variação da superfície.
- **Tipografia:** Fraunces com eixo `SOFT` 100 (títulos, uma palavra em itálico barro por título)
  e Source Sans 3 (texto 17–18 px, preços com `tabular-nums`, rótulos em versalete +0,14em).
- **Colagem:** herói com foto grande sangrando à direita e um recorte menor (borda de papel)
  sobre a quina; serviços com textura de grama + recorte; pessoas com as folhas na cerca;
  uma faixa de ponta a ponta (irrigação) com um cartão de papel por cima da borda. As fotos são
  cenas (sem "nossa equipe" ou "nosso trabalho"; o rodapé diz isso).
- **Assinatura — "The year in the yard":** abas de estação (setas, Home/End) pintam as colunas
  dos meses, dissolvem a foto da estação e trocam a lista; o calendário mostra cada serviço como
  barra nos meses do brief (mowing março–novembro, aeração setembro–meados de outubro…), a seca de
  julho em hachura de barro e uma linha "Today". Os meses de "spring"/"fall" são aproximados e a
  página diz isso. Abre na estação de hoje.
- **"In the yard now":** etiqueta de papel na foto do topo, calculada no navegador a partir das
  mesmas barras (em 26/10: "Weekly mowing · Sod and seeding · Fall leaf cleanup"), leva ao calendário.
- **Área:** esquema SVG com as seis cidades nas posições reais (km a partir do centro), o anel da
  I-485 que se desenha, a divisa NC/SC; nomes em HTML para ficarem legíveis no celular.
- **Orçamento (demonstração):** quintal (plantas de lote que crescem) + cidade → serviços (com
  "from" do brief; erro anunciado se nada for marcado) → fotos opcionais (miniaturas locais via
  `URL.createObjectURL`, nunca enviadas) → nome, telefone, e-mail opcional, forma de resposta →
  confirmação em `role="status"` que diz que nada foi enviado. Selo "Demonstration · nothing is
  sent" desde o primeiro passo.
- **Movimento quieto:** entrada do topo em CSS (foto assenta 1,06 → 1, recorte e título sobem);
  `data-g-rise` (18 px, 0,7 s, uma vez); barras do calendário crescem da esquerda; anel da I-485 se
  desenha; deriva lenta das fotos da colagem e da faixa (scrub) só fora do modo leve. Reduzir
  movimento: nada anima, tudo no estado final. GSAP importado sob demanda.
- **Selo:** `<NoSweatBadge />` no fim, num invólucro `@container` com `--nsb-bg` papel e
  `--nsb-fg` preto (a 55% dentro do selo dá 4,6:1 sobre o papel).

## Validação (build de produção, `next start`)

- 1440×900, 834×1112 e 390×844: `scrollWidth - innerWidth = 0`, zero erros no console.
- axe-core (WCAG 2.2 AA + best-practice, reduzir movimento) em 1440 e 390: 0 violações; também 0
  em cada passo do orçamento (inclusive com o erro de validação e com fotos escolhidas).
- Teclado: pular para o conteúdo, menu, telefone, "Get a quote", etiqueta do topo, abas (setas,
  Home), campos do orçamento; foco visível (2 px pinho) em tudo. Menu do celular: Esc fecha e
  devolve o foco.
- Reduzir movimento: 0 elementos escondidos ou deslocados. Modo leve (4 núcleos): deriva e
  faixa paradas, revelações completas; com 8 núcleos, 6 fotos derivando.
- `tsc`, `eslint` (0 erros), `prettier --check`, `pnpm build`.
- Vídeo de 74,7 s (1440×900 gravado, 30 fps), relógio virtual, no build de produção (`kit/rec-greenline.cjs`, fora do repositório).

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Observação                                                                                         |
| -------------- | ---- | -------------------------------------------------------------------------------------------------- |
| Ideia          | 3    | "o ano de um quintal de Charlotte"; na primeira dobra só aparece pela manchete e pela etiqueta     |
| Primeira dobra | 3    | colagem bonita e própria; a foto do topo tem reflexos de lente de banco de imagens                 |
| Hierarquia     | 4    |                                                                                                    |
| Tipografia     | 4    |                                                                                                    |
| Ritmo          | 3    | a lista de serviços é longa; sobra papel embaixo da coluna das pessoas no computador               |
| Imagem         | 3    | cenas de lugares diferentes, coerentes na luz quente; um cliente real precisaria de fotos próprias |
| Movimento      | 3    | um temperamento só e correto; nada memorável além do calendário                                    |
| Ação principal | 4    | telefone e "Get a quote" fixos em toda largura                                                     |
| Celular        | 4    |                                                                                                    |
| Acessibilidade | 4    | axe 0 em todas as telas e passos; sem teste com leitor de tela real                                |
| Desempenho     | 3    | 11 fotos `lazy` com srcset; LCP não medido; as 4 fotos de estação carregam juntas                  |
| Honestidade    | 4    | só fatos da fixture; demo e ficção rotuladas; créditos com UTM                                     |
| Não repete     | 4    | outro arquétipo e outros eixos que Aurelia e Mercer                                                |

Média 3,5; nenhum critério abaixo de 3; travas em 4.

## Correções feitas na revisão

- Fato errado: a linha de fatos dizia "Mon–Sat from 7 AM" (sábado abre às 8) → "7–6 · 8–1".
- Título inventado ("one crew a street") → "Where we mow, _and when_".
- A citação do Robert, ao lado do cartão da irrigação, caía sobre a foto (texto escuro sobre a
  grama; o axe não pega texto sobre imagem) → desce para baixo da faixa.
- O cartão da irrigação sozinho deixava meia tela vazia → citação em coluna própria.
- As tarefas da estação ficavam embaixo da foto, longe do calendário → embaixo do calendário, foto
  presa à esquerda.
- Primeira dobra sem a ideia → etiqueta "In the yard now" ligada ao calendário.
- A foto do aparador de cerca-viva aparecia duas vezes (recorte do topo e primavera) → a
  primavera usa o aspersor e a coluna das pessoas fica com uma foto só; as 11 fotos aparecem uma vez.
- Celular: abas de estação apertadas (19 px), nomes do mapa sobrepostos (todos à direita do
  ponto), mapa enorme no tablet (máx. 620 px).

## Limites

- Fotos de banco (Unsplash), não do dono; a composição pede 8–12 fotos reais.
- Os meses de "spring", "late summer" e "fall" são uma leitura do brief, marcada como aproximada.
- Prêmios das referências só por trechos de busca + créditos no site (Awwwards inacessível daqui).
