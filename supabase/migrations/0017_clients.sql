-- Módulo de clientes (um CRM simples para o dono do negócio): clientes, histórico de cada um e
-- pedidos do site que o dono descartou. Todo pedido do formulário do site (tabela leads) vira, ou
-- se junta a, um cliente sozinho (sync em apps/web/server/clients/service.ts).
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

create table if not exists public.clients (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users (id) on delete cascade,
  name              text not null,
  email             text,
  phone             text,
  address           text,
  stage             text not null default 'new'
                      check (stage in ('new', 'contacted', 'quoted', 'won', 'lost')),
  source            text not null default 'manual' check (source in ('website', 'manual')),
  -- Site de onde veio o primeiro pedido (null = cadastro manual ou site apagado).
  site_id           uuid references public.sites (id) on delete set null,
  notes             text not null default '',
  follow_up_on      date,
  last_activity_at  timestamptz not null default now(),
  -- Soma dos serviços (atividades `job`), recalculada pelo servidor a cada serviço registrado.
  total_jobs_cents  bigint not null default 0,
  jobs_count        int not null default 0,
  -- E-mail em minúsculas e telefone só com dígitos: para juntar pedidos da mesma pessoa.
  email_norm        text,
  phone_norm        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists clients_owner_activity_idx
  on public.clients (owner_id, last_activity_at desc);
create index if not exists clients_owner_email_idx on public.clients (owner_id, email_norm);
create index if not exists clients_owner_phone_idx on public.clients (owner_id, phone_norm);
create index if not exists clients_owner_follow_up_idx on public.clients (owner_id, follow_up_on);

alter table public.clients enable row level security;

create table if not exists public.client_activities (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  kind          text not null check (kind in ('lead', 'note', 'job', 'stage')),
  body          text not null default '',
  -- Só em `job`: valor cobrado, em centavos.
  amount_cents  bigint check (amount_cents is null or amount_cents >= 0),
  -- Só em `lead`: o pedido do site que gerou o item.
  lead_id       uuid references public.leads (id) on delete set null,
  site_id       uuid references public.sites (id) on delete set null,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Um pedido do site entra uma vez só (dois syncs ao mesmo tempo: o segundo é ignorado).
-- Índice inteiro (não parcial) para servir de alvo do `on_conflict=lead_id` do PostgREST; vários
-- NULL continuam permitidos (no Postgres, NULL nunca é igual a NULL num índice único).
create unique index if not exists client_activities_lead_idx
  on public.client_activities (lead_id);
create index if not exists client_activities_client_idx
  on public.client_activities (client_id, occurred_at desc);
create index if not exists client_activities_owner_lead_idx
  on public.client_activities (owner_id)
  where lead_id is not null;

alter table public.client_activities enable row level security;

-- Pedidos do site de clientes que o dono apagou. Sem esta "lápide", o sync importaria o pedido de
-- novo (o histórico do cliente some junto com ele) e o cliente apagado voltaria sozinho.
create table if not exists public.client_dismissed_leads (
  lead_id     uuid primary key references public.leads (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists client_dismissed_leads_owner_idx
  on public.client_dismissed_leads (owner_id);

alter table public.client_dismissed_leads enable row level security;
