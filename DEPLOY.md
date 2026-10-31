# Colocar a No Sweat no ar (Supabase + Vercel + nosweatfd.com)

Você **não copia HTML nenhum**. O site é montado pela Vercel direto do GitHub. Você só vai copiar:

1. **Os arquivos SQL** de `supabase/migrations/` para criar as tabelas no Supabase.
2. **As chaves** do Supabase e da Anthropic (IA) para a Vercel.
3. **Dois registros de DNS** da Vercel para o painel onde o domínio foi comprado.

Tempo total: uns 30 minutos, mais a espera do DNS. Antes de cobrar o primeiro cliente, faça
também a lista [Antes de vender](#antes-de-vender-obrigatório) no fim deste arquivo.

> **Endereço oficial: `https://www.nosweatfd.com`** (com `www`). Na Vercel, `nosweatfd.com`
> redireciona (308) para o `www`. Use sempre o `www` nos painéis de fora (Supabase, Stripe, Meta,
> Vault): chamadas de servidor para servidor (webhooks, crons) **não seguem** redirecionamento.

---

## Passo 0: código na `main`

A Vercel publica a branch `main`. No GitHub, abra o repositório `Felipenosweat/NoSweat`,
crie o Pull Request da branch de trabalho para a `main` e clique em **Merge**.

---

## Passo 1: Supabase (o banco de dados)

1. Entre em https://supabase.com → **New project**.
   - Nome: `nosweat`. Região: **East US** (perto dos clientes). Crie uma senha forte e guarde.
2. Com o projeto criado, no menu da esquerda clique em **SQL Editor** → **New query**.
3. Rode **todos** os arquivos da pasta [`supabase/migrations/`](supabase/migrations/), **um por vez
   e na ordem do número** (`0001`, `0002`, … até o último, hoje `0018`). Para cada um: copie todo
   o conteúdo, cole numa query nova e clique em **Run**. Tem que aparecer _Success_.
   - O `0008` tem dois arquivos (`0008_guest_sites.sql` e `0008_site_images_bucket.sql`): rode
     os dois.
   - Nunca pule um arquivo. Se der erro, pare e mande a mensagem para o time.
4. Pegue as duas informações que vão para a Vercel:

| O que copiar                                         | Onde fica no Supabase                                                                                       | Nome na Vercel              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Project URL** (ex.: `https://abcdxyz.supabase.co`) | Botão **Connect** no topo, ou **Project Settings → Data API**                                               | `NEXT_PUBLIC_SUPABASE_URL`  |
| **Chave secreta**                                    | **Project Settings → API Keys**: a **Secret key** (`sb_secret_...`) ou, na aba _Legacy_, a **service_role** | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ A chave secreta dá acesso total ao banco. Cole **só** na Vercel. Não mande por chat,
> e-mail ou WhatsApp, e nunca coloque no código. A chave _publishable/anon_ **não** serve aqui.

5. **Login (Authentication → URL Configuration)**:
   - **Site URL**: `https://www.nosweatfd.com`
   - **Redirect URLs** → _Add URL_, as duas: `https://www.nosweatfd.com/**` e
     `https://nosweatfd.com/**` (a segunda é só uma rede de segurança).

   Sem isso, o link do e-mail de confirmação de cadastro aponta para `localhost`. O
   `NEXT_PUBLIC_SITE_URL` do arquivo `apps/web/.env.production` tem que ser igual ao Site URL.

6. **Modelos de e-mail do login (Authentication → Emails → Templates)**: troque o link dos dois
   modelos abaixo (o resto do texto pode ficar, em inglês):
   - _Confirm signup_:
     `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`
   - _Reset password_:
     `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

   Por quê: o link com `token_hash` funciona em qualquer navegador (por exemplo o navegador
   interno do app de e-mail, ou outro aparelho). O padrão do Supabase, `{{ .ConfirmationURL }}`
   (PKCE), só funciona no mesmo navegador em que a pessoa começou o cadastro; em qualquer outro,
   o link dá erro.

   Sites criados como visitante antes do cadastro: enquanto o e-mail não é confirmado, o servidor
   guarda o código do visitante na conta nova (`app_metadata.pending_guest_id`) e os sites passam
   para a conta quando ela confirma. Isso usa a mesma `SUPABASE_SERVICE_ROLE_KEY` do item 4;
   nada novo para configurar.

> A chave **publishable** (pública) do login já está no arquivo `apps/web/.env.production`.
> Se trocar de projeto Supabase, atualize esse arquivo.
>
> O envio de e-mails padrão do Supabase só entrega para e-mails da própria equipe e tem limite
> por hora: clientes de verdade **não recebem** o e-mail de confirmação. O SMTP próprio é
> obrigatório antes de abrir para clientes (ver [Antes de vender](#antes-de-vender-obrigatório)).

### Conferir as migrations depois de cada merge

Toda vez que um merge na `main` trouxer um arquivo novo em `supabase/migrations/`, rode esse
arquivo no SQL Editor. Depois confira: **Supabase → Database → Migrations** tem que listar os
mesmos números da pasta. Se o painel não mostrar a lista (arquivos rodados à mão no SQL Editor
nem sempre aparecem), confira pelo efeito do arquivo (a tabela ou coluna nova em
**Table Editor**). Em outubro de 2026 o `0009_drop_duplicate_leads_index.sql` estava faltando em
produção: rode esse arquivo se ainda não rodou (ele só apaga um índice repetido).

---

## Passo 2: Vercel (onde o site roda)

1. Entre em https://vercel.com com a conta do GitHub → **Add New… → Project**.
2. Escolha o repositório **NoSweat** → **Import**.
3. Na tela de configuração:
   - **Root Directory**: clique em _Edit_ e escolha **`apps/web`**.
   - **Framework Preset**: _Next.js_ (aparece sozinho).
   - Não mexa nos comandos de build e de install: eles vêm do arquivo `apps/web/vercel.json`
     (que força o pnpm; sem ele a Vercel tenta usar o npm e falha com `workspace:`).
4. Abra **Environment Variables** e adicione:

| Name                        | Value                                                                |
| --------------------------- | -------------------------------------------------------------------- |
| `AI_PROVIDER`               | `anthropic`                                                          |
| `ANTHROPIC_API_KEY`         | chave criada em https://console.anthropic.com (com crédito e limite) |
| `NEXT_PUBLIC_SUPABASE_URL`  | a Project URL do Passo 1                                             |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave secreta do Passo 1                                           |
| `CRON_SECRET`               | um texto aleatório longo (ex.: `openssl rand -hex 32`); ver Passo 5  |
| `APP_URL`                   | `https://www.nosweatfd.com` (links dos e-mails e dos crons)          |

Em produção (`VERCEL_ENV=production`) o app **recusa** rodar sem isso: sem `AI_PROVIDER=anthropic`
e `ANTHROPIC_API_KEY`, criar e editar sites com IA dá erro (em vez de entregar um site de
exemplo, como o Joe's Plumbing); sem as duas chaves do Supabase, toda página que lê sites dá
erro (em vez de guardar os sites na memória e perder tudo). Nos deploys de _Preview_ e no dev
local, o mock e a memória continuam valendo.

5. (Para domínios de clientes) crie um token em **vercel.com → Account Settings → Tokens →
   Create**, com acesso ao time da No Sweat, e adicione a variável `VERCEL_TOKEN` com ele.
   Sem o token, os domínios dos clientes ficam como "Being set up" e precisam ser adicionados
   à mão em **Settings → Domains**.
6. Clique em **Deploy**. No fim aparece um endereço tipo `nosweat-xxxx.vercel.app`.
   Abra, vá em **Get started**, gere um site e confira se o preview abre.

> O install usa `pnpm install --frozen-lockfile` (em `apps/web/vercel.json`): o deploy instala
> exatamente as versões do `pnpm-lock.yaml`. Quem mudar um `package.json` precisa rodar
> `pnpm install` e commitar o `pnpm-lock.yaml` junto; senão o build da Vercel falha.

> Se o build der erro, copie o log (aba _Deployments_ → o deploy com erro → _Build Logs_)
> e mande para o time de desenvolvimento.

---

## Passo 3: domínio nosweatfd.com

1. Na Vercel, dentro do projeto: **Settings → Domains → Add**.
2. Adicione `www.nosweatfd.com` (o endereço oficial) e também `nosweatfd.com`, este
   **redirecionando para `www.nosweatfd.com`** (é assim que está hoje; `apps/web/lib/site.ts` e os
   links do Google contam com isso).
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

Pronto: https://www.nosweatfd.com no ar. A cada merge na `main`, a Vercel publica de novo
sozinha.

---

## Fotos e e-mails (Resend)

As fotos são opcionais (sem a chave, o site sai sem foto de banco de imagens). Os **e-mails são
obrigatórios antes de vender**: sem a Resend, o dono não recebe aviso de pedido novo (só vê no
painel), ninguém recebe lembrete de vencimento do plano e a equipe não recebe alerta de erro.

1. **Fotos de banco de imagens (Pexels, grátis)**: crie uma conta em https://www.pexels.com/api/,
   clique em **Your API Key** e copie a chave. (Opcional, reserva: crie um app em
   https://unsplash.com/developers e copie a **Access Key**.)
2. **E-mails (Resend)**, obrigatório antes de vender:
   1. Crie uma conta em https://resend.com.
   2. **Domains → Add Domain** → `nosweatfd.com`. A Resend mostra alguns registros de DNS
      (`TXT`/`MX`); adicione no painel do domínio, como no Passo 3, e espere ficar **Verified**.
   3. **API Keys → Create API Key** (permissão _Sending access_) e copie a chave (`re_...`).
3. **Vercel → Settings → Environment Variables**, adicione:

| Name                  | Value                                                                   |
| --------------------- | ----------------------------------------------------------------------- |
| `PEXELS_API_KEY`      | a chave do Pexels                                                       |
| `UNSPLASH_ACCESS_KEY` | (opcional) a Access Key do Unsplash                                     |
| `RESEND_API_KEY`      | a chave da Resend                                                       |
| `LEADS_FROM_EMAIL`    | `NoSweat <leads@nosweatfd.com>` (domínio verificado)                    |
| `BILLING_FROM_EMAIL`  | (opcional) remetente dos e-mails do plano manual; ver abaixo            |
| `ALERT_EMAIL`         | e-mail da equipe que recebe os alertas de erro de produção (ver abaixo) |

Depois clique em **Deployments → ⋯ → Redeploy** para valer. Teste mandando um pedido para você
mesmo pelo formulário de um site publicado.

**`BILLING_FROM_EMAIL`** (opcional): remetente dos e-mails do plano liberado à mão ("plan is
active" e os lembretes de vencimento). Sem ela, sai como `No Sweat <billing@nosweatfd.com>`. O
domínio do remetente tem que estar verificado na Resend.

**Alertas de erro (`ALERT_EMAIL`)**: com `ALERT_EMAIL` e `RESEND_API_KEY`, toda falha inesperada
do servidor (página, rota da API, Server Action) manda um e-mail curto para esse endereço, com a
rota, a hora e o _Error ID_. No máximo um e-mail por rota a cada 10 minutos. O detalhe fica em
**Vercel → Logs** (procure pelo Error ID). Vários endereços: separe por vírgula. Sem
`ALERT_EMAIL`, nada é enviado.

4. **Fotos enviadas pelo dono (Supabase Storage)**: o bucket público `site-images` (até 8 MB, só
   JPG/PNG/WebP) é criado pela migration
   [`0008_site_images_bucket.sql`](supabase/migrations/0008_site_images_bucket.sql) do Passo 1.
   Confira em **Storage** que o bucket aparece.

5. **Lista de lançamento (e-mail de boas-vindas)**: a tabela vem da migration
   [`0010_marketing_contacts.sql`](supabase/migrations/0010_marketing_contacts.sql) do Passo 1.
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
     `https://www.nosweatfd.com/terms` e `https://www.nosweatfd.com/privacy`.
2. Supabase → Authentication → Sign In / Providers → Google: ligar e colar o Client ID e o
   Client Secret.
3. Supabase → Authentication → URL Configuration: os mesmos valores do Passo 1 (Site URL
   `https://www.nosweatfd.com`; Redirect URLs `https://www.nosweatfd.com/**` e
   `https://nosweatfd.com/**`). Nada de novo para o Google.

Apple funciona igual (provider "Apple"), mas exige conta Apple Developer (US$ 99/ano).

## Passo 5: tarefas automáticas (Cron da Vercel)

O `apps/web/vercel.json` agenda três crons diários:

- `/api/cron/cleanup-guests` (07:17 UTC): apaga sites criados sem conta e abandonados (mais de
  30 dias) e manda os lembretes de vencimento do acesso manual (Passo 6b): ao cliente faltando
  7 dias, 1 dia e no dia em que acaba (cada um uma vez só), e um resumo para `SALES_EMAIL`. Os
  lembretes só saem com os planos valendo (`REQUIRE_PLAN=true` ou Stripe) e com a
  `RESEND_API_KEY`, e precisam da migration
  [`0018_access_grant_reminders.sql`](supabase/migrations/0018_access_grant_reminders.sql)
  rodada no **Supabase → SQL Editor** (Passo 1);
- `/api/cron/social-refresh` (08:23 UTC): renova os tokens do Instagram antes de vencerem;
- `/api/cron/social-publish` (13:05 UTC): **reserva** do publicador de posts. O publicador de
  verdade roda a cada minuto pelo próprio Supabase (Passo 7.6).

Os três exigem a variável `CRON_SECRET` na Vercel (Settings → Environment Variables), com um
texto aleatório longo. **Sem ela, os três respondem 401 e nada roda.** Confira em Vercel →
Settings → **Cron Jobs**. Quando um cron termina com falhas (post que não publicou, token que
não renovou, lembrete que não saiu), a equipe recebe um alerta no `ALERT_EMAIL` (seção _Fotos e
e-mails_).

Recomendado também: `IP_HASH_SALT` (texto aleatório) para o hash de IP dos limites anti-abuso.

## Passo 6: cobrança (Stripe)

Enquanto as chaves abaixo não existirem, publicar e conectar domínio continuam **grátis**.
Com elas, publicar passa a exigir um plano (Starter, Pro ou Premium) e domínio próprio exige
Pro ou Premium. Os preços ficam no código (`apps/web/server/billing/plans.ts`): **não** precisa
criar produtos no Stripe.

1. Crie a conta em https://dashboard.stripe.com/register (use o modo **Test** para testar).
2. **Developers → API keys**: copie a **Secret key** (`sk_test_...` ou `sk_live_...`).
3. **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://www.nosweatfd.com/api/billing/webhook` (com `www`: o Stripe não
     segue o redirecionamento do endereço sem `www`)
   - Eventos: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Depois de criar, copie o **Signing secret** (`whsec_...`).
4. **Settings → Billing → Customer portal**: clique em **Save** (ativa o botão "Manage billing").
5. Vercel → Settings → Environment Variables: `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
   Depois **Deployments → ⋯ → Redeploy**.

Cartão de teste no modo Test: `4242 4242 4242 4242`, qualquer data futura e qualquer CVC.

> Enquanto o checkout do Stripe não está pronto (precisa das **duas**, `STRIPE_SECRET_KEY` e
> `STRIPE_WEBHOOK_SECRET`; no código, `checkoutReady()`), os cards de preço, o FAQ e os Termos
> mostram o texto do plano manual: pago adiantado e **sem renovação automática**. Com as duas,
> passam a falar de assinatura. A landing e `/pricing` são páginas estáticas: depois de mudar
> essas variáveis, faça **Redeploy** para o texto mudar.

## Passo 6b: cobrança à mão (Pix / WhatsApp), sem Stripe

Para fechar com o cliente pelo WhatsApp e receber por Pix:

1. Vercel → Settings → Environment Variables:
   - `REQUIRE_PLAN` = `true` (publicar passa a exigir plano);
   - `SALES_WHATSAPP` = seu número só com dígitos e código do país (ex.: `14075551234`).
     **Atenção:** em Production o número fica **público**: aparece no rodapé do site de
     marketing ("Chat on WhatsApp"), no FAQ da landing ("message us on WhatsApp"), na ajuda do
     painel e em `/billing`. Confirme que quer esse número à mostra. Sem a variável, nenhum
     desses links aparece. Como a landing é estática, mudar o número exige **Redeploy**;
   - opcional: `SALES_EMAIL` (padrão `hello@nosweatfd.com`).
     Depois **Deployments → ⋯ → Redeploy**.
2. O cliente escolhe o plano em `/billing` e cai no seu WhatsApp com a mensagem pronta
   (plano, mensal/anual e o e-mail da conta dele).
3. Recebeu o Pix? Abra `/admin`, clique em **Manage** no cliente, escolha o plano e os dias
   (ex.: 30) e clique em **Grant access**. Para renovar, **Add days** soma ao que falta.
4. Quando os dias acabam, o site dele sai do ar ("temporarily unavailable") e volta sozinho
   quando você liberar de novo. Sites de admins nunca saem do ar.
5. **Lembretes de vencimento**: o cron diário `cleanup-guests` manda e-mail ao cliente faltando
   7 dias, 1 dia e no dia em que acaba, e um resumo para `SALES_EMAIL`. Precisa de:
   `RESEND_API_KEY` (seção _Fotos e e-mails_), `APP_URL=https://www.nosweatfd.com`, o
   `CRON_SECRET` (Passo 5) e a migration
   [`0018_access_grant_reminders.sql`](supabase/migrations/0018_access_grant_reminders.sql)
   rodada no Supabase. Opcional: `BILLING_FROM_EMAIL` (remetente verificado na Resend).

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

As tabelas vêm das migrations do Passo 1:
[`0013_social.sql`](supabase/migrations/0013_social.sql),
[`0014_social_media_bucket.sql`](supabase/migrations/0014_social_media_bucket.sql) (cria o bucket
público `social-media`),
[`0015_ai_usage_social_kinds.sql`](supabase/migrations/0015_ai_usage_social_kinds.sql) e
[`0016_social_publish_schedule.sql`](supabase/migrations/0016_social_publish_schedule.sql) (o
agendamento a cada minuto; ele só funciona depois dos segredos do Passo 7.6).

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
   - **OAuth redirect URIs**: `https://www.nosweatfd.com/api/social/instagram/callback`
     (tem que ser igual, letra por letra, ao `INSTAGRAM_REDIRECT_URI`; a Meta às vezes põe uma
     `/` no final: confira e tire). Se o app já tinha o endereço sem `www`, deixe os dois na
     lista até trocar o `INSTAGRAM_REDIRECT_URI` na Vercel.
   - **Deauthorize callback URL**: `https://www.nosweatfd.com/api/meta/deauthorize`
   - **Data deletion request URL**: `https://www.nosweatfd.com/api/meta/data-deletion`
   - **Save**. (Estes dois últimos são chamados pelo servidor da Meta, que não segue o
     redirecionamento do endereço sem `www`: use o `www`.)
2. **App settings → Basic**:
   - **Privacy Policy URL**: `https://www.nosweatfd.com/privacy`
   - **Terms of Service URL**: `https://www.nosweatfd.com/terms`
   - **User data deletion** (se a tela pedir de novo): se for _Data deletion callback URL_, use
     `https://www.nosweatfd.com/api/meta/data-deletion`; se for _Data deletion instructions URL_,
     use `https://www.nosweatfd.com/data-deletion` _(confirmar qual opção aparece)_.
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

| Nome                     | Valor                                                     |
| ------------------------ | --------------------------------------------------------- |
| `INSTAGRAM_APP_ID`       | Instagram app ID                                          |
| `INSTAGRAM_APP_SECRET`   | Instagram app secret                                      |
| `INSTAGRAM_REDIRECT_URI` | `https://www.nosweatfd.com/api/social/instagram/callback` |
| `SOCIAL_TOKEN_KEYS`      | `v1:` + o resultado do `openssl` (ex.: `v1:Zm9v...=`)     |
| `SOCIAL_TESTER_EMAILS`   | e-mails dos testadores, separados por vírgula             |

> ⚠️ Guarde uma cópia do `SOCIAL_TOKEN_KEYS` num lugar seguro. Se ele se perder, todos os
> clientes precisam conectar o Instagram de novo. Para trocar: `v2:<nova>,v1:<antiga>`.

Opcionais (padrões no código): `META_GRAPH_VERSION`, `SOCIAL_TESTER_ONLY` (`true`),
`SOCIAL_DAILY_POST_CAP` (10), `SOCIAL_MAX_LATENESS_HOURS` (6), `AI_DAILY_SOCIAL_PLANS` (3),
`AI_DAILY_SOCIAL_CAPTIONS` (30). Depois **Deployments → ⋯ → Redeploy**.

### 7.6 Publicador a cada minuto (Supabase: pg_cron + pg_net + Vault)

Os posts aprovados saem no horário porque o **próprio Supabase** chama
`/api/cron/social-publish` a cada minuto: a migration `0016_social_publish_schedule.sql` liga o
`pg_cron` (agenda) e o `pg_net` (chamada HTTP) e cria o job `social-publish`. O endereço e o
segredo ficam no **Supabase Vault** (nunca no Git). **Sem os dois segredos abaixo, o job roda mas
não chama nada**, e os posts aprovados só saem no cron diário de reserva da Vercel (13:05 UTC);
o que passar de `SOCIAL_MAX_LATENESS_HOURS` (padrão 6 h) de atraso vira _missed_.

1. Confira que `CRON_SECRET` está na Vercel (Passo 5).
2. Supabase → **SQL Editor → New query**, rode (troque o segundo valor pelo **mesmo** texto do
   `CRON_SECRET` da Vercel, sem espaços):

   ```sql
   select vault.create_secret('https://www.nosweatfd.com', 'app_url');
   select vault.create_secret('<o mesmo valor de CRON_SECRET da Vercel>', 'cron_secret');
   ```

   Use o endereço **com `www`**: o `pg_net` não segue o redirecionamento do endereço sem `www`
   (o comentário dentro da migration 0016 está desatualizado nesse ponto).

3. Espere um minuto e confira as últimas chamadas (tem que aparecer `status_code` **200**):

   ```sql
   select id, status_code, created, left(content, 200) as content
   from net._http_response
   order by created desc
   limit 5;
   ```

   - `401`: o `cron_secret` do Vault não é igual ao `CRON_SECRET` da Vercel.
   - `308`/`301`: o `app_url` está sem `www`.
   - Nenhuma linha nova: os segredos não foram criados (`select name from vault.secrets;`) ou o
     job está desligado (`select jobname, schedule, active from cron.job;`).

4. Para trocar um valor depois (o mesmo vale para `app_url`):

   ```sql
   select vault.update_secret(id, '<novo valor>') from vault.secrets where name = 'cron_secret';
   ```

O cron diário `/api/cron/social-publish` do `apps/web/vercel.json` continua como **reserva** (se
o Supabase ficar fora do ar). O `/api/cron/social-refresh` diário renova os tokens. Os dois usam o
`CRON_SECRET` do Passo 5.

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

## Passo 8 (opcional): prospecção (/admin/prospects)

1. Rode a migration [`0025_prospects.sql`](supabase/migrations/0025_prospects.sql) (como no
   Passo 1).
2. Sem nada configurado, a busca usa o **OpenStreetMap** (Overpass API, grátis, sem chave). Os
   dados são © OpenStreetMap contributors (ODbL): a página já mostra a atribuição.
3. (Opcional, pago) Para usar o **Google Places**: no Google Cloud, ligue a **Places API (New)**,
   crie uma chave restrita a essa API e adicione na Vercel:

| Name                  | Value                                                  |
| --------------------- | ------------------------------------------------------ |
| `GOOGLE_MAPS_API_KEY` | a chave do Google (sem ela, a fonte é o OpenStreetMap) |

Redeploy. Regras de uso (e-mails, ligações, descadastro) em [`docs/prospecting.md`](docs/prospecting.md).

## Conferência final

- [ ] `https://nosweatfd.com` abre a landing page (e o endereço vira `https://www.nosweatfd.com`).
- [ ] Em **Get started**, um negócio que não é encanador (ex.: `dog grooming in Boise, ID`) gera
      um site com o **nome e os serviços desse negócio** (não um site de exemplo, como o Joe's
      Plumbing).
- [ ] Recarregar a página do preview continua mostrando o site (ou seja, está salvo no Supabase).
- [ ] No Supabase, em **Table Editor → sites**, aparece uma linha nova.
- [ ] Em **My sites**, o site aparece na lista.
- [ ] **Supabase → Database → Migrations** (ou o efeito de cada arquivo) bate com a pasta
      `supabase/migrations/`.

## Antes de vender (obrigatório)

Faça tudo isto antes de cobrar o primeiro cliente:

- [ ] **SMTP próprio no Supabase** (sem ele, clientes de verdade não recebem o e-mail de
      confirmação e não conseguem entrar): **Authentication → Emails → SMTP Settings** → ligar o
      SMTP próprio pela Resend: host `smtp.resend.com`, porta `465`, usuário `resend`, senha =
      uma API key da Resend, remetente `no-reply@nosweatfd.com` (domínio verificado), nome
      `No Sweat`.
- [ ] **Limite de e-mails**: **Authentication → Rate Limits** → aumente os e-mails por hora
      (ex.: 100).
- [ ] **Modelos de e-mail** (**Authentication → Emails → Templates**), em inglês e com a cara da
      No Sweat: _Confirm signup_, _Reset password_ e _Change email address_. Nos dois primeiros,
      use o link com `token_hash` (Passo 1, item 6; funciona em qualquer navegador ou aparelho):
  - _Confirm signup_:
    `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`
  - _Reset password_:
    `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
- [ ] **Captcha (Turnstile)** ligado no Supabase e na Vercel (seção _Fotos e e-mails_, item 6).
      Teste o cadastro com um Gmail pessoal que não seja da equipe.
- [ ] **Resend**: domínio `nosweatfd.com` verificado, `RESEND_API_KEY` e `LEADS_FROM_EMAIL` na
      Vercel (seção _Fotos e e-mails_). Teste um pedido pelo formulário de um site publicado.
- [ ] **`ALERT_EMAIL`** na Vercel (alertas de erro de produção).
- [ ] **`VERCEL_TOKEN`** na Vercel (Passo 2, item 5): sem ele, domínios de clientes ficam
      "Being set up" até alguém adicionar à mão. Se o projeto ou o time não forem os padrões de
      `apps/web/server/domains/vercel.ts`, configure também `VERCEL_PROJECT_ID` e `VERCEL_TEAM_ID`.
      Conecte um domínio de teste do começo ao fim.
- [ ] **Segredos do Vault** para o publicador do Instagram (Passo 7.6), com `status_code` 200 em
      `net._http_response`.
- [ ] **Lembretes de vencimento** (Passo 6b, item 5): `RESEND_API_KEY`, `APP_URL` e a migration
      `0018` rodada.
- [ ] **Vercel Pro**: o plano Hobby (grátis) não permite uso comercial. Passe o time da Vercel
      para o **Pro** antes de cobrar.
- [ ] **Supabase Pro**: o plano grátis não tem backup e pausa o projeto parado. Passe a
      organização para o **Pro** e ligue **Authentication → Attack Protection → Prevent use of
      leaked passwords**.
- [ ] **IA real**: `AI_PROVIDER=anthropic` e `ANTHROPIC_API_KEY` em Production (Passo 2), com
      limite de gasto no console da Anthropic.

## Limitações atuais (conhecidas)

- A IA de sites é a da **Anthropic** (`AI_PROVIDER=anthropic`). O `openai` ainda não existe
  (responde erro) e o `mock` (sites de exemplo) só vale no dev local e nos deploys de Preview.
- Trocar o e-mail de login ainda é pelo e-mail da equipe (a página `/account` só mostra o e-mail).
  Apagar a conta também é um pedido por e-mail, como dizem os Termos e a Privacidade.
