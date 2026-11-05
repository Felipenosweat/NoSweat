// "O que todo site leva": cartões numerados, só o que o produto cumpre hoje (CLAUDE.md, princípio
// "o cliente fala pouco, nós entregamos muito"). Sem números de clientes, notas ou selos.

const ITEMS = [
  {
    title: "Call button",
    body: "A tap-to-call number at the top and a sticky call button on phones.",
  },
  {
    title: "Contact form",
    body: "Requests land in your dashboard, and you can reply from there.",
  },
  {
    title: "Your hours and area",
    body: "Opening hours and the places you serve, only when you tell us.",
  },
  {
    title: "Set up for Google",
    body: "Page title, description and a sitemap, added for you. No SEO homework.",
  },
  {
    title: "Fast on a phone",
    body: "Designed at 390 px first, because that is where your customers are.",
  },
  {
    title: "Yours to change",
    body: "Click to edit, or ask the AI in plain words. Every change is a draft you review.",
  },
];

export function Included() {
  return (
    <section id="included" aria-labelledby="included-title" className="px-0 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="text-center">
          <span className="lp-tag">Included</span>
          <h2
            id="included-title"
            data-lp-rise
            className="lp-serif mt-6 text-[clamp(2rem,4.4vw,3.5rem)]"
          >
            You say little. <br className="hidden sm:block" />
            <em>We ship the rest.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] text-lg leading-relaxed text-[#6e6e73]">
            Every site comes complete, even the parts you did not ask for.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {ITEMS.map((item, index) => (
            <li
              key={item.title}
              data-lp-rise
              className="flex min-h-[220px] flex-col justify-between rounded-[22px] bg-[#f5f5f7] p-6 lg:min-h-[280px] lg:p-8"
            >
              <p
                className="text-[15px] font-semibold tracking-[0.08em] text-[#0066ff]"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h3 className="text-[22px] leading-tight font-semibold tracking-[-0.02em] text-[#071b33]">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-[38ch] text-[15px] leading-[1.65] text-pretty text-[#071b33]/70">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
