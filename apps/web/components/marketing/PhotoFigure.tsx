import Image from "next/image";
import type { Photo } from "@/components/photos";
import { focusRing } from "./styles";

/**
 * Foto documental com crédito embaixo (12px), no formato da licença.
 * Nunca recebe texto por cima, nome de pessoa ou citação: as fotos são ilustrativas.
 */
export function PhotoFigure({
  photo,
  sizes,
  aspect,
  className = "",
}: {
  photo: Photo;
  sizes: string;
  /** Classes de proporção (ex.: "aspect-[4/5] lg:aspect-[3/4]"). */
  aspect: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div
        className={`relative overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/5 ${aspect}`}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: photo.focus }}
        />
      </div>
      <figcaption className="mt-2 text-xs text-slate-500">
        Photo by{" "}
        <a
          href={photo.credit.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-sm underline decoration-slate-300 underline-offset-2 hover:text-ink hover:decoration-slate-500 ${focusRing}`}
        >
          {photo.credit.name}
        </a>{" "}
        on {photo.credit.source}
      </figcaption>
    </figure>
  );
}
