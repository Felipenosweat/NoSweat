import { NoSweatBadge } from "@nosweat/templates";
import { Consult } from "@/components/demos/mercer-law/Consult";
import { FAQ, FIRM, HOURS, PEOPLE, STEPS } from "@/components/demos/mercer-law/content";
import { MercerMotion } from "@/components/demos/mercer-law/MercerMotion";
import { OfficeStatus } from "@/components/demos/mercer-law/OfficeStatus";
import { PHOTOS } from "@/components/demos/mercer-law/photos";
import { PracticeIndex } from "@/components/demos/mercer-law/PracticeIndex";
import { Rail } from "@/components/demos/mercer-law/Rail";
import { Credit, Figure, SectionMark } from "@/components/demos/mercer-law/ui";

// Mercer Law (demonstração, escritório fictício). Direção "Broadsheet": a primeira página de
// um jornal de bairro. Manchete grande em serifa, foto emoldurada com legenda "Fig. n", seções
// numeradas com "§" (o sinal das leis), um trilho lateral vinho no computador e uma barra
// "Call / Book" no polegar do celular. Ordem: primeira página → § 1 o escritório (+ faixa
// vinho com a frase da Ellen) → § 2 serviços e preços como índice → § 3 da primeira reunião
// à assinatura → § 4 Ellen e Ruth → § 5 perguntas → § 6 pedido de consulta (demonstração) e
// visita → rodapé. Ver docs/design/demos/mercer-law.md.

const wrap = "mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-14";
const h2 = "m-display mt-5 text-[clamp(2.4rem,5vw,4.6rem)]";

