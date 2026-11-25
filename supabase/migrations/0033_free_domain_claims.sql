-- Domínio grátis do Premium: 1 domínio .com/.net por conta, PARA SEMPRE, comprado pela No Sweat
-- no registro da Vercel e ligado ao site do cliente (apps/web/server/domains/free-domain.ts).
--
-- Contra comprar duas vezes: a linha `pending` é gravada ANTES de chamar a compra. `user_id` é
-- único (um por conta); um clique duplo ou uma nova tentativa bate na linha que já existe e não
-- compra de novo. `failed` (o registro recusou) pode tentar mais uma vez: o servidor troca para
-- `pending` só se `attempts` ainda for o que ele leu (troca condicional, sem corrida).
--
-- Dados pessoais: o endereço e o telefone do dono do domínio vão direto para o registro e NÃO
-- ficam aqui. `error` guarda só o código do erro do registro.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas (como 0025 e 0030).

create table if not exists public.free_domain_claims (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique,
  -- Site que recebeu o domínio. Site apagado: o pedido continua (o domínio é do cliente).
  site_id       uuid references public.sites (id) on delete set null,
  domain        text not null check (domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.(com|net)$'),
  status        text not null default 'pending' check (status in ('pending', 'purchased', 'failed')),
  price_cents   int not null check (price_cents >= 0),
  attempts      int not null default 1 check (attempts between 1 and 5),
  -- Pedido no registro da Vercel (orderId da compra).
  order_id      text check (order_id is null or char_length(order_id) <= 200),
  -- Renovação automática no registro: ligada enquanto o Premium vale (por nossa conta); o cron
  -- diário desliga quando o plano acaba (syncFreeDomainAutoRenew).
  auto_renew    boolean not null default true,
  error         text check (error is null or char_length(error) <= 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  purchased_at  timestamptz
);

-- Um mesmo domínio não pode estar em dois pedidos vivos (o registro já recusaria; isto é a trava).
create unique index if not exists free_domain_claims_domain_live_idx
  on public.free_domain_claims (domain)
  where status in ('pending', 'purchased');

create index if not exists free_domain_claims_status_idx
  on public.free_domain_claims (status);

alter table public.free_domain_claims enable row level security;

revoke all on table public.free_domain_claims from anon, authenticated;
grant select, insert, update on table public.free_domain_claims to service_role;
