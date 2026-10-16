import type { ReactNode } from "react";
import { SearchDemo } from "@/components/landing/demos/SearchDemo";
import { ArrowUturnLeftIcon, GlobeIcon, PencilIcon, PhotoIcon } from "@/components/marketing/icons";
import { container } from "@/components/marketing/styles";

// "Also in every plan": quatro linhas (sem cartões) com o que vem junto e não coube no tour.
// Só o que o produto faz hoje.

const ROWS: { icon: ReactNode; title: string; body: string; demo?: ReactNode }[] = [
  {
    icon: <GlobeIcon className="size-6" />,
    title: "Set up for search",
    body: "Every site gets a page title and a description written from your business details, so search results say who you are and where you work. Rankings are up to the search engines.",
    demo: <SearchDemo />,
  },
  {
    icon: <PhotoIcon className="size-6" />,
    title: "Your own photos",
    body: "Upload JPG, PNG or WebP photos and show them in a gallery. Until then, your site starts with a photo picked for your trade, credited to the photographer.",
  },
  {
    icon: <PencilIcon className="size-6" />,
    title: "Colors, fonts and sections you control",
    body: "Change colors, pick from ten font pairings, switch between five layouts, and add, remove or reorder sections, all with a live preview.",
  },
  {
    icon: <ArrowUturnLeftIcon className="size-6" />,
    title: "Go back to any version",
    body: "Every save and every AI edit is kept as a version. Restore an older one as a new draft; nothing goes live until you publish.",
  },
];

export function AlsoIncluded() {
  return (
    <section aria-labelledby="also-title" className="bg-surface pt-8 pb-20 lg:pb-28">
      <div className={container}>
        <h2
          id="also-title"
          className="max-w-[18ch] font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink"
        >
          Also in every plan.
        </h2>
        <ul className="mt-10 border-b border-slate-200 lg:mt-14">
          {ROWS.map((row) => (
            <li
              key={row.title}
              className="grid grid-cols-1 gap-4 border-t border-slate-200 py-8 lg:grid-cols-12 lg:gap-8 lg:py-10"
            >
              <div className="flex items-start gap-4 lg:col-span-4">
                <span className="mt-0.5 shrink-0 text-slate-500">{row.icon}</span>
                <h3 className="font-display text-xl leading-snug font-semibold tracking-[-0.015em] text-ink">
                  {row.title}
                </h3>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                <p className="max-w-[60ch] text-[17px] leading-[1.65] text-pretty text-slate-600">
                  {row.body}
                </p>
                {row.demo && <div className="mt-6">{row.demo}</div>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
