-- Módulo de redes sociais: contas conectadas (Instagram), preferências, posts agendados,
-- histórico de eventos (auditoria) e pedidos de exclusão de dados da Meta.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.
-- O token de acesso fica CRIPTOGRAFADO (AES-256-GCM, chave em SOCIAL_TOKEN_KEYS) e nunca sai do
-- servidor; as listagens nunca selecionam access_token_enc.

create table if not exists public.social_accounts (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references auth.users (id) on delete cascade,
  provider            text not null check (provider in ('instagram')),
  -- Id da conta profissional no Instagram (o usado nas chamadas /{id}/media).
  external_id         text not null,
  -- Id "app-scoped" que a Meta manda nos avisos de desautorização e de exclusão de dados.
  app_scoped_id       text,
  username            text not null,
  account_type        text,
  avatar_url          text,
  access_token_enc    text,
  token_key_version   text,
  token_expires_at    timestamptz,
  token_refreshed_at  timestamptz,
  scopes              text[] not null default '{}',
  status              text not null default 'active'
                        check (status in ('active', 'needs_reconnect', 'revoked')),
  last_error          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  revoked_at          timestamptz,
  unique (owner_id, provider, external_id)
);

-- A mesma conta do Instagram não pode estar ligada a dois donos ao mesmo tempo.
create unique index if not exists social_accounts_live_external_idx
  on public.social_accounts (provider, external_id)
  where status <> 'revoked';
create index if not exists social_accounts_app_scoped_idx
  on public.social_accounts (provider, app_scoped_id);
create index if not exists social_accounts_expiring_idx
  on public.social_accounts (token_expires_at)
  where status = 'active';

alter table public.social_accounts enable row level security;

create table if not exists public.social_settings (
  owner_id         uuid primary key references auth.users (id) on delete cascade,
  timezone         text not null default 'America/New_York',
  default_site_id  uuid references public.sites (id) on delete set null,
  post_days        int[] not null default '{2,4,6}',
  post_time        text not null default '10:00',
  -- Liberado pelo admin para publicar enquanto o app da Meta está em modo de desenvolvimento.
  tester           boolean not null default false,
  updated_at       timestamptz not null default now()
);

alter table public.social_settings enable row level security;

create table if not exists public.social_posts (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users (id) on delete cascade,
  account_id       uuid references public.social_accounts (id) on delete set null,
  site_id          uuid references public.sites (id) on delete set null,
  post_type        text not null default 'image' check (post_type in ('image', 'carousel')),
  caption          text not null default '',
  owner_note_pt    text,
  media            jsonb not null default '[]',
  scheduled_at     timestamptz,
  status           text not null default 'draft'
                     check (status in ('draft', 'approved', 'scheduled', 'publishing', 'needs_check',
                                       'published', 'manual_published', 'failed', 'paused',
                                       'missed', 'canceled')),
  source           text not null default 'manual' check (source in ('manual', 'ai')),
  claims_flagged   boolean not null default false,
  approved_at      timestamptz,
  approved_by      uuid,
  attempts         int not null default 0,
  next_attempt_at  timestamptz,
  locked_at        timestamptz,
  ig_container_id  text,
  ig_media_id      text,
  permalink        text,
  last_error       text,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Nada entra na fila (nem fica pronto para postar) sem a aprovação do dono.
  constraint social_posts_approved_check
    check (status not in ('approved', 'scheduled', 'publishing', 'needs_check')
           or approved_at is not null)
);

create index if not exists social_posts_due_idx
  on public.social_posts (status, next_attempt_at)
  where status in ('scheduled', 'publishing', 'needs_check');
create index if not exists social_posts_owner_scheduled_idx
  on public.social_posts (owner_id, scheduled_at);
create index if not exists social_posts_account_published_idx
  on public.social_posts (account_id, published_at);

alter table public.social_posts enable row level security;

-- Histórico (auditoria): conectar, desconectar, publicar, erros, exclusão... Nunca guarda tokens.
create table if not exists public.social_events (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users (id) on delete cascade,
  account_id  uuid,
  post_id     uuid,
  actor_id    uuid,
  action      text not null,
  detail      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists social_events_owner_created_idx
  on public.social_events (owner_id, created_at desc);

alter table public.social_events enable row level security;

-- Pedidos de exclusão de dados vindos da Meta (o dono vê o andamento em /data-deletion?code=).
create table if not exists public.data_deletion_requests (
  id                 uuid primary key default gen_random_uuid(),
  provider           text not null,
  external_user_id   text not null,
  confirmation_code  text not null unique,
  status             text not null default 'completed' check (status in ('received', 'completed')),
  created_at         timestamptz not null default now(),
  completed_at       timestamptz
);

alter table public.data_deletion_requests enable row level security;

-- Pega os posts que já estão na hora (no máximo p_limit) e marca como "publishing", de forma
-- atômica: duas execuções do cron ao mesmo tempo nunca pegam o mesmo post (skip locked).
-- Antes, devolve à conferência os posts que ficaram presos em "publishing" por mais de 10 min.
create or replace function public.claim_due_social_posts(p_limit int)
returns setof public.social_posts
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  update public.social_posts
     set status = 'needs_check', next_attempt_at = now(), locked_at = null, updated_at = now()
   where status = 'publishing'
     and locked_at < now() - interval '10 minutes';

  return query
  update public.social_posts p
     set status = 'publishing', locked_at = now(), attempts = p.attempts + 1, updated_at = now()
   where p.id in (
           select q.id
             from public.social_posts q
            where q.status in ('scheduled', 'needs_check')
              and q.next_attempt_at <= now()
            order by q.next_attempt_at
            limit greatest(p_limit, 0)
            for update skip locked
         )
  returning p.*;
end;
$$;

-- Mesma coisa para UM post ("Publish now"): só pega se ainda estiver na fila.
create or replace function public.claim_social_post(p_id uuid)
returns setof public.social_posts
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  return query
  update public.social_posts p
     set status = 'publishing', locked_at = now(), attempts = p.attempts + 1, updated_at = now()
   where p.id = p_id
     and p.status in ('scheduled', 'needs_check')
  returning p.*;
end;
$$;

-- Só o servidor chama as funções (o padrão do Postgres libera para todos).
revoke execute on function public.claim_due_social_posts(int) from public, anon, authenticated;
revoke execute on function public.claim_social_post(uuid) from public, anon, authenticated;
grant execute on function public.claim_due_social_posts(int) to service_role;
grant execute on function public.claim_social_post(uuid) to service_role;
