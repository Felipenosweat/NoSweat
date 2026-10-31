# Estudo de caso: Iron Lotus Tattoo

Demonstração de um estúdio de tatuagem **fictício** em RiNo, Denver, em
`/demos/iron-lotus-tattoo` (fora do índice: `robots: noindex`). Código em
`apps/web/app/demos/iron-lotus-tattoo/` e `apps/web/components/demos/iron-lotus/`. Todos os fatos
(artistas, estilos, preços, depósito, idade, horário, endereço, telefone, e-mail e os dois
depoimentos) vêm de `packages/fixtures/src/library/iron-lotus-tattoo.ts` (regra 8). A fixture não
traz instruções de cuidados depois da tatuagem; por isso a página só fala do retoque grátis em 6
meses, que é o que o dono deu.

## Direção pedida

Do seletor: arquétipo **experimental-grid** (o layout é a ideia, mas usável), composição
`collage`, tipografia `grotesk-only`, hierarquia `index-led`, imagem `collage-cutouts`, navegação
`side-rail`, movimento `kinetic` contido, superfície `single-paper` (papel claro de propósito: o
demo de churrasco é o escuro). Não podia lembrar Aurelia (palácio escuro, arcos, ouro), Mercer Law
(jornal, trilho vinho), Fade & Co. (blocos vermelhos, tipo variável) nem Smoke & Rail (escuro,
brasa, palco preso).

## Referências (detalhes em `research-inbox/iron-lotus-tattoo.json` e `studies/`)

| Referência                               | Prêmio (evidência)                                                                                                                      | O que levamos                                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Monolith Studio (monolithstudio.com)     | Awwwards SOTD segundo a Abduzeedo (artigo lido) e o resumo de busca da vitrine da Webflow ("SOTD & DEV"); página da Awwwards não aberta | o índice de artistas com anatomia fixa (número → nome → papel e estilos → nota → preço → uma ação); fotos todas em preto e branco      |
| Lass Tattoo (lasstattoo.com)             | Honorable Mention, 17/05/2023, só num trecho de busca (uma segunda busca não achou nada); não aprovada                                  | papel claro + tinta + UM vermelho para tatuagem parecer desenho; regras práticas numeradas nas palavras do cliente                     |
| Aralesk — Collages & Motion (aralesk.es) | fita "HM" da Awwwards embutida no próprio site, com link para `/sites/aralesk-collages-motion`; resumo de busca do perfil               | peças presas em escalas diferentes com título; um fio vermelho que marca o caminho e o progresso; no celular, a mesma colagem em grade |

A Awwwards continua inacessível daqui (DNS falha); cada registro diz de onde veio a evidência. As
três foram abertas ao vivo (1440×900, 390×844 e com "reduzir movimento"); prints ficaram fora do
repositório.

## Três direções

**A. Flash Sheet (escolhida).** A página é uma folha de flash de balcão: papel cor de osso,
tinta preta, um vermelho de caneta. No topo, 12 desenhos numerados presos em escalas diferentes
(lótus, punhal, andorinha, estrela náutica, rosa, mariposa, cobra, coração com faixa, teia, olho,
dados, lua), desenhados em SVG para a demo. Passar o mouse ou focar mostra a etiqueta da peça;
clicar circula a peça em vermelho e manda o número para a ficha de consulta. O resto são "folhas"
numeradas 01–06 (Sheet 02 / 06 · Artists), com o índice na margem direita. Risco: virar enfeite e
esconder preço e contato; resolvido com a etiqueta trazendo o preço da fixture e com "Call" e
"Book" sempre à vista.

**B. Stencil Ledger.** O estúdio como livro-caixa de estêncil: tabela de serviços e preços em
mono, carbono azul, artistas como fichas de cadastro, papel milimetrado. Clara e honesta, mas fria
e muito perto do "jornal" da Mercer Law (colunas, fios, mono); não dá vontade de mostrar a ninguém.

**C. Studio Wall.** A parede do estúdio fotografada: quadro de cortiça, polaroids presas com
alfinete, fio vermelho entre as peças (a Aralesk quase literal). Bonito, mas dependeria de fotos de
trabalho real dos artistas, que a fixture não tem (fotos de banco apresentadas como trabalho deles
seria mentira), e puxa para o escuro e o marrom.

**Por que A:** é a única em que a primeira dobra só serve a um estúdio de tatuagem e a interação
principal (escolher um flash e levá-lo para a ficha) é o que um cliente faz de verdade no balcão.
De B ficou a ficha de consulta como formulário de balcão (campos numerados, picote, "carbon copy");
de C, os recortes de foto com fita e a linha vermelha que corre no índice.

## Decisões

- **Paleta:** papel `#f2ede3`, ficha `#fbf8f1`, papel 2 `#e9e2d4`, tinta `#171513`, tinta suave
  `#595651` (6,3:1), vermelho `#b8261c` (5,4:1 sobre o papel, o papel sobre ele também). No rodapé
  escuro o mesmo vermelho clareia para `#e86a5f` (5,8:1). O vermelho só marca: o círculo de caneta,
  o número da folha atual, o carimbo de 18+, a placa de Flash Fridays e o botão de agendar.
