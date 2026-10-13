-- Rascunho x publicado + histórico de versões.
-- sites.spec           = rascunho (o editor e a IA mexem aqui)
-- sites.published_spec = o que está no ar (copiado do rascunho ao publicar)
-- site_versions        = cada salvamento vira uma versão (permite voltar atrás)

alter table public.sites
  add column if not exists published_spec jsonb;

create table if not exists public.site_versions (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  spec        jsonb not null,
  source      text not null check (source in ('generate', 'edit', 'ai_edit', 'restore', 'initial')),
  created_at  timestamptz not null default now()
);

create index if not exists site_versions_site_id_created_at_idx
  on public.site_versions (site_id, created_at desc);

alter table public.site_versions enable row level security;

-- Sites que já estavam no ar continuam iguais.
update public.sites set published_spec = spec
  where status = 'published' and published_spec is null;

-- Cada site existente ganha uma primeira versão.
insert into public.site_versions (site_id, spec, source)
  select s.id, s.spec, 'initial' from public.sites s
  where not exists (select 1 from public.site_versions v where v.site_id = s.id);
