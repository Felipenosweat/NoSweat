import type { TemplateId } from "@nosweat/schema";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteRecord } from "@/server/store";
import { DeleteSiteButton } from "./DeleteSiteButton";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const TEMPLATE_LABELS: Record<TemplateId, string> = {
  "home-services": "Home services",
  beauty: "Beauty",
  restaurant: "Restaurant",
  professional: "Professional",
  portfolio: "Portfolio",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const STEPS = [
  { title: "Describe", caption: "Tell us what you do and where." },
  {
    title: "Review & edit",
    caption: "Change text, services, colors and fonts in a live preview.",
  },
  { title: "Publish", caption: "Go live at nosweatfd.com/s/your-business or your own domain." },
];

/** Estado vazio padrão do painel do cliente: convite para criar o primeiro site. */
function DefaultEmptyState() {
  return (
    <section
      aria-labelledby="empty-heading"
      className="mt-8 gap-8 rounded-2xl border border-slate-200 bg-white p-6 lg:grid lg:grid-cols-12 lg:p-10"
    >
      <div className="lg:col-span-6">
        <h2
          id="empty-heading"
          className="font-display text-2xl leading-tight font-bold tracking-[-0.02em] text-ink"
        >
          Create your first website
        </h2>
        <p className="mt-3 max-w-[48ch] text-base leading-[1.65] text-slate-600">
          Describe your business in a few sentences and we&rsquo;ll build a first draft in seconds.
        </p>
        <Link
          href="/create"
          className={`mt-6 inline-flex h-12 items-center rounded-lg bg-brand px-6 font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px ${focusRing}`}
        >
          Build my website
        </Link>
      </div>
      <ol className="mt-8 space-y-5 border-t border-slate-200 pt-6 lg:col-span-6 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="font-display text-sm leading-5 font-semibold text-brand tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm leading-5 font-semibold text-ink">{step.title}</p>
              <p className="mt-0.5 text-[13px] leading-normal text-slate-500">{step.caption}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Endereço do site no card: domínio próprio, endereço grátis ou situação atual. */
function siteAddress(site: SiteRecord): { text: string; muted: boolean } {
  if (site.customDomain) return { text: site.customDomain, muted: false };
  if (site.slug) return { text: `nosweatfd.com/s/${site.slug}`, muted: false };
  if (site.status === "published") return { text: "Published", muted: false };
  return { text: "Not published yet", muted: true };
}

/** Lista de sites de um cliente (painel do cliente e "ver como cliente" do admin). */
export function SitesGrid({ sites, emptyState }: { sites: SiteRecord[]; emptyState?: ReactNode }) {
  if (sites.length === 0) return emptyState ?? <DefaultEmptyState />;

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => {
        const { business, theme, template } = site.spec;
        const where = [business.city, business.state].filter(Boolean).join(", ");
        const live = site.status === "published";
        const address = siteAddress(site);
        return (
          <li
            key={site.id}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300"
          >
            <Link href={`/sites/${site.id}`} className={`flex flex-1 flex-col ${focusRing}`}>
              <div className="flex h-1.5" aria-hidden="true">
                {[theme.primary, theme.secondary, theme.background].map((color, index) => (
                  <span key={index} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 font-display text-lg font-semibold tracking-[-0.01em] break-words text-ink">
                    {business.name}
                  </h2>
                  {live ? (
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600" />
                      Live
                    </span>
                  ) : (
                    <span className="mt-0.5 shrink-0 rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      Draft
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {[TEMPLATE_LABELS[template], where].filter(Boolean).join(" · ")}
                </p>
                <p
                  className={`mt-3 truncate text-sm font-medium ${
                    address.muted ? "text-slate-500" : "text-ink"
                  }`}
                >
                  {address.text}
                </p>
              </div>
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-[13px]">
              <span className="text-slate-500">
                Updated {dateFormat.format(new Date(site.updatedAt))}
              </span>
              <span className="flex items-center gap-4">
                <DeleteSiteButton siteId={site.id} siteName={business.name} compact />
                <Link
                  href={`/sites/${site.id}`}
                  className={`font-semibold whitespace-nowrap text-brand ${focusRing}`}
                >
                  {live ? "Manage site" : "Finish and publish"} <span aria-hidden="true">→</span>
                </Link>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
