import Image from "next/image";
import { creditsLine } from "./data";

// Parte branca e prática da landing "Showroom": o escritório (captura real do app, com clientes
// inventados) e como o site é feito. Só o que o produto faz hoje (ver CLAUDE.md: Clientes,
// agendamento, orçamentos/faturas, avaliações do Google, calendário do Instagram).

const OFFICE: { term: string; detail: string }[] = [
  {
    term: "Requests and clients",
    detail:
      "Every request from your contact form becomes a client. Move them from New to Won, add notes and log the jobs you did.",
  },
  {
    term: "Online booking",
    detail: "Customers pick an open time from your hours, and the job lands on your schedule.",
  },
  {
    term: "Estimates and invoices",
    detail: "Send an estimate, then turn it into an invoice when the job is done.",
  },
  {
    term: "Google review requests",
    detail: "Ask happy customers for a review by text, email or a QR code.",
  },
  {
    term: "Instagram post calendar",
    detail: "AI drafts posts from your website. Nothing goes out until you approve it.",
  },
];

export function Office() {
  return (
    <section
      id="office"
      aria-labelledby="office-title"
      className="scroll-mt-16 bg-white px-5 pt-20 pb-16 sm:px-8 lg:pt-32 lg:pb-24"
    >
      <div className="mx-auto grid w-full max-w-[1280px] gap-12 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <h2
            id="office-title"
            className="max-w-[16ch] font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-ink lg:text-[3rem]"
          >
            The office comes with the website.
          </h2>
          <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.6] text-pretty text-slate-600">
            When the site brings in a request, you answer it from the same place you edit the site.
          </p>
          <dl className="mt-8 border-t border-slate-200">
            {OFFICE.map((item) => (
              <div key={item.term} className="border-b border-slate-200 py-4">
                <dt className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">
                  {item.term}
                </dt>
                <dd className="mt-1 text-[15px] leading-[1.55] text-pretty text-slate-600">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="lg:col-span-7 lg:pt-2">
          <div className="rounded-xl bg-surface p-3 shadow-[0_1px_2px_rgb(7_27_51/.06),0_16px_40px_-16px_rgb(7_27_51/.18)]">
            <Image
              src="/landing/real/clients-2.webp"
              alt="The Clients screen in No Sweat: five new requests, each with a name, phone number, email and a Reply button."
              width={2400}
              height={1500}
              sizes="(min-width: 1024px) 720px, 100vw"
              className="h-auto w-full rounded-lg"
            />
          </div>
          <figcaption className="mt-3 text-sm text-slate-600">
            Real No Sweat screen. The customers are made up.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function HowItGetsBuilt() {
  return (
    <section aria-labelledby="built-title" className="bg-white px-5 sm:px-8">
      <div className="mx-auto grid w-full max-w-[1280px] gap-6 border-t border-slate-200 py-14 lg:grid-cols-12 lg:gap-x-8 lg:py-20">
        <h2
          id="built-title"
          className="font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-ink lg:col-span-5 lg:text-[3rem]"
        >
          How it gets built
        </h2>
        <div className="lg:col-span-7">
          <p className="max-w-[60ch] text-[17px] leading-[1.6] text-pretty text-slate-600 lg:text-lg">
            You describe the business in a sentence or two and answer a few quick questions. We pick
            a layout that fits your trade and write the headline, services and FAQ from what you
            told us. You check it in a private preview, change anything you like and publish when
            it’s right.
          </p>
          <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.6] text-pretty text-slate-600">
            {creditsLine()}
          </p>
        </div>
      </div>
    </section>
  );
}
