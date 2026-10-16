import Image from "next/image";
import { getPhoto, type PhotoKey } from "@/components/photos";

// Fundo fotográfico de tela cheia da landing (hero, cenas do tour, CTA final): a foto do ofício
// escurecida com ink, uma luz da marca em degradê radial e o grão. Sempre decorativo
// (aria-hidden, alt vazio). As fotos vêm de components/photos.ts e já têm crédito em /credits.
// Foto ausente no catálogo = só o ink com a luz (o layout não muda).

/** Luz da marca + grão por cima da foto (as classes ficam no landing.css). */
export function BackdropShade({ side = "left" }: { side?: "left" | "even" }) {
  // "left": no computador a sombra é mais forte à esquerda, onde fica o texto.
  return (
    <>
      <div className={`lp-shade ${side === "left" ? "lp-shade-left" : ""} absolute inset-0`} />
      <div className="lp-glow absolute inset-0" />
      <div className="lp-grain absolute inset-0" />
    </>
  );
}

/** Uma foto em tela cheia (object-cover no ponto de foco do catálogo). */
export function BackdropPhoto({
  photo,
  priority = false,
  className = "",
}: {
  photo: PhotoKey;
  priority?: boolean;
  className?: string;
}) {
  const data = getPhoto(photo);
  if (!data) return null;
  return (
    <Image
      src={data.src}
      alt=""
      fill
      sizes="100vw"
      quality={60}
      priority={priority}
      className={`object-cover ${className}`}
      style={{ objectPosition: data.focus }}
    />
  );
}
