import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteActionsMenu } from "@/app/sites/[id]/SiteActionsMenu";
import { GlassBadge, GlassButton } from "@/components/glass";
import { getPhoto } from "@/components/photos";
import { hasUnpublishedChanges, liveSpec } from "@/server/sites";
import type { SiteRecord } from "@/server/store";
import { cardClass, focusRing, primaryButton } from "./DashboardUi";
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
        <ol className="border-t border-(--glass-rim) p-6 sm:p-10 lg:col-span-6 lg:border-t-0 lg:border-l lg:p-12">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 py-3 first:pt-0 last:pb-0">
              <span className="font-display text-[15px] leading-6 font-semibold text-slate-500 tabular-nums">
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

/** Endereço público relativo ou do domínio do cliente (para "Share link" e "View site"). */
function viewHref(site: SiteRecord): string | null {
  if (site.status !== "published") return null;
  if (site.customDomain) return `https://${site.customDomain}`;
  return site.slug ? `/s/${site.slug}` : null;
}

function leadsLabel(count: number): string {
  if (count === 0) return "No requests yet";
  return `${count} request${count === 1 ? "" : "s"}`;
}

/** Lista de sites do dono na página inicial do painel. */
export function SitesGrid({
  sites,
  emptyState,
  leadCounts,
  headingLevel = 2,
  offline = false,
}: {
  sites: SiteRecord[];
  emptyState?: ReactNode;
  /** Pedidos de contato por site (id → quantidade). Sem isto, a linha não aparece. */
  leadCounts?: Record<string, number>;
  /** Nível do título de cada card (3 quando a lista fica sob um título "Your sites"). */
  headingLevel?: 2 | 3;
  /**
   * O plano do dono acabou (planos valendo): os sites publicados mostram "temporarily
   * unavailable" aos visitantes, então o selo diz "Offline" em vez de "Live".
   */
  offline?: boolean;
}) {
  if (sites.length === 0) return emptyState ?? <DefaultEmptyState />;
  const CardHeading = headingLevel === 3 ? "h3" : "h2";

  // Cartão de vidro: miniatura grande do site no topo; embaixo o nome, o selo de status, a linha
  // de apoio, "Edit" e o menu "⋯" (Edit, Preview, Manage, Share link, Delete). O nome é um link
  // "esticado": o cartão inteiro abre a página do site.
  return (
    <ul className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
      {sites.map((site) => {
        const { business } = site.spec;
        const where = [business.city, business.state].filter(Boolean).join(", ");
        const live = site.status === "published";
        const href = viewHref(site);
        const leads = leadCounts?.[site.id];
        const pending = live && hasUnpublishedChanges(site);
        return (
          <li key={site.id}>
            <article
              className={`group relative flex h-full flex-col overflow-hidden ${cardClass} glass-interactive motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:glass-raised`}
            >
              <div className="relative m-2 mb-0 overflow-hidden rounded-xl ring-1 ring-(--glass-rim)">
                <div className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.015]">
                  <SiteThumb spec={liveSpec(site)} />
                </div>
                <span className="absolute top-2.5 left-2.5">
                  <GlassBadge tone={live ? (offline ? "pending" : "live") : "draft"}>
                    {live ? (offline ? "Offline" : "Live") : "Draft"}
                  </GlassBadge>
                </span>
              </div>
              <div className="flex flex-1 flex-col px-4 pt-3.5 pb-3 sm:px-5">
                <CardHeading className="line-clamp-2 font-display text-lg leading-6 font-semibold tracking-[-0.012em] break-words text-ink">
                  <Link
                    href={`/sites/${site.id}`}
                    className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand"
                  >
                    {business.name}
                  </Link>
                </CardHeading>
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] leading-5 text-slate-500 tabular-nums">
                  {where && (
                    <>
                      <span>{where}</span>
                      <span aria-hidden="true">·</span>
                    </>
                  )}
                  <span>Updated {dateFormat.format(new Date(site.updatedAt))}</span>
                </p>
                {(leads !== undefined || pending) && (
                  <p className="mt-1 flex flex-wrap gap-x-2 text-[13px] leading-5 text-slate-500">
                    {leads !== undefined && (
                      <span className={leads > 0 ? "font-semibold text-ink" : undefined}>
                        {leadsLabel(leads)}
                      </span>
                    )}
                    {leads !== undefined && pending && <span aria-hidden="true">·</span>}
                    {pending && <span className="text-amber-800">Unpublished changes</span>}
                  </p>
                )}
                {/* Ações acima do link esticado (z-10) para continuarem clicáveis. */}
                <div className="relative z-10 mt-auto flex items-center gap-2 pt-3">
                  <GlassButton href={`/sites/${site.id}/edit`} variant="secondary">
                    Edit
                    <span className="sr-only"> {business.name}</span>
                  </GlassButton>
                  <span className="ml-auto">
                    <SiteActionsMenu
                      siteId={site.id}
                      siteName={business.name}
                      liveUrl={href}
                      place="card"
                      hasPendingChanges={pending}
                    />
                  </span>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