- **Tipografia:** uma grotesca só, **Archivo** variável: eixo `wdth` 62 + peso 800–900 para os
  títulos condensados ("IRON / LOTUS" até 13 rem, nomes dos artistas, preços), `wdth` 100 para o
  texto (17–18 px). **IBM Plex Mono** só para números, rótulos, a ficha e as legendas.
- **Composição:** grade 6 × 6 na folha do topo (cada peça com coluna, linha, largura, altura,
  inclinação e profundidade em `content.ts`); no celular, a mesma folha vira grade de 3 colunas com
  o lótus 2 × 2 e as peças largas 2 × 1, cada uma com número e nome.
- **Hierarquia por índice:** cada seção abre com "0X Sheet 0X / 06 · Nome" + título grande; os
  artistas são linhas 01–03; os preços são placas A–F; os passos 01–04.
- **Navegação:** trilho fixo na margem **direita** (a Mercer usa um bloco vinho à esquerda), no
  mesmo papel, com 01–06 e o rótulo de cada folha; a atual ganha o número vermelho e um círculo de
  caneta; uma linha de tinta vermelha desce com a rolagem. Embaixo: horário, telefone e "Book a
  consult". Tablet: barra no topo com "Call" e "Book". Celular: barra fina com "Index" e a doca do
  polegar com "Call" e "Request a consult".
- **Fotos:** 6 cenas do Unsplash (mãos de luva com a máquina, esboço de letreiro, pincéis sobre
  desenhos coloridos, sessão de desenho, estêncil cortado de uma folha de flash, mural "DENVER"),
  em preto e branco como fotocópia presa com fita; ganham cor com o mouse. Toda legenda diz
  "Example image" e, nos artistas, "not Mara's work". Créditos com UTM no rodapé; os
  `download_location` foram para a fila do kit (3 buscas na API, de 6 permitidas).
- **Ficha de consulta (demo):** 6 linhas numeradas (lugar, tamanho, tipo de trabalho, artista, a
  ideia com imagem de referência opcional, nome/contato/18+). O "price guide" no pé mostra só o
  que a fixture diz para aquele caso (custom $180/h com consulta e sessão de desenho; fine line
  a partir de $150, 1–2 h; cover-up com consulta grátis e depois $180/h; dia inteiro $1,100 até
  6 h para manga ou costas; Flash Fridays a partir de $100; depósito de $100). A imagem escolhida
  vira `blob:` local e nunca sai da aba; "Demo · sends nothing" desde o início, na hora de entregar
  e na cópia carbono. Erros num resumo com links (`role="alert"`), linhas marcadas "Needed".
- **Movimento (cinético contido):** entrada da folha em CSS (peças "presas" em sequência de
  55 ms, 0,6 s) e do título (linhas sobem da máscara); paralaxe do ponteiro por profundidade nas
  peças; peça reta e maior no hover; círculo de caneta que se desenha; números das folhas sobem da
  máscara; recortes "caem" e assentam; carimbo bate; moldura dos artistas troca de cena pela
  rolagem e inclina para o ponteiro. Tudo em `IronLotusMotion.tsx` (GSAP + ScrollTrigger),
  `transform`/`opacity` apenas. "Reduzir movimento": nada anda (0 animações, nada escondido).
  Modo leve (≤ 4 núcleos ou ≤ 4 GB): sem paralaxe nem scrub, só revelações simples.
- **Rodapé:** bloco de tinta com o lótus, endereço, horário, telefone, "fictional… design
  demonstration by No Sweat… flash designs drawn for this demo… photos are example scenes", os 6
  créditos e a palavra "IRON LOTUS" vazada; por último o `NoSweatBadge` com `--nsb-bg` tinta e
  `--nsb-fg` papel.

## Validação (build de produção, `next start -p 3706`)

- `tsc --noEmit`, `pnpm lint` (sem erros; 2 avisos antigos fora da demo), `prettier --check
app/demos components/demos` e `pnpm build` passam.
- Kit `cap.cjs` em 1440×900, 834×1112 e 390×844: rolagem lateral 0, nenhum erro no console.
- Kit `axe.cjs` (WCAG 2.2 AA + boas práticas, reduzir movimento) em 1440 e 390: **0 violações**.
- Teclado: "Skip to content" → marca → 01–06 → Call → Book → peças 01–12 → "Ask Mara/Theo/Lena" →
  ficha → visita → rodapé; 0 alvos de foco invisíveis; Enter numa peça circula e mostra a etiqueta.
- Fluxo testado no Playwright: hover/clique na rosa (`aria-pressed`), "Put No. 05 on a consult
  slip" põe a peça na ficha, entrega vazia lista 4 linhas faltando com foco no resumo, "Ask Theo"
  marca o Theo, o guia mostra os preços certos (e avisa que fine line é com o Theo), entrega →
  cópia carbono `role="status"`; índice do celular abre com foco no primeiro item, Esc devolve o
  foco ao botão.
