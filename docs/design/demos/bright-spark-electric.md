# Estudo de caso: Bright Spark Electric

Demonstração de um eletricista residencial **fictício** em Phoenix, AZ, em
`/demos/bright-spark-electric` (fora do índice: `robots: noindex`). Código em
`apps/web/app/demos/bright-spark-electric/` e `apps/web/components/demos/bright-spark/`. Todos os
fatos (Marcus e Tasha Bell, 2006 e 2014, ROC/bonded/insured, preços, taxa de visita de $95,
horário, as seis cidades, telefone 555, e-mail e as duas falas de clientes) vêm de
`packages/fixtures/src/library/bright-spark-electric.ts` (regra 8). A fixture **não** fala de
emergência, plantão, prazo de resposta, garantia nem número de licença: a página não fala
também. O horário aparece exatamente como na fixture (seg–sex 7–17, sáb 8–12); domingo não é
mencionado.

## Direção pedida

Do seletor: arquétipo **service-direct** (telefone e orçamento primeiro, fatos simples, área e
horário sempre à vista), composição `type-poster`, tipografia `grotesk-only`, hierarquia
`number-led`, imagem `framed-editorial`, navegação `bottom-bar-mobile`, movimento `quiet`,
superfície `brand-block`. Não podia lembrar Aurelia (palácio escuro), Mercer Law (jornal, trilho
vinho), Fade & Co. (blocos vermelhos, tipo variável), Smoke & Rail (escuro cinematográfico), Greenline
(papel aveia, colagem), Sunrise (papel quente, Zilla Slab) nem Iron Lotus (folha de flash, Archivo
condensada, trilho à direita). Nem o molde Signature.

## Referências (detalhes em `research-inbox/bright-spark-electric.json` e `studies/`)

| Referência                          | Prêmio (evidência)                                                                                                                  | O que levamos                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| SWTCH (swtchenergy.com)             | Honorable Mention, 03/07/2023, só no resumo de busca de awwwards.com/sites/swtch; rodapé atual "Website by Locomotive"              | a promessa simples em grotesco pesado como imagem do topo; uma cor forte guardada para ação e um bloco de fecho       |
| Zaptec (zaptec.com)                 | Site of the Day, nota 7,29, só no resumo de busca de awwwards.com/sites/zaptec (sem data); inspiração "by Good Morning" na Awwwards | fatos técnicos numa fila calma (número/título curto + duas linhas, sem ícone); aparelho fotografado num lugar de casa |
| List General Contractor (listgc.at) | comunicado da agência Reichl und Partner ("AWWWARDS … 'Honorable Mention'"), lido com curl; sem data; **não aprovada**              | contagens do dono como letra de display, mas com o rótulo colado no número (o que lá falta)                           |

A Awwwards continua inacessível daqui. Os três sites foram abertos ao vivo (1440×900, 390×844 e
com "reduzir movimento"); nenhum dos três tem `tel:` na página inicial, o que confirmou a regra
oposta para nós: o telefone em todo lugar. Prints ficaram fora do repositório.

## Três direções

**A. Breaker Panel (escolhida).** Um cartaz: "Written quote first." (o destaque do próprio dono)
em Schibsted Grotesk 800 de até 216 px, tinta quase preta num bloco inteiro de amarelo de
segurança. Embaixo, a fila de números do dono ($95 · 6 · 7–5 · 2006). O índice de serviços é um
quadro de disjuntores: cada disjuntor é um serviço com o preço no rótulo; ligar um mostra o que
está incluso (só frases da fixture), o preço grande e uma cena emoldurada com legenda. A assinatura
de movimento: um fio na margem esquerda que se energiza com a rolagem e liga o interruptor desenhado
de cada "circuito" (seção, CKT 01–05). Risco: o amarelo cansar e virar "placa de obra"; resolvido
alternando amarelo (topo, área e horário), papel (serviços, pessoas, orçamento) e tinta (dia de troca
de quadro, rodapé).

**B. Work Order.** A página como uma ordem de serviço impressa: papel branco, grade fina, campos
numerados, carimbo "Written quote" e o orçamento como o próprio formulário. Muito honesta e muito
"eletricista", mas fria; o amarelo vira só detalhe e a primeira dobra não dá vontade de mostrar.

**C. Desert Noon.** Foto grande de uma casa de estuque com palmeiras ao meio-dia e a frase por cima,
paleta de areia e céu. Bonita, mas é o eixo `full-bleed-photo` (fora do pedido), depende de foto de
banco para carregar a página e lembra a Greenline.

**Por que A:** é a única em que a primeira dobra é inconfundível sem foto e já responde "o que,
onde, quanto e como ligo". De B ficaram a numeração (CKT 01/05, Fig. 01) e o pedido de orçamento
como folha branca com a faixa amarela; de C, a casa de estuque como uma das cenas.

## Decisões

- **Paleta:** amarelo `#ffd000`, tinta `#121211`, papel `#f3f1ea` e `#e8e5db`, cinza de quadro
  `#1d1e20`/`#2b2d30`. Amarelo nunca é texto sobre claro; sobre tinta, sim (12,7:1).
- **Tipografia:** só Schibsted Grotesk (400–900). Cartaz 800, −0,055em, entrelinha 0,84; números
  800; texto 400 a 16–18 px; rótulos 12 px +0,12em em caixa-alta. Algarismos de linha
  proporcionais (a vírgula tabular desta fonte deixava "$2 , 400"); só as horas grandes usam
  tabulares.
