# Colocar a No Sweat no ar (Supabase + Vercel + nosweatfd.com)

Você **não copia HTML nenhum**. O site é montado pela Vercel direto do GitHub. Você só vai copiar:

1. **Um texto SQL** (uma vez) para criar a tabela no Supabase.
2. **Duas chaves** do Supabase para a Vercel.
3. **Dois registros de DNS** da Vercel para o painel onde o domínio foi comprado.

Tempo total: uns 20 minutos, mais a espera do DNS.

---

## Passo 0: código na `main`

A Vercel publica a branch `main`. No GitHub, abra o repositório `Felipenosweat/NoSweat`,
crie o Pull Request da branch de trabalho para a `main` e clique em **Merge**.

---

## Passo 1: Supabase (o banco de dados)

1. Entre em https://supabase.com → **New project**.
   - Nome: `nosweat`. Região: **East US** (perto dos clientes). Crie uma senha forte e guarde.
2. Com o projeto criado, no menu da esquerda clique em **SQL Editor** → **New query**.
3. **Copie todo o conteúdo** do arquivo [`supabase/migrations/0001_create_sites.sql`](supabase/migrations/0001_create_sites.sql),
   cole na tela e clique em **Run**. Tem que aparecer _Success_.
4. Pegue as duas informações que vão para a Vercel:

| O que copiar                                         | Onde fica no Supabase                                                                                       | Nome na Vercel              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Project URL** (ex.: `https://abcdxyz.supabase.co`) | Botão **Connect** no topo, ou **Project Settings → Data API**                                               | `NEXT_PUBLIC_SUPABASE_URL`  |
| **Chave secreta**                                    | **Project Settings → API Keys**: a **Secret key** (`sb_secret_...`) ou, na aba _Legacy_, a **service_role** | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ A chave secreta dá acesso total ao banco. Cole **só** na Vercel. Não mande por chat,
> e-mail ou WhatsApp, e nunca coloque no código. A chave _publishable/anon_ **não** serve aqui.

---

## Passo 2: Vercel (onde o site roda)

1. Entre em https://vercel.com com a conta do GitHub → **Add New… → Project**.
2. Escolha o repositório **NoSweat** → **Import**.
3. Na tela de configuração:
   - **Root Directory**: clique em _Edit_ e escolha **`apps/web`**.
   - **Framework Preset**: _Next.js_ (aparece sozinho).
   - Não mexa nos comandos de build e de install: eles vêm do arquivo `apps/web/vercel.json`
     (que força o pnpm; sem ele a Vercel tenta usar o npm e falha com `workspace:`).
4. Abra **Environment Variables** e adicione as três:

| Name                        | Value                      |
| --------------------------- | -------------------------- |
| `AI_PROVIDER`               | `mock`                     |
| `NEXT_PUBLIC_SUPABASE_URL`  | a Project URL do Passo 1   |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave secreta do Passo 1 |

5. Clique em **Deploy**. No fim aparece um endereço tipo `nosweat-xxxx.vercel.app`.
   Abra, vá em **Get started**, gere um site e confira se o preview abre.

> Se o build der erro, copie o log (aba _Deployments_ → o deploy com erro → _Build Logs_)
> e mande para o time de desenvolvimento.

---

## Passo 3: domínio nosweatfd.com

1. Na Vercel, dentro do projeto: **Settings → Domains → Add**.
2. Digite `nosweatfd.com` e confirme. Se ela oferecer, aceite também o `www.nosweatfd.com`
   (redirecionando para `nosweatfd.com`).
3. A Vercel mostra os registros de DNS que faltam. Normalmente são dois:

| Tipo    | Nome / Host          | Valor (copie o que a **Vercel** mostrar) |
| ------- | -------------------- | ---------------------------------------- |
| `A`     | `@` (ou deixe vazio) | um IP, ex.: `76.76.21.21`                |
| `CNAME` | `www`                | ex.: `cname.vercel-dns.com`              |

4. Entre no painel onde o domínio foi comprado (GoDaddy, Namecheap, Hostinger, Registro.br,
   Google/Squarespace, Cloudflare...) → **DNS** / **Gerenciar DNS** / **Zona DNS**:
   - **Apague** registros `A` antigos do `@` e o `CNAME` antigo do `www`, se existirem
     (geralmente apontam para uma "página estacionada" do registrador).
   - **Adicione** os dois registros da tabela acima, com os valores exatos da tela da Vercel.
   - Se for Cloudflare: deixe a nuvem **cinza** (_DNS only_).
5. Volte na Vercel e espere o status ficar **Valid Configuration** (de alguns minutos a algumas
   horas). O HTTPS (cadeado) é configurado sozinho.

Pronto: https://nosweatfd.com no ar. A cada merge na `main`, a Vercel publica de novo sozinha.

---

## Conferência final

- [ ] `https://nosweatfd.com` abre a landing page.
- [ ] Em **Get started**, `plumbing company in Austin` gera o site do Joe's Plumbing.
- [ ] Recarregar a página do preview continua mostrando o site (ou seja, está salvo no Supabase).
- [ ] No Supabase, em **Table Editor → sites**, aparece uma linha nova.
- [ ] Em **My sites**, o site aparece na lista.

## Limitações atuais (conhecidas)

- Ainda **não há login**: qualquer pessoa com o endereço vê a lista em `/dashboard`.
  Antes de divulgar, precisamos de autenticação (próxima etapa).
- A IA ainda é o **mock** (escolhe um de 3 sites de exemplo). A IA real entra trocando
  `AI_PROVIDER` e adicionando a chave da Anthropic ou da OpenAI.
