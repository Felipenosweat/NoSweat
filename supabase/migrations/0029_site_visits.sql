-- Visitas dos sites publicados e o resumo mensal por e-mail ("seu site teve 120 visitas e 6
-- pedidos"). O cliente precisa ver que o site trabalha para ele; sem isso, cancela.
-- Só contagem por dia: nada de IP, cookie ou qualquer dado do visitante.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

create table if not exists public.site_visits (
  site_id  uuid not null references public.sites (id) on delete cascade,
  day      date not null,
  visits   int  not null default 0,
  primary key (site_id, day)
);

alter table public.site_visits enable row level security;

-- Soma uma visita no dia de hoje (UTC), numa ida só ao banco. Site que não existe ou não está
-- publicado não conta nada.
create or replace function public.count_site_visit(p_site uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.site_visits (site_id, day, visits)
  select s.id, (now() at time zone 'utc')::date, 1
  from public.sites s
  where s.id = p_site and s.status = 'published'
  on conflict (site_id, day) do update set visits = public.site_visits.visits + 1;
$$;

revoke all on function public.count_site_visit(uuid) from public, anon, authenticated;
grant execute on function public.count_site_visit(uuid) to service_role;

-- Resumos mensais já enviados: uma linha por conta e mês (primeiro dia do mês). A linha entra
-- ANTES do envio, então o mesmo resumo nunca sai duas vezes.
create table if not exists public.monthly_reports (
  owner_id  uuid not null references auth.users (id) on delete cascade,
  month     date not null,
  sent_at   timestamptz not null default now(),
  primary key (owner_id, month)
);

alter table public.monthly_reports enable row level security;
