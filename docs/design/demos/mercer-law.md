# Estudo de caso: Mercer Law

Demonstração de um escritório **fictício** de direito de família e sucessões em German Village,
Columbus (OH), em `/demos/mercer-law` (fora do índice de busca: `robots: noindex`). Código em
`apps/web/app/demos/mercer-law/` e `apps/web/components/demos/mercer-law/`. Todos os fatos (pessoas,
endereço, horário, preços, telefone 555, e-mail) vêm do site-modelo
`packages/fixtures/src/library/mercer-law.ts`; nada além dele (regra 8).

## Pedido

Direção dada pelo seletor: arquétipo **broadsheet-editorial**, composição `split-editorial`, tipo
`serif-only`, hierarquia `headline-led`, imagem `framed-editorial` com legenda, navegação `side-rail`
no computador (barra no topo no celular), movimento `quiet`, superfície `brand-block`. Precisa ter:
serviços como índice, como é a primeira reunião (passos), com quem a pessoa vai falar, um pedido de
consulta calmo e privado (demonstração que não envia nada) e telefone sempre à mão no celular. Não
pode parecer o Aurelia nem o molde Signature: sem arcos, sem ouro, sem abertura.

## Referências (pesquisa de 2026-10-26)

Registros em `research-inbox/mercer-law.json`; estudos em `studies/`. A Awwwards continua
inacessível daqui: os prêmios vêm de trechos de busca e das páginas das agências (cada registro diz).

| Referência         | Prêmio (evidência)                                | O que levamos                                                                                                                                                                       |
| ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alkemist-avocats` | HM 29/04/2021 (busca + portfólio do designer)     | uma ação só, com o nome do primeiro passo, repetida no topo, no herói e numa barra fixa no celular; o pedido começa com "sobre o que você quer falar?" e vai uma pergunta por passo |
| `imk-avocats`      | HM 05/03/2026 (busca + página da agência fatfish) | as áreas como **índice** (número, nome, fio); um acento só para sinais pequenos                                                                                                     |
| `ario-law-firm`    | HM 25/05/2026 (busca + página da firma)           | ornamento de prancheta (tabela de fios, linha dupla) e fatos numa tabelinha dentro da ficha; nada do tom alto                                                                       |

## Três direções

**A. Broadsheet (escolhida).** A primeira página de um jornal de bairro: régua dupla com endereço e
"aberto agora", manchete enorme em serifa ("Family and estate law in German Village"), linha fina e,
embaixo, a coluna do lead (quem, o quê, preço por escrito) ao lado de uma foto emoldurada de German
Village com legenda "Fig. 1". As seções são numeradas com "§" (o sinal de parágrafo das leis) e o
trilho lateral vinho funciona como a lombada de um processo: capítulos, progresso, horário de hoje,
telefone e "Book a consultation". Serviços e preços viram um sumário com pontilhado.

**B. Ledger (livro-caixa).** A página inteira como um livro de registro: colunas de tabela, números
em fonte de máquina, cada serviço uma linha com data, prazo e preço, e o pedido de consulta como um
formulário de cartório. Honesto e muito fácil de varrer, mas frio para quem está passando por um
divórcio ou uma morte na família, e perto demais de "planilha".

**C. Kitchen table (mesa da cozinha).** Começa pela vida do cliente: uma foto grande de uma mesa de
cozinha à luz da manhã, texto em primeira pessoa da Ellen, passos contados como uma conversa, cor
quente e quase nenhuma régua. Acolhedora, mas depende de fotos de banco carregando a emoção (risco de
parecer clínica ou seguradora) e se afasta do arquétipo pedido.

**Por que A:** é a única em que a primeira dobra diz "escritório de advocacia, deste bairro, com
preço claro" só pela tipografia, sem depender de foto, e onde o arquétipo vira estrutura (seções §,
índice, legenda, régua) e não só estilo. De B ficaram a tabela de fatos (2013 · 2006 · 2) e os preços
com números alinhados; de C, a foto da mesa da cozinha na seção da primeira reunião e a voz em
primeira pessoa no "About the office".

## Decisões

- **Paleta:** papel `#f3eee4`, papel 2 `#e9e1d3`, tinta `#1c1915`, cinza `#5c554b`, vinho `#6b2d2a`
  (a cor que o dono escolheu no SiteSpec), pedra `#9c8f78` só em fios. Contrastes no topo de
  `mercer.css` (tinta 15,1:1; vinho 8,9:1; cinza 6,4:1).
- **Tipografia:** uma família, Newsreader (Google, eixo óptico): display com `opsz 72` e −0,022em,
  texto 18–21 px, rótulos em caixa-alta 12 px +0,14em, algarismos de texto no corrido e alinhados
  (`tabular-nums`) em preços e datas. Diferente do Aurelia (Bodoni Moda + Jost).
- **Superfície "brand-block":** o trilho lateral vinho (computador), a faixa vinho com a frase da
  própria Ellen no brief ("I can't promise a result in any case...") e os botões. No celular, a barra
  do polegar "Call the office / Book a consultation" é o bloco vinho.
- **Assinatura:** o índice de serviços. Grupos (Planning ahead / After a death / Marriage and
  divorce), número 2.1–2.6, nome, pontilhado e preço. Escolher uma linha troca a ficha presa à direita
  (descrição, taxa, "good to know", "Ask about this →"); no celular a ficha abre embaixo da linha.
  "Ask about this" marca o assunto no pedido de consulta (evento `mercer:matter`).
- **Primeira reunião:** linha do tempo de 3 passos (primeira reunião com a Ellen → rascunhos em cerca
  de duas semanas → assinatura no escritório com testemunhas e tabelião), o fio se desenha e os marcos
  acendem; ao lado, um quadro sobre divórcio (US$ 200, 60 min, abatido se contratar, sem prever
  resultado).
