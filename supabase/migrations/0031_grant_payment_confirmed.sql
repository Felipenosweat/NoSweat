-- Acesso manual (Pix/WhatsApp) só conta como cliente de verdade depois que o admin confirma que o
-- dinheiro chegou. Sem essa data, o acesso vale (o site fica no ar), mas não entra no contador de
-- clientes ativos do /admin (meta de 10 para subir os preços). Só o servidor lê e escreve.

alter table public.access_grants
  add column if not exists payment_confirmed_at timestamptz;
