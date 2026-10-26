# Estudo de caso: Smoke & Rail BBQ

Demonstração de um pit de churrasco + food truck **fictício** de Kansas City em
`/demos/smoke-and-rail-bbq` (fora do índice: `robots: noindex`). Código em
`apps/web/app/demos/smoke-and-rail-bbq/` e `apps/web/components/demos/smoke-and-rail/`. Todo fato
vem do site-modelo `packages/fixtures/src/library/smoke-and-rail-bbq.ts` (nome, endereço,
horários, cardápio e preços, catering, telefone 555, e-mail, as duas falas de clientes que o dono
passou). Nada de nota, prêmio, "desde", "o melhor" ou garantia.

## Pedido e direção atribuída

Direção do seletor: arquétipo **cinematic-scrollytelling**, composição `pinned-stage`, tipo
`slab+grotesk` ou display condensado pesado, hierarquia `image-led`, imagem `full-bleed`,
navegação `overlay-menu` com "Order / Call" sempre à mão, movimento `cinematic`, superfície
`monochrome-dark` (carvão + uma brasa). Obrigatório: cardápio com preços, horários, como chegar
e ligar/encomendar sempre a um toque no celular. Não pode lembrar o Aurelia nem o molde
Signature: nada de arcos, nada de ouro, nada de serifa.

## Três direções

**A. Fourteen Hours (escolhida).** O pit é um palco preso na primeira dobra e a rolagem é o
relógio de um brisket: um contador mecânico enorme em brasa vai de 00 a 14, as fotos se
dissolvem do fogo para a fumaça, para a casca e para o corte, e o texto de cada cena entra no
espaço vazio. O nome da casa (o pátio de trens ao lado) vira o sistema do resto da página: a
barra de progresso é um trilho com 15 dormentes (horas 0–14) e estações clicáveis, o cardápio é
uma placa de partidas com plaquinhas que giram, a semana é um quadro de horários com o dia de
hoje marcado, a história é uma linha de trilho com três paradas (2011, 2018, 2022). Big
Shoulders (letreiro industrial de Chicago, condensado) + Archivo. Risco: página longa e pesada
em celular fraco; resolvido com o modo pilha (sem JS, "reduzir movimento" e modo leve).

**B. Sold Out Board.** Tipográfica, sem palco: a primeira dobra é o próprio quadro do dia em
letras de estação ("TODAY · THE PIT · 11 AM – SOLD OUT"), com o cardápio logo abaixo como placa
de partidas e uma faixa de fotos em preto e branco com só a brasa colorida. Rápida e muito útil,
mas é `kinetic-type`/`service-direct`, não a direção atribuída, e a primeira dobra não teria
imagem: perde o "image-led" e a fumaça, que é o que vende churrasco.

**C. Night Freight.** Capítulos horizontais presos (`horizontal-chapters`): a página anda de lado
como um trem passando, um vagão por capítulo (pit, cardápio, truck, catering), fotos do pátio à
noite. Forte e diferente, mas sequestra a direção da rolagem por muito tempo, esconde o cardápio
atrás de três vagões e no celular vira uma fileira que ninguém termina. O vagão sobreviveu só
como a foto do pátio que abre da esquerda para a direita.

**Por que A:** é a única em que a primeira dobra mostra o produto (fumaça e fogo), conta o fato
que o dono mais repete (14 horas sobre hickory) sem um adjetivo, e mantém tudo o que o cliente
precisa a um toque: "Preorder pickup" e o telefone no cabeçalho e numa doca fixa no celular, o
cardápio logo depois do palco, e um "Skip to the menu" para quem não quer a história. De B
ficaram a placa de partidas e o quadro do dia; de C, a foto que abre como um vagão passando.

## O que veio de cada referência

Registros em `docs/design/research-inbox/smoke-and-rail-bbq.json`; estudos em
`docs/design/studies/`.

- **white-desert** (Malvah, Site of the Day 11/09/2026 por trecho de busca; aberto ao vivo): o
  número que define a experiência vira cena (o painel de voo com horas, distância e
  temperatura) → o contador 00–14; display condensado em tamanho de monumento + outra voz para o
  texto → Big Shoulders + Archivo; um único acento saturado sobre paleta neutra → a brasa. Não
  levamos: filme sem pôster, foco de 0 px, aviso de chat sobre o celular, Lenis.
