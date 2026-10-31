# Estudo de caso: Hollis Interiors

Demonstração de um estúdio de design de interiores **fictício** de East Nashville em
`/demos/hollis-interiors` (fora do índice de busca: `robots: noindex`). Código em
`apps/web/app/demos/hollis-interiors/` e `apps/web/components/demos/hollis/`. Todo fato vem da
fixture `packages/fixtures/src/library/hollis-interiors.ts`: Claire Hollis e Jess Tran, o endereço,
a área, o horário, os cinco serviços com taxas e prazos, "custo + 15%", os quatro projetos recentes
(só por nome), as duas frases de clientes e o telefone 555.

## Pedido

Direção do seletor: arquétipo **quiet-luxury** — composição `pinned-stage` (ou `split-editorial`),
tipos `grotesk-only`, hierarquia `index-led`, imagem `framed-editorial`, navegação `top-bar`,
movimento `cinematic` mas lento, superfície `photographic` / um neutro claro. Assinatura que só
sirva a um designer de interiores. Não pode parecer Aurelia (palácio escuro, ouro, serifa), Mercer
Law (jornal serifado, trilho vinho), Fade & Co. (blocos vermelhos, letra cinética), Smoke & Rail
(escuro cinematográfico, brasa) nem Greenline (papel de aveia, colagem, Fraunces).

## Referências (pesquisa desta rodada)

Registros em `research-inbox/hollis-interiors.json`, estudos em `studies/`. A Awwwards segue
inacessível daqui; os prêmios vêm de resultados de busca, conferidos com o site ao vivo.

| Referência                               | Prêmio (evidência)                                                                                                    | O que levamos                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Studio DADO](../studies/studio-dado.md) | Site of the Day, 25/02/2026 (título e resumo da busca na página awwwards.com/sites/studio-dado)                       | um tamanho só de grotesco para tudo que é prático; legenda de catálogo sob um fio; colunas vazias; bloco quente no fim |
| [Tecnoarreda](../studies/tecnoarreda.md) | Honorable Mention, 09/07/2026, LO Studio (resumo da busca; o site carrega GSAP, como diz a ficha)                     | letra grande só se for fina e curta; o cômodo é o herói e o texto é legenda                                            |
| [Shed](../studies/shed-design.md)        | "Site of the Day" segundo o título de um artigo da Abduzeedo (artigo não abriu; sem data) — registrado como `partial` | os tipos de cômodo como **índice** de palavras sobre fios, cada uma ligada a uma imagem; etiqueta de seção minúscula   |

Não levamos: herói só de vídeo sem pôster e `alt` vazio (DADO), painel de consentimento sobre o
celular e texto fino cinza no preto (Tecnoarreda), capitais pesadas e azul elétrico, botões sem
contorno de foco (Shed), e o Lenis/revelações que ignoram "reduzir movimento" dos três.

## Três direções

**A. Room by Room (escolhida).** Um quadro preso no meio da página; ao rolar, o cômodo troca (sala,
cozinha, banho, quarto, escritório) por dissolução lenta, com uma câmera que anda devagar dentro da
foto. À esquerda, um índice pequeno 01–05 com a taxa de partida de cada cômodo; à direita, a
**paleta lida da própria foto** (quatro tons medidos, com faixa proporcional ao quanto cada um cobre)
e o serviço da fixture que cobre aquele cômodo. Papel de gesso, um grotesco só, legendas de catálogo.
Risco: o palco preso cansar ou esconder preço e contato — resolvido com cinco trechos curtos (80svh),
preços no próprio índice e a barra fixa com telefone + "Book a consultation".

**B. The Sample Board.** O site como a prancha de amostras do estúdio: uma mesa vista de cima com
tecidos, madeiras e pedras que o visitante arrasta para montar a paleta de um cômodo. Muito própria
de designer, mas pediria fotos de materiais "da Hollis" (inventadas) ou ilustrações, viraria um
brinquedo e afastaria o pedido de consulta.

**C. Floor Plan Walk.** Uma planta baixa de uma casa de Nashville desenhada à mão; clicar num cômodo
abre a foto dele. Boa para o "full-home design", mas a planta seria de uma casa que não existe (um
projeto inventado, regra 8), e em 390 px a planta fica pequena demais para tocar.

**Por que A:** é a única que nasce do que o brief realmente tem (serviços por cômodo, taxas e prazos,
"cost plus 15%") sem inventar obra, e é exatamente a composição `pinned-stage` + hierarquia
`index-led` pedida. De B ficou a paleta como assinatura (só que medida da foto, não inventada); de
C, a ideia de percorrer a casa cômodo por cômodo e o fecho "Through the door" do topo.

## Decisões

- **Paleta:** gesso `#f1efea` (fundo), papel `#f8f7f4` (consulta), pedra `#e9e6df` (estúdio), tinta
  `#1f1d1a`, cinza `#625d55` (5,7:1), **um** acento nogueira `#7a5236` (5,9:1; só número ativo, fio do
  processo e avisos de demonstração) e o bloco nogueira escuro `#2b2622` para visita + rodapé + selo.
- **Tipo:** Host Grotesk 300/400/500 (nenhuma outra demo usa). Títulos 300 com −0,028 a −0,035em,
  texto 15–17 px, rótulos de 11 px em caixa-alta +0,14em, legendas 12,5 px, números tabulares.
  Razão display:texto ≈ 4× no topo, ~2,5× nas seções: calmo.
