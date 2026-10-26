-- Correções do escritório (0022). Contrato em packages/schema/src/office.ts; regras em
-- apps/web/server/office/service.ts.
--
-- 1. Apagar um cliente não leva mais junto os orçamentos, jobs e faturas dele (dinheiro!).
-- 2. Itens de pagamento no histórico do cliente (`kind = 'payment'`, com `payment_id`).
-- 3. Pagamento atômico (`office_record_payment`): dois pagamentos ao mesmo tempo nunca passam do
--    total da fatura.
-- 4. Uma fatura não anulada por orçamento (converter duas vezes ao mesmo tempo não duplica).

-- ---------- 1. client_id sem cascade ----------
-- NO ACTION (o padrão), e não RESTRICT: a checagem fica para o fim do comando. Assim, apagar a
-- CONTA (auth.users → cascade em clients E em estimates/jobs/invoices, ex.: contas de teste do
-- admin) continua funcionando, porque no fim do comando nada sobra apontando para o cliente. Com
-- RESTRICT, a ordem das cascatas poderia barrar o apagamento da conta. Apagar só o cliente com
-- documentos é recusado (o servidor responde 409 antes; isto é a garantia do banco).

alter table public.estimates drop constraint if exists estimates_client_id_fkey;
alter table public.estimates
  add constraint estimates_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete no action;

alter table public.jobs drop constraint if exists jobs_client_id_fkey;
alter table public.jobs
  add constraint jobs_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete no action;

alter table public.invoices drop constraint if exists invoices_client_id_fkey;
alter table public.invoices
  add constraint invoices_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete no action;

-- ---------- 2. pagamentos no histórico do cliente ----------
-- `payment` soma no total do cliente (total_jobs_cents) e na receita do mês, mas não conta como
-- serviço (jobs_count). O item some junto com o pagamento (on delete cascade).

alter table public.client_activities drop constraint if exists client_activities_kind_check;
alter table public.client_activities
  add constraint client_activities_kind_check
  check (kind in ('lead', 'note', 'job', 'stage', 'payment'));

alter table public.client_activities
  add column if not exists payment_id uuid references public.invoice_payments (id) on delete cascade;

create index if not exists client_activities_payment_idx
  on public.client_activities (payment_id)
  where payment_id is not null;

-- Pagamentos gravados antes desta migration entraram como `job` ("Payment for invoice #1001"):
-- viram `payment` (sem payment_id: não dá para saber qual era) e os totais são recalculados.
-- Dois comandos (e não um WITH): o comando de fora não enxergaria o que o WITH mudou.
update public.client_activities
   set kind = 'payment'
 where kind = 'job'
   and body like 'Payment for invoice #%';

update public.clients c
   set jobs_count = (
         select count(*) from public.client_activities a
          where a.client_id = c.id and a.kind = 'job'
       ),
       total_jobs_cents = (
         select coalesce(sum(a.amount_cents), 0) from public.client_activities a
          where a.client_id = c.id and a.kind in ('job', 'payment')
       ),
       updated_at = now()
 where exists (
   select 1 from public.client_activities a
    where a.client_id = c.id and a.kind = 'payment'
 );

-- ---------- 3. pagamento atômico ----------
-- Trava a linha da fatura (for update), confere que existe, é do dono, não está anulada e que o
-- valor cabe no saldo; grava o pagamento e atualiza amount_paid_cents, status e paid_at.
-- Devolve { payment, invoice } (as duas linhas em jsonb). Erros (o servidor lê a mensagem):
--   office_invoice_not_found → 404; office_invoice_void → 409;
--   office_payment_over_balance (detail = saldo em centavos) → 400.

create or replace function public.office_record_payment(
  p_owner        uuid,
  p_invoice      uuid,
  p_amount       bigint,
  p_method       text,
  p_reference    text,
  p_received_on  date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv      public.invoices%rowtype;
  paid     bigint;
  new_paid bigint;
  pay      public.invoice_payments%rowtype;
begin
  select * into inv from public.invoices
   where id = p_invoice and owner_id = p_owner
   for update;
  if not found then
    raise exception 'office_invoice_not_found';
  end if;
  if inv.status = 'void' then
    raise exception 'office_invoice_void';
  end if;

  select coalesce(sum(amount_cents), 0) into paid
    from public.invoice_payments where invoice_id = inv.id;
  if p_amount is null or p_amount <= 0 or p_amount > inv.total_cents - paid then
    raise exception 'office_payment_over_balance'
      using detail = greatest(inv.total_cents - paid, 0)::text;
  end if;

  insert into public.invoice_payments (owner_id, invoice_id, amount_cents, method, reference, received_on)
  values (p_owner, inv.id, p_amount, p_method, coalesce(p_reference, ''), coalesce(p_received_on, current_date))
  returning * into pay;

  new_paid := paid + p_amount;
  update public.invoices
     set amount_paid_cents = new_paid,
         status = case
                    when new_paid >= inv.total_cents then 'paid'
                    when inv.status = 'draft' then 'sent'
                    else inv.status
                  end,
         paid_at = case when new_paid >= inv.total_cents then now() else inv.paid_at end,
         updated_at = now()
   where id = inv.id
  returning * into inv;

  return jsonb_build_object('payment', to_jsonb(pay), 'invoice', to_jsonb(inv));
end;
$$;

revoke all on function public.office_record_payment(uuid, uuid, bigint, text, text, date)
  from public, anon, authenticated;
grant execute on function public.office_record_payment(uuid, uuid, bigint, text, text, date)
  to service_role;

-- ---------- 4. uma fatura ativa por orçamento ----------
-- Dois "converter" ao mesmo tempo: o segundo insert falha aqui e o servidor devolve a fatura que
-- já existe. Anuladas não contam (anular e converter de novo cria outra).
-- Atenção: se já houver duas faturas não anuladas do mesmo orçamento, esta linha falha; anule uma
-- delas e rode de novo.

create unique index if not exists invoices_estimate_active_idx
  on public.invoices (estimate_id)
  where status <> 'void' and estimate_id is not null;
