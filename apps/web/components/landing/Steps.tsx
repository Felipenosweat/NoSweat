import { Unbounded } from "next/font/google";

// "How it works" (#story): o slogan em caixa alta numa fonte larga (Unbounded, só nesta seção,
// sem preload) e os quatro passos numa linha do tempo: uma linha azul que se desenha com a
// rolagem (CSS animation-timeline; sem suporte ou com "reduzir movimento", aparece inteira).
// Só o que o produto faz hoje.

const wide = Unbounded({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
  variable: "--font-lp-wide",
});

const STEPS = [
  {
    title: "Answer a few questions",
    body: "What you do, where, and anything worth knowing. About a minute.",
  },
  {
    title: "We build the first draft",
    body: "Layout, words, services and contact form, set up for your business.",
  },
  {
    title: "Change anything",
    body: "Click to edit, or ask the AI in plain words. You review every draft.",
  },
  {
    title: "Go live",
    body: "A free nosweatfd.com address, or your own domain on Pro.",
  },
];

export function Steps() {
  return (
    <section
      id="story"
      aria-labelledby="story-title"
      className={`${wide.variable} scroll-mt-14 bg-[#f5f5f7] px-5 py-20 sm:px-8 lg:py-28`}
    >
      <div className="mx-auto w-full max-w-[1240px]">
        <span className="lp-tag bg-white">How it works</span>
        <h2
          id="story-title"
          className="lp-wide mt-7 text-[clamp(1.75rem,4.6vw,4.1rem)] leading-[0.98] text-[#071b33]"
        >
          Start with a few answers.
          <br />
          <span className="text-[#0066ff]">Build with clarity.</span>
        </h2>

        <ol className="lp-timeline relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative pl-12 lg:pt-14 lg:pl-0">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 z-10 grid size-9 place-items-center rounded-full border border-[#0066ff] bg-white text-[13px] font-semibold text-[#0066ff] tabular-nums lg:top-0"
              >
                {index + 1}
              </span>
              <h3 className="text-[20px] leading-tight font-semibold tracking-[-0.02em] text-[#071b33]">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[30ch] text-[15px] leading-[1.55] text-[#6e6e73]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
