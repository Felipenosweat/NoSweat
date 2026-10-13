-- "Experimente antes de criar conta": sites criados por visitantes sem login.
-- O site fica com owner_id nulo e guest_id = id aleatório guardado num cookie do visitante.
-- Ao entrar ou criar a conta, o site passa para a conta (owner_id preenchido, guest_id nulo).

alter table public.sites add column if not exists guest_id text;

create index if not exists sites_guest_id_idx
  on public.sites (guest_id) where guest_id is not null;

-- Uso da IA por visitantes: sem user_id; contamos por visitante (guest_id) e por IP
-- (ip_hash = SHA-256 do IP com sal, nunca o IP puro), para limitar abuso e custo.
alter table public.ai_usage alter column user_id drop not null;
alter table public.ai_usage add column if not exists guest_id text;
alter table public.ai_usage add column if not exists ip_hash text;

create index if not exists ai_usage_guest_idx
  on public.ai_usage (kind, created_at desc) where user_id is null;

-- Limite de envios do formulário de contato (anti-spam): conta mensagens por site e por IP.
alter table public.leads add column if not exists ip_hash text;

create index if not exists leads_site_created_at_idx
  on public.leads (site_id, created_at desc);