- Reduzir movimento: 0 animações, nada com opacidade < 1, nenhuma peça deslocada, rolagem sem
  `smooth`. Modo leve: 0 peças com paralaxe (12 no modo completo).
- Vídeo de 73,9 s (2.218 quadros, 30 fps, 1440×900) gravado quadro a quadro com o relógio virtual
  (`vtime.js`, 8 núcleos) no build de produção: folha (hover, circular a rosa, botão da etiqueta),
  os três artistas, preços, passos e carimbo, a ficha preenchida e entregue, visita e rodapé. Fica
  fora do repositório (pasta `videos/` do kit), em versão 1280 px e leve 960 px.

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Observação                                                                                             |
| -------------- | ---- | ------------------------------------------------------------------------------------------------------ |
| Ideia          | 4    | a folha de flash que vira pedido; só serve a um estúdio de tatuagem                                    |
| Primeira dobra | 4    | "IRON LOTUS" condensado + 12 peças presas, etiqueta e botões no primeiro quadro                        |
| Hierarquia     | 3    | folhas numeradas claras; a coluna da direita da visita fica vazia embaixo                              |
| Tipografia     | 4    | uma família com dois "trabalhos" pelo eixo de largura + mono para números e ficha                      |
| Ritmo          | 3    | formas próprias por seção (folha, índice, placas, passos, ficha), mas todas abrem com a mesma anatomia |
| Imagem         | 3    | a arte principal é nossa e coerente; as 6 fotos de banco vêm de sessões diferentes (o P&B une)         |
| Movimento      | 4    | um temperamento (cinético curto), explica a estrutura (presas, circular, índice que corre)             |
| Ação principal | 4    | "Book a consult" no trilho, barra do tablet e doca do celular; "Call" sempre junto                     |
| Celular        | 4    | folha em grade de 3 com nomes, etiqueta presa embaixo, doca do polegar; sem rolagem lateral            |
| Acessibilidade | 4    | axe 0 em 1440 e 390, teclado completo, reduzir movimento testado                                       |
| Desempenho     | 3    | 6 fotos `lazy` com srcset, arte em SVG, modo leve; LCP não medido                                      |
| Honestidade    | 4    | só fatos da fixture; "drawn for this demo", "example image, not Mara's work", ficha que não envia      |
| Não repete     | 3    | outro arquétipo e superfície; mas trilho lateral + doca de baixo também existem na Mercer Law          |

Média 3,6; nenhum critério abaixo de 3; travas (celular, acessibilidade, honestidade) em 4.

## Correções feitas na revisão

- O círculo de caneta aparecia pela metade em todas as peças: `vector-effect: non-scaling-stroke`
  anula o `pathLength=1` → tirado; a espessura passa a acompanhar o tamanho da peça.
- O punhal (SVG 1 × 2) estourava a célula quadrada no celular: a arte passou a um retângulo
  absoluto com tamanho definido.
- "Call" e "Book" do topo apareciam no celular junto com a doca: `.il-btn { display }` vencia o
  `hidden` do Tailwind → classe própria `il-topbar-cta`.
- A foto do estêncil cobria o rótulo da placa C (cover-ups): sem sobreposição.
- A moldura dos artistas ficava na cena da Mara ao rolar sem mouse: a linha do meio da tela vira a
  ativa (`IntersectionObserver`), então a legenda "not Lena's work" aparece ao lado da Lena.
- Número da ficha gerado num efeito (lint `set-state-in-effect`) → nasce ao entregar, como o
  carimbo do balcão ("No. ____" até lá).
- Espaçamento das seções variado (artistas e visita com mais ar, preços mais justos).
- Marcos: barra do topo como `header` e doca como `nav` (cada um some no tamanho em que o outro
  aparece), para o axe não achar conteúdo fora de região.
- Achado no primeiro vídeo: depois de entregar a ficha (a ficha vira uma cópia carbono mais
  curta), o endereço e a foto da visita não apareciam, porque o ScrollTrigger guardava as posições
  antigas. Um `ResizeObserver` no `<main>` recalcula as posições quando a altura muda.
- No vídeo, depois de circular a rosa o ponteiro passava sobre o coração e a etiqueta mostrava
  "No. 08" com o botão "Put No. 05": o roteiro agora leva o ponteiro ao botão.

## Limites

- As peças de flash são desenhos simples feitos em SVG à mão para a demo; um estúdio real trocaria
  pela folha de flash dele (a grade aceita qualquer imagem por célula).
- Não há foto de trabalho dos artistas (a fixture não tem); um cliente real precisaria de 6–12
  fotos próprias para o índice de artistas.
- Sem teste com leitor de tela real; LCP/CLS não medidos com Lighthouse.
- O projeto não foi gravado no `usage-log.json` (fora dos arquivos permitidos nesta tarefa).
