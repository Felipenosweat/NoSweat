-- Chama o publicador de posts (GET /api/cron/social-publish) a cada minuto, pelo próprio banco.
-- Motivo: no plano Hobby da Vercel o cron só pode rodar uma vez por dia.
-- Usa pg_cron (agenda) + pg_net (chamada HTTP). O endereço e o segredo ficam no Supabase Vault,
-- nunca no Git. Antes de funcionar, crie os dois segredos (SQL Editor do Supabase):
--   select vault.create_secret('https://nosweatfd.com', 'app_url');
--   select vault.create_secret('<o mesmo valor de CRON_SECRET da Vercel>', 'cron_secret');
-- Sem eles, a função não faz nada (não dá erro).

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.trigger_social_publish()
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
    url := rtrim(v_url, '/') || '/api/cron/social-publish',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.trigger_social_publish() from public, anon, authenticated;

-- Recria o agendamento sem duplicar (rodar esta migration de novo não cria dois).
select cron.unschedule(jobid) from cron.job where jobname = 'social-publish';
select cron.schedule('social-publish', '* * * * *', 'select public.trigger_social_publish()');
