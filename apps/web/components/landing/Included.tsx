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
    <section id="included" aria-labelledby="included-title" className="py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-end">
          <h2
            id="included-title"
            data-lp-rise
            className="lp-serif text-[clamp(2.4rem,5.5vw,5rem)] lg:col-span-8"
          >
            You say little. <em>We ship the rest.</em>
          </h2>
          <p className="max-w-[40ch] text-lg leading-relaxed text-[#071b33]/70 lg:col-span-4">
            Every site comes complete, even the parts you did not ask for.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {ITEMS.map((item, index) => (
            <li
              key={item.title}
              data-lp-rise
              className="lp-frame flex min-h-[240px] flex-col justify-between rounded-[4px] p-6 lg:min-h-[280px] lg:p-8"
            >
              <p
                className="lp-serif text-[clamp(3rem,5vw,4.5rem)] text-[#0066ff]"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h3 className="lp-serif text-[clamp(1.6rem,2.4vw,2.1rem)]">{item.title}</h3>
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
