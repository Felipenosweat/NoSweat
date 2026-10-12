-- Tabela de sites gerados pela No Sweat.
-- Rode este arquivo UMA vez no Supabase: Dashboard → SQL Editor → New query → colar → Run.

create table if not exists public.sites (
  id          uuid primary key default gen_random_uuid(),
  spec        jsonb not null,
  status      text not null default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists sites_created_at_idx on public.sites (created_at desc);

-- RLS ligado e sem nenhuma policy: ninguém acessa pela chave pública (anon).
-- Só o servidor da No Sweat, com a chave secreta (service role), lê e grava.
-- TODO: quando houver login, adicionar owner_id e policies por usuário.
alter table public.sites enable row level security;
