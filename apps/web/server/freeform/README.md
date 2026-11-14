# Experimento "caminho A": a IA escreve o código da landing page

**Status: prova de conceito isolada. Nada aqui é usado em produção.** Nenhuma rota, tela ou
gerador existente chama esta pasta; a geração de verdade continua sendo SiteSpec validado
(`server/ai`, `packages/templates`). A ideia é TESTAR se deixar o Claude escrever o HTML de cada
site, como o Lovable faz, dá sites mais variados do que os templates.

## O que tem aqui

| Arquivo                      | Para quê                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt.ts`                  | Pedido do sistema: um documento HTML completo, direção de arte própria, lista de "cara de IA" proibida, regra 8 (nada inventado, `[Your phone]`), requisitos.  |
| `generate.ts`                | Chama a API da Anthropic (`@anthropic-ai/sdk`, streaming + `finalMessage()`), extrai o HTML e devolve `{ html, usage, model }`.                                |
| `sanitize.ts` (+ testes)     | Segunda camada: tira scripts externos, iframes, objetos, `<base>`, meta refresh, `action` de formulários, URLs `javascript:` e imagens fora da lista de fotos. |
| `pricing.ts`                 | Preço por token de cada modelo (o `server/admin/costs.ts` só tem custo médio por uso).                                                                         |
| `scripts/freeform-batch.mts` | Gera 6 sites de exemplo (2 barbearias diferentes, advocacia de família, churrasco, paisagismo, padaria) em `apps/web/.freeform-samples/` (fora do Git).        |
| `scripts/freeform-sheet.mjs` | Folha de prints lado a lado (1440 e 390 px, no mesmo sandbox) para julgar a variedade.                                                                         |
| `app/lab/freeform/page.tsx`  | Prévia em `/lab/freeform`, só no `pnpm dev` (404 em produção).                                                                                                 |

## Como rodar

Precisa de `ANTHROPIC_API_KEY` (o lote custa dinheiro; sem a chave o script para com aviso).
O Node 22 roda o `.mts` direto (remoção de tipos), sem instalar nada:

```bash
cd apps/web
ANTHROPIC_API_KEY=sk-ant-... node scripts/freeform-batch.mts            # os 6 sites
ANTHROPIC_API_KEY=sk-ant-... node scripts/freeform-batch.mts bbq bakery # só alguns
FREEFORM_MODEL=claude-opus-5-5 ANTHROPIC_API_KEY=... node scripts/freeform-batch.mts
node scripts/freeform-sheet.mjs        # → .freeform-samples/_sheet/contact-sheet.png
pnpm dev                               # → http://localhost:3000/lab/freeform
```

Variáveis: `FREEFORM_MODEL` (`claude-sonnet-5-5`, padrão, ou `claude-opus-5-5`), `FREEFORM_EFFORT`
(`low`…`max`; sem ela vale o padrão do modelo) e `FREEFORM_FALLBACKS=off` (desliga o modelo
substituto do servidor quando o principal recusa; ligado por padrão). O script mostra os tokens e o
custo ESTIMADO de cada site e grava um `.json` ao lado de cada `.html`.

## Por que o sandbox

O HTML é código escrito por um modelo, a partir de um texto que veio do cliente. Ele só abre
dentro de `<iframe sandbox="allow-scripts" srcdoc=…>` **sem `allow-same-origin`**: o documento roda
numa origem opaca e não lê cookies, sessão, `localStorage` nem a página da No Sweat; também não
envia formulários, não abre janelas e não navega a página de cima. Por isso o `sanitize.ts` deixa
JavaScript inline e atributos `on*`: o sandbox contém isso. Nunca juntar `allow-scripts` com
`allow-same-origin` (o documento poderia tirar o próprio sandbox). O sanitizador usa expressões
regulares (sem dependência nova): serve de segunda camada, não de proteção principal.

## O que faltaria para produção

1. **Combinar a regra 6 com o outro dev antes de qualquer uso real.** Hoje a regra é "a IA nunca
   gera código de site, só SiteSpec validado"; este experimento existe para decidir se ela muda.
2. **Hospedar em outra origem** (ex.: um domínio só para sites, sem cookies da plataforma), com
   CSP própria; nunca servir código livre em `nosweatfd.com`. Sanitizador com parser HTML de
   verdade e checagem de CSS (`url()`, `@import`).
3. **Editor para código livre**: o editor atual mexe em campos do SiteSpec. Com HTML livre, editar
   texto, telefone ou foto exige mapear o DOM ou pedir de novo à IA.
4. **Formulário**: ligar o `<form data-ns-contact>` ao `POST /api/sites/[id]/leads` (script do
   host injetado na publicação, campo-isca `company`).
5. **Versões**: guardar cada HTML como versão (rascunho × publicado), como `site_versions`.
6. **Custo por edição**: cada mudança pedida à IA reescreve a página inteira (dezenas de milhares
   de tokens de saída), bem mais caro que o ModelFill/edição de SiteSpec; preço em créditos.
7. Conferência automática do que a regra 8 exige (nada inventado), acessibilidade e desempenho
   antes de mostrar ao cliente; selo da No Sweat, SEO e fotos com crédito pela plataforma.
