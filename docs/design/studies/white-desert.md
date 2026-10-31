# White Desert (Malvah) — números como cena, letra condensada de monumento

- Ao vivo: https://white-desert.com/ — operadora de expedições de luxo na Antártida.
- Prêmio (só busca; a Awwwards não abre deste ambiente): WebSearch
  `"White Desert" Antarctica website awwwards "Site of the Day" studio credits` → resultado
  "White Desert - Awwwards SOTD" (awwwards.com/sites/white-desert), trecho "Site of the Day -
  Sep 11, 2026", créditos "Malvah ^PRO, Geoff Dawes, Usudo". Entrevista da LBB Online com a
  Malvah cita o trabalho para a White Desert. A página do prêmio não foi carregada.
- Método (2026-10-26): Playwright Chromium (sem placa de vídeo; o navegador do ambiente não toca
  MP4/H.264, então o filme do herói não rodou), 1440×900 com 10 passos de rolagem por roda do
  mouse, 390×844 com 10 saltos, 1440×900 com `reducedMotion: "reduce"`, 8 Tabs, estilo
  computado (h1/h2/p, `document.fonts`), elementos `fixed`/`sticky`. Prints ficaram fora do
  repositório.

## Observação

- **Estrutura (≈20 800 px no computador):** herói com filme mudo (`video` com `autoplay`, sem
  `poster`: o primeiro quadro é cinza) e "ANTARCTICA" em caixa-alta na base → frase longa em
  serifa caixa-alta sobre branco, com linhas verticais finas de grade fixas por cima
  (`.grid-overlay`) → "OUR TRIPS" com cartões de viagem → "OUR CAMPS" sobre uma foto aérea de
  gelo presa (`.horizontal-scroll_wrapper` sticky) enquanto os cartões dos acampamentos
  passam de lado → dissoluções "névoa" entre cenas (`.mist-transition_image-container` sticky)
  → citação de revista → "CPT – WFR" (código da rota) gigante sobre gelo → painel escuro com
  números de voo (FLYING TIME 05:30 HRS · 4,220 KM / 2,610 MI · -5°C / 23°F) ao lado de um mapa
  da rota → rodapé com "WHITE DESERT" de largura inteira e selos de parceiros.
- **Tipos (computado):** h1 "Antarctica" em Oswald 400, 256 px, entrelinha 256 px; "CPT – WFR"
  em Oswald 320 px (200 px no celular; h1 80 px no celular); títulos e a frase em "Cardinal
  Classic Long" 90 px caixa-alta; parágrafos Cardinal Classic Long 18 px; interface em Inter
  Tight 500. Três famílias.
- **Cor:** branco, azul-gelo, cinza; um laranja só para a aba vertical "Rates", o "Enquire" do
  celular e detalhes. Um único bloco escuro (#090B10) no painel de voo.
- **Navegação:** barra com Experience / Operation / About (botões), marca no centro, Rates e
  Enquire à direita; no celular "Menu" + "Enquire" laranja. Dois `tel:` no rodapé.
- **Movimento:** classe `lenis` no `html` (rolagem suavizada); cursor próprio (`.custom-cursor`);
  os prints sequenciais mostram os cartões de acampamento andando de lado e a névoa entrando.
- **Reduzir movimento:** os prints com `reduce` saíram iguais aos normais.
- **Teclado:** 8 Tabs: Experience, Operation, About, logo, Rates, Enquire, Watch Film, primeiro
  cartão. Contorno computado `auto 0px` em 6 dos 8 (quase invisível); 1 px no logo e no cartão.
  Sem link de pular.
- **Celular:** os mesmos capítulos; um aviso de chat ("Interested in Antarctica but not sure
  where to begin?") e o banner de cookies cobrem ≈35% de baixo em todos os prints.
- **Imagens:** 29 `img`, nenhuma sem `alt`.

## Interpretação (o que levamos para a Smoke & Rail)

1. **O número é a cena.** O painel de voo transforma horas, distância e temperatura em
   espetáculo sem adjetivo. No churrasco o número que define tudo é dado pelo dono: 14 horas
   sobre hickory. Virou o contador gigante do palco preso (00 → 14).
2. **Letra condensada em tamanho de monumento** para nome de lugar e código, com outra voz para o
   texto. Usamos Big Shoulders (letreiro industrial de Chicago) no lugar de Oswald, e Archivo no
   texto, só duas famílias.
3. **Um acento saturado sobre paleta neutra**, reservado para ação e para o número: a brasa
   #ff6a2b sobre carvão.
4. **Foto presa enquanto a informação muda por cima** (a foto aérea dos acampamentos): o nosso
   palco fica preso e as fotos se dissolvem por baixo do relógio.

## O que não levar

- Filme de herói sem pôster e sem alternativa para "reduzir movimento" (o nosso herói é foto, e
  com `reduce` o palco vira pilha de cenas paradas).
- Contorno de foco de 0 px; aviso de chat e cookies sobre a primeira tela do celular.
- Lenis (a rolagem continua do navegador).
- O par Oswald/Cardinal, o gelo, a marca e as fotos deles.
