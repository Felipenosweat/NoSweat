# No Sweat

Plataforma SaaS (nosweatfd.com) para pequenas empresas dos EUA criarem o próprio site com IA.
O cliente descreve o negócio, a IA escolhe um de 5 templates e preenche um JSON chamado
**SiteSpec** (seções, textos, cores). A plataforma desenha o site a partir desse JSON.
A IA nunca escreve código de site: só SiteSpec validado pelo Zod.

## Mapa de pastas

```
apps/web/                       Next.js (App Router): telas + API
  app/(marketing)/              landing page (/)                         → front
  app/(dashboard)/              /create e /dashboard (painel do cliente) → front
  app/(admin)/admin/            painel principal da No Sweat (só admins)  → front
  app/sites/                    /sites/[id] (publicar, domínio, mensagens), /sites/[id]/edit
                                (editor com prévia ao vivo) e /sites/preview/[id] → front
  app/s/[slug]/                 site publicado no endereço grátis (público) → front
  app/d/[host]/                 site publicado no domínio do cliente (via proxy.ts) → front
  app/(auth)/login/             tela e Server Actions de login/cadastro  → front
  app/auth/callback/            confirmação de e-mail (troca code → sessão) → back
  proxy.ts                      domínio de cliente → /d/<host>; senão renova a sessão e protege
                                /dashboard, /create, /sites → back
  app/api/                      rotas HTTP (validam com @nosweat/schema) → back
  server/ai/                    geradores de SiteSpec (mock, anthropic, openai) → back
  server/admin.ts               quem é admin (tabela platform_admins) e lista de clientes → back
  server/auth/                  sessão do Supabase Auth (getCurrentUser)  → back
  server/domains/                domínios de clientes (API da Vercel, registros de DNS) → back
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
- Login: Supabase Auth (e-mail e senha). Toda rota e página de site chama `getCurrentUser()`
  e só mostra/altera sites com `ownerId` igual ao do usuário (site de outra pessoa = 404).
  Sem Supabase configurado (dev local), o login fica desligado e todo mundo é o `DEV_USER`.
- Admins (tabela `platform_admins`) veem `/admin` e acessam qualquer site (`getOwnedSite`).
  TODO: separar dados privados do cliente quando houver clientes de verdade.
- Publicação: `POST /api/sites/[id]/publish` gera o `slug` e o site fica em `/s/<slug>`.
  Domínio próprio: `PUT /api/sites/[id]/domain` registra `dominio.com` + `www` no projeto da
  Vercel (precisa de `VERCEL_TOKEN`; sem ele o status fica `manual`) e o cliente cria um
  registro A e um CNAME. O `proxy.ts` reconhece o domínio e mostra o site certo.
- Rascunho x publicado: `sites.spec` é o RASCUNHO (editor e IA mudam só isto, e cada
  salvamento vira uma linha em `site_versions`); `sites.published_spec` é o que está no ar e só
  muda ao publicar. Páginas públicas usam `liveSpec(site)`. Restaurar versão = novo rascunho.
- IA editando o site: `POST /api/sites/[id]/ai-edit` recebe um pedido em linguagem natural,
  a IA devolve o SiteSpec inteiro alterado + um resumo (`AiEditResult`), e isso vira um novo
  RASCUNHO (versão `ai_edit`). Limite diário por conta em `server/quota.ts`
  (`AI_DAILY_GENERATIONS`, `AI_DAILY_EDITS`; admins sem limite), registrado em `ai_usage`.
- Formulário de contato: sites publicados enviam para `POST /api/sites/[id]/leads` (público, com
  campo-isca anti-robô); o dono vê os pedidos em `/sites/[id]`. No domínio do cliente o
  `proxy.ts` deixa `/api/*` passar sem reescrever.
- Erros da API sempre no formato `{ error: { code, message } }` (ver `ERROR_CODES`).

- Criar sem conta (modo visitante): `/create`, o editor e a prévia funcionam sem login. Quem
  não está logado ganha o cookie `ns_guest` (`server/guest.ts`); o site fica com `owner_id` nulo
  e `guest_id` = cookie. Rotas que visitantes usam chamam `requireSiteAccess` / `getActor`
  (`server/sites.ts`); publicar, domínio e mensagens continuam com `requireOwnedSite` (só conta).
  Ao entrar/criar conta (`/login`, `/signup`, `/auth/callback`) `claimGuestSites` passa os sites
  para a conta. Visitantes têm limite de IA por cookie, por IP (hash) e um teto global por dia
  (`server/quota.ts`, variáveis `GUEST_*`).
- Planos e preços mostrados no site: só em `lib/plans.ts` (landing e `/pricing` leem dali).
- Apagar site: `DELETE /api/sites/[id]` (dono ou admin) tira do ar, libera o domínio na Vercel e
  apaga versões e mensagens (cascade). Não devolve créditos da IA: o limite diário conta usos.

## Princípio do produto: o cliente fala pouco, nós entregamos muito

- Todo site sai completo mesmo que o cliente não peça: telefone clicável, botão de ligar no
  celular, formulário de contato, área atendida, horário (se ele informou), SEO básico (título e
  descrição), favicon, rodapé, página rápida e boa no celular.
- Cada passo pede o mínimo possível; o que der para deduzir, a plataforma deduz (sem inventar
  fatos, ver regra 8).
- Referência de experiência: lovable.dev (entrada imersiva, criar antes de pedir cadastro,
  cadastro em página própria com termos e privacidade).

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
8. Nada de afirmação inventada nos sites: depoimentos, notas/estrelas, prêmios, licenças,
   garantias ou "same-day" só aparecem se vierem do dono (`business.highlights`, seções que ele
   preencheu). Os templates não podem ter selos fixos.

## Convenções

- TypeScript strict em tudo; nada de `any` sem justificativa em comentário.
- Código, arquivos e variáveis em inglês. Comentários, README e este arquivo em português.
- Os pacotes internos são consumidos como código-fonte TS (`transpilePackages` no Next).
- O projeto roda sem chaves e sem banco: `AI_PROVIDER=mock` e store em memória.
  Com as variáveis do Supabase definidas, o store passa a ser o Supabase (`server/store/supabase.ts`).
- Mudanças no banco: um arquivo novo em `supabase/migrations/` (nunca editar um que já rodou).
- Deploy e domínio: ver `DEPLOY.md`.
