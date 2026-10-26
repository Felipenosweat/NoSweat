-- Escritório do dono (gestão da empresa): configurações, tabela de preços, equipe, serviços
-- (jobs), orçamentos, faturas e pagamentos. Contrato em packages/schema/src/office.ts.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas. Dinheiro em centavos.

create table if not exists public.office_settings (
  owner_id               uuid primary key references auth.users (id) on delete cascade,
  company_name           text not null default '',
  phone                  text,
  email                  text,
  address                text,
  default_tax_rate_bps   int not null default 0 check (default_tax_rate_bps between 0 and 3000),
  invoice_due_days       int not null default 14 check (invoice_due_days between 0 and 120),
  estimate_valid_days    int not null default 30 check (estimate_valid_days between 1 and 365),
  estimate_terms         text not null default '',
  payment_instructions   text not null default '',
  time_zone              text not null default 'America/New_York',
  -- Próximos números (#1001...). Reservados com office_next_number (abaixo), sem corrida.
  next_job_number        int not null default 1001,
  next_estimate_number   int not null default 1001,
  next_invoice_number    int not null default 1001,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.office_settings enable row level security;

-- Reserva o próximo número de um tipo de documento ('job' | 'estimate' | 'invoice') para o dono,
-- criando a linha de configurações se faltar. Atômico (update ... returning).
create or replace function public.office_next_number(p_owner uuid, p_kind text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  insert into public.office_settings (owner_id) values (p_owner) on conflict (owner_id) do nothing;
  if p_kind = 'job' then
    update public.office_settings set next_job_number = next_job_number + 1
      where owner_id = p_owner returning next_job_number - 1 into n;
  elsif p_kind = 'estimate' then
    update public.office_settings set next_estimate_number = next_estimate_number + 1
      where owner_id = p_owner returning next_estimate_number - 1 into n;
  elsif p_kind = 'invoice' then
    update public.office_settings set next_invoice_number = next_invoice_number + 1
      where owner_id = p_owner returning next_invoice_number - 1 into n;
  else
    raise exception 'unknown kind %', p_kind;
  end if;
  return n;
end;
$$;

revoke all on function public.office_next_number(uuid, text) from public, anon, authenticated;
grant execute on function public.office_next_number(uuid, text) to service_role;

create table if not exists public.price_items (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users (id) on delete cascade,
  name              text not null,
  description       text not null default '',
  unit_price_cents  bigint not null check (unit_price_cents >= 0),
  unit              text not null default 'each',
  taxable           boolean not null default true,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists price_items_owner_idx on public.price_items (owner_id, name);
alter table public.price_items enable row level security;

create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  role        text not null default '',
  color       text not null default 'blue'
                check (color in ('blue', 'green', 'orange', 'purple', 'pink', 'teal', 'red', 'gray')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists team_members_owner_idx on public.team_members (owner_id, name);
alter table public.team_members enable row level security;

create table if not exists public.estimates (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users (id) on delete cascade,
  number             int not null,
  client_id          uuid not null references public.clients (id) on delete cascade,
  job_id             uuid,
  title              text not null default '',
  -- 'expired' é calculado na leitura; aqui só o que foi decidido.
  status             text not null default 'draft'
                       check (status in ('draft', 'sent', 'approved', 'declined')),
  items              jsonb not null default '[]',
  tax_rate_bps       int not null default 0 check (tax_rate_bps between 0 and 3000),
  subtotal_cents     bigint not null default 0,
  discount_cents     bigint not null default 0,
  tax_cents          bigint not null default 0,
  total_cents        bigint not null default 0,
  message            text not null default '',
  valid_until        date,
  public_token       text not null unique,
  sent_at            timestamptz,
  responded_at       timestamptz,
  approved_by_name   text,
  decline_reason     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (owner_id, number)
);

create index if not exists estimates_owner_idx on public.estimates (owner_id, created_at desc);
create index if not exists estimates_client_idx on public.estimates (client_id);
alter table public.estimates enable row level security;

create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  number        int not null,
  client_id     uuid not null references public.clients (id) on delete cascade,
  title         text not null,
  description   text not null default '',
  status        text not null default 'unscheduled'
                  check (status in ('unscheduled', 'scheduled', 'in_progress', 'done', 'canceled')),
  start_at      timestamptz,
  end_at        timestamptz,
  address       text,
  -- Ids de team_members (sem chave estrangeira: membro apagado some da lista na leitura).
  assignee_ids  uuid[] not null default '{}',
  notes         text not null default '',
  estimate_id   uuid references public.estimates (id) on delete set null,
  invoice_id    uuid,
  value_cents   bigint check (value_cents is null or value_cents >= 0),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (owner_id, number),
  check (end_at is null or start_at is null or end_at > start_at)
);

create index if not exists jobs_owner_start_idx on public.jobs (owner_id, start_at);
create index if not exists jobs_owner_status_idx on public.jobs (owner_id, status);
create index if not exists jobs_client_idx on public.jobs (client_id);
alter table public.jobs enable row level security;

alter table public.estimates
  add constraint estimates_job_fk foreign key (job_id) references public.jobs (id) on delete set null;

create table if not exists public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users (id) on delete cascade,
  number             int not null,
  client_id          uuid not null references public.clients (id) on delete cascade,
  job_id             uuid references public.jobs (id) on delete set null,
  estimate_id        uuid references public.estimates (id) on delete set null,
  title              text not null default '',
  -- 'partial' e 'overdue' são calculados na leitura.
  status             text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  items              jsonb not null default '[]',
  tax_rate_bps       int not null default 0 check (tax_rate_bps between 0 and 3000),
  subtotal_cents     bigint not null default 0,
  discount_cents     bigint not null default 0,
  tax_cents          bigint not null default 0,
  total_cents        bigint not null default 0,
  amount_paid_cents  bigint not null default 0,
  message            text not null default '',
  issued_on          date not null default current_date,
  due_on             date,
  public_token       text not null unique,
  sent_at            timestamptz,
  paid_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (owner_id, number)
);

create index if not exists invoices_owner_idx on public.invoices (owner_id, created_at desc);
create index if not exists invoices_client_idx on public.invoices (client_id);
alter table public.invoices enable row level security;

alter table public.jobs
  add constraint jobs_invoice_fk foreign key (invoice_id) references public.invoices (id) on delete set null;

create table if not exists public.invoice_payments (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  invoice_id    uuid not null references public.invoices (id) on delete cascade,
  amount_cents  bigint not null check (amount_cents > 0),
  method        text not null
                  check (method in ('cash', 'check', 'card', 'zelle', 'venmo', 'cashapp', 'other')),
  reference     text not null default '',
  received_on   date not null default current_date,
  created_at    timestamptz not null default now()
);

create index if not exists invoice_payments_invoice_idx on public.invoice_payments (invoice_id);
create index if not exists invoice_payments_owner_received_idx
  on public.invoice_payments (owner_id, received_on desc);
alter table public.invoice_payments enable row level security;
