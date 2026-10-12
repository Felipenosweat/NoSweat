# No Sweat

Plataforma SaaS (nosweatfd.com) para pequenas empresas dos EUA criarem o próprio site com IA.
O cliente descreve o negócio, a IA escolhe um de 5 templates e preenche um JSON chamado
**SiteSpec** (seções, textos, cores). A plataforma desenha o site a partir desse JSON.
A IA nunca escreve código de site: só SiteSpec validado pelo Zod.

## Mapa de pastas

```
apps/web/                       Next.js (App Router): telas + API
  app/(marketing)/              landing page (/)                         → front
  app/(dashboard)/              /create e /dashboard                     → front
  app/sites/                    /sites/preview/[id]                      → front
  app/api/                      rotas HTTP (validam com @nosweat/schema) → back
  server/ai/                    geradores de SiteSpec (mock, anthropic, openai) → back
  server/store/                 persistência (Supabase se configurado, senão memória) → back
  server/http.ts                helpers de resposta/erro das rotas       → back
packages/schema/                @nosweat/schema: o contrato (Zod) de SiteSpec e da API → os dois
packages/fixtures/              @nosweat/fixtures: sites de exemplo válidos            → os dois
packages/templates/             @nosweat/templates: <SiteRenderer />, seções e temas   → front
```

Como as peças se ligam:

- `POST /api/sites/generate` → `server/ai` gera o SiteSpec → `SiteSpec.parse` → `server/store`.
- Páginas (server components) leem dados direto de `@/server/store`; componentes de cliente
  chamam a API com `fetch` e validam a resposta com os schemas de `@nosweat/schema`.
- `<SiteRenderer spec />` escolhe o template por `spec.template`. As cores do tema viram
  variáveis CSS `--ns-*`; os componentes só usam as utilidades `ns-*` do Tailwind
  (`bg-ns-primary`, `text-ns-muted`...), nunca cores fixas.
- Erros da API sempre no formato `{ error: { code, message } }` (ver `ERROR_CODES`).

## Regras do time

1. Nunca commitar direto na `main`. Uma branch por tarefa: `front/...` ou `back/...`.
2. `packages/schema` é o contrato. Não renomear nem remover campos sem os dois combinarem;
   adicionar campo opcional é ok.
3. Cada um mexe nas suas pastas (ver `.github/CODEOWNERS`).
4. Antes de dar qualquer tarefa por terminada:
   `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
5. Segredos só em `.env.local`, nunca no Git.
6. A IA nunca gera código de site, só SiteSpec validado.
7. Interface em inglês; commits em Conventional Commits.

## Convenções

- TypeScript strict em tudo; nada de `any` sem justificativa em comentário.
- Código, arquivos e variáveis em inglês. Comentários, README e este arquivo em português.
- Os pacotes internos são consumidos como código-fonte TS (`transpilePackages` no Next).
- O projeto roda sem chaves e sem banco: `AI_PROVIDER=mock` e store em memória.
  Com as variáveis do Supabase definidas, o store passa a ser o Supabase (`server/store/supabase.ts`).
- Mudanças no banco: um arquivo novo em `supabase/migrations/` (nunca editar um que já rodou).
- Deploy e domínio: ver `DEPLOY.md`.