export default function MercerLawPage() {
  return (
    <>
      <Rail />
      <main id="main" className="pt-14 lg:pt-0 lg:pl-[var(--m-rail)]">
        {/* PRIMEIRA PÁGINA */}
        <section id="top" aria-labelledby="m-title" className="pb-20 lg:pb-28">
          <div className={wrap}>
            <div className="m-double-rule mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--m-rule)] py-2.5 text-[14px] lg:mt-10">
              <span className="m-muted">
                {FIRM.street} · {FIRM.neighborhood} · {FIRM.city}, Ohio
              </span>
              <OfficeStatus className="m-muted" />
            </div>

            <p className="m-label mt-10 text-[var(--m-ox)] lg:mt-14">
              Mercer Law · Office opened {FIRM.opened}
            </p>
            <h1
              id="m-title"
              className="m-display mt-4 text-[clamp(3rem,8.2vw,7.2rem)] leading-[0.94]"
            >
              Family and estate law in German Village
            </h1>

            <div className="mt-10 grid gap-10 border-t border-[var(--m-ink)] pt-8 lg:mt-14 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-4">
                <p className="text-[20px] leading-[1.55] text-pretty lg:text-[21px]">
                  Ellen Mercer handles wills, trusts, probate, prenuptial agreements and divorce
                  consultations from a two-person office on S Third St. Fees are quoted in writing
                  before we start.
                </p>
                <p className="m-muted mt-5 border-t border-[var(--m-rule)] pt-4 text-[15px] leading-snug">
                  <span className="m-label text-[11px] text-[var(--m-ink)]">With</span>
                  <br />
                  {FIRM.attorney}, attorney
                  <br />
                  {FIRM.paralegal}, paralegal
                </p>
                <div className="mt-8 flex flex-col items-start gap-4">
                  <a href="#book" className="m-btn m-btn-ox">
                    Book a consultation <span aria-hidden="true">→</span>
                  </a>
                  <a href={`tel:${FIRM.tel}`} className="m-link m-num text-[18px]">
                    or call {FIRM.phone}
                  </a>
                </div>
              </div>
              <Figure
                photo={PHOTOS.village}
                fig={1}
                ratio={3 / 2}
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                caption={
                  <>
                    German Village on a cloudy fall day, with downtown Columbus behind. The office
                    is at {FIRM.street}.
                  </>
                }
                className="lg:col-span-8"
              />
            </div>
          </div>
        </section>

        {/* § 1 O ESCRITÓRIO */}
        <section id="office" aria-labelledby="office-title" className="scroll-mt-16 pb-24 lg:pb-32">
          <div className={wrap}>
            <div className="border-t border-[var(--m-ink)] pt-6">
              <SectionMark no="1" label="The office" />
            </div>
            <div className="mt-2 grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h2 id="office-title" data-m-rise className={h2}>
                  A two-person office on S Third St
                </h2>
                <div
                  data-m-rise
                  className="m-prose mt-8 max-w-[60ch] space-y-5 text-[19px] leading-[1.7] lg:text-[20px]"
                >
                  <p>
                    Mercer Law is two people. You meet with me at the start, and Ruth Okafor, our
                    paralegal, prepares every document and runs the signing meeting, so your file
                    stays with the two of us. Nobody hands your file to someone you&apos;ve never
                    met.
                  </p>
                  <p>
                    I was admitted to the Ohio bar in {FIRM.barSince} and opened this office in{" "}
                    {FIRM.opened}. We draft wills and trusts, review estate plans, help families
                    through Ohio probate, write prenuptial agreements and hold consultations about
                    divorce and dissolution.
                  </p>
                  <p className="m-muted text-[16px]">{FIRM.attorney}, attorney</p>
                </div>
                <dl className="mt-12 grid grid-cols-3 border-t border-[var(--m-rule-strong)]">
                  {[
                    ["Opened", String(FIRM.opened)],
                    ["Ohio bar", String(FIRM.barSince)],
                    ["People", "2"],
                  ].map(([term, value]) => (
                    <div key={term} data-m-rise className="py-5 pr-4">
                      <dt className="m-label text-[11px] text-[var(--m-muted)]">{term}</dt>
                      <dd className="m-display m-num mt-2 text-[clamp(2rem,3.4vw,2.8rem)]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <Figure
                photo={PHOTOS.ledger}
                fig={2}
                ratio={4 / 5}
                focus="center"
                sizes="(min-width: 1024px) 34vw, 100vw"
                caption="An open ledger on a desk by a window. A stock photograph of a scene, used for mood."
                className="mx-auto w-full max-w-[460px] lg:col-span-4 lg:col-start-9 lg:mt-24 lg:max-w-none"
              />
            </div>
          </div>
        </section>

        {/* FAIXA VINHO — a frase da Ellen (do próprio brief do dono) */}
        <section
          aria-label="From Ellen Mercer"
          className="m-on-ox bg-[var(--m-ox)] text-[var(--m-on-ox)]"
        >
          <figure className={`${wrap} py-20 lg:py-28`}>
            <blockquote
              data-m-rise
              className="m-display max-w-[24ch] text-[clamp(2.1rem,4.6vw,4.2rem)] leading-[1.06] font-[380]"
            >
              “I can&apos;t promise a result in any case. I will tell you plainly what Ohio law says
              and what each option costs.”
            </blockquote>
            <figcaption className="m-label mt-10 flex items-center gap-4 text-[var(--m-on-ox-muted)]">
              <span aria-hidden="true" className="h-px w-10 bg-current" />
              {FIRM.attorney}, attorney
            </figcaption>
          </figure>
        </section>

        {/* § 2 SERVIÇOS E PREÇOS — índice */}
        <section id="fees" aria-labelledby="fees-title" className="scroll-mt-16 py-24 lg:py-32">
          <div className={wrap}>
            <div className="border-t border-[var(--m-ink)] pt-6">
              <SectionMark no="2" label="Services and fees" />
            </div>
            <div className="mt-2 mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
              <h2 id="fees-title" data-m-rise className={`${h2} lg:col-span-7`}>
                Services and fees
              </h2>
              <p
                data-m-rise
                className="max-w-[44ch] text-[18px] leading-[1.6] lg:col-span-5 lg:pb-2"
              >
                Wills, trusts, plan reviews and prenups are flat fees, quoted in writing before we
                start. Probate is $285 an hour, or a flat quote once we&apos;ve seen the estate.
              </p>
            </div>
            <PracticeIndex />
          </div>
        </section>

        {/* § 3 DA PRIMEIRA REUNIÃO À ASSINATURA */}
        <section
          id="first-meeting"
          aria-labelledby="first-title"
          className="scroll-mt-16 bg-[var(--m-paper-2)] py-24 lg:py-32"
        >
          <div className={wrap}>
            <div className="border-t border-[var(--m-ink)] pt-6">
              <SectionMark no="3" label="The first meeting" />
            </div>
            <h2 id="first-title" data-m-rise className={`${h2} max-w-[16ch]`}>
              From the first meeting to the signing
            </h2>

            <ol
              data-m-timeline
              className="relative mt-14 grid gap-10 lg:mt-20 lg:grid-cols-3 lg:gap-12"
            >
              <span
                aria-hidden="true"
                data-m-line
                className="absolute top-[7px] right-0 left-0 hidden h-px bg-[var(--m-ink)] lg:block"
              />
              {STEPS.map((step) => (
                <li
                  key={step.no}
                  className="relative border-l border-[var(--m-ink)] pl-6 lg:border-l-0 lg:pl-0"
                >
                  <span
                    aria-hidden="true"
                    data-m-node
                    className="absolute top-[3px] -left-[5px] block size-[9px] rounded-full bg-[var(--m-ox)] lg:left-0"
                  />
                  <p className="m-label text-[11px] text-[var(--m-muted)] lg:pt-8">
                    Step {step.no} · {step.when}
                  </p>
                  <h3 className="m-display mt-3 text-[clamp(1.7rem,2.6vw,2.3rem)]">{step.title}</h3>
                  <p className="mt-4 max-w-[38ch] text-[18px] leading-[1.6]">{step.body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-20 grid gap-10 lg:grid-cols-12 lg:gap-12">
              <Figure
                photo={PHOTOS.kitchen}
                fig={3}
                ratio={4 / 5}
                sizes="(min-width: 1024px) 30vw, 100vw"
                caption="Late sun on a kitchen table. A stock photograph of a scene."
                className="mx-auto w-full max-w-[420px] lg:col-span-4 lg:max-w-none"
              />
              <div className="flex flex-col gap-12 lg:col-span-7 lg:col-start-6 lg:pt-28">
                <Figure
                  photo={PHOTOS.signing}
                  fig={4}
                  ratio={3 / 2}
                  focus="center"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  caption="A signature on a typed page. A stock photograph; not a client of the office."
                />
                <aside
                  data-m-rise
                  aria-labelledby="divorce-title"
                  className="border-l-[3px] border-[var(--m-ox)] bg-[var(--m-paper)] p-6 sm:p-8"
                >
                  <h3 id="divorce-title" className="m-display text-[clamp(1.5rem,2.2vw,1.9rem)]">
                    Thinking about divorce or dissolution
                  </h3>
                  <p className="mt-4 text-[18px] leading-[1.6]">
                    The consultation is 60 minutes and costs $200, credited if you hire us. Ellen
                    explains what Ohio law says, what your options are and what each one costs. She
                    can&apos;t tell you how it will turn out.
                  </p>
                </aside>
              </div>
            </div>
          </div>
        </section>

        {/* § 4 ELLEN E RUTH — o "expediente" do jornal */}
        <section id="people" aria-labelledby="people-title" className="scroll-mt-16 py-24 lg:py-32">
          <div className={wrap}>
            <div className="border-t border-[var(--m-ink)] pt-6">
              <SectionMark no="4" label="The people" />
            </div>
            <div className="mt-2 grid gap-6 lg:grid-cols-12 lg:items-end">
              <h2 id="people-title" data-m-rise className={`${h2} lg:col-span-8`}>
                Ellen Mercer and Ruth Okafor
              </h2>
              <p
                data-m-rise
                className="max-w-[36ch] text-[18px] leading-[1.6] lg:col-span-4 lg:pb-2"
              >
                Nobody hands your file to someone you&apos;ve never met.
              </p>
            </div>
            <div className="mt-12 grid border-y-[3px] border-double border-[var(--m-ink)] sm:grid-cols-2">
              {PEOPLE.map((person, index) => (
                <article
                  key={person.name}
                  data-m-rise
                  className={`flex gap-6 py-10 ${index === 0 ? "border-b border-[var(--m-rule)] sm:border-r sm:border-b-0 sm:pr-10" : "sm:pl-10"}`}
                >
                  <span
                    aria-hidden="true"
                    className="m-display grid size-20 shrink-0 place-items-center border border-[var(--m-ox)] text-[34px] text-[var(--m-ox)] sm:size-24 sm:text-[40px]"
                  >
                    {person.initials}
                  </span>
                  <div>
                    <p className="m-label text-[11px] text-[var(--m-ox)]">{person.role}</p>
                    <h3 className="m-display mt-2 text-[clamp(1.8rem,2.8vw,2.5rem)]">
                      {person.name}
                    </h3>
                    <ul className="mt-4 space-y-1 text-[18px] leading-[1.55]">
                      {person.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
            <p className="m-muted mt-5 text-[14px]">
              There are no photographs of Ellen or Ruth on this page. The photographs are scenes.
            </p>
          </div>
        </section>

        {/* § 5 PERGUNTAS */}
        <section
          id="questions"
          aria-labelledby="questions-title"
          className="scroll-mt-16 pb-24 lg:pb-32"
        >
          <div className={`${wrap} grid gap-10 lg:grid-cols-12 lg:gap-12`}>
            <div className="lg:col-span-4">
              <div className="border-t border-[var(--m-ink)] pt-6">
                <SectionMark no="5" label="Questions" />
              </div>
              <h2 id="questions-title" data-m-rise className={h2}>
                Questions
              </h2>
              <p className="m-muted mt-6 max-w-[30ch] text-[17px] leading-[1.6]">
                Something else? Call{" "}
                <a
                  href={`tel:${FIRM.tel}`}
                  className="m-link m-num whitespace-nowrap text-[var(--m-ink)]"
                >
                  {FIRM.phone}
                </a>
                .
              </p>
            </div>
            <div className="border-t border-[var(--m-ink)] lg:col-span-8 lg:mt-[4.6rem]">
              {FAQ.map((item, index) => (
                <details
                  key={item.q}
                  className="group border-b border-[var(--m-rule-strong)]"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer items-baseline gap-5 py-5">
                    <span className="m-num w-7 shrink-0 text-[14px] text-[var(--m-muted)]">
                      5.{index + 1}
                    </span>
                    <span className="m-display flex-1 text-[clamp(1.3rem,2vw,1.7rem)] leading-tight">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="m-plus text-[26px] leading-none text-[var(--m-ox)]"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[58ch] pb-6 pl-12 text-[18px] leading-[1.65]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* § 6 PEDIDO DE CONSULTA (demonstração) + VISITA */}
        <section
          id="book"
          aria-labelledby="book-title"
          className="scroll-mt-16 border-t-[3px] border-double border-[var(--m-ink)] bg-[var(--m-paper-2)] py-24 lg:py-32"
        >
          <div className={wrap}>
            <SectionMark no="6" label="Book a consultation" />
            <div className="mt-2 mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
              <h2 id="book-title" data-m-rise className={`${h2} lg:col-span-7`}>
                Book a consultation
              </h2>
              <p
                data-m-rise
                className="max-w-[40ch] text-[18px] leading-[1.6] lg:col-span-5 lg:pb-2"
              >
                Tell us what it&apos;s about and when suits you. Three short steps, and no details
                of your situation until we meet.
              </p>
            </div>
            <Consult />

            <div className="mt-24 grid gap-10 border-t border-[var(--m-ink)] pt-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <h3 className="m-display text-[clamp(1.9rem,3vw,2.6rem)]">Visiting the office</h3>
                <address className="mt-6 text-[19px] leading-[1.6] not-italic">
                  {FIRM.street}
                  <br />
                  {FIRM.neighborhood}, {FIRM.city}, {FIRM.state}
                </address>
                <dl className="mt-6 text-[17px] leading-snug">
                  {HOURS.map((row) => (
                    <div
                      key={row.days}
                      className="flex justify-between gap-4 border-b border-[var(--m-rule)] py-2.5"
                    >
                      <dt>{row.days}</dt>
                      <dd className="m-num">{row.time}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 border-b border-[var(--m-rule)] py-2.5">
                    <dt>Tuesday evenings</dt>
                    <dd>By request</dd>
                  </div>
                </dl>
                <p className="mt-5 text-[17px] leading-[1.6]">{FIRM.parking}</p>
                <p className="mt-5 text-[17px] leading-[1.7]">
                  <a href={`tel:${FIRM.tel}`} className="m-link m-num">
                    {FIRM.phone}
                  </a>
                  <br />
                  <a href={`mailto:${FIRM.email}`} className="m-link break-all">
                    {FIRM.email}
                  </a>
                </p>
              </div>
              <Figure
                photo={PHOTOS.skyline}
                fig={5}
                ratio={16 / 10}
                sizes="(min-width: 1024px) 50vw, 100vw"
                caption="Downtown Columbus from the Main Street Bridge, across the Scioto River."
                className="lg:col-span-7"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="m-on-ox bg-[var(--m-ink)] text-[var(--m-paper)] lg:pl-[var(--m-rail)]">
        <div className={`${wrap} grid gap-12 pt-20 pb-14 lg:grid-cols-12`}>
          <div className="lg:col-span-4">
            <p className="m-display text-[40px] leading-none">Mercer Law</p>
            <p className="mt-4 text-[16px] leading-relaxed text-[var(--m-paper)]/75">
              {FIRM.street}, {FIRM.city}, {FIRM.state}
              <br />
              <a href={`tel:${FIRM.tel}`} className="m-link m-num">
                {FIRM.phone}
              </a>
            </p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className="m-label text-[11px] text-[var(--m-paper)]/75">About this page</p>
            <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-[var(--m-paper)]/85">
              Mercer Law, Ellen Mercer and Ruth Okafor are fictional, and so are the phone number,
              the email address and the fees. This page is a design demonstration by{" "}
              <a href="https://www.nosweatfd.com/" className="m-link">
                No Sweat
              </a>
              . Nothing on it is legal advice, and the consultation form does not send or store
              anything.
            </p>
            <p className="m-label mt-8 text-[11px] text-[var(--m-paper)]/75">Photography</p>
            <ul className="mt-3 grid gap-x-8 gap-y-1 text-[14px] text-[var(--m-paper)]/80 sm:grid-cols-2">
              {Object.values(PHOTOS).map((photo) => (
                <li key={photo.id}>
                  <Credit photo={photo} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
      {/* Selo da No Sweat: último elemento da página, nas cores do rodapé. */}
      <div
        className="@container bg-[#1c1915] lg:pl-[var(--m-rail)]"
        style={{ ["--nsb-bg" as string]: "#1c1915", ["--nsb-fg" as string]: "#f3eee4" }}
      >
        <NoSweatBadge />
      </div>
      <MercerMotion />
    </>
  );
}
