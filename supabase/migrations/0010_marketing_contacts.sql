-- Lista de e-mails de lançamento/novidades (marketing). Quem marcou a caixa no cadastro entra
-- aqui; o e-mail de boas-vindas sai uma vez só (welcome_sent_at). Sair da lista grava
-- unsubscribed_at e a pessoa não recebe mais nada de marketing (regra do CAN-SPAM).
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

create table if not exists public.marketing_contacts (
  email            text primary key check (email = lower(email)),
  user_id          uuid references auth.users (id) on delete set null,
  first_name       text,
  source           text not null default 'signup',
  consented_at     timestamptz not null default now(),
  welcome_sent_at  timestamptz,
  unsubscribed_at  timestamptz
);

create index if not exists marketing_contacts_user_id_idx
  on public.marketing_contacts (user_id);

alter table public.marketing_contacts enable row level security;
