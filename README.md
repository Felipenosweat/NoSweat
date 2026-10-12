# No Sweat

Plataforma SaaS para pequenas empresas dos Estados Unidos criarem o próprio site com IA
([nosweatfd.com](https://nosweatfd.com)).

O cliente descreve o negócio → a IA escolhe um de 5 templates e preenche um **SiteSpec**
(JSON validado com Zod) → a plataforma desenha o site a partir desse JSON. A IA nunca escreve
código de site, e é isso que garante que todo site sai bonito e sem quebrar.

## Pré-requisitos

- **Node.js 24** (LTS). Com nvm: `nvm use` (lê o `.nvmrc`).
- **pnpm 10**, via Corepack (já vem com o Node): `corepack enable`.
  A versão exata está no campo `packageManager` do `package.json`.

Não precisa de nenhuma chave de API nem de banco de dados para rodar.

## Como rodar

```bash
corepack enable
pnpm install
cp .env.example apps/web/.env.local   # opcional: os padrões já funcionam
pnpm dev
```

Abra http://localhost:3000, clique em **Get started**, descreva o negócio
(ex.: `plumbing company in Austin`) e clique em **Generate my website**.

> O gerador de IA é um mock (escolhe um site de exemplo por palavra-chave e espera 1,5 s).
> Sem as variáveis do Supabase, os sites ficam em memória e somem quando o servidor reinicia.
> Com elas, ficam salvos no Supabase. Para colocar no ar com o domínio, veja **[DEPLOY.md](DEPLOY.md)**.

## Scripts (na raiz, rodam em todos os pacotes)

| Comando          | O que faz                                         |
| ---------------- | ------------------------------------------------- |
| `pnpm dev`       | Sobe o Next.js em modo desenvolvimento            |
| `pnpm build`     | Build de produção                                 |
| `pnpm typecheck` | `tsc --noEmit` em cada pacote                     |
| `pnpm lint`      | ESLint em cada pacote                             |
| `pnpm test`      | Vitest em cada pacote                             |
| `pnpm format`    | Prettier em tudo (`pnpm format:check` só confere) |

Para rodar só em um pacote: `pnpm --filter @nosweat/web test`.

## Estrutura de pastas

```
nosweat/
├── apps/web/              # Next.js (App Router): front e API
│   ├── app/(marketing)/   # landing page
│   ├── app/(dashboard)/   # /create e /dashboard
│   ├── app/sites/         # /sites/preview/[id]
│   ├── app/api/           # rotas HTTP
│   └── server/            # IA (server/ai) e persistência (server/store)
├── packages/schema/       # @nosweat/schema: o contrato (Zod)
├── packages/fixtures/     # @nosweat/fixtures: sites de exemplo
├── packages/templates/    # @nosweat/templates: <SiteRenderer /> e templates em React
├── supabase/migrations/   # SQL do banco (rodar no Supabase)
└── .github/               # CI e CODEOWNERS
```

### API

| Rota                                      | Entrada     | Saída                      |
| ----------------------------------------- | ----------- | -------------------------- |
| `POST /api/sites/generate`                | `{ brief }` | `{ siteId, spec }`         |
| `GET /api/sites/[id]`                     |             | `{ siteId, spec, status }` |
| `PATCH /api/sites/[id]`                   | `{ spec }`  | `{ siteId, spec }`         |
| `POST /api/sites/[id]/regenerate-section` |             | 501 `not_implemented`      |
| `POST /api/sites/[id]/publish`            |             | 501 `not_implemented`      |
| `GET /api/me/credits`                     |             | `{ remaining, plan }`      |

Todo erro sai como `{ "error": { "code": "...", "message": "..." } }`.
Os schemas de entrada e saída estão em `packages/schema/src/api.ts`.

## Fluxo de trabalho (dois devs em paralelo)

1. Atualize a `main`: `git switch main && git pull`.
2. Crie uma branch por tarefa: `git switch -c front/landing-hero` ou `git switch -c back/supabase-store`.
3. Trabalhe nas **suas** pastas (veja `.github/CODEOWNERS`). Precisa mexer na pasta do outro?
   Combine antes.
4. Mudou o contrato (`packages/schema`)? Adicionar campo opcional é ok. Renomear ou remover
   campo só depois de os dois combinarem.
5. Antes de abrir o PR, rode: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
6. Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/):
   `feat(templates): add beauty template`, `fix(api): return 404 for unknown site`.
7. `git push -u origin <sua-branch>` e abra um Pull Request para a `main`.
   O CI roda typecheck, lint, test e build; o CODEOWNERS pede revisão de quem é dono da pasta.
8. Com CI verde e aprovação, faça o merge (de preferência _squash_) e apague a branch.

**Nunca** commite direto na `main` nem coloque segredos no Git (use `apps/web/.env.local`).

> Dica: no GitHub, proteja a `main` (Settings → Branches) exigindo PR, CI verde e revisão
> do CODEOWNER.
