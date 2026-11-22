import { OFFICE_EXTRAS } from "./content";
import { OfficeTabs } from "./OfficeTabs";

// Escritório (bloco branco): o que acontece depois que o site vai ao ar. Título grande à esquerda
// e a frase de apoio embaixo à direita (assimétrico, nada centralizado). Abas com capturas reais;
// embaixo, as outras ferramentas que existem hoje, em texto corrido (sem cartões).

export function LiveOffice() {
  return (
    <section id="clients" aria-labelledby="office-title" className="scroll-mt-4 bg-white">
      <div className="mx-auto w-full max-w-[1440px] pt-20 pb-20 sm:px-8 lg:px-12 lg:pt-32 lg:pb-28">
        <div className="grid gap-x-10 gap-y-6 px-5 sm:px-0 lg:grid-cols-12 lg:items-end">
          <h2
            id="office-title"
            className="live-d max-w-[12ch] text-[clamp(2.75rem,7.4vw,7rem)] leading-[0.92] font-extrabold tracking-[-0.04em] text-balance text-ink lg:col-span-8"
          >
            Then the phone starts ringing.
          </h2>
          <p className="max-w-[38ch] text-lg leading-[1.5] text-pretty text-slate-600 lg:col-span-4 lg:pb-3 lg:text-xl">
            Every call button, form and booking from your site lands in one place you can run from
            your phone.
          </p>
        </div>

        <div className="mt-14 lg:mt-20">
          <OfficeTabs />
        </div>

        <div className="mt-16 grid gap-x-10 gap-y-4 px-5 sm:px-0 lg:mt-24 lg:grid-cols-12">
          <h3 className="live-d text-[22px] font-medium tracking-[-0.01em] text-ink lg:col-span-4">
            Also in the office
          </h3>
          <ul className="border-t border-slate-200 lg:col-span-8">
            {OFFICE_EXTRAS.map((tool) => (
              <li
                key={tool.name}
                className="grid gap-x-8 gap-y-1 border-b border-slate-200 py-5 sm:grid-cols-[14rem_1fr]"
              >
                <span className="text-[17px] font-semibold text-ink">{tool.name}</span>
                <span className="text-[17px] leading-[1.5] text-pretty text-slate-600">
                  {tool.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
