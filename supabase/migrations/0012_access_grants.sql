-- Acesso liberado à mão pelo admin (ex.: cliente pagou por Pix/WhatsApp): plano até uma data.
-- Vale junto com a assinatura do Stripe: a conta tem acesso se qualquer um dos dois estiver ativo.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

create table if not exists public.access_grants (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  plan        text not null check (plan in ('starter', 'pro', 'premium')),
  expires_at  timestamptz not null,
  note        text,
  granted_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.access_grants enable row level security;
