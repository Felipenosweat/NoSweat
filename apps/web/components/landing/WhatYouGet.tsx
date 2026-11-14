import Image from "next/image";
import type { CSSProperties } from "react";
import { frameShadow } from "@/components/marketing/styles";
import { Arrow } from "./Arrow";
import { h2Class, h3Class, leadClass, sectionBody, sectionHead, shell } from "./type";

// "What you get" (#what): os três produtos à vista ao mesmo tempo, sem abas nem clique, em três
// cartões desiguais. Website (cinza-claro, alto, à esquerda) com a captura do site de exemplo e a
// versão de celular por cima; Clients (ink) e Instagram (azul bem claro) empilhados à direita,
// cada um com a TELA REAL do app (dados de demonstração de um negócio inventado, avisado na
// legenda). As capturas do app são recortes ampliados da mesma imagem (sem montagem), para o
// texto continuar legível; o texto alternativo descreve só o que aparece no recorte.
// Capturas em public/landing/real (regravar: ver docs/design/README.md, "Validação").

const card =
  "lp-reveal flex min-w-0 flex-col overflow-hidden rounded-2xl px-6 pt-6 sm:px-8 sm:pt-8";
const caption = "mt-4 text-[13px] leading-normal";

const SOCIAL_STEPS = ["Drafted for you", "You approve", "Posted on time"];

export function WhatYouGet() {
  return (
    <section id="what" aria-labelledby="what-title" className={`${shell} pt-20 lg:pt-28`}>
      <div className={`lp-reveal ${sectionHead}`}>
        <h2 id="what-title" className={h2Class}>
          Not just a website.
          <br />
          <span className="text-slate-500">The tools around it.</span>
        </h2>
        <p className={leadClass}>
          Your site, the requests it brings in and your Instagram, in one place. Built for people
          who would rather be working.
        </p>
      </div>

      <div className={`${sectionBody} grid gap-5 lg:grid-cols-2 lg:grid-rows-[1fr_auto]`}>
        <article className={`${card} bg-slate-100 lg:row-span-2`}>
          <h3 className={h3Class}>Website</h3>
          <p className="mt-2 text-[17px] leading-[1.6] text-slate-600">
            Services, hours, a contact form and a call button.
          </p>
          <figure className="flex flex-1 flex-col">
            <figcaption className={`${caption} text-slate-600`}>
              Mercer Law, an example site. The business is made up.
            </figcaption>
            <div className="relative mt-6 min-h-[21rem] flex-1 sm:min-h-[34rem]">
              <div className="absolute inset-y-0 right-0 left-[18%] overflow-hidden rounded-t-2xl border border-b-0 border-slate-300 bg-white">
                <Image
                  src="/landing/real/site-2.webp"
                  width={2000}
                  height={3750}
                  alt="The Mercer Law example site made with No Sweat: a large serif headline, “Family and estate law in German Village”, a photo of law books and the office’s story."
                  sizes="(min-width: 1024px) 480px, 85vw"
                  className="h-auto w-full"
                />
              </div>
              <div
                className={`absolute bottom-0 left-0 aspect-[9/17] w-[28%] max-w-[10rem] overflow-hidden rounded-t-2xl border border-b-0 border-slate-300 bg-white ${frameShadow}`}
              >
                <Image
                  src="/landing/signature/mercer-law-m.webp"
                  width={640}
                  height={1385}
                  alt="The same site on a phone."
                  sizes="176px"
                  className="size-full object-cover object-top"
                />
              </div>
            </div>
          </figure>
        </article>

        <article className={`${card} bg-ink text-white`} style={{ "--i": 1 } as CSSProperties}>
          <h3 className={`${h3Class} text-white`}>Clients</h3>
          <p className="mt-2 text-[17px] leading-[1.6] text-slate-300">
            Every request from your site, in one list.
          </p>
          <figure className="flex flex-1 flex-col">
            <figcaption className={`${caption} text-slate-300`}>
              The real Clients screen, with demo requests.
            </figcaption>
            <div className="relative mt-6 aspect-square overflow-hidden rounded-t-2xl bg-white sm:aspect-[2/1] lg:aspect-auto lg:min-h-[15rem] lg:flex-1">
              {/* Recorte: as etapas e os cinco pedidos (nome, telefone e e-mail), encostado embaixo. */}
              <Image
                src="/landing/real/clients-2.webp"
                width={2400}
                height={1500}
                alt="The No Sweat Clients screen: five new requests from the contact form, each with a name, phone number and email."
                sizes="(min-width: 1024px) 800px, (min-width: 640px) 150vw, 300vw"
                className="absolute bottom-0 left-[-75%] h-auto w-[320%] max-w-none sm:left-[-36.5%] sm:w-[150%]"
              />
            </div>
          </figure>
        </article>

        <article className={`${card} bg-brand/10`} style={{ "--i": 2 } as CSSProperties}>
          <h3 className={h3Class}>Instagram</h3>
          <p className="mt-2 text-[17px] leading-[1.6] text-slate-700">
            Posts drafted for you. Nothing goes out until you approve it.
          </p>
          <ol className="mt-5 flex flex-col items-start gap-2 text-[15px] font-semibold text-ink sm:flex-row sm:flex-wrap sm:items-center">
            {SOCIAL_STEPS.map((label, i) => (
              <li
                key={label}
                className="flex flex-col items-start gap-2 sm:flex-row sm:items-center"
              >
                {/* No celular as etapas ficam uma embaixo da outra e a seta aponta para baixo. */}
                {i > 0 && <Arrow className="ml-5 rotate-90 text-brand-dark sm:ml-0 sm:rotate-0" />}
                <span
                  className={`rounded-full px-3.5 py-2 ${i === 1 ? "bg-ink text-white" : "bg-white"}`}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
          <figure className="flex flex-1 flex-col">
            <figcaption className={`${caption} text-slate-700`}>
              The real Social screen, with a demo account.
            </figcaption>
            <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-t-2xl bg-white sm:aspect-[5/2]">
              {/* Recorte: a conta do Instagram ligada, o plano do mês e o começo do calendário. */}
              <Image
                src="/landing/real/social-2.webp"
                width={2400}
                height={1500}
                alt="The No Sweat Social screen: a connected Instagram account, the monthly posting plan and the November calendar."
                sizes="(min-width: 1024px) 800px, (min-width: 640px) 150vw, 280vw"
                className="absolute top-[-43%] left-[-66%] h-auto w-[280%] max-w-none sm:top-[-42%] sm:left-[-36.5%] sm:w-[150%]"
              />
            </div>
          </figure>
        </article>
      </div>
    </section>
  );
}
