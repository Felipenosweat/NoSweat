-- Agendamento online: o cliente do dono escolhe um horário livre no site. Contrato em
-- packages/schema/src/booking.ts; regras em apps/web/server/booking.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

-- Serviços da tabela de preços que o cliente pode marcar pelo site, e quanto tempo levam.
alter table public.price_items
  add column if not exists bookable boolean not null default false,
  add column if not exists duration_minutes int
    check (duration_minutes is null or duration_minutes between 5 and 480);

-- Regras de agendamento do dono (horários da semana, passo, folga, antecedência...). O JSON é o
-- `BookingSettings` do contrato; o servidor valida na entrada e na saída.
create table if not exists public.booking_settings (
  owner_id    uuid primary key references auth.users (id) on delete cascade,
  settings    jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.booking_settings enable row level security;

-- Marcações feitas pelo site. `job_id` liga ao serviço (job) criado na agenda do dono; `token` é o
-- link público do cliente (/booking/<token>) para ver e cancelar, sem conta.
-- Sem chave estrangeira em service_id: serviço apagado da tabela de preços não apaga a marcação
-- (o nome fica em service_name).
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  site_id         uuid not null,
  token           text not null unique,
  job_id          uuid references public.jobs (id) on delete set null,
  client_id       uuid references public.clients (id) on delete set null,
  service_id      uuid not null,
  service_name    text not null,
  -- team_members.id (sem chave estrangeira, como jobs.assignee_ids). Nulo = agenda única.
  staff_id        uuid,
  start_at        timestamptz not null,
  end_at          timestamptz not null,
  status          text not null default 'confirmed' check (status in ('confirmed', 'canceled')),
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text,
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  canceled_at     timestamptz,
  check (end_at > start_at)
);

create index if not exists bookings_owner_start_idx on public.bookings (owner_id, start_at);
create index if not exists bookings_job_idx on public.bookings (job_id) where job_id is not null;
alter table public.bookings enable row level security;

-- Marca o horário SEM marcar duas vezes. É a única porta de entrada de marcações novas.
-- Trava por dono (pg_advisory_xact_lock): duas chamadas ao mesmo tempo para o mesmo dono rodam uma
-- depois da outra, então a segunda já enxerga a marcação da primeira. Dentro da trava confere se o
-- horário (com a folga `p_buffer_minutes` depois do atendimento) bate com:
--   (a) marcação confirmada da mesma pessoa (ou qualquer uma, se uma das duas não tem pessoa);
--   (b) serviço (job) não cancelado atribuído à pessoa, sem ninguém atribuído (vale para todos) ou
--       qualquer um, se a marcação não tem pessoa. Job sem fim conta como 60 minutos.
-- Devolve jsonb: { "conflict": true } ou { "conflict": false, "booking": { ...linha... } }.
create or replace function public.book_slot(
  p_owner           uuid,
  p_site            uuid,
  p_token           text,
  p_client          uuid,
  p_service_id      uuid,
  p_service_name    text,
  p_staff           uuid,
  p_start           timestamptz,
  p_end             timestamptz,
  p_buffer_minutes  int,
  p_customer_name   text,
  p_customer_phone  text,
  p_customer_email  text,
  p_notes           text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buffer interval := make_interval(mins => greatest(coalesce(p_buffer_minutes, 0), 0));
  v_row public.bookings;
begin
  perform pg_advisory_xact_lock(hashtext(p_owner::text));

  if exists (
    select 1 from public.bookings b
    where b.owner_id = p_owner
      and b.status = 'confirmed'
      and (p_staff is null or b.staff_id is null or b.staff_id = p_staff)
      and b.start_at < p_end + v_buffer
      and b.end_at + v_buffer > p_start
  ) or exists (
    select 1 from public.jobs j
    where j.owner_id = p_owner
      and j.status <> 'canceled'
      and j.start_at is not null
      and (p_staff is null or cardinality(j.assignee_ids) = 0 or p_staff = any (j.assignee_ids))
      and j.start_at < p_end + v_buffer
      and coalesce(j.end_at, j.start_at + interval '60 minutes') + v_buffer > p_start
  ) then
    return jsonb_build_object('conflict', true);
  end if;

  insert into public.bookings (
    owner_id, site_id, token, client_id, service_id, service_name, staff_id, start_at, end_at,
    customer_name, customer_phone, customer_email, notes
  ) values (
    p_owner, p_site, p_token, p_client, p_service_id, p_service_name, p_staff, p_start, p_end,
    p_customer_name, p_customer_phone, p_customer_email, coalesce(p_notes, '')
  )
  returning * into v_row;

  return jsonb_build_object('conflict', false, 'booking', to_jsonb(v_row));
end;
$$;

revoke all on function public.book_slot(
  uuid, uuid, text, uuid, uuid, text, uuid, timestamptz, timestamptz, int, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.book_slot(
  uuid, uuid, text, uuid, uuid, text, uuid, timestamptz, timestamptz, int, text, text, text, text
) to service_role;
