-- Cada site pertence a um usuário (Supabase Auth).
-- Sites antigos (criados antes do login) ficam com owner_id nulo e não aparecem para ninguém.

alter table public.sites
  add column if not exists owner_id uuid references auth.users (id) on delete cascade;

create index if not exists sites_owner_id_created_at_idx
  on public.sites (owner_id, created_at desc);
