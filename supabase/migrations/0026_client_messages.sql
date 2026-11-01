-- Respostas do dono ao cliente (e-mail enviado ou SMS avisado) entram no histórico como `message`.
-- Só amplia o CHECK do tipo (a 0023 criou a versão anterior: lead, note, job, stage, payment).

alter table public.client_activities drop constraint if exists client_activities_kind_check;
alter table public.client_activities
  add constraint client_activities_kind_check
  check (kind in ('lead', 'note', 'job', 'stage', 'payment', 'message'));
