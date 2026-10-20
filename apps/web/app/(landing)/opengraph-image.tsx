import { renderOgImage } from "@/lib/og-image";

// Imagem de compartilhamento da landing (1200×630); o desenho está em lib/og-image.tsx.
// Fica em (landing) e não na raiz do app para não virar a imagem padrão dos sites
// publicados dos clientes (/s/…, domínio próprio), que têm a própria foto.
// alt/size/contentType declarados aqui literalmente (convenção de arquivo do Next).

export const alt = "No Sweat: describe your business, get a website. nosweatfd.com/s/your-business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}
