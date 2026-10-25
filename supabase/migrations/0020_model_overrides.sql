-- Estúdio de modelos (/admin/models): o fundador revisa, edita e aprova os sites-modelo que a
-- geração "a partir do modelo" usa (apps/web/server/ai/models.ts). Cada linha é:
-- - a versão editada de um modelo do código (packages/fixtures; mesmo slug), ou
-- - um modelo novo criado no estúdio (slug que não existe no código).
-- Só linhas com status 'approved' entram na geração (apps/web/server/models).
-- Só o servidor (service role) lê e escreve: RLS ligado e sem políticas.

create table if not exists public.model_sites (
  slug        text primary key
                check (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
  spec        jsonb not null,
  status      text not null default 'draft' check (status in ('draft', 'approved')),
  -- Categoria (template) do modelo: 'home-services', 'beauty', 'restaurant', 'professional'
  -- ou 'portfolio'. Para modelos do código, a mesma do código.
  category    text check (
                category is null
                or category in ('home-services', 'beauty', 'restaurant', 'professional', 'portfolio')
              ),
  -- Palavras do ramo; null = as do código (modelos do código) ou nenhuma (modelos novos).
  keywords    text[],
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

alter table public.model_sites enable row level security;