- **Pessoas:** "expediente" de jornal com Ellen e Ruth, iniciais em moldura no lugar de foto, e a
  frase "There are no photographs of Ellen or Ruth on this page. The photographs are scenes."
- **Pedido de consulta (demo):** assunto → quando (horário comercial ou terça à noite) e como
  responder → nome e telefone ou e-mail; a "ficha" ao lado se preenche; o aviso "Demonstration ·
  private · nothing leaves this page" desde o primeiro passo; a observação pede para não escrever
  detalhes do caso; a confirmação (`role="status"`, foco no título) diz que nada foi enviado.
- **Movimento quieto (`MercerMotion.tsx`):** só opacidade + subida de 16 px (0,65 s, `power2.out`),
  fios que se desenham, a linha do tempo, e a troca da ficha em CSS (450 ms). Nada na primeira tela
  anima; sem abertura. Reduzir movimento: nada anima. Modo leve (≤ 4 núcleos ou ≤ 4 GB): só os fios.
- **Fotos (5, Unsplash, hotlink + srcset):** German Village no outono e o skyline da Main Street
  Bridge (lugar dito pelo próprio autor na foto), um livro-razão numa mesa, uma mesa de cozinha, uma
  assinatura. Legendas dizem que são cenas/fotos de banco; nenhuma é apresentada como advogada ou
  cliente. `download_location` de cada uma na fila do kit (`pings-queue.txt`).

## Validação (build de produção, `next start -p 3702`)

- `tsc --noEmit`, `eslint` e `prettier --check` nos arquivos da demo: sem erros. `pnpm build`: ok
  (`/demos/mercer-law` estática).
- Playwright 1440×900, 834×1112 e 390×844 (8 núcleos informados): `scrollWidth − innerWidth = 0`,
  zero erros no console.
- axe-core (WCAG 2.2 AA + best-practice, reduzir movimento) em 1440 e 390: 0 violações (a primeira
  rodada achou a barra do polegar fora de landmark → virou `<nav aria-label="Call or book">`).
- Teclado: Tab percorre pular-para-conteúdo → trilho → herói → créditos → índice (Enter abre a ficha)
  → "Ask about this" → perguntas → formulário → rodapé → selo; foco visível em tudo. Menu do celular:
  foco no primeiro item, Esc fecha e devolve o foco, `inert` quando fechado.
- Pedido: "Ask about this" marca o assunto; passo 3 não avança sem nome (validação nativa); a
  confirmação recebe o foco.
- Reduzir movimento: nenhum gancho escondido ou deslocado, 0 animações. Modo leve: nenhum bloco
  escondido.
- Vídeo: 30 fps quadro a quadro com relógio virtual no build de produção
  (`kit/videos/mercer-law.mp4` e `-light.mp4`).

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Por quê                                                                                                   |
| -------------- | ---- | --------------------------------------------------------------------------------------------------------- |
| Ideia          | 3    | "jornal do bairro para um escritório de duas pessoas": § + índice + lombada vinho                         |
| Primeira dobra | 3    | manchete forte e foto real do bairro; bonita e clara, menos "inesquecível" que o Aurelia                  |
| Hierarquia     | 4    | um foco por tela; o § e a régua dizem onde se está                                                        |
| Tipografia     | 4    | uma família com eixo óptico, escala com propósito, algarismos certos em preço e data                      |
| Ritmo          | 3    | papel → faixa vinho → índice → papel 2 → expediente → perguntas → papel 2; anatomia repetida de propósito |
| Imagem         | 3    | emolduradas, legendadas e honestas; fotos de banco, a da assinatura mostra um celular                     |
| Movimento      | 3    | quieto e correto; a troca da ficha é a única interação com assinatura                                     |
| Ação principal | 4    | "Book a consultation" e telefone fixos no trilho; barra do polegar no celular                             |
| Celular        | 4    | barra do polegar, ficha em acordeão, menu em folha vinho; sem rolagem lateral                             |
| Acessibilidade | 4    | axe 0, teclado, reduzir movimento testados (sem leitor de tela real)                                      |
| Desempenho     | 3    | 5 fotos (herói `eager`, resto `lazy`), uma família; LCP não medido                                        |
| Honestidade    | 4    | só fatos do fixture; ficção, demo e "não é aconselhamento jurídico" rotulados; créditos                   |
| Não repete     | 4    | outro arquétipo e outros eixos que o Aurelia (serifa só, trilho lateral, quieto, papel)                   |

Média 3,5; nenhum abaixo de 2; as travas (celular, acessibilidade, honestidade) com 4.

## Correções feitas na revisão

- Manchete presa a 13ch quebrava em 3 linhas no computador com metade da largura vazia → sem limite,
  `clamp(3rem, 8.2vw, 7.2rem)`: 2 linhas no computador, 3 no celular.
- Tabela de fatos com "In writing" quebrando em 2 linhas → só os números (2013, 2006, 2).
- Botão do trilho quebrava "Book a / consultation" → menor e sem quebra; rótulo do § 6 no trilho
  vira "Consultation".
- E-mail cortado no meio ("offic e@...") na ficha do pedido → em linha própria, sem `break-all`.
- Ficha do serviço no celular repetia o nome logo abaixo da linha → título só para leitor de tela.
- Preço colado no nome no celular → alinhado à direita.
- Barra do polegar fora de landmark (axe) → `<nav>`.

## Limites

- Fotos de banco: um cliente real teria a fachada da S Third St e o próprio escritório.
- Sem teste com leitor de tela real; LCP e CLS não medidos com ferramenta.
- O "aberto agora" usa o relógio do visitante no fuso de Columbus; feriados não existem no fixture.
- Página feita à mão: o gerador ainda não produz este nível sozinho.
