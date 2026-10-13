-- Publicação: endereço grátis (nosweatfd.com/s/<slug>) e domínio próprio do cliente.

alter table public.sites
  add column if not exists slug text unique,
  add column if not exists custom_domain text unique,
  add column if not exists published_at timestamptz;
