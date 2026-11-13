import { edgeInner, edgeOuter, h2Class, h3Class } from "./type";

// "How it works" (#story), direto no fundo cinza: os quatro passos numa lista parada, todos à
// vista (nada escondido atrás de rolagem lateral). Cada passo é um número num quadrado com anel
// azul, o título e uma linha de texto. No computador os quatro ficam sobre um fio horizontal que
// se desenha uma vez ao rolar (.lp-timeline em landing.css); no celular, um fio vertical à
// esquerda liga os números; no tablet, 2×2 sem fio. Só o que o produto faz hoje.

const STEPS = [
  {
    title: "Answer a few questions",
    body: "What you do and where. About a minute.",
  },
  {
    title: "Get your first draft",
    body: "Pages, words and a contact form, set up for your business.",
  },
  {
    title: "Change anything",
    body: "Click to edit, or ask the AI in plain words.",
  },
  {
    title: "Go live",
    body: "A free nosweatfd.com address, or your own domain on Pro.",
  },
];

export function Steps() {
  return (
    <section id="story" aria-labelledby="story-title" className={`scroll-mt-14 ${edgeOuter}`}>
      <div className={`${edgeInner} py-14 lg:py-20`}>
        <h2 id="story-title" className={h2Class}>
          From a few answers to a live site.
        </h2>
        <ol className="lp-timeline relative mt-10 grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:mt-14 lg:grid-cols-4">
          {STEPS.map(({ title, body }, index) => (
            <li key={title} className="relative grid grid-cols-[36px_1fr] gap-x-4 sm:block">
              {/* O número é enfeite: o <ol> já numera para quem usa leitor de tela. */}
              <span
                aria-hidden="true"
                className="relative z-10 grid size-9 place-items-center rounded-xl bg-white font-display text-sm font-semibold text-ink tabular-nums ring-1 ring-brand ring-inset"
              >
                {index + 1}
              </span>
              <div className="pt-[5px] sm:pt-5">
                <h3 className={h3Class}>{title}</h3>
                <p className="mt-2 max-w-[32ch] text-base leading-[1.6] text-pretty text-slate-600">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
