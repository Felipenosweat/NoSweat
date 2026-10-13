import Image from "next/image";
import { container } from "@/components/marketing/styles";
import { getPhoto, type PhotoKey } from "@/components/photos";

// Fotos de quem a gente atende, tratadas em duotone azul (mesma cor da marca): ficam com cara
// de campanha, não de banco de imagens. São ilustrativas: nunca "nossos clientes".
// Crédito de cada foto embaixo dela (e na página /credits).

const REEL: { key: PhotoKey; label: string }[] = [
  { key: "plumber", label: "Plumbers" },
  { key: "crew", label: "Cleaners" },
  { key: "stylist", label: "Salons" },
  { key: "cook", label: "Kitchens" },
  { key: "landscaper", label: "Landscapers" },
];

export function People() {
  const photos = REEL.flatMap(({ key, label }) => {
    const photo = getPhoto(key);
    return photo ? [{ photo, label }] : [];
  });
  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="people-title" className="relative overflow-hidden py-28 lg:py-40">
      <div className={`${container} grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end`}>
        <h2
          id="people-title"
          data-l-reveal
          className="l-display text-[clamp(2.5rem,5.5vw,5rem)] text-white lg:col-span-7"
        >
          For people who’d <span className="l-serif l-gradient-text">rather be working.</span>
        </h2>
        <p
          data-l-reveal="0.1"
          className="text-lg leading-relaxed text-slate-300 lg:col-span-4 lg:col-start-9"
        >
          You’re on a roof, in a kitchen, behind a chair. Describe your business once; your site
          takes calls and quote requests while you work.
        </p>
      </div>

      <ul className="mt-16 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:px-8 lg:mx-auto lg:grid lg:max-w-[1400px] lg:grid-cols-5 lg:overflow-visible lg:px-8 [&::-webkit-scrollbar]:hidden">
        {photos.map(({ photo, label }, i) => (
          <li
            key={photo.src}
            data-l-reveal={i * 0.08}
            className={`w-[72vw] shrink-0 snap-center sm:w-[42vw] lg:w-auto ${i % 2 === 1 ? "lg:mt-16" : ""}`}
          >
            <figure>
              <div
                data-l-parallax={i % 2 ? "0.06" : "0.12"}
                className="l-duotone aspect-[3/4] rounded-3xl"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 260px, 72vw"
                  className="object-cover"
                  style={{ objectPosition: photo.focus }}
                />
                <p className="l-display absolute bottom-4 left-5 z-10 text-4xl text-white uppercase drop-shadow-lg">
                  {label}
                </p>
              </div>
              <figcaption className="mt-3 text-xs text-slate-400">
                Photo:{" "}
                <a
                  href={photo.credit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-slate-600 underline-offset-2 hover:text-slate-300"
                >
                  {photo.credit.name}
                </a>{" "}
                / {photo.credit.source}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
