import type { CSSProperties } from "react";
import {
  OFFICE_TOOLS,
  OVERNIGHT_BODY,
  OVERNIGHT_REQUESTS,
  OVERNIGHT_TITLE,
  REQUEST_CAPTION,
} from "./content";
import { OvernightList } from "./OvernightList";
import { PHOTOS } from "./photos";
import { RequestCard } from "./RequestCard";
import { UnsplashImage } from "./UnsplashImage";

// 3. "O que acontece depois que alguém me encontra?"
// O pavilhão ao anoitecer, de ponta a ponta, com as paredes de vidro acesas à direita. À esquerda,
// sobre o véu ink (o morro escuro e o caminho), o título e "a lista da madrugada": três pedidos de exemplo com a hora em que chegaram,
// de ramos diferentes, entrando um por um. Embaixo, no ink, as ferramentas do painel que existem hoje (OFFICE_TOOLS, cada uma com a
// rota conferida no teste). Celular: a foto vira uma faixa no alto e os cartões ficam no ink.

export function Overnight() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="overnight-title"
      className="relative isolate scroll-mt-16 bg-ink text-white"
    >
      {/* Âncoras antigas (/#clients, /#social) do rodapé e das outras páginas. */}
      <span id="clients" aria-hidden="true" className="absolute top-0 scroll-mt-16" />
      <span id="social" aria-hidden="true" className="absolute top-0 scroll-mt-16" />

      <div className="relative lg:min-h-[max(90vh,760px)]">
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
          <UnsplashImage photo={PHOTOS.overnight} sizes="100vw" />
          {/* Véu funcional: no celular só a borda de baixo funde com o ink; no computador
              escurece à esquerda (título) e embaixo (passagem para a lista de ferramentas). */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(7_27_51/0)_55%,rgb(7_27_51/1)_100%)] lg:bg-[linear-gradient(90deg,rgb(7_27_51/.9)_0%,rgb(7_27_51/.82)_34%,rgb(7_27_51/.2)_56%,rgb(7_27_51/0)_70%),linear-gradient(180deg,rgb(7_27_51/.4)_0%,rgb(7_27_51/0)_20%,rgb(7_27_51/0)_75%,rgb(7_27_51/1)_100%)]"
          />
        </div>

        <div className="ah-grid relative pb-8 lg:min-h-[max(90vh,760px)] lg:content-start lg:pt-40 lg:pb-32">
          <div className="col-[2/14] -mt-8 md:-mt-16 lg:col-[2/7] lg:mt-0">
            <h2 id="overnight-title" className="ah-display ah-h2 max-w-[14ch] text-white">
              {OVERNIGHT_TITLE}
            </h2>
            <p className="mt-6 max-w-[34ch] text-[17px] leading-[1.6] text-pretty text-white/80 md:text-[18px]">
              {OVERNIGHT_BODY}
            </p>
          </div>

          <div className="col-[2/14] mt-12 sm:col-[2/12] md:col-[2/10] lg:col-[2/7] lg:mt-16">
            <p className="flex items-center gap-2 text-[14px] font-medium text-white/80">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
              Your website, after closing time
            </p>
            <OvernightList className="mt-6 grid gap-4 md:gap-5">
              {OVERNIGHT_REQUESTS.map((request, index) => (
                <li
                  key={request.name}
                  style={{ "--i": index } as CSSProperties}
                  className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center sm:gap-5"
                >
                  <p className="text-[15px] font-light text-white/80 tabular-nums sm:text-[17px]">
                    {request.time}
                  </p>
                  <RequestCard
                    kind={request.kind}
                    name={request.name}
                    job={request.job}
                    caption={REQUEST_CAPTION}
                  />
                </li>
              ))}
            </OvernightList>
          </div>
        </div>
      </div>

      <div className="ah-grid pt-16 pb-24 md:pt-20 md:pb-32 lg:pt-8 lg:pb-40">
        <h3 className="col-[2/14] text-[15px] font-medium text-white/80">
          Also in your No Sweat office
        </h3>
        <dl className="col-[2/14] mt-6 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {OFFICE_TOOLS.map((tool) => (
            <div key={tool.term} className="border-t border-white/15 py-5 lg:py-6">
              <dt className="text-[17px] font-medium text-white">{tool.term}</dt>
              <dd className="mt-1.5 max-w-[38ch] text-[16px] leading-[1.6] text-slate-300">
                {tool.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
