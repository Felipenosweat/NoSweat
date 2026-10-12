import type { SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { MapPinIcon } from "../components/icons";
import { Container, SectionHeading, type SectionHeadingProps } from "../components/primitives";

export type ContactProps = {
  data: SectionOf<"contact">;
  id?: string;
  heading?: SectionHeadingProps;
  /** Slot com os dados de contato do negócio, montado pelo template. */
  details?: ReactNode;
  submitLabel?: string;
};

const DEFAULT_HEADING: SectionHeadingProps = {
  eyebrow: "Contact",
  title: "Get in touch",
  align: "left",
};

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-ns-border bg-ns-background px-4 py-3 text-base text-ns-text placeholder:text-ns-muted/70 focus:border-ns-primary focus:ring-2 focus:ring-ns-primary/20 focus:outline-none";

export function Contact({
  data,
  id,
  heading = DEFAULT_HEADING,
  details,
  submitLabel = "Send message",
}: ContactProps) {
  return (
    <section id={id} className="scroll-mt-24 bg-ns-surface py-16 sm:py-24">
      <Container className={`grid gap-10 ${data.showForm ? "lg:grid-cols-2" : ""}`}>
        <div className="flex flex-col gap-8">
          <SectionHeading {...heading} />
          {details}
          {data.showMap && <MapPlaceholder />}
        </div>

        {data.showForm && (
          // TODO: enviar o formulário pela API (ex.: POST /api/sites/[id]/leads). Por enquanto é só visual.
          <form className="rounded-2xl border border-ns-border bg-ns-background p-6 shadow-sm sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-2">
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium">
                Phone
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 555-0100"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium sm:col-span-2">
                How can we help?
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Tell us a little about what you need..."
                  className={inputClass}
                />
              </label>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-ns-primary px-6 py-4 text-base font-semibold text-ns-on-primary shadow-lg shadow-ns-primary/25 transition hover:brightness-110"
            >
              {submitLabel}
            </button>
            <p className="mt-3 text-center text-sm text-ns-muted">
              We&rsquo;ll get back to you soon.
            </p>
          </form>
        )}
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
