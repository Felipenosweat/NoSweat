-- Lembretes de vencimento do acesso manual (apps/web/server/billing/reminders.ts, rodado pelo cron
-- diário /api/cron/cleanup-guests): e-mail ao cliente faltando 7 dias, 1 dia e quando acaba.
-- reminder_stage = última etapa avisada ('7d', '1d' ou 'ended'); reminded_for = o expires_at
-- daquele aviso. Quando o admin muda a data, reminded_for deixa de bater e os avisos recomeçam.

alter table public.access_grants
  add column if not exists reminder_stage text
    check (reminder_stage is null or reminder_stage in ('7d', '1d', 'ended')),
  add column if not exists reminded_for timestamptz;

-- O cron busca pela data final (acessos que vencem nos próximos dias ou acabaram de vencer).
create index if not exists access_grants_expires_at_idx on public.access_grants (expires_at);
