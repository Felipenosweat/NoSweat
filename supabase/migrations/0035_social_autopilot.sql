-- Piloto automático do Instagram (Premium) e "Approve all drafts" (Pro e Premium).
-- O dono liga o Piloto automático uma vez (consentimento permanente). Depois disso, os rascunhos
-- COMPLETOS da IA que ele não editou nem pulou são aprovados sozinhos cerca de 2 h antes da hora,
-- desde que o e-mail de aviso tenha saído pelo menos 12 h antes. Do dia 25 em diante, o mês
-- seguinte é planejado sozinho (mesmos créditos do botão). Aprovar só põe na fila: publicar
-- continua com o publicador e as travas dele (nunca publicar duas vezes).

-- Preferências: ligado/desligado, quando ligou, último e-mail de aviso e a última tentativa de
-- planejar o mês seguinte.
alter table public.social_settings
  add column if not exists autopilot             boolean not null default false,
  add column if not exists autopilot_since       timestamptz,
  add column if not exists autopilot_digest_at   timestamptz,
  add column if not exists autopilot_plan_month  text,
  add column if not exists autopilot_plan_status text
    check (autopilot_plan_status in ('planned', 'out_of_credits', 'no_site', 'failed')),
  add column if not exists autopilot_plan_at     timestamptz;

create index if not exists social_settings_autopilot_idx
  on public.social_settings (owner_id)
  where autopilot;

-- Posts: "Skip" do dono, quando o dono editou, quando o aviso listou o post e quando o Piloto
-- automático aprovou (approved_at continua obrigatório para entrar na fila).
alter table public.social_posts
  add column if not exists autopilot_skip      boolean not null default false,
  add column if not exists owner_edited_at     timestamptz,
  add column if not exists autopilot_notice_at timestamptz,
  add column if not exists auto_approved_at    timestamptz;

-- Rascunhos da IA com data (o que o Piloto automático procura).
create index if not exists social_posts_autopilot_idx
  on public.social_posts (owner_id, scheduled_at)
  where status = 'draft' and source = 'ai';

-- Chama o Piloto automático (GET /api/cron/social-autopilot) a cada 15 minutos, como o
-- publicador (migration 0016): pg_cron + pg_net, endereço e segredo no Supabase Vault
-- ('app_url' e 'cron_secret', os mesmos da 0016). Sem eles, a função não faz nada.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.trigger_social_autopilot()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'app_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1;
  if v_url is null or v_secret is null then
    return;
  end if;
  perform net.http_get(
    url := rtrim(v_url, '/') || '/api/cron/social-autopilot',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.trigger_social_autopilot() from public, anon, authenticated;

-- Recria o agendamento sem duplicar. Minutos 7, 22, 37 e 52 (fora do :00 dos outros jobs).
select cron.unschedule(jobid) from cron.job where jobname = 'social-autopilot';
select cron.schedule('social-autopilot', '7,22,37,52 * * * *', 'select public.trigger_social_autopilot()');
