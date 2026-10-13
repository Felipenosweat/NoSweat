-- Pedidos de contato enviados pelo formulário dos sites publicados.

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists leads_site_id_created_at_idx on public.leads (site_id, created_at desc);

alter table public.leads enable row level security;
