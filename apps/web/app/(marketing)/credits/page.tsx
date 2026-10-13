import { fixtures } from "@nosweat/fixtures";
import type { Metadata } from "next";
import Image from "next/image";
import { container, focusRing, h2Class, leadClass } from "@/components/marketing/styles";
import { allPhotos } from "@/components/photos";

// Créditos das imagens do site da No Sweat (/credits): as fotos documentais (components/photos.ts)
// e as fotos de topo dos sites de exemplo (fixtures). Fica dentro de (marketing) para ter o
// mesmo header e rodapé da landing.

export const metadata: Metadata = {
  title: "Image credits",
  description: "Credits for the photos used on nosweatfd.com and in the example sites.",
  alternates: { canonical: "/credits" },
};

const SOURCE_LABEL: Record<string, string> = {
  unsplash: "Unsplash",
  pexels: "Pexels",
  upload: "Upload",
};

const LICENSE_FOR: Record<string, string> = {
  unsplash: "Unsplash License",
  pexels: "Pexels License",
};

type CreditRow = {
  src: string;
  alt: string;
  name: string;
  url: string;
  source: string;
  license?: string;
  usedOn: string;
};

function exampleCredits(): CreditRow[] {
  return Object.values(fixtures).flatMap((spec) => {
    const hero = spec.sections.find((section) => section.type === "hero");
    const image = hero?.type === "hero" ? hero.image : undefined;
    const credit = image?.credit;
    if (!image || !credit) return [];
    return [
      {
        src: image.url,
        alt: image.alt,
        name: credit.name,
        url: credit.url,
        source: SOURCE_LABEL[image.source] ?? image.source,
        license: LICENSE_FOR[image.source],
        usedOn: `Example site: ${spec.business.name} (fictional)`,
      },
    ];
  });
}

const linkClass = `rounded-sm text-ink underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500 ${focusRing}`;

function CreditList({ rows }: { rows: CreditRow[] }) {
  return (
    <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <li key={row.src}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/5">
            <Image
              src={row.src}
              alt={row.alt}
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Photo by{" "}
            <a href={row.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {row.name}
            </a>{" "}
            on {row.source}
            {row.license ? ` · ${row.license}` : ""}
          </p>
          <p className="mt-1 text-[13px] text-slate-500">{row.usedOn}</p>
        </li>
      ))}
    </ul>
  );
}

export default function CreditsPage() {
  const sitePhotos: CreditRow[] = allPhotos().map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    name: photo.credit.name,
    url: photo.credit.url,
    source: photo.credit.source,
    license: photo.credit.license,
    usedOn: "nosweatfd.com (illustrative photo)",
  }));
  const examplePhotos = exampleCredits();

  return (
    <div className={`${container} py-16 lg:py-24`}>
      <h1 className="max-w-[18ch] font-display text-[2.25rem] leading-[1.05] font-bold tracking-[-0.035em] text-balance text-ink lg:text-5xl">
        Image credits
      </h1>
      <p className={`mt-5 ${leadClass}`}>
        The photos on our site show the kind of work our product is for. They are stock photos used
        under their licenses, not pictures of No Sweat customers.
      </p>

      <section aria-labelledby="site-photos" className="mt-16">
        <h2 id="site-photos" className={h2Class}>
          On nosweatfd.com
        </h2>
        <CreditList rows={sitePhotos} />
      </section>

      {examplePhotos.length > 0 && (
        <section aria-labelledby="example-photos" className="mt-20">
          <h2 id="example-photos" className={h2Class}>
            In the example sites
          </h2>
          <CreditList rows={examplePhotos} />
        </section>
      )}
    </div>
  );
}
