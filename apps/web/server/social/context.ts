import type { SiteImage, SiteSpec } from "@nosweat/schema";
import { liveSpec } from "../sites";
import { getSiteStore, type SiteRecord } from "../store";

// Contexto do negócio para a IA montar os posts. Só LÊ o site do dono (nunca altera).

export type BusinessContext = {
  siteId: string;
  businessName: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  services: string[];
  /** Fatos confirmados pelo dono (regra 8): a única fonte de selos, garantias e ofertas. */
  highlights: string[];
  serviceArea: string | null;
  /** Fotos do PRÓPRIO dono (upload). Fotos de banco de imagens nunca entram (ver ownerPhoto). */
  photos: { url: string; alt: string }[];
};

/** Fotos no máximo (cada uma vira um índice no pedido à IA). */
const MAX_PHOTOS = 12;

/** Buckets do Supabase Storage onde ficam as fotos enviadas pelo dono. */
const OWNER_BUCKETS = /\/storage\/v1\/object\/public\/(site-images|social-media)\//;

function supabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * `true` só para foto enviada pelo dono e hospedada no nosso Storage. Fotos de banco de imagens
 * (Pexels, Unsplash, `kind: "scene"`) e de outros endereços ficam de fora: post com foto de banco
 * pareceria "nosso trabalho" (regra 8). Sem foto, o dono escolhe uma antes de aprovar.
 */
export function isOwnerPhotoUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || !OWNER_BUCKETS.test(parsed.pathname)) return false;
  const host = supabaseHost();
  return host ? parsed.host === host : parsed.host.endsWith(".supabase.co");
}

function ownerPhoto(image: SiteImage | undefined): image is SiteImage {
  return (
    image !== undefined &&
    image.source === "upload" &&
    image.kind === "owner" &&
    isOwnerPhotoUrl(image.url)
  );
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Monta o contexto a partir de um SiteSpec (exportado para testes). */
export function contextFromSpec(siteId: string, spec: SiteSpec): BusinessContext {
  const services: string[] = [];
  const photos: { url: string; alt: string }[] = [];
  const seen = new Set<string>();
  const addPhoto = (image: SiteImage | undefined) => {
    if (!ownerPhoto(image) || seen.has(image.url) || photos.length >= MAX_PHOTOS) return;
    seen.add(image.url);
    photos.push({ url: image.url, alt: image.alt });
  };

  for (const section of spec.sections) {
    if (section.type === "services") {
      for (const item of section.items) {
        const name = item.name.trim();
        if (name && !services.includes(name)) services.push(name);
      }
    } else if (section.type === "hero") {
      addPhoto(section.image);
    } else if (section.type === "gallery") {
      for (const image of section.images) addPhoto(image);
    }
  }

  const business = spec.business;
  return {
    siteId,
    businessName: business.name.trim(),
    city: clean(business.city),
    state: clean(business.state),
    phone: clean(business.phone),
    services,
    highlights: (business.highlights ?? []).map((h) => h.trim()).filter(Boolean),
    serviceArea: clean(business.serviceArea),
    photos,
  };
}

/**
 * Contexto do negócio do dono: o site escolhido (`siteId`, se for dele), senão o mais recente.
 * Usa o que está no ar (`liveSpec`), ou o rascunho se nunca foi publicado.
 * `null` se o dono não tem nenhum site.
 */
export async function buildBusinessContext(
  ownerId: string,
  siteId?: string | null,
): Promise<BusinessContext | null> {
  const store = getSiteStore();
  let site: SiteRecord | null = null;
  if (siteId) {
    const chosen = await store.get(siteId);
    if (chosen && chosen.ownerId === ownerId) site = chosen;
  }
  if (!site) {
    // list() já vem do mais recente para o mais antigo.
    const sites = await store.list(ownerId);
    site = sites.find((s) => s.ownerId === ownerId) ?? null;
  }
  if (!site) return null;
  return contextFromSpec(site.id, liveSpec(site));
}
