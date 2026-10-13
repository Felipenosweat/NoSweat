import type { SectionOf } from "@nosweat/schema";
import type { ComponentType, SVGProps } from "react";
import { CheckIcon } from "../components/icons";
import { Container, SectionHeading, type SectionHeadingProps } from "../components/primitives";

export type ServicesProps = {
  data: SectionOf<"services">;
  id?: string;
  heading?: SectionHeadingProps;
  /** Ícones usados em rodízio nos cards. */
  icons?: ComponentType<SVGProps<SVGSVGElement>>[];
};

const DEFAULT_HEADING: SectionHeadingProps = {
  eyebrow: "Services",
  title: "How we can help",
};

export function Services({
  data,
  id,
  heading = DEFAULT_HEADING,
  icons = [CheckIcon],
}: ServicesProps) {
  if (data.items.length === 0) return null;
  // Com 1, 2 ou 4 serviços, 3 colunas deixariam uma linha órfã: fica em 2 colunas.
  const threeColumns = ![1, 2, 4].includes(data.items.length);
  return (
    <section id={id} className="scroll-mt-24 bg-ns-background py-16 @min-[40rem]:py-24">
      <Container>
        <SectionHeading {...heading} />
        <ul
          className={`mt-12 grid gap-5 @min-[40rem]:grid-cols-2 ${threeColumns ? "@5xl:grid-cols-3" : ""}`}
        >
          {data.items.map((item, index) => {
            const ItemIcon = icons[index % icons.length] ?? CheckIcon;
            return (
              <li
                key={`${item.name}-${index}`}
                className="group rounded-2xl border border-ns-border bg-ns-background p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-ns-primary/40 hover:shadow-lg"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-ns-primary/10 text-ns-primary transition group-hover:bg-ns-primary group-hover:text-ns-on-primary">
                  <ItemIcon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-balance [overflow-wrap:anywhere]">
                  {item.name}
                </h3>
                <p className="mt-2 leading-relaxed text-ns-muted">{item.description}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