- **gourou-indian-food** (13g + Thomas Carré, Honorable Mention 17/02/2026 por trecho de busca e
  crédito no rodapé; aberto ao vivo): o cardápio como peça da identidade → a placa de partidas;
  nome real do prato + uma linha → descrições do dono; endereço, transporte, horário e telefone
  juntos → o quadro da semana + cartão do pit. Não levamos: texto de 14 px, cinco cores, nada
  mudar com "reduzir movimento".
- **bucks-sauce** (molho de churrasco, Site of the Day + Developer Award 03/07/2026 por trecho de
  busca): **não inspecionado**. buckssauce.com respondeu com o "Vercel Security Checkpoint"
  (código 21) ao curl e ao Chromium; bucks-sauce.com é domínio estacionado. Fica como pista
  (`evidenceStatus: unavailable`, `approved: false`); nada dele entrou no design.

## Decisões

- **Paleta:** carvão #0d0c0b, carvão claro #161412, ferro #221f1c, fumaça #ece6dd, cinza
  #a39b91, brasa #ff6a2b. Contrastes: fumaça/carvão 16,6:1, cinza/carvão 7:1, brasa/carvão 6,3:1.
  A brasa nunca é fundo de seção: botão, número, fio, aviso.
- **Tipos:** Big Shoulders 800–900 caixa-alta (títulos, números, placas, cardápio) e Archivo
  (texto 17–18 px, rótulos em semicondensado espaçado). Duas famílias.
- **Palco preso (assinatura):** seção de 600svh com o palco `sticky`; uma linha do tempo do GSAP
  de exatamente 14 "horas" ligada à rolagem (`scrub: 0.6`). O contador é mecânico: o número fica
  parado e rola só no último quarto de cada hora, para ler sempre limpo. Fumaça (foto em
  `screen`) atravessa o palco entre as horas 2 e 13. Estações do trilho levam a cada cena; foco
  de teclado numa cena escondida rola até ela. Só `transform` e `opacity`.
- **Placa de partidas:** preço e aviso em plaquinhas com vinco; as letras giram uma vez ao
  entrar (rAF) e param na certa; o leitor de tela lê o texto inteiro (`sr-only`), as plaquinhas
  são `aria-hidden`. No computador, a foto presa à esquerda troca com o mouse sobre a linha.
- **Quadro da semana:** tabela de verdade (`caption`, `th scope`), segunda a domingo; depois de
  carregar, o dia de hoje no fuso de Kansas City (`America/Chicago`) ganha a marca de brasa e uma
  linha `role="status"` diz "Today…" ou "Next…". Segunda e domingo dizem só "No pit or truck on
  the schedule" (o brief não lista esses dias).
- **Navegação:** cabeçalho mínimo (marca, telefone, "Preorder pickup", "Menu"); o menu é um
  `<dialog>` nativo em tela cheia (prende o foco, Esc fecha, o foco volta ao botão) com os seis
  capítulos em display grande e o resumo de horários + ações. No celular, doca fixa embaixo com
  "Call" e "Preorder pickup"; o selo da No Sweat já reserva o espaço dela.
- **Pedido demo (catering / truck / brisket inteiro):** regras do dono validadas (25 convidados
  mínimo para catering, até 100 para o truck) com a mensagem ligada ao campo; selo "Demo form ·
  nothing is sent" antes, e a confirmação em `role="status"` diz que nada foi enviado.
- **Honestidade:** rodapé diz que o negócio, as pessoas e o cardápio são fictícios, que o
  telefone é 555 e que os endereços de pedido e e-mail não existem; 12 fotos do Unsplash com
  autor + Unsplash (UTM), `download_location` de cada uma na fila do coordenador. As duas falas
  de clientes são as do brief, com o nome que o dono deu.
- **Selo:** `<NoSweatBadge />` é o último elemento, com `--nsb-bg`/`--nsb-fg` do rodapé.

## Validação (build de produção, `next start -p 3701`)

- `tsc --noEmit`, `pnpm lint` (0 erros; 2 avisos em arquivos que não são desta demo),
  `prettier --check app/demos components/demos`, `pnpm build` (página estática).
- `cap.cjs` em 1440×900, 834×1112 e 390×844: rolagem lateral 0, zero erros no console.
- axe-core (WCAG 2.2 AA + boas práticas) em 1440 e 390: 0 violações com "reduzir movimento" (o
  `axe.cjs` do kit) **e** 0 com movimento completo (palco preso ativo).
