import type { SectionOf } from "@nosweat/schema";
import { ChevronDownIcon } from "../components/icons";
import { Container, SectionHeading, type SectionHeadingProps } from "../components/primitives";

export type FaqProps = {
  data: SectionOf<"faq">;
  id?: string;
  heading?: SectionHeadingProps;
};

const DEFAULT_HEADING: SectionHeadingProps = {
  eyebrow: "FAQ",
  title: "Frequently asked questions",
};

/** Acordeão com <details>, sem JavaScript no cliente. */
export function Faq({ data, id, heading = DEFAULT_HEADING }: FaqProps) {
  if (data.items.length === 0) return null;
  return (
    <section id={id} className="scroll-mt-24 bg-ns-background py-16 @min-[40rem]:py-24">
      <Container size="narrow">
        <SectionHeading {...heading} />
        <div className="mt-10 divide-y divide-ns-border rounded-2xl border border-ns-border bg-ns-background">
          {data.items.map((item, index) => (
            <details
              key={`${item.q}-${index}`}
              className="group px-5 @min-[40rem]:px-6"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDownIcon className="size-5 shrink-0 text-ns-primary transition group-open:rotate-180" />
              </summary>
              <p className="pb-5 leading-relaxed text-ns-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
