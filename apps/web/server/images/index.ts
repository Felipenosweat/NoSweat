// Fotos dos sites: busca em bancos de imagens (Pexels/Unsplash) e limpeza da saída da IA.
export { trackImageChosen, type Orientation } from "./providers";
export { sanitizeAiImages } from "./sanitize";
export {
  clearImageCache,
  hasImageProvider,
  MAX_SERVICE_IMAGES,
  resolveHeroImage,
  resolveServiceImages,
  resolveSiteImages,
  searchImages,
} from "./search";
