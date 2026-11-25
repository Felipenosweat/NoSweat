-- Pedido de avaliação no Google automático (planos Pro e Premium): quando um job da agenda vira
-- "done", o cliente recebe por e-mail o pedido com o link de avaliações do dono.
-- Regras: um pedido por job (nunca dois), nenhum para o mesmo cliente em 30 dias, e a linha entra
-- ANTES do envio (função claim_auto_review_request), então dois pedidos ao mesmo tempo não
-- mandam dois e-mails. Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

-- Configuração do dono. Sem linha = ligado (padrão para os planos que têm o recurso).
create table if not exists public.review_request_settings (
  owner_id      uuid primary key references auth.users (id) on delete cascade,
  auto_enabled  boolean not null default true,
  updated_at    timestamptz not null default now()
);

alter table public.review_request_settings enable row level security;

create table if not exists public.auto_review_requests (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  -- Job apagado: a linha fica (conta para os 30 dias do cliente), só sem o job.
  job_id      uuid references public.jobs (id) on delete set null,
  client_id   uuid not null references public.clients (id) on delete cascade,
  email       text not null,
  -- pending = gravado, e-mail saindo; failed = a Resend recusou (não tenta de novo).
  status      text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);

-- Um pedido por job. Índice inteiro (vários NULL de jobs apagados continuam permitidos).
create unique index if not exists auto_review_requests_job_idx
  on public.auto_review_requests (job_id);
create index if not exists auto_review_requests_client_idx
  on public.auto_review_requests (client_id, created_at desc);
create index if not exists auto_review_requests_owner_idx
  on public.auto_review_requests (owner_id, created_at desc);

alter table public.auto_review_requests enable row level security;

-- Reserva o pedido do job ANTES do envio. Trava por cliente (pg_advisory_xact_lock): dois jobs do
-- mesmo cliente marcados "done" ao mesmo tempo rodam um depois do outro. Devolve o id da linha
-- nova, ou null se o job já teve pedido ou o cliente recebeu um (pendente ou enviado) nos
-- últimos `p_cooldown_days` dias.
create or replace function public.claim_auto_review_request(
  p_owner          uuid,
  p_job            uuid,
  p_client         uuid,
  p_email          text,
  p_cooldown_days  int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('auto_review:' || p_client::text));

  if exists (select 1 from public.auto_review_requests r where r.job_id = p_job) then
    return null;
  end if;

  if exists (
    select 1 from public.auto_review_requests r
    where r.owner_id = p_owner
      and r.client_id = p_client
      and r.status in ('pending', 'sent')
      and r.created_at > now() - make_interval(days => greatest(coalesce(p_cooldown_days, 0), 0))
  ) then
    return null;
  end if;

  insert into public.auto_review_requests (owner_id, job_id, client_id, email)
  values (p_owner, p_job, p_client, p_email)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.claim_auto_review_request(uuid, uuid, uuid, text, int)
  from public, anon, authenticated;
grant execute on function public.claim_auto_review_request(uuid, uuid, uuid, text, int)
  to service_role;
