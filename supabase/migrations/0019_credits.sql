-- Créditos da IA (moeda própria da No Sweat). Cada linha é um movimento: gasto, devolução,
-- compra de créditos avulsos ou ajuste do admin. Os saldos são calculados a partir daqui
-- (apps/web/server/credits): a cota mensal do plano NÃO fica guardada (vem do plano ativo) e
-- zera todo mês; os créditos comprados (bucket 'topup') não vencem.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

create table if not exists public.credit_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- Negativo = gasto; positivo = devolução, compra ou bônus.
  delta       integer not null,
  -- De qual saldo: a cota do mês ('monthly') ou os créditos comprados ('topup').
  bucket      text not null check (bucket in ('monthly', 'topup')),
  reason      text not null
    check (reason in ('monthly_grant', 'spend', 'topup', 'admin_adjust', 'refund')),
  -- Ação da IA que gastou (generate, ai_edit, social_plan...). `null` em compras e ajustes.
  action      text,
  site_id     text,
  created_at  timestamptz not null default now(),
  meta        jsonb not null default '{}'::jsonb
);

create index if not exists credit_ledger_user_created_at_idx
  on public.credit_ledger (user_id, created_at desc);

alter table public.credit_ledger enable row level security;

-- Somas do saldo numa consulta só (topup: tudo; mensal: só a partir do início do período).
create or replace function public.credit_sums(p_user_id uuid, p_period_start timestamptz)
returns table (topup bigint, monthly_spent bigint, monthly_granted bigint)
language sql
stable
set search_path = ''
as $$
  select
    coalesce(sum(l.delta) filter (where l.bucket = 'topup'), 0)::bigint as topup,
    coalesce(-(sum(l.delta) filter (
      where l.bucket = 'monthly'
        and l.reason in ('spend', 'refund')
        and l.created_at >= p_period_start
    )), 0)::bigint as monthly_spent,
    coalesce(sum(l.delta) filter (
      where l.bucket = 'monthly'
        and l.reason in ('monthly_grant', 'admin_adjust')
        and l.created_at >= p_period_start
    ), 0)::bigint as monthly_granted
  from public.credit_ledger l
  where l.user_id = p_user_id;
$$;

revoke all on function public.credit_sums(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.credit_sums(uuid, timestamptz) to service_role;
