-- Lembretes por texto: consentimento do cliente e bloqueio por STOP.
-- NÃO há envio automático de SMS (isso exige provedor e registro A2P 10DLC): o dono manda os
-- textos do próprio celular, e estas colunas provam o consentimento e impedem lembretes para quem
-- respondeu STOP. Tudo opcional: marcações e clientes antigos continuam valendo.
-- Mesma postura de segurança das tabelas: RLS ligado e sem políticas (só o servidor lê e escreve).

-- Marcação: quando o cliente marcou a caixa (opcional) e o aviso exato que ele viu.
alter table public.bookings
  add column if not exists sms_consent_at   timestamptz,
  add column if not exists sms_consent_text text;

-- Cliente (CRM): respondeu STOP, e quando.
alter table public.clients
  add column if not exists sms_opt_out    boolean not null default false,
  add column if not exists sms_opt_out_at timestamptz;

alter table public.bookings enable row level security;
alter table public.clients enable row level security;
