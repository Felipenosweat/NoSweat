-- Fotos dos posts das redes sociais (POST /api/social/media).
-- Bucket público para LEITURA: o Instagram baixa a foto pela URL pública na hora de publicar.
-- Gravação só pelo servidor, com a service role (sem políticas para anon/authenticated).
-- Só JPEG (o Instagram só aceita JPEG). Caminho: <owner_id>/<aleatório>.jpg.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-media',
  'social-media',
  true,
  8388608, -- 8 MB
  array['image/jpeg']
)
on conflict (id) do nothing;
