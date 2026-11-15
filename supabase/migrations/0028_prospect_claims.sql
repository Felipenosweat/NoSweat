-- Prospecção: o prospect assume a prévia ("Make it yours" em /p/<token>) e a gente fica sabendo.
-- Antes o botão levava para o /create vazio e a pessoa perdia o site que tinha acabado de ver.
-- Agora cada clique cria uma CÓPIA da prévia para quem clicou (visitante ou conta) e grava aqui.
-- Também conta as aberturas da prévia: quem abriu é quem vale a ligação.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas (como 0025).

alter table public.prospects
  add column if not exists preview_views int not null default 0,
  add column if not exists preview_last_viewed_at timestamptz,
  -- Primeira vez que alguém assumiu a prévia.
  add column if not exists claimed_at timestamptz;

-- Uma linha por cópia. Site apagado (ex.: visitante que nunca criou conta) leva a linha junto.
create table if not exists public.prospect_claims (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references public.prospects (id) on delete cascade,
  site_id      uuid not null references public.sites (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists prospect_claims_prospect_idx on public.prospect_claims (prospect_id);
alter table public.prospect_claims enable row level security;
