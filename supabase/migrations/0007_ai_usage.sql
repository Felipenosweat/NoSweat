-- Registro de cada uso da IA, para limitar quantas vezes por dia cada conta pode usar
-- (controle de custo). Os limites ficam nas variáveis AI_DAILY_GENERATIONS e AI_DAILY_EDITS.

create table if not exists public.ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('generate', 'ai_edit')),
  created_at  timestamptz not null default now()
);

create index if not exists ai_usage_user_kind_created_at_idx
  on public.ai_usage (user_id, kind, created_at desc);

alter table public.ai_usage enable row level security;
