-- Formulário de marcação v2: nome e sobrenome separados, país do telefone e a prova do aceite da
-- política de privacidade e da política de cancelamento (data + o texto que o cliente viu).
-- Tudo opcional (nulo): marcações antigas e o formato antigo do pedido continuam valendo.
-- A função `book_slot` (0027) NÃO muda: o servidor grava estas colunas num UPDATE logo depois dela.
-- Mesma postura de segurança de `bookings`: RLS ligado e sem políticas (só o servidor lê e escreve).

alter table public.bookings
  add column if not exists customer_first_name         text,
  add column if not exists customer_last_name          text,
  add column if not exists customer_phone_country      text
    check (customer_phone_country is null or char_length(customer_phone_country) = 2),
  add column if not exists privacy_accepted_at         timestamptz,
  add column if not exists cancellation_accepted_at    timestamptz,
  add column if not exists cancellation_policy_snapshot text;

alter table public.bookings enable row level security;
