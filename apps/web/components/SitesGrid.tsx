import Link from "next/link";
import type { SiteRecord } from "@/server/store";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/** Lista de sites de um cliente (painel do cliente e "ver como cliente" do admin). */
export function SitesGrid({ sites }: { sites: SiteRecord[] }) {
  return sites.length === 0 ? (
    <div className="mt-10 rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <h2 className="font-display text-xl font-bold">Create your first website</h2>
      <p className="mt-2 text-slate-600">
        Describe your business and we&rsquo;ll build it in seconds.
      </p>
      <Link
        href="/create"
        className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700"
      >
        Get started
      </Link>
    </div>
  ) : (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {sites.map((site) => {
        const { business, theme, template } = site.spec;
        const where = [business.city, business.state].filter(Boolean).join(", ");
        return (
          <li key={site.id}>
            <Link
              href={`/sites/${site.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1" aria-hidden="true">
                  {[theme.primary, theme.secondary, theme.background].map((color, index) => (
                    <span
                      key={index}
                      className="size-4 rounded-full border border-slate-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    site.status === "published"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {site.status === "published" ? "Live" : "Draft"}
                </span>
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">{business.name}</h2>
              <p className="text-sm text-slate-600">
                {[site.customDomain ?? template, where].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Created {dateFormat.format(new Date(site.createdAt))}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
