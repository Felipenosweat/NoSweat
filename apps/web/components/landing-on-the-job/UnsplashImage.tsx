"use client";

import Image, { type ImageLoaderProps } from "next/image";
import type { CSSProperties } from "react";
import type { LandingPhoto } from "./photos";

// next/image com o loader do próprio Unsplash (hotlink, como pedem as regras deles): o navegador
// recebe o tamanho certo direto de images.unsplash.com, em WebP. Precisa ser componente de cliente
// porque a função `loader` não passa de server component para o next/image.

function unsplashLoader({ src, width, quality }: ImageLoaderProps): string {
  return `${src}?w=${width}&q=${quality ?? 60}&fm=webp&fit=max`;
}

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
  // Foco por faixa de largura (ver photos.ts); as classes object-[var(--fp…)] leem estas variáveis.
  const style = {
    "--fp": photo.focus.base,
    "--fp-md": photo.focus.md ?? photo.focus.base,
    "--fp-lg": photo.focus.lg ?? photo.focus.md ?? photo.focus.base,
  } as CSSProperties;
  return (
    <Image
      loader={unsplashLoader}
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={60}
      style={style}
      className={`object-cover object-[var(--fp)] md:object-[var(--fp-md)] lg:object-[var(--fp-lg)] ${className}`}
    />
  );
}
