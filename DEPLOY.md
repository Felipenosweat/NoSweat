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

5. **Login (Authentication → URL Configuration)**:
   - **Site URL**: `https://www.nosweatfd.com`
   - **Redirect URLs** → _Add URL_: `https://www.nosweatfd.com/**`

   Sem isso, o link do e-mail de confirmação de cadastro aponta para `localhost`.

> A chave **publishable** (pública) do login já está no arquivo `apps/web/.env.production`.
> Se trocar de projeto Supabase, atualize esse arquivo.
>
> O envio de e-mails padrão do Supabase só entrega para e-mails da própria equipe e tem limite
> por hora. Para clientes de verdade, configure um SMTP próprio em
> **Authentication → Emails → SMTP Settings** (ex.: o e-mail da Hostinger).

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

5. (Para domínios de clientes) crie um token em **vercel.com → Account Settings → Tokens →
   Create**, com acesso ao time da No Sweat, e adicione a variável `VERCEL_TOKEN` com ele.
   Sem o token, os domínios dos clientes ficam como "Being set up" e precisam ser adicionados
   à mão em **Settings → Domains**.
6. Clique em **Deploy**. No fim aparece um endereço tipo `nosweat-xxxx.vercel.app`.
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

## Fotos e avisos de pedidos

Tudo aqui é opcional: sem estas chaves o site funciona, só fica sem foto de banco de imagens e
sem e-mail de aviso (os pedidos continuam aparecendo no painel do site).

