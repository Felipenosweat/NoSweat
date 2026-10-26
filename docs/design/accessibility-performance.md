# Acessibilidade e desempenho

O piso para qualquer página nossa, por mais ousado que seja o design. Se uma ideia visual não
cabe aqui, a ideia muda.

## Acessibilidade (WCAG 2.2 AA)

**Estrutura**

- Um `h1` por página, títulos em ordem, landmarks (`header`, `nav`, `main`, `footer`).
- "Pular para o conteúdo" quando houver abertura, menu grande ou cabeçalho fixo.
- Conteúdo que só "aparece" com movimento já está no HTML (leitores de tela e buscadores leem
  tudo; a animação só muda o visual).

**Contraste**

- 4,5:1 para texto, 3:1 para títulos grandes e ícones de controle.
- Ouro (`#b8955a`) **só** em filete, número grande ou texto sobre fundo escuro: sobre marfim ele
  não passa 4,5:1. Texto em cima de foto sempre com véu escuro.
- Texto com opacidade (`/70`, `/80`) conferido contra o fundo real. Sobre marfim, tinta a 60%
  já falha em texto pequeno (4,42:1): rótulos e legendas a 70–75%.
- **Não "apague" o conteúdo inativo** (capítulo fora de foco a 35%): vira texto ilegível.
  Marque o ativo (fio, cor do numeral) em vez de esmaecer os outros.
- Palavra gigante decorativa (marca-d'água) vem do CSS (`content: attr(data-word)`) com
  `aria-hidden`, para não ser texto de baixo contraste na página.

**Teclado e foco**

- Tudo que abre com mouse abre com foco (acordeão das suítes: `onFocus` + `aria-expanded`).
- Foco visível próprio (`.a-focus`: contorno de 2 px com afastamento), nunca `outline: none`
  sem troca.
- Menu em tela cheia: `inert` no resto da página, Esc fecha, foco volta para o botão.
- Lightbox: `<dialog>` nativo (prende o foco, Esc fecha), setas trocam a foto, botão "Close".

**Formulários**

- `label` de verdade, `autocomplete`, erros ligados ao campo (`aria-describedby`) e anunciados;
  confirmação em `role="status"`.
- Demo que não envia nada **diz isso** antes e depois (selo "Demonstration" + texto na
  confirmação).

**Movimento**: ver `motion.md` (reduzir movimento desliga presos, scrub e abertura).

**Toque**: alvos com pelo menos 44 px; nada que só funciona com hover.

**Rolagem lateral**: uma fileira que rola de lado sem nada focável dentro precisa de
`tabIndex={0}` + `aria-label` (senão quem usa teclado não consegue rolar).

## Desempenho

**Orçamento de uma página de demonstração**

- LCP < 2,5 s em 4G; CLS < 0,05; nada de tarefa longa > 200 ms depois da carga.
- JS de cliente só para o que interage. O resto é server component.

**Imagens**

- Sempre com `width`/`height` (ou `aspect-ratio`) para não pular.
- `srcset` com larguras reais (640–2560) e `sizes` honesto; a foto do herói `eager` +
  `fetchpriority="high"`, o resto `lazy`.
- Unsplash: `auto=format` (AVIF/WebP), `q=72`, corte pelo servidor (`fit=crop&crop=entropy`).
- Cor de fundo da foto (`color` do Unsplash) enquanto carrega, para não piscar branco.

**Fontes**

- `next/font` (arquivo no próprio domínio, `display: swap`, sem pedido ao Google no navegador).
- No máximo 2 famílias e os pesos que se usa de fato.

**Movimento**

- GSAP + ScrollTrigger carregados só onde há efeito; `ScrollTrigger.refresh()` depois das fontes.
- Modo leve em máquina fraca (`motion.md`).
- Nada de `backdrop-filter` em área grande que se mexe.

## Como conferir

- Playwright em 390×844, 834×1112 e 1440×900: `scrollWidth <= innerWidth`, zero erros no
  console, capturas.
- axe-core (WCAG 2.2 AA + best-practice) com `reducedMotion: "reduce"`, em 1440 e 390:
  zero violações. O script do Aurelia injeta `node_modules/.pnpm/axe-core@*/axe.min.js`.
- Teclado só: Tab do começo ao fim, abrir/fechar cada controle.
- `reducedMotion: "reduce"` no Playwright: nada preso, nada escondido.
- `pnpm build` e a página no build de produção (`next start`), não só no `dev`.