- **Composição:** topo split-editorial (texto em 5 colunas, quadro em 6, fatos no pé), palco preso
  01, serviços 02 como índice 00–04 com fios e preço à direita (+ 4 perguntas da fixture), uma pausa
  larga sem texto, processo 03 (cinco etapas que saem da fixture: consulta → orçamento fixo →
  projeto → pedidos a custo + 15% → dia da instalação, com quem cuida de cada uma), estúdio 04
  (Claire e Jess só em texto, sem retrato de banco; as duas frases; projetos só por nome),
  consulta 05, visita 06 no bloco escuro.
- **Assinatura:** a paleta medida. As cores de cada cômodo saíram de `convert -colors 6` sobre a foto
  (a quantidade de pixels de cada cor vira a largura da faixa e a porcentagem); os nomes (Plaster,
  Oatmeal, Walnut…) são descritivos e a página diz "An example palette: four tones sampled from the
  photo".
- **Fotos:** 10 do Unsplash, seis da mesma série de Clay Banks (mesma luz de dia, paredes brancas,
  nogueira, couro); toda legenda diz "Example room/Example image" e o rodapé diz que não são
  projetos da Hollis. `download_location` das 10 na fila do kit.
- **Pedido de consulta (demo):** cômodos → onde e quando → contato, com validação por passo, foco no
  título de cada passo e confirmação em `role="status"` que diz que nada foi enviado. Sem faixa de
  orçamento (a fixture não define); ao lado, "Where you would start" calcula o ponto de partida só
  com as taxas da fixture (fora do Tennessee → e-design).
- **Movimento (`HollisMotion.tsx` + CSS):** moldura que abre das bordas (clip-path inset 7% → 0) com
  a foto assentando (1,12 → 1); fio que se desenha; topo com parallax leve; fio vertical do processo
  ligado à rolagem; no palco, dissolução de 1,4 s e "pan" de 16 s por tempo. Curvas power2/power3 e
  `cubic-bezier(.65,0,.35,1)`, nada quica. Modo leve: sem scrub. Reduzir movimento: nada preso
  (o palco vira botões), sem entradas, sem pan.

## Validação (build de produção, `next start` na 3707)

- `tsc --noEmit`, `pnpm lint` (0 erros; 2 avisos antigos fora da demo), `prettier --check` e
  `pnpm build` passaram.
- `cap.cjs` em 1440×900, 834×1112 e 390×844: rolagem lateral 0, nenhum erro no console.
- `axe.cjs` (WCAG 2.2 AA + boas práticas, reduzir movimento) em 1440 e 390: **0 violações**.
- Playwright: palco preso troca sala → cozinha → banho → quarto → escritório pela rolagem e o
  índice leva ao cômodo; no celular o toque troca; com reduzir movimento nada preso, nenhuma
  animação rodando e nenhum bloco escondido. Consulta: erro sem cômodo, erro sem nome, foco no
  título de cada passo, confirmação. Menu do celular: foco no primeiro link, resto inerte, Esc fecha
  e devolve o foco. Teclado: "Skip to content" primeiro, contorno visível em tudo.
- Vídeo (74 s, 30 fps, relógio virtual, 8 núcleos): `kit/videos/hollis-interiors.mp4` e
  `-light.mp4` (gravado a 80 s e acelerado 1,08× no ffmpeg).

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Nota                                                                                            |
| -------------- | ---- | ----------------------------------------------------------------------------------------------- |
| Ideia          | 4    | "room by room": quadro preso + paleta medida + serviço por cômodo; só serve a interiores        |
| Primeira dobra | 3    | calma e precisa, mas o palco (a ideia) só aparece na segunda tela                               |
| Hierarquia     | 4    | um foco por tela; índices numerados em todo lugar                                               |
| Tipografia     | 4    | um grotesco, escala com propósito, versalete e tabulares                                        |
| Ritmo          | 4    | cada seção com forma própria (palco, índice, pausa, lista, citações deslocadas, bloco escuro)   |
| Imagem         | 3    | série coerente de Clay Banks; banho e quarto de outros fotógrafos; a pausa mostra uma geladeira |
| Movimento      | 4    | lento, um temperamento, explica o palco; nunca atrasa o botão                                   |
| Ação principal | 4    | "Book a consultation"/"Consult" + telefone na barra em toda tela                                |
| Celular        | 4    | índice em 5 botões, quadro 4:5, telefone e consulta na barra; sem rolagem lateral               |
| Acessibilidade | 4    | axe 0 em 1440 e 390, teclado, foco, reduzir movimento testados                                  |
| Desempenho     | 3    | 10 fotos com srcset e `lazy`; o palco carrega as 5 fotos dos cômodos juntas                     |
| Honestidade    | 4    | só fatos da fixture; "Example room" em toda foto; rodapé diz o que é ficção                     |
| Não repete     | 4    | quiet-luxury + grotesco + gesso: nada em comum com as cinco demos anteriores                    |

## Correções feitas na revisão

- Telefone da barra aparecia (quebrado em 3 linhas) no celular: `.h-navlink` definia `display` e
  anulava o `hidden` do Tailwind → invólucro com `hidden lg:inline`.
- Linhas de serviços e projetos com preço/ano caindo na primeira coluna em ≥640 px (o
  `row-start-1` do celular continuava valendo) → posições explícitas por coluna.
- Folga demais depois do palco preso (20svh → 10svh).
- "Usual timeline: remote · 3 weeks" → "3 weeks".

## Limites

- Fotos de banco de casas diferentes; um cliente real teria as próprias fotos (e os projetos
  recentes poderiam ganhar imagem).
- Sem teste com leitor de tela real (só axe, teclado e Playwright).
- O selo "Shed" é evidência fraca (artigo não aberto); não foi aprovado.
