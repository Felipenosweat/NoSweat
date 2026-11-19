-- Registro das ações do admin (painel /admin): quem fez o quê, em quem, por quê e de onde.
-- Antes estas ações só iam para o console.info (logs da Vercel: retenção curta e editáveis por
-- quem tem o projeto). Gravado por apps/web/server/admin/audit.ts (recordAdminAction) com a
-- chave secreta; mostrado em /admin/audit.
--
-- SÓ ACRESCENTA: ninguém altera nem apaga linhas.
-- - RLS ligado e sem políticas: anon e authenticated não leem nem escrevem (como platform_admins).
-- - UPDATE, DELETE e TRUNCATE revogados também do service_role (o servidor só insere e lê).
-- - Gatilhos recusam UPDATE, DELETE e TRUNCATE de qualquer papel, inclusive do dono da tabela
--   (para apagar de propósito, alguém com acesso de superusuário teria que tirar o gatilho, o que
--   fica no log do Postgres).
-- `admin_id` sem chave estrangeira: o registro continua mesmo se a conta do admin for apagada.
-- `ip_hash`: HMAC do IP (server/ip.ts); o IP puro nunca é guardado.

create table if not exists public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null,
  action       text not null check (action ~ '^[a-z][a-z0-9_.]{0,63}$'),
  target_type  text check (target_type is null or char_length(target_type) <= 32),
  target_id    text check (target_id is null or char_length(target_id) <= 200),
  reason       text check (reason is null or char_length(reason) <= 500),
  metadata     jsonb not null default '{}'::jsonb,
  ip_hash      text check (ip_hash is null or char_length(ip_hash) <= 128),
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_admin_idx
  on public.admin_audit_log (admin_id, created_at desc);

create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log (target_type, target_id, created_at desc);

alter table public.admin_audit_log enable row level security;

revoke all on table public.admin_audit_log from anon, authenticated;
revoke update, delete, truncate on table public.admin_audit_log from service_role;
grant select, insert on table public.admin_audit_log to service_role;

create or replace function public.admin_audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'admin_audit_log is append-only (% is not allowed)', tg_op
    using errcode = 'insufficient_privilege';
end;
$$;

revoke all on function public.admin_audit_log_append_only() from public, anon, authenticated;

drop trigger if exists admin_audit_log_no_update_delete on public.admin_audit_log;
create trigger admin_audit_log_no_update_delete
  before update or delete on public.admin_audit_log
  for each row execute function public.admin_audit_log_append_only();

drop trigger if exists admin_audit_log_no_truncate on public.admin_audit_log;
create trigger admin_audit_log_no_truncate
  before truncate on public.admin_audit_log
  for each statement execute function public.admin_audit_log_append_only();
