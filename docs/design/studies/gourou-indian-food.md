# Gourou Indian Food Company (13g + Thomas Carré) — o cardápio como peça da marca

- Ao vivo: https://www.gourouindianfood.fr/ — restaurante indiano em Paris 11e (42 rue Léon
  Frot), com salão, retirada e loja.
- Prêmio (só busca; a Awwwards não abre deste ambiente): resultado "Gourou Indian Food -
  Awwwards Honorable Mention" (awwwards.com/sites/gourou-indian-food) e o perfil de Thomas Carré
  na Awwwards com o trecho "Gourou Indian Food WEBSITE HM Honorable Mention Feb 17, 2026". O
  rodapé do site diz "Design : 13g.fr" e "Dev : Thomas Carré", o que bate com o crédito.
- Método (2026-10-26): Playwright Chromium, 1440×900 com 10 passos de roda, 390×844 com 10
  saltos, 1440×900 com `reducedMotion: "reduce"`, 8 Tabs, estilo computado, `document.fonts`,
  vídeos, elementos `fixed`. Prints fora do repositório.

## Observação

- **Estrutura (≈8 500 px no computador, ≈10 300 px no celular):** cabeçalho com logo, pílulas
  contornadas "Réserver" e "Emporter" e "Recrutement" em vermelho → herói com duas fotos lado a
  lado (cozinha e prato) e "INDIAN FOOD COMPANY" de borda a borda em azul → letreiro corrido
  "TO PARIS" com o desenho de um triciclo de entrega → faixas vermelhas de largura inteira →
  "Une cuisine indienne maison, fraîche & généreuse" → bloco de recrutamento com foto → **grade
  do cardápio**: cada prato é um cartão de cor chapada (amarelo, azul, verde, vermelho, laranja)
  com o nome em devanágari, o nome em francês/inglês, a foto recortada e uma linha de descrição
  → "Notre menu en détail" → "SHOP" (fósforos, camiseta) → redes → bloco final com endereço,
  metrô (linha 9, Charonne), horários e telefone → rodapé azul com links.
- **Tipos (computado):** Poppins 700 caixa-alta em quase tudo (h2 86,4 px; títulos 28,8 px;
  texto 14,4 px com entrelinha 15,8–20 px); Oswald carregada; o devanágari funciona como segunda
  voz gráfica.
- **Cor:** creme #FFF6E2 de fundo, vermelho #F70000, azul #1738BA, amarelo, verde, laranja.
- **Movimento:** GSAP e Lenis presentes; letreiros corridos, carregador e cortina de transição
  fixos (`.loader`, `.transition`), vídeos Lottie no hover; 4 vídeos mudos.
- **Reduzir movimento:** os prints com `reduce` saíram iguais aos normais (letreiros rodando).
- **Teclado:** 8 Tabs passam por logo, Réserver, Emporter, Recrutement, Le restaurant, Le menu,
  La boutique, Sur place; contorno `auto 1px` na maioria, 0 px no último.
- **Celular:** um cartão por linha, as faixas de cor continuam; `tel:0140563595` válido.
- **Imagens:** 66 `img`, todas com `alt`.

## Interpretação (o que levamos para a Smoke & Rail)

1. **O cardápio é o componente assinatura**, desenhado no sistema da marca, e não uma lista
   genérica ou um PDF. Na Smoke & Rail o sistema da marca é o pátio de trens, então o cardápio
   virou uma **placa de partidas** (plaquinhas que giram) com preço e aviso ("THU & SAT ONLY",
   "48 HRS NOTICE").
2. **Nome real do prato e uma linha simples**, sem adjetivo: usamos as descrições do dono.
3. **Fatos práticos juntos e legíveis no fim** (endereço, transporte, horário, telefone): o
   nosso capítulo "Where to find us" é um quadro de horários da semana com o dia de hoje marcado
   e um cartão do pit com "Get directions" e "Call".
4. **Ações no cabeçalho desde o primeiro quadro** ("Réserver", "Emporter"): o nosso "Preorder
   pickup" e o telefone ficam no topo, e no celular numa doca fixa embaixo.

## O que não levar

- Texto corrido de 14,4 px com entrelinha apertada (o nosso: 17–18 px, 1,6).
- Nada muda com "reduzir movimento".
- Cinco cores saturadas ao mesmo tempo (a nossa direção é carvão + uma brasa).
- O logo, a paleta, o devanágari e as fotos deles.
