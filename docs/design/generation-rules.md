# Regras de geração: como uma descrição vira uma direção de arte

Este é o caminho que o **aplicativo** segue em produção. O modelo de IA não lê este arquivo
nem o CLAUDE.md: tudo o que ele precisa vai escrito no pedido (ver passo 4).

## O fluxo

```
POST /api/sites/generate { brief }
  └─ generateSiteSpec(brief, generator, { recent, photos })        apps/web/server/ai/index.ts
       1. planDesign(brief, options)                                 apps/web/server/design/plan.ts
            readBrief → ramo, tons (estilo do dono vale 2×), ação principal
            pontuação das 5 composições + votos das referências aprovadas
            − penalidade para o layout dos 3 últimos sites da conta
            − imersiva fora da disputa sem banco de fotos
            → composition, allowed (até 2), primaryAction, density, imageTreatment,
              references (até 3), fallback, rationale
       2. generator.generateSite(brief, plan)
            Claude recebe <brief> + <design_plan> (designBriefForPrompt)
            e preenche o SiteSpec com design.composition
       3. SiteSpec.parse + sanitizeAiImages
       4. applyDesignPlan: a composição da IA só vale se estiver em `allowed`;
          referências e motivo vêm sempre do plano
  └─ resolveHeroImage → fitDesignToPhoto (imersiva sem foto vira editorial)
  └─ store.create(spec)   → design salvo em sites.spec e em cada site_versions
```

## Como escolher referências para um pedido novo

1. Leia os sinais: ramo (`signals.ts`), estilo escolhido no /create ("Style: …"), palavras de
   tom, ação principal (ligar, orçamento, agendar, visitar, ver trabalhos) e se o dono deu horário.
2. Uma referência aprovada entra se combinar com pelo menos 2 pontos: ramo (vale 2), cada tom
   em comum (1), a ação principal (1). Até 4 votam; até 3 (da composição escolhida) vão para a IA.
3. Sem nenhuma referência combinando, o plano segue só com as regras gerais e grava
   `fallback: true` e "no matching reference" no `rationale`. O site sai normalmente.
4. Para a IA vai: a composição (e a alternativa), a ação principal, o ritmo, o tratamento de
   foto, o guia de texto da composição (`COMPOSITION_GUIDE`) e os princípios curtos das
   referências. Nunca nomes, slogans ou textos das referências.

## Composições

| Composição    | Arquitetura                                                                                                                                                          | Quando costuma ganhar                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `service-led` | Barra de contato, topo em duas colunas com foto, card de ligar, cards de serviço, barra fixa de ligar.                                                               | Urgência, ofícios, "ligue agora".                                            |
| `editorial`   | Título de revista em largura total, texto e botões numa linha, foto larga com legenda, serviços numerados, perguntas com título fixo ao lado, nome grande no rodapé. | Estilo elegante, beleza, profissionais, criativos.                           |
| `immersive`   | Foto de ponta a ponta com véu escuro e texto em cima, faixa de horário/área/telefone, serviços em duas colunas desencontradas, contato em duas metades.              | Restaurante, spa, lugares para visitar. Precisa de foto.                     |
| `typographic` | Título enorme num bloco da cor da marca, quadro "de relance" com fatos reais, faixa de foto opcional, índice numerado, telefone gigante no contato.                  | Profissionais, estilo "bold & local", negócios sem boa foto.                 |
| `modular`     | Cabeçalho em pílula, topo em grade de blocos (título, foto, horário, ligar, selos), serviços em blocos sem buracos, perguntas em blocos.                             | Limpeza, estilo "warm & friendly", serviços com várias informações práticas. |

## Antes de aceitar uma composição nova ou mudança no renderer

- Compare com os 5 exemplos (`/examples/<slug>`) e com sites gerados recentes, lado a lado,
  no topo **e** nas seções de baixo. Se a diferença for só cor, fonte e foto, refaça a estrutura.
- Teste sem foto, sem telefone, sem contato e com 1, 4 e 5 serviços (`SiteRenderer.test.tsx`).
- Rode a validação pelo caminho real (ver README, "Validação").
- Regrave as capturas da landing (`public/landing/wall`, `public/landing/build`).

## Honestidade

As regras 6 e 8 do CLAUDE.md valem para tudo isto: a direção de arte muda forma, nunca fatos.
Composições não têm selos fixos; `highlights`, horário, área e depoimentos só aparecem se o
dono deu. Exemplos usam negócios fictícios rotulados e uma descrição de dono em
`packages/fixtures/src/briefs.ts`.