1. **Fotos de banco de imagens (Pexels, grátis)**: crie uma conta em https://www.pexels.com/api/,
   clique em **Your API Key** e copie a chave. (Opcional, reserva: crie um app em
   https://unsplash.com/developers e copie a **Access Key**.)
2. **E-mail de aviso de pedidos (Resend)**:
   1. Crie uma conta em https://resend.com.
   2. **Domains → Add Domain** → `nosweatfd.com`. A Resend mostra alguns registros de DNS
      (`TXT`/`MX`); adicione no painel do domínio, como no Passo 3, e espere ficar **Verified**.
   3. **API Keys → Create API Key** (permissão _Sending access_) e copie a chave (`re_...`).
3. **Vercel → Settings → Environment Variables**, adicione:

| Name                  | Value                                                |
| --------------------- | ---------------------------------------------------- |
| `PEXELS_API_KEY`      | a chave do Pexels                                    |
| `UNSPLASH_ACCESS_KEY` | (opcional) a Access Key do Unsplash                  |
| `RESEND_API_KEY`      | a chave da Resend                                    |
| `LEADS_FROM_EMAIL`    | `NoSweat <leads@nosweatfd.com>` (domínio verificado) |

Depois clique em **Deployments → ⋯ → Redeploy** para valer.

4. **Fotos enviadas pelo dono (Supabase Storage)**: no Supabase, **SQL Editor → New query**,
   cole o conteúdo de [`supabase/migrations/0008_site_images_bucket.sql`](supabase/migrations/0008_site_images_bucket.sql)
   e clique em **Run**. Isso cria o bucket público `site-images` (até 8 MB, só JPG/PNG/WebP).
   Confira em **Storage** que o bucket aparece.

5. **Lista de lançamento (e-mail de boas-vindas)**: rode no SQL Editor a
   [`supabase/migrations/0010_marketing_contacts.sql`](supabase/migrations/0010_marketing_contacts.sql).
   Na Vercel, adicione `MARKETING_POSTAL_ADDRESS` (endereço postal da empresa, exigido por lei
   em e-mail de marketing; pode ser uma caixa postal) e, se quiser, `MARKETING_FROM_EMAIL`.
   Sem o endereço, ninguém recebe o e-mail (os contatos ficam guardados na lista).
6. **Captcha no cadastro e login (Cloudflare Turnstile, grátis)**:
   1. https://dash.cloudflare.com → **Turnstile → Add widget**, domínio `nosweatfd.com`, modo
      _Managed_. Copie a **Site Key** e a **Secret Key**.
   2. Supabase → **Authentication → Attack Protection → Enable Captcha protection**, provedor
      **Turnstile**, cole a **Secret Key** e salve.
   3. Vercel → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = a **Site Key**, e **Redeploy**.
      Faça os passos 2 e 3 juntos: com o captcha ligado no Supabase e sem a chave na Vercel,
      ninguém consegue entrar.

> O aviso vai para o e-mail da conta do dono do site (ou, se não achar, para o e-mail do
> negócio no site). O link do e-mail abre a página do site no painel. Há um limite de
> 5 envios do formulário por hora por rede (IP) em cada site.

---

## Passo 4 (opcional): entrar com Google

O botão "Continue with Google" em `/login` e `/signup` só aparece quando o Google está ligado no
Supabase (a página confere sozinha, a cada 5 minutos).

1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID →
   tipo "Web application".
   - Authorized redirect URI: `https://<id-do-projeto>.supabase.co/auth/v1/callback`
   - Tela de consentimento: nome "No Sweat", e-mail de suporte, links
     `https://nosweatfd.com/terms` e `https://nosweatfd.com/privacy`.
2. Supabase → Authentication → Sign In / Providers → Google: ligar e colar o Client ID e o
   Client Secret.
3. Supabase → Authentication → URL Configuration: Site URL `https://nosweatfd.com` e, em
   Redirect URLs, `https://nosweatfd.com/auth/callback**`.

Apple funciona igual (provider "Apple"), mas exige conta Apple Developer (US$ 99/ano).

## Passo 5: limpeza automática (Cron da Vercel)

Sites criados sem conta e abandonados (mais de 30 dias) são apagados todo dia às 07:17 UTC por
`/api/cron/cleanup-guests` (configurado em `apps/web/vercel.json`). Para funcionar, crie na Vercel
(Settings → Environment Variables) a variável `CRON_SECRET` com um texto aleatório longo. Sem
ela, a rota recusa tudo (nada é apagado).

Recomendado também: `IP_HASH_SALT` (texto aleatório) para o hash de IP dos limites anti-abuso.

## Passo 6: cobrança (Stripe)

Enquanto as chaves abaixo não existirem, publicar e conectar domínio continuam **grátis**.
Com elas, publicar passa a exigir um plano (Starter, Pro ou Premium) e domínio próprio exige
Pro ou Premium. Os preços ficam no código (`apps/web/server/billing/plans.ts`): **não** precisa
criar produtos no Stripe.

1. Crie a conta em https://dashboard.stripe.com/register (use o modo **Test** para testar).
2. **Developers → API keys**: copie a **Secret key** (`sk_test_...` ou `sk_live_...`).
3. **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://nosweatfd.com/api/billing/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Depois de criar, copie o **Signing secret** (`whsec_...`).
4. **Settings → Billing → Customer portal**: clique em **Save** (ativa o botão "Manage billing").
5. Vercel → Settings → Environment Variables: `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
   Depois **Deployments → ⋯ → Redeploy**.

Cartão de teste no modo Test: `4242 4242 4242 4242`, qualquer data futura e qualquer CVC.

## Conferência final

- [ ] `https://nosweatfd.com` abre a landing page.
- [ ] Em **Get started**, `plumbing company in Austin` gera o site do Joe's Plumbing.
- [ ] Recarregar a página do preview continua mostrando o site (ou seja, está salvo no Supabase).
- [ ] No Supabase, em **Table Editor → sites**, aparece uma linha nova.
- [ ] Em **My sites**, o site aparece na lista.

## Limitações atuais (conhecidas)

- **Plano da Vercel:** o plano Hobby (grátis) não permite uso comercial. Antes de cobrar
  clientes, passe o projeto para o plano **Pro**.

- E-mails de cadastro usam o SMTP padrão do Supabase (só equipe, com limite). Configure um SMTP
  próprio antes de abrir para clientes.
- A IA ainda é o **mock** (escolhe um de 3 sites de exemplo). A IA real entra trocando
  `AI_PROVIDER` e adicionando a chave da Anthropic ou da OpenAI.
