-- Fotos enviadas pelos donos dos sites (POST /api/sites/[id]/images).
-- Bucket público para LEITURA (os sites publicados mostram as fotos pela URL pública).
-- Gravação só pelo servidor, com a service role: não há política de insert/update/delete para
-- anon ou authenticated, então o navegador não consegue enviar arquivos direto.
-- Caminho dos arquivos: <site_id>/<aleatório>.<ext>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
