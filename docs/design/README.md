# Conhecimento de design da No Sweat

Índice da pesquisa de design e de como ela chega aos sites gerados. Comece por aqui antes de
qualquer trabalho visual (landing, telas do app ou templates de site).

## O que tem aqui

| Arquivo                             | Para quê                                                                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `references.json`                   | Registro estruturado de cada referência: links (Awwwards e site original), data, o que foi inspecionado de fato (`inspection`), `evidenceStatus`, `approved`, arquétipo, direções, para quem serve (`fits`), observações, princípios e o que **não** trazer. |
| `studies/<id>.md`                   | Estudos a fundo (observação × interpretação, com o método). `studies/access-log.md` registra cada tentativa de acesso, inclusive as falhas.                                                                                                                  |
| `archetypes.json` / `.md`           | Os 9 arquétipos (heritage-grandeur, service-direct...) e os 7 eixos de design (composição, tipografia, hierarquia, imagem, navegação, movimento, superfície).                                                                                                |
| `selection.md` + `tools/select.mjs` | Como escolher a direção de um projeto novo: o seletor pontua referências e arquétipos e monta uma combinação de eixos evitando o que os últimos projetos usaram (`usage-log.json`).                                                                          |
| `patterns.md`                       | Receitas de layout, narrativa, componentes e interação, cada uma com a fonte.                                                                                                                                                                                |
| `typography-spacing.md`             | Números medidos nas referências (escala, entrelinha, espaçamento entre letras, medida) e as regras.                                                                                                                                                          |
| `motion.md`                         | Os 5 temperamentos de movimento, receitas prontas e regras (reduzir movimento, modo leve).                                                                                                                                                                   |
| `accessibility-performance.md`      | O piso de acessibilidade (WCAG 2.2 AA) e o orçamento de desempenho, com como conferir.                                                                                                                                                                       |
| `review-rubric.md`                  | Rubrica de 13 critérios (0–4) para avaliar uma página antes de mostrar.                                                                                                                                                                                      |
| `aurelia.md`                        | Estudo de caso do Aurelia Royal Estate (`/demos/aurelia-royal-estate`): 3 direções, decisões, validação, rubrica.                                                                                                                                            |
| `principles.md`                     | Lições práticas de composição, tipografia, mídia, demonstração e movimento.                                                                                                                                                                                  |
| `media.md`                          | Auditoria das fotos: origem, licença, o que foi trocado e por quê.                                                                                                                                                                                           |
| `anti-patterns.md`                  | Falhas de estrutura que já tivemos (sites "irmãos", demos em wireframe…) e o conserto.                                                                                                                                                                       |
| `copy-rules.md`                     | Regras de texto sem "cara de IA" (da página da Wikipedia "Signs of AI writing"): valem para os sites-modelo, para o que a IA escreve (`prompt.ts`) e para a landing.                                                                                         |
| `generation-rules.md`               | Como o gerador escolhe a direção de arte e as referências para uma descrição nova.                                                                                                                                                                           |
| `v4-direction.md`                   | Direção da landing V4 (histórico).                                                                                                                                                                                                                           |

## Fluxo para um projeto desenhado à mão

1. `selection.md`: rode `tools/select.mjs` com ramo, tons e objetivo.
2. Leia os estudos das referências sugeridas, `patterns.md`, `typography-spacing.md` e `motion.md`.
3. Escreva 3 direções, escolha 1 (exemplo: `aurelia.md`).
4. Construa seguindo `accessibility-performance.md`.
5. Avalie com `review-rubric.md` e grave o projeto no `usage-log.json` (`--record`).

Regras visuais gerais e o checklist de "cara de IA": `.claude/skills/premium-web-design/`.

## Como buscar

- Por direção: `jq '.[] | select(.directions | index("immersive-photography")) | .id' references.json`
- Só o que está aprovado para sites de clientes:
  `jq '.[] | select(.approved and (.useFor | index("customer-sites"))) | {id, directions, fits}' references.json`
