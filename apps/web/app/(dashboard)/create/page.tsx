import type { Metadata } from "next";
import { CreateForm } from "./CreateForm";

export const metadata: Metadata = { title: "Create your website" };

// O que a IA realmente gera a partir da descrição (só capacidades verificadas).
const OUTPUTS = [
  {
    label: "Industry template",
    caption: "One of five: home services, beauty, restaurant, professional or portfolio.",
  },
  { label: "Headline and intro", caption: "Written from your description." },
  { label: "Services", caption: "Listed with short descriptions." },
  { label: "FAQ", caption: "Common customer questions, answered." },
  { label: "Colors and fonts", caption: "Picked to fit your business." },
];

export default function CreatePage() {
  return (
    <div className="max-w-2xl lg:grid lg:max-w-none lg:grid-cols-12 lg:gap-x-8">
      <div className="lg:col-span-7">
        <h1 className="font-display text-3xl font-bold tracking-[-0.025em] text-balance text-ink lg:text-[2.5rem] lg:leading-tight">
          Tell us about your business
        </h1>
        <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600">
          Write it like you&rsquo;d explain it to a new customer. A few sentences is plenty.
        </p>
      </div>

      <div className="mt-8 lg:col-span-7 lg:row-start-2">
        <CreateForm />
      </div>

      <aside
        aria-labelledby="outputs-heading"
        className="mt-10 self-start rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-8 lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:mt-8 lg:p-8"
      >
        <h2
          id="outputs-heading"
          className="font-display text-lg font-semibold tracking-[-0.01em] text-ink lg:text-xl"
        >
          What we&rsquo;ll make from this
        </h2>
        <dl className="mt-3 divide-y divide-slate-200">
          {OUTPUTS.map((item) => (
            <div key={item.label} className="py-3">
              <dt className="text-sm font-semibold text-ink">{item.label}</dt>
              <dd className="mt-0.5 text-[13px] leading-normal text-slate-500">{item.caption}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 border-t border-slate-200 pt-4 text-sm leading-relaxed text-pretty text-slate-600">
          Next: a private preview only you can see. You can edit your text, colors and sections
          before publishing.
        </p>
      </aside>
    </div>
  );
}
