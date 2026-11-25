"use client";

import Image, { type ImageLoaderProps } from "next/image";
import type { CSSProperties } from "react";
import type { LandingPhoto } from "./photos";

// next/image com o loader do próprio Unsplash (hotlink, como pedem as regras deles): o navegador
// recebe o tamanho certo direto de images.unsplash.com, em WebP, com qualidade 75 (fotos nítidas,
// sem cara de comprimidas). Precisa ser componente de cliente
// porque a função `loader` não passa de server component para o next/image.

function unsplashLoader({ src, width, quality }: ImageLoaderProps): string {
  return `${src}?w=${width}&q=${quality ?? 75}&fm=webp&fit=max`;
}

/** Foco por faixa de largura (ver photos.ts); as classes object-[var(--fp…)] leem estas variáveis. */
function focusStyle(photo: LandingPhoto): CSSProperties {
  return {
    "--fp": photo.focus.base,
    "--fp-md": photo.focus.md ?? photo.focus.base,
    "--fp-lg": photo.focus.lg ?? photo.focus.md ?? photo.focus.base,
  } as CSSProperties;
}

const coverClass =
  "object-cover object-[var(--fp)] md:object-[var(--fp-md)] lg:object-[var(--fp-lg)]";

export function UnsplashImage({
  photo,
  sizes,
  priority = false,
  className = "",
}: {
  photo: LandingPhoto;
  /** Obrigatório: cada uso diz quanto da tela a foto ocupa. */
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      loader={unsplashLoader}
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={75}
      style={focusStyle(photo)}
      className={`${coverClass} ${className}`}
    />
  );
}
