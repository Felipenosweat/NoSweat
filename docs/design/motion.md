# Movimento

Movimento é parte do arquétipo, não um enfeite que se liga no fim. Cada projeto escolhe **um**
temperamento (eixo `motion` em `archetypes.md`) e o segue em tudo: entrada, rolagem, hover,
menu.

## Os 5 temperamentos

| Temperamento | Curvas e tempos                                                    | Bom para                          | Ruim para                   |
| ------------ | ------------------------------------------------------------------ | --------------------------------- | --------------------------- |
| `ceremonial` | ease-out longo `cubic-bezier(.16,1,.3,1)`, 0,9–1,6 s; nada de mola | palácio, joalheria, vinícola      | serviço com pressa          |
| `cinematic`  | ligado à rolagem (scrub), palco preso, dissolução de 1–1,4 s       | destinos, lançamentos, imóveis    | página curta, celular fraco |
| `kinetic`    | 0,4–0,8 s, `power3/expo.out`, linhas e letras escalonadas 30–60 ms | estúdios, eventos, marcas ousadas | texto longo                 |
| `quiet`      | só opacidade + subida de 12–24 px, 0,5–0,7 s, uma vez              | serviços, clínicas, a maioria     | —                           |
| `playful`    | molas leves, inclinação no hover, cursor que segue                 | café, criança, portfólio leve     | luxo, jurídico              |

## Receitas (todas usadas no Aurelia; código em `apps/web/components/demos/aurelia/`)

1. **Abertura cerimonial pulável.** Portas que se abrem + brasão que se desenha (traço SVG) +
   nome que se espaça. Até 2,7 s, botão "Skip" focável, Esc pula, e só toca **uma vez por
   sessão** (`sessionStorage` + script inline no `<head>` que marca `html[data-a-opened]`
   antes da pintura, para quem volta não ver a cortina piscar). Nunca bloqueia a leitura:
   o conteúdo já está no HTML por baixo.
2. **Revelação por máscara em arco.** `clip-path: inset(100% 0 0 0 round 999px 999px 0 0)` →
   `inset(0 ...)` com a foto dentro saindo de `scale(1.15)` para 1. Mesma forma do layout (o
   arco), então o movimento confirma a composição em vez de competir com ela.
3. **Filete que se desenha.** `scaleX(0)` → 1 com `transform-origin: left`, antes do título do
   capítulo. Barato, elegante, diz "começou um capítulo".
4. **Herói com escala ligada à rolagem.** A foto vai de 1 a 1,12 e o título sobe e esmaece
   enquanto o herói sai. O zoom de entrada em CSS fica num **invólucro** (`.a-hero-zoom`), e o
   GSAP mexe na foto: duas propriedades `transform` no mesmo elemento brigam.
5. **Enfilada horizontal presa.** A galeria fica presa (`position: sticky`, altura 360vh) e a
   fileira anda de lado com a rolagem; uma linha de progresso mostra onde se está. Só no
   computador e só com movimento completo; no celular e em "reduzir movimento" é uma fileira
   com rolagem nativa e `scroll-snap`.
6. **Troca de imagem por capítulo.** Foto presa à esquerda, capítulos à direita; o
   `IntersectionObserver` (`rootMargin: -45% 0px -45% 0px`) diz qual capítulo está no meio e a
   foto dissolve (opacidade + escala 1,06 → 1). Sem cálculo por quadro.
7. **Acordeão de arcos.** `flex-grow` de 1 para 4,2 com transição de 0,9 s; o nome vira
   vertical nos arcos fechados. Abre com mouse, foco do teclado e clique (`aria-expanded`).
8. **Cursor de ouro** só com ponteiro fino (`(hover: hover) and (pointer: fine)`), só sobre
   elementos marcados (`data-a-cursor`), e nunca esconde o cursor do sistema.

## Regras

- **`prefers-reduced-motion: reduce`**: abertura não toca, nada preso, nada ligado à rolagem,
  só trocas instantâneas ou opacidade curta. Testar de verdade (Playwright
  `reducedMotion: "reduce"`), não só ler o CSS.
- Dos 4 sites imersivos, só a kozowood muda algo com "reduzir movimento" (tira a porta). Os
  nossos vão além: nada preso, nada ligado à rolagem, sem carregador, imagens no estado final.
- **Como a era-estate faz** (a única das 5 de luxo que respeita "reduzir movimento"): duração
  quase zero em tudo e as revelações forçadas a aparecer. Nenhum dos 5 sites editoriais mudou
  com "reduzir movimento". É o mínimo, não um diferencial.
- **Modo leve** em máquina fraca (`hardwareConcurrency <= 4 || deviceMemory <= 4`): pula os
  efeitos ligados à rolagem e mantém as revelações simples (mesma regra da landing V8).
- **Carregador: no máximo ~1 s**, e só enquanto a foto do herói ou as fontes carregam, com a
  cara da marca (a son-daven conta "% LOADED" e some em segundos; o da oryzo-ai ainda estava
  na tela aos 48 s sem placa de vídeo). Nunca uma porta "Entrar" que trava a rolagem (kozowood).
- **Palavra por palavra só em 2–3 linhas de manifesto**, e o texto inteiro aparece sem
  movimento (kozowood).
- **Som desligado por padrão; um filme de herói de até 3 MB, mudo, com pôster primeiro.**
  floema baixa ~14 MB de MP3 na página inicial, kozowood ~7,7 MB de áudio, son-daven ~54 MB
  numa rolagem completa.
- **Só `transform` e `opacity`** (e `clip-path` em elementos pequenos). Nada de animar
  `width/height/top/left`, sombra ou filtro em área grande.
- **Movimento nunca atrasa a ação principal.** O botão de reservar/ligar aparece no primeiro
  quadro.
- **Sem rolagem sequestrada** (Lenis e afins): a rolagem é do navegador. Tiramos o Lenis da
  landing (PR #45) porque pesava em máquina fraca.
- **Easing nunca quica** em `heritage-grandeur`, `quiet-luxury` e `broadsheet-editorial`.

## Gravar um vídeo de demonstração liso

Gravar a tela em tempo real neste ambiente (sem placa de vídeo, 4 núcleos) sai travado **e**
em modo leve (sem os efeitos). O jeito certo é quadro a quadro com relógio virtual: um script
injetado antes da página (`addInitScript`) troca `performance.now`, `Date.now`,
`requestAnimationFrame` e os timers por um relógio que só anda quando o gravador manda, pausa
as animações CSS (`document.getAnimations()`) e avança o `currentTime` delas junto; o gravador
rola a página com easing, tira um print por quadro (30 fps) e o `ffmpeg` junta. Informe 8
núcleos (`navigator.hardwareConcurrency`) para não cair no modo leve. Usado no vídeo do
Aurelia (`aurelia.md`).
