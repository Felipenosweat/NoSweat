import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getPhoto } from "@/components/photos";
import { liveSpec } from "@/server/sites";
import type { SiteRecord } from "@/server/store";
import {
  StatusBadge,
  cardClass,
  cardShadow,
  focusRing,
  primaryButton,
  secondaryButton,
  textButton,
} from "./DashboardUi";
import { DeleteSiteButton } from "./DeleteSiteButton";
import { SiteThumb } from "./SiteThumb";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const STEPS = [
  { title: "Describe", caption: "Tell us what you do and where you work." },
  { title: "Review and edit", caption: "Change text, photos, colors and fonts in a live preview." },
  { title: "Publish", caption: "Go live at nosweatfd.com/s/your-business or your own domain." },
];

/** Estado vazio padrão do painel do cliente: convite para criar o primeiro site. */
function DefaultEmptyState() {
  const photo = getPhoto("cleaner");
  return (
    <section
      aria-labelledby="empty-heading"
      className={`mt-8 overflow-hidden lg:grid lg:grid-cols-12 ${cardClass}`}
    >
      <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-6 lg:p-12">
        <h2
          id="empty-heading"
          className="max-w-[18ch] font-display text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink lg:text-[2rem]"
        >
          Your first site takes about a minute.
        </h2>
        <p className="mt-3 max-w-[44ch] text-base leading-[1.65] text-slate-600">
          Describe your business in a sentence or two. We&rsquo;ll write the pages, pick the colors
          and set up a contact form. You can change anything before it goes live.
        </p>
        <div className="mt-6">
          <Link href="/create" className={`${primaryButton} min-h-12 px-6 sm:min-h-12`}>
            Build my website
          </Link>
        </div>
      </div>

      {photo ? (
        <figure className="p-4 pt-0 sm:p-6 sm:pt-0 lg:col-span-6 lg:p-6 lg:pl-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-slate-900/5">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
              style={{ objectPosition: photo.focus }}
            />
          </div>
          <figcaption className="mt-2 text-xs text-slate-500">
            Photo:{" "}
            <a
              href={photo.credit.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500 ${focusRing}`}
            >
              {photo.credit.name}
            </a>{" "}
            / {photo.credit.source} ({photo.credit.license})
          </figcaption>
        </figure>
      ) : (
        <ol className="border-t border-slate-200/70 bg-surface p-6 sm:p-10 lg:col-span-6 lg:border-t-0 lg:border-l lg:p-12">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 py-3 first:pt-0 last:pb-0">
              <span className="font-display text-[15px] leading-6 font-semibold text-slate-400 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-[15px] leading-6 font-semibold text-ink">{step.title}</p>
                <p className="mt-0.5 text-[13px] leading-normal text-slate-500">{step.caption}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Endereço público relativo ou do domínio do cliente (para "View site"). */
function viewHref(site: SiteRecord): string | null {
  if (site.status !== "published") return null;
  if (site.customDomain) return `https://${site.customDomain}`;
  return site.slug ? `/s/${site.slug}` : null;
}

function leadsLabel(count: number): string {
  if (count === 0) return "No requests yet";
  return `${count} request${count === 1 ? "" : "s"}`;
}

/** Lista de sites de um cliente (painel do cliente e "ver como cliente" do admin). */
export function SitesGrid({
  sites,
  emptyState,
  leadCounts,
  headingLevel = 2,
}: {
  sites: SiteRecord[];
  emptyState?: ReactNode;
  /** Pedidos de contato por site (id → quantidade). Sem isto, a linha não aparece. */
  leadCounts?: Record<string, number>;
  /** Nível do título de cada card (3 quando a lista fica sob um título "Your sites"). */
  headingLevel?: 2 | 3;
}) {
  if (sites.length === 0) return emptyState ?? <DefaultEmptyState />;
  const CardHeading = headingLevel === 3 ? "h3" : "h2";

  // Cartões como os da App Store: miniatura grande arredondada com sombra leve, e embaixo o nome,
  // o status e as ações. O card inteiro abre as configurações do site (link "esticado").
  return (
    <ul className="mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2">
      {sites.map((site) => {
        const { business } = site.spec;
        const where = [business.city, business.state].filter(Boolean).join(", ");
        const live = site.status === "published";
        const href = viewHref(site);
        const leads = leadCounts?.[site.id];
        return (
          <li key={site.id}>
            <article className="group relative flex h-full flex-col">
              <div
                className={`overflow-hidden rounded-2xl border border-slate-200/70 bg-white ${cardShadow} transition-shadow duration-200 group-hover:shadow-[0_1px_2px_rgb(7_27_51/0.05),0_18px_40px_-18px_rgb(7_27_51/0.25)]`}
              >
                <div className="transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  <SiteThumb spec={liveSpec(site)} />
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardHeading className="line-clamp-2 font-display text-lg leading-6 font-semibold tracking-[-0.012em] break-words text-ink">
                    {/* Link "esticado": o card inteiro abre as configurações do site. */}
                    <Link
                      href={`/sites/${site.id}`}
                      className="after:absolute after:-inset-1.5 after:rounded-[1.25rem] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand"
                    >
                      {business.name}
                    </Link>
                  </CardHeading>
                  {where && <p className="mt-0.5 text-[15px] text-slate-500">{where}</p>}
                </div>
                <StatusBadge tone={live ? "live" : "draft"}>{live ? "Live" : "Draft"}</StatusBadge>
              </div>
              <p className="mt-2 flex flex-wrap gap-x-2 text-[13px] text-slate-500 tabular-nums">
                <span>Updated {dateFormat.format(new Date(site.updatedAt))}</span>
                {leads !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className={leads > 0 ? "font-medium text-ink" : undefined}>
                      {leadsLabel(leads)}
                    </span>
                  </>
                )}
              </p>
              {/* Ações acima do link esticado (z-10) para continuarem clicáveis. */}
              <div className="relative z-10 mt-3 flex items-center gap-2">
                <Link href={`/sites/${site.id}/edit`} className={secondaryButton}>
                  Edit
                </Link>
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className={textButton}>
                    View site<span className="sr-only"> (opens in a new tab)</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link href={`/sites/preview/${site.id}`} className={textButton}>
                    Preview
                  </Link>
                )}
                <span className="ml-auto">
                  <DeleteSiteButton siteId={site.id} siteName={site.spec.business.name} compact />
                </span>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