- **Navegação:** barra fina preta presa no topo (nome, 4 atalhos, "Open now · until 5 PM" pela hora
  de Phoenix, telefone em amarelo). No celular, Call / Text / Quote presos embaixo; o selo da No
  Sweat já tem 5,5 rem de folga e não fica coberto. No celular, uma linha "Mon–Fri 7–5 · Sat 8–12 ·
  6 Valley cities" fica logo abaixo do cartaz.
- **Quadro de disjuntores:** padrão de abas vertical (setas, Home/End, `aria-selected`), alvo de
  64 px, "Quote for this" leva o serviço escolhido para o pedido de orçamento. Preso (`sticky`) no
  computador enquanto o detalhe rola.
- **Pedido de orçamento (demo):** 3 passos (o que está acontecendo → cidade + cruzamento/CEP + até
  4 fotos que ficam no navegador → contato e "ligar ou mensagem"). Selo "Demo · Nothing is sent"
  desde o primeiro passo; confirmação em `role="status"` que repete que nada saiu. A escolha do
  problema não diagnostica: só aponta o serviço e o preço da fixture.
- **Fotos:** 5 cenas do Unsplash (eletricista testando uma caixa, carregador de parede, sala com
  ventilador de teto, casa de estuque, telhados vistos de cima), hotlink com `srcset`, legenda
  "Example scene, not a Bright Spark job", créditos com UTM no rodapé, `download_location` na fila
  do coordenador. Uma foto de quadro com adesivos de energia solar foi descartada (a fixture não
  fala de solar).
- **Movimento quieto:** linhas do cartaz sobem uma vez (0,7 s, 80 ms entre linhas); blocos sobem
  20 px; fotos abrem de baixo para cima na moldura; o fio (`scaleY` ligado à rolagem) e os
  interruptores. "Reduzir movimento": nada se move, fios cheios, interruptores ligados. Modo leve:
  sem nada ligado à rolagem (os interruptores ainda ligam por gatilho simples).

## Validação (build de produção, `next start`)

- 1440×900, 834×1112 e 390×844: `scrollWidth − innerWidth = 0`, zero erros no console.
- axe-core (WCAG 2.2 AA + boas práticas, "reduzir movimento"): 0 violações em 1440 e 390.
- Playwright: clique e setas no quadro, "Quote for this" pré-escolhe o serviço, erros por passo
  (cidade, nome, telefone) com foco no primeiro erro, foto local com prévia, confirmação; no fim da
  página nenhum circuito fica desligado; com "reduzir movimento" nenhum desligado e fio sem
  `transform`.
- Teclado: a ordem começa no "Skip to content" do layout raiz (um "skip" duplicado nosso foi
  tirado na revisão), depois a barra, o topo, o quadro.

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Nota                                                                                        |
| -------------- | ---- | ------------------------------------------------------------------------------------------- |
| Ideia          | 4    | quadro de disjuntores + fio que liga cada circuito: só serve a um eletricista               |
| Primeira dobra | 4    | "Written quote first." em bloco amarelo, telefone e fatos na mesma tela                     |
| Hierarquia     | 4    | um foco por tela: cartaz, quadro, passos 1–4, cidades, números das pessoas, formulário      |
| Tipografia     | 4    | uma família, escala com propósito, rótulos e números cuidados                               |
| Ritmo          | 3    | amarelo/papel/tinta alternam; pessoas e orçamento são dois papéis seguidos                  |
| Imagem         | 3    | cenas honestas e emolduradas, mas de banco e só dentro do quadro                            |
| Movimento      | 3    | um temperamento só; o fio é discreto, alguém pode nem notar                                 |
| Ação principal | 4    | telefone no topo em toda a página, barra de 3 ações no celular, "Call about this" no quadro |
| Celular        | 4    | desenhado para o polegar; sem rolagem lateral                                               |
| Acessibilidade | 4    | axe 0, teclado, foco visível, "reduzir movimento" testado                                   |
| Desempenho     | 3    | 5 fotos `lazy`, GSAP só no cliente, modo leve; LCP não medido                               |
| Honestidade    | 4    | só fatos da fixture; ficção e demo rotuladas; créditos                                      |
| Não repete     | 4    | primeiro `type-poster` + `brand-block` amarelo das demos                                    |

## Correções feitas na revisão

- "$2 , 400": vírgula tabular larga → algarismos proporcionais.
- O detalhe de "Panel upgrades" repetia os 4 passos da seção 02 → frases diferentes da fixture.
- O quadro deixava um vazio embaixo no computador → `sticky` enquanto o detalhe rola.
- Cartaz pequeno demais no celular (21vw) → 24vw; horário e área não apareciam na primeira tela
  do celular → linha curta logo abaixo do cartaz.
- Cabeçalho de circuito quebrava "CKT 02 / 05" no celular → `nowrap` e sem o fio decorativo.
- E-mail quebrando no meio no bloco de contato → coluna de rótulo mais estreita e 15 px.
- Dois "Skip to content" (o do layout raiz e o nosso) → tirado o nosso.

## Limites

- Fotos de banco, não do Marcus; um cliente real precisaria de 4–6 fotos próprias de serviço.
- Sem teste com leitor de tela real; LCP/CLS não medidos com Lighthouse.
- O "Open now" depende do relógio do visitante convertido para Phoenix; sem JS a linha não aparece.
