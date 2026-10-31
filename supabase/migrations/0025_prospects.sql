-- Prospecção (/admin/prospects): pequenas empresas dos EUA achadas no Google Places que não têm
-- site (ou têm um fraco). Para cada uma o admin pode criar um site de PRÉVIA (rascunho dele) e
-- abrir em /p/<preview_token>, e exportar a lista para a ferramenta de e-mail.
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas (como 0012).
--
-- Regras do Google Places: o place_id pode ficar guardado para sempre; o resto que veio do
-- Places (nome, endereço, telefone, site, nota, horário...) é cache de no máximo 30 dias:
-- last_fetched_at marca quando veio, e o servidor busca de novo antes de usar o que passou disso
-- (ver apps/web/server/prospects/service.ts). e-mail e website_* vêm do próprio site da empresa.

create table if not exists public.prospects (
  id               uuid primary key default gen_random_uuid(),
  place_id         text not null unique,
  name             text not null,
  category         text,
  address          text,
  city             text,
  state            text,
  phone            text,
  website          text,
  -- Horário de funcionamento como o Places devolve ("Monday: 8:00 AM – 5:00 PM", ...).
  hours            jsonb,
  website_status   text not null default 'unknown'
                     check (website_status in ('none', 'weak', 'ok', 'unknown')),
  website_notes    text,
  -- E-mail público achado no site da própria empresa (nunca adivinhado).
  email            text,
  rating           numeric,
  review_count     int,
  -- A busca que achou a empresa ("plumber in Austin, TX").
  search           text,
  status           text not null default 'new'
                     check (status in ('new', 'preview_ready', 'contacted', 'replied', 'won', 'lost',
                                       'do_not_contact')),
  site_id          uuid references public.sites (id) on delete set null,
  preview_token    text unique,
  notes            text,
  last_fetched_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists prospects_created_idx on public.prospects (created_at desc);
create index if not exists prospects_status_idx on public.prospects (status);

alter table public.prospects enable row level security;
