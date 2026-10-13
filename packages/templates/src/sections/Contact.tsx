import type { SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { MapPinIcon } from "../components/icons";
import { Container, SectionHeading, type SectionHeadingProps } from "../components/primitives";
import { ContactForm } from "./ContactForm";

export type ContactProps = {
  data: SectionOf<"contact">;
  id?: string;
  heading?: SectionHeadingProps;
  /** Slot com os dados de contato do negócio, montado pelo template. */
  details?: ReactNode;
  submitLabel?: string;
  /** Endpoint do formulário (só nos sites publicados). */
  endpoint?: string;
};

const DEFAULT_HEADING: SectionHeadingProps = {
  eyebrow: "Contact",
  title: "Get in touch",
  align: "left",
};

export function Contact({
  data,
  id,
  heading = DEFAULT_HEADING,
  details,
  submitLabel = "Send message",
  endpoint,
}: ContactProps) {
  return (
    <section id={id} className="scroll-mt-24 bg-ns-surface py-16 @min-[40rem]:py-24">
      <Container className={`grid gap-10 ${data.showForm ? "@5xl:grid-cols-2" : ""}`}>
        <div className="flex flex-col gap-8">
          <SectionHeading {...heading} />
          {details}
          {data.showMap && <MapPlaceholder />}
        </div>

        {data.showForm && <ContactForm endpoint={endpoint} submitLabel={submitLabel} />}
      </Container>
    </section>
  );
}

/** TODO: trocar por um mapa de verdade (ex.: Google Maps Embed) quando houver endereço no SiteSpec. */
function MapPlaceholder() {
  return (
    <div
      className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-ns-border bg-ns-background bg-[radial-gradient(var(--ns-border)_1px,transparent_1px)] [background-size:18px_18px]"
      role="img"
      aria-label="Service area map"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-ns-primary text-ns-on-primary shadow-lg shadow-ns-primary/30">
        <MapPinIcon className="size-7" />
      </span>
    </div>
  );
}