- Depois leia o estudo (`study`) da referência. Se `evidenceStatus` não for `verified-live`,
  trate como pista, não como fato.

## Dois consumidores, dois caminhos

1. **Quem trabalha no código (Claude Code e pessoas):** este diretório. O CLAUDE.md aponta para cá.
2. **O aplicativo em produção:** o modelo de IA não lê o repositório. O gerador usa
   `apps/web/server/design/library.ts`, um resumo curto das referências **aprovadas** (mesmos `id`s;
   o teste `server/design/design.test.ts` falha se um `id` não existir aqui ou não estiver aprovado).
   O plano de direção de arte (`plan.ts`) escolhe até 3 referências por pedido e manda os princípios
   delas no pedido à IA (`<design_plan>`). O plano escolhido (composição, ação principal, ritmo,
   tratamento de foto, ids das referências e o motivo) fica salvo no próprio site em
   `spec.design` (tabela `sites` e cada linha de `site_versions`), para depuração.

Isto é conhecimento guardado e recuperado, não treino do modelo: só influencia a geração o que
estiver em `library.ts` (e, portanto, no pedido).

## Como acrescentar uma referência

1. Pesquise separado da geração (nenhum site de cliente depende de acessar a Awwwards):
   abra o site original no navegador, desktop 1440×900 e celular 390×844; registre fontes pelo
   estilo computado, o que se move e como reage a "reduzir movimento".
2. Registre em `references.json` com a evidência honesta (`text-only` se só viu resultado de busca)
   e escreva `studies/<id>.md` se inspecionou a fundo. Não salve prints de terceiros no repositório.
3. Se servir para sites de clientes e estiver verificada, copie para `library.ts` só o resumo:
   composições, `fits` (nos termos de `signals.ts`) e 2–3 princípios escritos para a IA.
4. Rode `pnpm --filter @nosweat/web test` (o teste da biblioteca confere os ids).

## Validação

Depois de mudar composições, o planejador ou a biblioteca:

- `server/design/design.test.ts`: cada exemplo da vitrine sai do gerador com a mesma composição
  da fixture; o mesmo negócio com outro estilo muda de composição; sem referências o plano cai nas
  regras gerais; a IA recebe o plano e os princípios.
- Pelo caminho real: rode o app sem chaves (`AI_PROVIDER=mock`) e chame `POST /api/sites/generate`
  com 3+ negócios e um segundo estilo para um deles; compare as prévias lado a lado (topo e seções
  de baixo).
- Regrave as capturas da landing (`apps/web/public/landing/wall` e `build`) a partir de
  `/examples/<slug>?embed=1`.

## Estado da pesquisa (2026-10-26)

24 referências, cada uma com um arquétipo (`archetypes.md`). A rodada de 2026-10-26
acrescentou 14 sites premiados ou listados na Awwwards, em 6 direções:

- luxo e hotelaria: royal-savoy, grand-hotel-miramare, castello-del-sole, velaa, era-estate;
- editorial: explora-journal, joshuas-magazine, mosbys-files;
- tipografia expressiva: mat-voyce, a-lign-studio;
- layout experimental: floema;
- orgânico: son-daven, kozowood (não aprovada: sem prêmio da Awwwards confirmado);
- narrativa imersiva: oryzo-ai.

A Awwwards continua inacessível deste ambiente (conexão recusada em todas as tentativas; ver
`studies/access-log.md`). Os prêmios vêm de trechos de busca, páginas das agências e créditos
no próprio site; cada registro diz qual (`awwwardsEvidence`). Os sites foram abertos ao vivo
em 1440 e 390 px e com "reduzir movimento". Faltam: casas de joias/moda (Cartier e Bulgari
bloquearam), hotéis atrás de Cloudflare (Badrutt's, Passalacqua, Le Sirenuse), e ainda
salão/beleza, restaurante com cardápio e serviço doméstico dos EUA verificados.
