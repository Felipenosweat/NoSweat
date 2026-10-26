-- Etiquetas livres nos clientes do CRM ("VIP", "Commercial", "Referral"...). Só acrescenta: a
-- coluna nova tem padrão vazio, então as linhas antigas e o código antigo continuam funcionando.
-- O servidor limita a 10 etiquetas de até 30 caracteres (contrato em packages/schema/src/clients.ts).

alter table public.clients
  add column if not exists tags text[] not null default '{}';

-- Para o resumo "receita do mês" e "ganhos do mês" (histórico do dono por data).
create index if not exists client_activities_owner_occurred_idx
  on public.client_activities (owner_id, occurred_at desc);
