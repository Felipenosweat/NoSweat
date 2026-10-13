-- Administradores da plataforma (time da No Sweat): veem o painel /admin e todos os sites.
-- Para adicionar alguém (no SQL Editor do Supabase):
--   insert into public.platform_admins (user_id)
--   select id from auth.users where email = 'pessoa@exemplo.com';

create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
