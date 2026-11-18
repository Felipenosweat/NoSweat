import Image from "next/image";
import { container, frameShadow } from "@/components/marketing/styles";
import { OfficeIndex } from "./OfficeIndex";

// "The office" (#office), a única seção escura (ink) da página: um pedido inventado seguido do
// primeiro toque no site até o pedido de avaliação, em seis capítulos, cada um com uma TELA REAL
// do app (capturas do app rodando com AI_PROVIDER=mock e dados de demonstração da Greenline
// Landscaping, negócio inventado, avisado na legenda). Capturas em public/landing/office
// (2x, 1200px de largura). Sem botão aqui: azul sobre ink não tem contraste.
// No computador, o índice da esquerda fica preso e marca o capítulo da vez (OfficeIndex).

export const OFFICE_CHAPTERS = [
  {
    id: "office-book",
    title: "Someone books a spring cleanup from your site",
    body: "Turn on booking and your live site shows your services and open times. Each booking adds the client and the job to your office.",
    src: "/landing/office/book.webp",
    width: 1200,
    height: 878,
    alt: "The Book a visit section of the Greenline Landscaping site: Spring cleanup, 3 hours for $240, is selected, with open morning and afternoon times and 9:00 AM picked.",
  },
  {
    id: "office-clients",
    title: "It lands in Clients",
    body: "Every booking and contact-form request becomes a client, with a Reply button for email or text.",
    src: "/landing/office/clients.webp",
    width: 1200,
    height: 900,
    alt: "The No Sweat Clients screen: 3 new requests waiting, Dana Whitfield marked Quoted, and Tom Alvarez, Priya Raman and Marcus Bell marked New, each with a Reply button.",
  },
  {
    id: "office-estimate",
    title: "Send the estimate",
    body: "Build it from your price list and send a link. Your client approves it online.",
    src: "/landing/office/estimate.webp",
    width: 1200,
    height: 1009,
    alt: "Estimate #1001 for Dana Whitfield, waiting for approval: a spring cleanup for $240 and 6 cubic yards of mulch for $390, $630 in total.",
  },
  {
    id: "office-schedule",
    title: "It’s on your schedule",
    body: "Online bookings and the jobs you add share one calendar.",
    src: "/landing/office/schedule.webp",
    width: 1200,
    height: 900,
    alt: "The No Sweat Schedule on Friday, November 20: Spring cleanup for Dana Whitfield from 9:00 AM to 12:00 PM and hedge trimming for Tom Alvarez from 1:30 to 3:30 PM.",
  },
  {
    id: "office-invoice",
    title: "Invoice when it’s done",
    body: "Send the invoice as a link and record each payment when it comes in.",
    src: "/landing/office/invoice.webp",
    width: 1200,
    height: 1009,
    alt: "Invoice #1001 for Dana Whitfield, unpaid, due December 2: $630 balance due, with a Record payment button.",
  },
  {
    id: "office-review",
    title: "Ask for a Google review",
    body: "Text or email your review link, or print the QR code for your truck.",
    src: "/landing/office/reviews.webp",
    width: 1200,
    height: 661,
    alt: "The Ask your clients panel: a ready-to-send message for Dana with the Google review link, buttons to copy, text or email it, and a QR code to print.",
  },
] as const;

export function OfficeChapter() {
  return (
    <section
      id="office"
      aria-labelledby="office-title"
      className="scroll-mt-16 bg-ink py-20 text-white lg:py-32"
    >
      <div className={`${container} grid grid-cols-1 lg:grid-cols-12 lg:gap-x-8`}>
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <h2
              id="office-title"
              className="max-w-[20ch] font-display text-[1.75rem] leading-[1.12] font-bold tracking-[-0.03em] text-balance text-white lg:text-[2.75rem] lg:leading-[1.08]"
            >
              The office behind your website.
            </h2>
            <p className="mt-4 max-w-[48ch] text-lg leading-[1.5] text-pretty text-slate-300">
              Requests, estimates, your schedule, invoices and review requests, in the same app as
              your site.
            </p>
            <p className="mt-4 max-w-[48ch] text-[13px] leading-normal text-slate-300">
              Real No Sweat screens. Greenline and its customers are made up.
            </p>
            <OfficeIndex
              chapters={OFFICE_CHAPTERS.map(({ id, title }) => ({ id, title }))}
              className="mt-10 hidden lg:block"
            />
          </div>
        </div>

        <div className="mt-14 lg:col-span-8 lg:mt-0">
          {/* O fio: uma linha vertical liga os números dos capítulos. */}
          <ol className="border-l border-white/15">
            {OFFICE_CHAPTERS.map((chapter, index) => (
              <li
                key={chapter.id}
                id={chapter.id}
                data-office-chapter
                className="scroll-mt-24 pb-16 pl-6 last:pb-12 sm:pl-8 lg:pb-24"
              >
                <p className="text-[13px] font-semibold text-slate-300 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-lg leading-snug font-semibold tracking-[-0.015em] text-white lg:text-xl">
                  {chapter.title}
                </h3>
                <p className="mt-2 max-w-[56ch] text-base leading-[1.65] text-pretty text-slate-300 lg:text-[17px]">
                  {chapter.body}
                </p>
                <div
                  className={`mt-6 overflow-hidden rounded-2xl border border-white/15 bg-white ${frameShadow}`}
                >
                  <Image
                    src={chapter.src}
                    width={chapter.width}
                    height={chapter.height}
                    alt={chapter.alt}
                    sizes="(min-width: 1200px) 760px, (min-width: 1024px) 64vw, 92vw"
                    className="h-auto w-full"
                  />
                </div>
              </li>
            ))}
            {/* Instagram: linha menor, sem captura. Texto honesto sobre a publicação automática. */}
            <li className="pl-6 sm:pl-8">
              <h3 className="font-display text-base leading-snug font-semibold tracking-[-0.015em] text-white lg:text-lg">
                Instagram posts, too
              </h3>
              <p className="mt-2 max-w-[56ch] text-base leading-[1.65] text-pretty text-slate-300">
                Posts are drafted for you to approve. Automatic posting turns on once Instagram
                approves our app.
              </p>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
