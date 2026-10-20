// Busca fotos grátis para os sites-modelo (roda no GitHub Actions, ver fetch-photos.yml).
// Para cada modelo de qa/photo-queries.json: busca no Unsplash (licença Unsplash, uso comercial
// grátis; fotos "Unsplash+" pagas ficam de fora), baixa em 1600px, converte para webp e monta uma
// folha de contato numerada para escolher. Sem Unsplash, tenta o Openverse (só licenças que
// permitem uso comercial). Tudo vai para OUT_DIR com um manifest.json (crédito de cada foto).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const OUT = process.env.OUT_DIR ?? "out";
const PER_QUERY = 4;
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const queries = JSON.parse(await readFile(new URL("./photo-queries.json", import.meta.url), "utf8"));

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function searchUnsplash(query) {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`;
  const json = await getJson(url);
  return (json.results ?? [])
    .filter((p) => !p.premium && !p.plus && p.urls?.raw)
    .map((p) => ({
      source: "Unsplash",
      id: p.id,
      download: `${p.urls.raw}&w=1600&q=80&fm=jpg&fit=max`,
      page: p.links?.html ?? `https://unsplash.com/photos/${p.id}`,
      photographer: p.user?.name ?? "Unknown",
      license: "Unsplash License",
      alt: p.alt_description ?? p.description ?? query,
    }));
}

async function searchOpenverse(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&page_size=20&mature=false`;
  const json = await getJson(url);
  return (json.results ?? []).map((p) => ({
    source: p.source ?? "Openverse",
    id: p.id,
    download: p.url,
    page: p.foreign_landing_url ?? p.url,
    photographer: p.creator ?? "Unknown",
    license: `${(p.license ?? "").toUpperCase()} ${p.license_version ?? ""}`.trim(),
    alt: p.title ?? query,
  }));
}

async function search(query) {
  try {
    const found = await searchUnsplash(query);
    if (found.length) return found;
  } catch (error) {
    console.warn("unsplash failed", query, String(error));
  }
  try {
    return await searchOpenverse(query);
  } catch (error) {
    console.warn("openverse failed", query, String(error));
    return [];
  }
}

const manifest = {};
for (const [slug, list] of Object.entries(queries)) {
  await mkdir(`${OUT}/${slug}`, { recursive: true });
  const picked = [];
  const seen = new Set();
  for (const query of list) {
    const results = await search(query);
    let taken = 0;
    for (const photo of results) {
      if (taken >= PER_QUERY) break;
      if (seen.has(photo.id)) continue;
      seen.add(photo.id);
      try {
        const res = await fetch(photo.download, { headers: { "User-Agent": UA } });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const n = picked.length + 1;
        const img = sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true });
        const info = await img.webp({ quality: 78 }).toFile(`${OUT}/${slug}/${n}.webp`);
        picked.push({ n, query, ...photo, width: info.width, height: info.height });
        taken += 1;
      } catch (error) {
        console.warn("download failed", photo.download, String(error));
      }
    }
  }
  manifest[slug] = picked;

  // Folha de contato: 4 colunas, miniaturas 400x267 com o número no canto.
  if (picked.length) {
    const cols = 4;
    const w = 400;
    const h = 267;
    const rows = Math.ceil(picked.length / cols);
    const tiles = await Promise.all(
      picked.map(async (p, i) => {
        const thumb = await sharp(`${OUT}/${slug}/${p.n}.webp`)
          .resize(w, h, { fit: "cover" })
          .composite([
            {
              input: Buffer.from(
                `<svg width="${w}" height="${h}"><rect x="0" y="0" width="56" height="40" fill="black"/><text x="10" y="30" font-size="28" font-family="sans-serif" fill="white">${p.n}</text></svg>`,
              ),
            },
          ])
          .png()
          .toBuffer();
        return { input: thumb, left: (i % cols) * w, top: Math.floor(i / cols) * h };
      }),
    );
    await sharp({
      create: { width: cols * w, height: rows * h, channels: 3, background: "#ffffff" },
    })
      .composite(tiles)
      .jpeg({ quality: 70 })
      .toFile(`${OUT}/${slug}/sheet.jpg`);
  }
  console.log(slug, picked.length);
}
await writeFile(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
