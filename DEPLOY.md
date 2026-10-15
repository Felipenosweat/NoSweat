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

## Passo 6b: cobrança à mão (Pix / WhatsApp), sem Stripe

Para fechar com o cliente pelo WhatsApp e receber por Pix:

1. Vercel → Settings → Environment Variables:
   - `REQUIRE_PLAN` = `true` (publicar passa a exigir plano);
   - `SALES_WHATSAPP` = seu número só com dígitos e código do país (ex.: `14075551234`);
   - opcional: `SALES_EMAIL` (padrão `hello@nosweatfd.com`).
     Depois **Deployments → ⋯ → Redeploy**.
2. O cliente escolhe o plano em `/billing` e cai no seu WhatsApp com a mensagem pronta
   (plano, mensal/anual e o e-mail da conta dele).
3. Recebeu o Pix? Abra `/admin`, clique em **Manage** no cliente, escolha o plano e os dias
   (ex.: 30) e clique em **Grant access**. Para renovar, **Add days** soma ao que falta.
4. Quando os dias acabam, o site dele sai do ar ("temporarily unavailable") e volta sozinho
   quando você liberar de novo. Sites de admins nunca saem do ar.

Pode usar junto com o Stripe: vale o maior plano ativo entre os dois.
**Atenção:** ao ligar `REQUIRE_PLAN`, sites já publicados de quem não tem plano saem do ar.
Libere o acesso desses clientes antes.

## Passo 7: redes sociais (Instagram)

O dono conecta o Instagram em `/social`, a IA sugere os posts do mês como **rascunho**, o dono
aprova cada um e o cron publica no horário. Sem as chaves abaixo, em produção o botão de conectar
fica desligado (no dev local entra a conta de mentira `@mock_business`).

> Os nomes dos menus da Meta mudam com frequência. Os caminhos abaixo foram conferidos na
> documentação da Meta em outubro de 2026; se algum botão estiver com outro nome, procure o
> equivalente. Os pontos marcados com _(confirmar)_ não deu para conferir na tela.

### 7.1 Banco

No Supabase → **SQL Editor**, rode, nesta ordem, cada arquivo inteiro (como no Passo 1):
[`0013_social.sql`](supabase/migrations/0013_social.sql),
[`0014_social_media_bucket.sql`](supabase/migrations/0014_social_media_bucket.sql) (cria o bucket
público `social-media`) e
[`0015_ai_usage_social_kinds.sql`](supabase/migrations/0015_ai_usage_social_kinds.sql).

### 7.2 Criar o app na Meta

1. Entre em https://developers.facebook.com com a conta do Facebook que administra o
   Instagram da No Sweat → **My Apps → Create App**.
2. Nome: `No Sweat`. E-mail de contato: `hello@nosweatfd.com`.
3. Caso de uso: **Manage messaging & content on Instagram** (nas telas antigas: tipo
   **Business** e depois **Add product → Instagram**).
4. Ligue o app ao portfólio empresarial (Business Manager) da No Sweat, se pedir.
5. No menu do app: **Instagram → API setup with Instagram login**. Só dá para ter um tipo de
   configuração por app: escolha **com Instagram login** (não "with Facebook login").

### 7.3 Endereços do app

Ainda em **API setup with Instagram login**:

1. Etapa **3. Set up Instagram business login** → **Business login settings**:
   - **OAuth redirect URIs**: `https://nosweatfd.com/api/social/instagram/callback`
     (tem que ser igual, letra por letra, ao `INSTAGRAM_REDIRECT_URI`; a Meta às vezes põe uma
     `/` no final: confira e tire).
   - **Deauthorize callback URL**: `https://nosweatfd.com/api/meta/deauthorize`
   - **Data deletion request URL**: `https://nosweatfd.com/api/meta/data-deletion`
   - **Save**.
2. **App settings → Basic**:
   - **Privacy Policy URL**: `https://nosweatfd.com/privacy`
   - **Terms of Service URL**: `https://nosweatfd.com/terms`
   - **User data deletion** (se a tela pedir de novo): se for _Data deletion callback URL_, use
     `https://nosweatfd.com/api/meta/data-deletion`; se for _Data deletion instructions URL_, use
     `https://nosweatfd.com/data-deletion` _(confirmar qual opção aparece)_.
   - Ícone do app (1024×1024), categoria e **Save changes**.

### 7.4 Testadores (antes do App Review)

Enquanto a Meta não aprova o app, ele fica em modo de desenvolvimento e **só funciona com
testadores**.

1. **App roles → Roles → Add People → Instagram Tester** (confirmar o nome do botão; em telas
   antigas é **Add Instagram Testers**) e digite o @ do Instagram.
