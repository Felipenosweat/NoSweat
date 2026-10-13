// Fotos documentais do site da No Sweat (landing, login, painel vazio).
// São ilustrativas: NUNCA apresentar como clientes, depoimentos ou "trabalho de" alguém.
// Cada foto tem licença permissiva e crédito (ver /credits). Arquivos em public/photos/.

export type PhotoKey = "cleaner" | "plumber" | "stylist" | "cook" | "shopOwner" | "landscaper";

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Ponto de foco para object-position (ex.: "50% 30%"). */
  focus: string;
  credit: { name: string; source: string; url: string; license: string };
};

/** Preenchido pela sessão principal com fotos verificadas. Chave ausente = sem foto (o layout se adapta). */
export const PHOTOS: Partial<Record<PhotoKey, Photo>> = {};

export function getPhoto(key: PhotoKey): Photo | undefined {
  return PHOTOS[key];
}

/** Todas as fotos em uso, para a página de créditos. */
export function allPhotos(): Photo[] {
  return Object.values(PHOTOS).filter((p): p is Photo => Boolean(p));
}