- "Reduzir movimento": `data-motion="reduced"`, palco em pilha, 0 títulos/parágrafos escondidos.
  Modo leve (4 núcleos): sem palco preso.
- Teclado: Tab passa por pular-links, marca, telefone, Preorder, Menu, as ações do herói, as 4
  estações e segue; contorno de 2 px em brasa. Estação "Bark" leva à cena certa. Menu: abre,
  foco no "Close", Esc fecha e devolve o foco; link do menu leva ao capítulo e fecha o diálogo.
  Formulário: 12 convidados em catering → `aria-invalid`; envio → "Thanks, Dana. This is a demo,
  so nothing was sent."
- Vídeo: 75 s, 30 fps, gravado quadro a quadro com o relógio virtual (8 núcleos informados,
  efeitos ligados) no build de produção: herói, menu em tela cheia, as 14 horas do palco, troca
  de foto na placa, quadro da semana, pátio e linha do tempo, tarifas, pedido demo, perguntas e
  rodapé. Versões 1280×800 (crf 22) e 960×600 leve (crf 27), fora do repositório.

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Nota                                                                                                     |
| -------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| Ideia          | 4    | "a rolagem é o relógio de 14 horas" + o pátio de trens como sistema (trilho, placa, quadro, paradas)     |
| Primeira dobra | 3    | fumaça + título condensado + "00" em brasa; o contador só vira assinatura quando se rola                 |
| Hierarquia     | 3    | no herói, o título e o "00" disputam o olho por um instante                                              |
| Tipografia     | 4    | Big Shoulders/Archivo, números tabulares, rótulos espaçados, texto 17–18 px                              |
| Ritmo          | 3    | palco, placa, quadro, foto que abre e tarifas têm formas próprias; cabeçalhos de seção repetem a fórmula |
| Imagem         | 3    | fogo/fumaça/carne coerentes e escuros; fotos de banco de lugares diferentes, a bandeja é mais clara      |
| Movimento      | 4    | um temperamento (cinematográfico), o relógio explica a história, nunca atrasa a ação                     |
| Ação principal | 4    | Preorder + telefone no topo; doca fixa no celular; "Get directions" no quadro                            |
| Celular        | 4    | herói recomposto para 390, doca do polegar, placa em duas colunas, sem rolagem lateral                   |
| Acessibilidade | 4    | axe 0 nos dois modos, teclado, diálogo nativo, tabela de verdade, reduzir movimento testado              |
| Desempenho     | 3    | 12 fotos `lazy` (herói `eager`), modo leve; LCP não medido; camada de fumaça em `screen` no palco        |
| Honestidade    | 4    | só fatos do brief, ficção e demo rotuladas, créditos                                                     |
| Não repete     | 4    | outro arquétipo, outra superfície, outra navegação e outros tipos que o Aurelia                          |

Média 3,6; nenhum critério abaixo de 3; as travas (celular, acessibilidade, honestidade) em 4.

## Rodada de crítica e correções

- O contador passava de 14 (a escala da última foto estendia a linha do tempo até 15,3 "horas":
  aparecia "1" sozinho no fim) → a duração das escalas é cortada em 14 e a hora sai do progresso.
- Os dígitos rolavam o tempo todo e liam pela metade ("09" com meio "10") → contador mecânico:
  só rola no último quarto de cada hora.
- No celular (390) o rótulo do herói ficava atrás do "00" → rótulo do relógio escondido no
  celular, contador menor (5,75 rem no mínimo), botões do herói lado a lado.
- O e-mail do rodapé quebrava no meio da palavra no computador → colunas do rodapé redivididas.
- Título "The pit, the truck and this week" (vírgula estranha) → "The pit and the truck this
  week".
- `setState` dentro de efeito (regra do lint) no quadro da semana → `useSyncExternalStore` com
  "sem dia" no servidor.

## Limites

- Fotos de banco: nenhuma é do lugar; um cliente real precisaria das próprias (o palco pede 5
  fotos fortes: fogo, pit, casca, corte, e uma de abertura).
- Sem teste com leitor de tela real (só axe, teclado e Playwright) e sem medição de LCP/CLS.
- A rolagem do app é `scroll-behavior: smooth` (global): os botões de estação usam rolagem suave
  de propósito, mas o gravador precisa de `behavior: "instant"`.
- Uma das 3 referências (bucks-sauce) não pôde ser aberta.
