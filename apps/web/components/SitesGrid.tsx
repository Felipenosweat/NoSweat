import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getPhoto } from "@/components/photos";
import { liveSpec } from "@/server/sites";
import type { SiteRecord } from "@/server/store";
import { StatusBadge, focusRing, primaryButton, secondaryButton, textButton } from "./DashboardUi";
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
      className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid lg:grid-cols-12"
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-black/5">
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
        <ol className="border-t border-slate-200 bg-surface p-6 sm:p-10 lg:col-span-6 lg:border-t-0 lg:border-l lg:p-12">
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
}: {
  sites: SiteRecord[];
  emptyState?: ReactNode;
  /** Pedidos de contato por site (id → quantidade). Sem isto, a linha não aparece. */
  leadCounts?: Record<string, number>;
}) {
  if (sites.length === 0) return emptyState ?? <DefaultEmptyState />;

  return (
    <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => {
        const { business } = site.spec;
        const where = [business.city, business.state].filter(Boolean).join(", ");
        const live = site.status === "published";
        const href = viewHref(site);
        const leads = leadCounts?.[site.id];
        return (
          <li key={site.id}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300">
              <div className="border-b border-slate-200">
                <SiteThumb spec={liveSpec(site)} />
              </div>
              <div className="flex-1 px-5 pt-4 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 font-display text-[17px] leading-6 font-semibold tracking-[-0.015em] break-words text-ink">
                    {/* Link "esticado": o card inteiro abre as configurações do site. */}
                    <Link
                      href={`/sites/${site.id}`}
                      className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand"
                    >
                      {business.name}
                    </Link>
                  </h2>
                  <StatusBadge tone={live ? "live" : "draft"}>
                    {live ? "Live" : "Draft"}
                  </StatusBadge>
                </div>
                {where && <p className="mt-1 text-sm text-slate-600">{where}</p>}
                <p className="mt-3 flex flex-wrap gap-x-2 text-[13px] text-slate-500 tabular-nums">
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
              </div>
              {/* Ações acima do link esticado (z-10) para continuarem clicáveis. */}
              <div className="relative z-10 flex items-center gap-2 border-t border-slate-200 px-5 py-3">
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