2. A pessoa aceita o convite **no Instagram**: Settings → **Apps and websites → Tester invites →
   Accept** (pelo navegador: instagram.com/accounts/manage_access). Pode levar alguns minutos
   para aparecer.
3. A conta do testador precisa ser **Profissional** (Business ou Creator). Conta pessoal é
   recusada ao conectar.
4. Na No Sweat, coloque o e-mail da conta dele em `SOCIAL_TESTER_EMAILS` (admins já contam).

### 7.5 Chaves na Vercel

1. Em **Instagram → API setup with Instagram login**, copie o **Instagram app ID** e o
   **Instagram app secret** (clique em _Show_). Atenção: são diferentes do App ID/App Secret de
   **App settings → Basic**; use os da tela do Instagram.
2. No seu computador, gere a chave dos tokens: `openssl rand -base64 32`.
3. Vercel → Settings → Environment Variables:

| Nome                     | Valor                                                 |
| ------------------------ | ----------------------------------------------------- |
| `INSTAGRAM_APP_ID`       | Instagram app ID                                      |
| `INSTAGRAM_APP_SECRET`   | Instagram app secret                                  |
| `INSTAGRAM_REDIRECT_URI` | `https://nosweatfd.com/api/social/instagram/callback` |
| `SOCIAL_TOKEN_KEYS`      | `v1:` + o resultado do `openssl` (ex.: `v1:Zm9v...=`) |
| `SOCIAL_TESTER_EMAILS`   | e-mails dos testadores, separados por vírgula         |

> ⚠️ Guarde uma cópia do `SOCIAL_TOKEN_KEYS` num lugar seguro. Se ele se perder, todos os
> clientes precisam conectar o Instagram de novo. Para trocar: `v2:<nova>,v1:<antiga>`.

Opcionais (padrões no código): `META_GRAPH_VERSION`, `SOCIAL_TESTER_ONLY` (`true`),
`SOCIAL_DAILY_POST_CAP` (10), `SOCIAL_MAX_LATENESS_HOURS` (6), `AI_DAILY_SOCIAL_PLANS` (3),
`AI_DAILY_SOCIAL_CAPTIONS` (30). Depois **Deployments → ⋯ → Redeploy**.

### 7.6 Crons (precisa do plano Pro da Vercel)

O `apps/web/vercel.json` tem dois crons novos: `/api/cron/social-publish` **a cada minuto**
(publica os posts aprovados) e `/api/cron/social-refresh` uma vez por dia (renova os tokens antes
de vencerem). O plano Hobby só aceita cron diário, então o publicador **exige o plano Pro**.
Os dois usam o mesmo `CRON_SECRET` do Passo 5. Confira em Vercel → Settings → **Cron Jobs**.

### 7.7 Teste com um testador

1. Entre na No Sweat com a conta do testador → `/social` → **Connect Instagram** → aceite.
2. Gere o plano do mês, coloque uma foto num post, aprove para daqui a 5 minutos.
3. Confira se o post aparece no Instagram e fica **Published** no painel.
4. Instagram → Apps and websites → remova a No Sweat: a conta tem que aparecer desconectada.

### 7.8 Liberar para todos os clientes (App Review)

Sem isto, só testadores publicam. Na Meta, nesta ordem:

1. **Business Verification** (verificação da empresa): **App settings → Basic → Verification**
   ou no Business Manager → Security Center. Pede documentos da empresa e domínio verificado.
2. **Access Verification** (para apps que dão acesso a outras empresas, como a No Sweat):
   aparece no painel depois da verificação da empresa _(confirmar)_.
3. **App Review → Permissions and features**: peça **Advanced Access** para
   `instagram_business_basic` e `instagram_business_content_publish`. Para cada uma:
   - explique em inglês o uso: "Small businesses connect their Instagram professional account so
     No Sweat can publish the posts they approve, at the time they choose.";
   - grave um vídeo de tela (screencast) **em inglês**, mostrando: login na No Sweat → Connect
     Instagram → tela de permissão da Meta → conta conectada (com o @) → criar post → aprovar →
     o post publicado no Instagram → desconectar. Use legendas ou narração, mostre a URL
     `nosweatfd.com` e não corte a tela de permissão;
   - dê um usuário de teste com acesso (conta No Sweat + Instagram profissional de teste).
4. Mude o app para **Live** (chave no topo do painel).
5. Só **depois** de aprovado e Live: na Vercel, `SOCIAL_TESTER_ONLY` = `false` e Redeploy.
   Antes disso, clientes que não são testadores não conseguem publicar automaticamente.

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
