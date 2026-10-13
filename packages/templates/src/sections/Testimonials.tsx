import type { SectionOf } from "@nosweat/schema";
import {
  Container,
  SectionHeading,
  initials,
  type SectionHeadingProps,
} from "../components/primitives";

export type TestimonialsProps = {
  data: SectionOf<"testimonials">;
  id?: string;
  heading?: SectionHeadingProps;
};

const DEFAULT_HEADING: SectionHeadingProps = {
  eyebrow: "Reviews",
  title: "What our customers say",
};

export function Testimonials({ data, id, heading = DEFAULT_HEADING }: TestimonialsProps) {
  if (data.items.length === 0) return null;
  return (
    <section id={id} className="scroll-mt-24 bg-ns-surface py-16 sm:py-24">
      <Container>
        <SectionHeading {...heading} />
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, index) => (
            <li
              key={`${item.author}-${index}`}
              className="rounded-2xl border border-ns-border bg-ns-background p-6 shadow-sm"
            >
              <figure className="flex h-full flex-col">
                <blockquote className="mt-4 flex-1 leading-relaxed text-pretty">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ns-primary text-sm font-semibold text-ns-on-primary">
                    {initials(item.author)}
                  </span>
                  <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                    {item.author}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
