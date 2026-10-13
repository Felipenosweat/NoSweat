-- Assinaturas (Stripe): uma por conta. O webhook do Stripe mantém esta tabela em dia;
-- o app só lê para saber se a conta pode publicar e quais recursos o plano libera.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

create table if not exists public.subscriptions (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id      text not null unique,
  stripe_subscription_id  text unique,
  plan                    text check (plan in ('starter', 'pro', 'premium')),
  billing_interval        text check (billing_interval in ('monthly', 'annual')),
  status                  text,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  updated_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
