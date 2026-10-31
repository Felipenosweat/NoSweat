-- Finanças da No Sweat (painel do admin, /admin/finance): custos da própria empresa, únicos,
-- mensais ou anuais. O painel soma o custo fixo do mês e mostra quantos clientes pagantes faltam
-- para empatar. Contrato em packages/schema/src/finance.ts. Dinheiro em centavos de dólar.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas (como platform_admins e
-- access_grants). As premissas do painel (ARPU, custo por cliente) ficam no endereço da página.

create table if not exists public.company_expenses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 120),
  category      text not null check (category in (
                  'hosting', 'database', 'ai', 'email', 'payments', 'domain', 'software',
                  'marketing', 'legal_accounting', 'payroll', 'other'
                )),
  amount_cents  int not null check (amount_cents >= 0),
  frequency     text not null check (frequency in ('one_time', 'monthly', 'yearly')),
  -- Começo (mensal/anual) ou dia do pagamento (único).
  starts_on     date not null default current_date,
  -- Último dia em que o custo vale (inclusive). Nulo = continua.
  ends_on       date check (ends_on is null or ends_on >= starts_on),
  notes         text not null default '' check (char_length(notes) <= 1000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists company_expenses_starts_on_idx
  on public.company_expenses (starts_on);

alter table public.company_expenses enable row level security;
