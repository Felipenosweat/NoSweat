# Estudo de caso: Aurelia Royal Estate

Demonstração de um palácio-hotel **fictício** em `/demos/aurelia-royal-estate` (fora do índice
de busca: `robots: noindex`). Código em `apps/web/app/demos/aurelia-royal-estate/` e
`apps/web/components/demos/aurelia/`. Serve de prova do nível que queremos e de laboratório
para as receitas de `motion.md` e `patterns.md`.

## Pedido

Um site de realeza "inesquecível": abertura marcante, introdução editorial, suítes e
experiências, galeria imersiva e um fluxo de reserva **marcado como demonstração**;
responsivo, acessível, respeitando "reduzir movimento" e rápido.

Seletor (`selection.md`): `--industry hotel --tones refined,premium --goal book` →
`heritage-grandeur`; alternativas `quiet-luxury` e `cinematic-scrollytelling`.

## Três direções

| Direção                | Arquétipo / eixos                                                                                | Primeira dobra                                                         | Risco                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| **A. Gilded Nocturne** | heritage-grandeur · full-bleed-photo · Didone + sans geométrico · arcos · cerimonial · noite/dia | portas que se abrem para o salão de lustres e o nome em itálico enorme | escuro demais / "cassino"; precisa de capítulos claros     |
| B. Archive & Ledger    | broadsheet-editorial · split-editorial · serif de texto · fotos emolduradas · quieto · papel     | o palácio como livro de registro: datas, índice numerado, gravuras     | elegante mas frio; não dá vontade de reservar              |
| C. Garden Court        | organic-naturalist · collage · serif suave · arcos de jardim · deriva lenta · luz do dia         | o palácio pelo jardim, de manhã                                        | perde a "realeza"; fotos de jardim boas são raras no banco |

**Escolhida: A.** É a única em que a primeira dobra é inesquecível sem depender de texto, e o
risco (escuro demais) se resolve com estrutura: capítulos noite/dia alternando (marfim na
introdução e na reserva, pergaminho nas experiências). De B ficaram a capitular, os números
romanos e os fatos em versalete; de C, os arcos.

## Decisões

- **Paleta:** noite `#0d0a08`, tinta `#1c1612`, marfim `#f4ede1`, pergaminho `#e8dfcd`, ouro
  `#b8955a` (claro `#d6b77d`), clarete `#6b1d24` só para ênfase em itálico sobre claro. Ouro
  nunca em texto pequeno sobre claro (contraste).
- **Tipografia:** Bodoni Moda (itálico no nome e nas ênfases) + Jost (rótulos em versalete
  espaçado e texto). Duas famílias, cada uma com um trabalho.
- **A forma que amarra tudo: o arco.** Brasão, fotos das suítes, imagem das experiências,
  metade da galeria e a imagem da reserva. As revelações também abrem em arco.
- **Capítulos I–V** com numeral romano + fio que se desenha + título com uma palavra em
  itálico. Estrutura: abertura → herói → I Estate → II Suites → III Experiences → IV Enfilade
  (galeria) → V Reservations → rodapé.
- **Abertura:** portas + brasão desenhado + nome que se espaça; 2,7 s, pulável (botão e Esc),
  uma vez por sessão, desligada com "reduzir movimento".
- **Suítes:** acordeão de 4 arcos no computador (mouse, foco e clique); no celular, fileira
  de arcos com `scroll-snap`.
- **Experiências:** foto presa em arco que troca por capítulo (`IntersectionObserver`).
- **Galeria "Enfilade":** fileira horizontal presa à rolagem no computador, com linha de
  progresso; lightbox em `<dialog>` com setas e Esc. No celular, rolagem nativa.
- **Reserva demo em 3 passos:** datas (com mínimos) + hóspedes → suíte → nome/e-mail/pedido →
  confirmação em `role="status"` que diz que nada foi reservado nem enviado. Selo
  "Demonstration · no booking is made" desde o primeiro passo.
- **Honestidade:** rodapé diz que o lugar é fictício; 18 fotos do Unsplash com autor e link
  (UTM) e `download_location` registrado para cada uma. Nenhum prêmio, nota ou depoimento.

## Validação

- 1440×900, 834×1112 e 390×844: sem rolagem lateral (`scrollWidth - innerWidth = 0`), zero
  erros no console.
- Interações testadas no Playwright: abertura e "Skip", acordeão por mouse e teclado,
  lightbox (abre, seta, Esc), validação e os 3 passos da reserva, menu do celular (Esc e foco).
- `reducedMotion: "reduce"`: sem abertura, sem nada preso, galeria em rolagem nativa.
- Modo leve (4 núcleos): sem efeitos ligados à rolagem.

## Rubrica (`review-rubric.md`)

| Critério       | Nota | Nota                                                                                |
| -------------- | ---- | ----------------------------------------------------------------------------------- |
| Ideia          | 4    | "palácio de verão aberto a poucos": arco + capítulos + noite/dia                    |
| Primeira dobra | 4    | salão de lustres + "Aurelia" itálico de ~19 rem                                     |
| Hierarquia     | 3    | rodapé do herói tem um rótulo a mais ("Royal estate")                               |
| Tipografia     | 4    |                                                                                     |
| Ritmo          | 4    |                                                                                     |
| Imagem         | 3    | fotos de banco de lugares diferentes; algumas (piscina, quarto) menos palacianas    |
| Movimento      | 4    |                                                                                     |
| Ação principal | 4    | "Reserve" fixo no topo em toda a página                                             |
| Celular        | 4    |                                                                                     |
| Acessibilidade | 4    | axe (WCAG 2.2 AA + boas práticas) sem violações em 1440 e 390, depois das correções |
| Desempenho     | 3    | página longa com 18 fotos; tudo `lazy` menos o herói                                |
| Honestidade    | 4    |                                                                                     |
| Não repete     | 4    | primeiro registro no `usage-log.json`                                               |

## Correções feitas na revisão

- Rolagem lateral no celular/tablet: textos `sr-only` (posição absoluta) dentro dos botões da
  galeria escapavam da fileira → `relative` nos botões.
- A animação CSS do herói anulava o `transform` do GSAP → zoom de entrada num invólucro.
- Foto do lightbox em branco (carregamento `lazy` dentro do `<dialog>`) → `priority`; faixas
  coloridas em volta da foto → fundo transparente.
- Título da galeria presa ficava embaixo do menu → `padding-top` no palco preso.
- Espaço sobrando depois da última experiência → `lg:last:min-h-0`.
- Auditoria axe (primeira rodada: 3 tipos de violação):
  - contraste de rótulos, legendas e passos da reserva sobre marfim (4,42 e 3,79:1) → tinta a 70–75%;
  - experiências inativas apagadas a 35% (1,7:1) → nada apagado, o capítulo ativo ganha o fio
    de ouro;
  - brasão do menu sem nome no celular → `aria-label`;
  - fileira de suítes no celular rolável sem foco → `tabIndex=0` + rótulo;
  - palavra-fantasma do rodapé → vem do CSS (`content: attr(data-word)`), é só decoração.

## Limites

- Fotos de banco não mostram um único palácio; um cliente real precisaria de fotos próprias
  (a composição foi pensada para 12–18 fotos).
- Sem teste com leitor de tela real (só axe, teclado e Playwright).
- É uma página feita à mão: o gerador de sites ainda não produz esse nível sozinho
  (ver "Relação com o gerador" em `archetypes.md`).
