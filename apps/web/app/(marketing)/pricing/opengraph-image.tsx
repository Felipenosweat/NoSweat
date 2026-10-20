import { renderOgImage } from "@/lib/og-image";

// Imagem de compartilhamento de /pricing (o link mais mandado para quem vai comprar): a mesma
// da landing, desenhada em lib/og-image.tsx. Só neste segmento, nunca na raiz do app.
// alt/size/contentType declarados aqui literalmente (convenção de arquivo do Next).

export const alt = "No Sweat: describe your business, get a website. nosweatfd.com/s/your-business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}
