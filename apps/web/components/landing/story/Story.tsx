import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { container } from "@/components/marketing/styles";
import { ScrollStage } from "./ScrollStage";
import {
  BuildStage,
  ClientsStage,
  DescribeStage,
  LiveStage,
  LOOKS,
  LooksStage,
  SocialStage,
} from "./stages";

// O "teatro" da landing (#story): seis cenas sobre o fundo ink, cada uma com legendas à esquerda
// e o produto se montando no palco. Uma só história: a Sparkle & Co. Cleaning (fictícia).
//
// Sem JS, com movimento reduzido ou tela baixa, é uma versão empilhada e completa: cada cena
// mostra o estado final (o servidor já manda `data-beat` = última batida) e todas as legendas
// em lista. O <ScrollStage /> liga `data-story="on"`: aí cada cena fica fixa por
// `100svh + batidas × --beat` e as batidas trocam pelo CSS (landing.css).

type Caption = { title: string; body: ReactNode };

type SceneDef = {
  id: string;
  chapter: string;
  title: ReactNode;
  captions: Caption[];
  /** Resumo para leitores de tela do que o palco mostra (o palco é aria-hidden). */
  summary: string;
  stage: ReactNode;
  foot?: ReactNode;
  /** A cena tem estado "antes de fixar" (data-beat="-1"), como o site que se monta. */
  pre?: boolean;
};

const focusDark =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const SCENES: SceneDef[] = [
  {
    id: "describe",
    chapter: "Describe",
    title: (
      <>
        Describe it once. <span className="text-slate-400">We do the rest.</span>
      </>
    ),
    captions: [
      { title: "Say it like you’d tell a customer.", body: "One or two sentences is enough." },
      {
        title: "We pick out the trade, the town and your number.",
        body: "Those facts go straight onto your site.",
      },
    ],
    summary:
      "Example: the owner of Sparkle & Co. Cleaning types “Sparkle & Co. — house cleaning in Worcester, MA. Weekly and move-out cleans. Call (508) 555-0142.” No Sweat picks out four facts: house cleaning, Worcester, MA, the phone number, and weekly and move-out cleans.",
    stage: <DescribeStage />,
  },
  {
    id: "build",
    chapter: "Build",
    pre: true,
    title: (
      <>
        Watch your site <span className="text-slate-400">build itself.</span>
      </>
    ),
    captions: [
      {
        title: "Your name and what you do, up top.",
        body: "Written from your sentence, in plain English.",
      },
      {
        title: "A photo picked for your trade.",
        body: "From a stock library, credited to the photographer. Or upload your own.",
      },
      { title: "Phone, hours, contact form.", body: "Always included, on every plan." },
      {
        title: "Change anything by asking.",
        body: "“Add Saturday hours, 9 to 2.” You get a draft first. Nothing goes live until you publish.",
      },
    ],
    summary:
      "Example: the Sparkle & Co. Cleaning website appears piece by piece: the header with the business name, the headline “A Spotless Home Without Lifting a Finger” with a quote button and the phone number, a photo, and the hours. Then the owner asks “Add Saturday hours, 9 to 2” and the hours show Saturday 9 AM to 2 PM, marked Updated, in a new draft.",
    stage: <BuildStage />,
  },
  {
    id: "looks",
    chapter: "Pick a look",
    title: (
      <>
        Five businesses, <span className="text-slate-400">five layouts.</span>
      </>
    ),
    captions: LOOKS.map((look) => ({
      title: look.layout,
      body: (
        <>
          {look.body}{" "}
          <span className="text-slate-400">
            Shown: {look.business}, {look.place}.
          </span>
        </>
      ),
    })),
    summary:
      "Five example websites, each in a different layout: Joe’s Plumbing in Service-led, Sparkle & Co. Cleaning in Modular, Glow Salon in Editorial, Rosa’s Kitchen in Immersive and Hale & Ortiz in Typographic. All five businesses are fictional.",
    stage: <LooksStage />,
    foot: (
      <div className="mt-5">
        <p className="text-[13px] text-slate-400">
          We pick the one that fits. Switch anytime in the editor.
        </p>
        <ul className="mt-1 flex flex-wrap gap-x-4 text-sm font-semibold">
          {LOOKS.map((look) => (
            <li key={look.slug}>
              <Link
                href={`/examples/${look.slug}`}
                className={`inline-flex min-h-11 items-center rounded-sm text-white underline decoration-brand decoration-2 underline-offset-4 hover:decoration-white ${focusDark}`}
              >
                {look.layout}
                <span className="sr-only">: view the {look.business} example site</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "go-live",
    chapter: "Go live",
    title: (
      <>
        Publish. <span className="text-slate-400">Pick up the phone.</span>
      </>
    ),
    captions: [
      {
        title: "Live on a free address the moment you publish.",
        body: "nosweatfd.com/s/your-business",
      },
      {
        title: "On a phone, the call button stays on screen.",
        body: "Customers tap once to call you.",
      },
      {
        title: "Or use a domain you already own.",
        body: "Pro and Premium. We show the three records to add and check them for you.",
      },
    ],
    summary:
      "Example: the Sparkle & Co. Cleaning site is published at nosweatfd.com/s/sparkle-co-cleaning. On a phone, a call button stays at the bottom of the screen. With an own domain, No Sweat lists three DNS records to add: an A record, a CNAME for www, and a TXT record named _nosweat that proves the domain is yours.",
    stage: <LiveStage />,
  },
  {
    id: "clients",
    chapter: "Get the call",
    title: (
      <>
        A request comes in. <span className="text-slate-400">It’s already a client.</span>
      </>
    ),
    captions: [
      { title: "You get an email right away.", body: "Name, phone and what they need." },
      { title: "Every request lands in Clients.", body: "No copying, no spreadsheet." },
      {
        title: "Move it along.",
        body: "Set the stage, a follow-up date, and tap to call, text or email.",
      },
    ],
    summary:
      "Example: an email arrives, “New request from Maria Chen”, asking for a move-out clean for a 3-bedroom on October 30. Maria appears at the top of the Clients list marked New. Her client card has Call, Text and Email buttons, the stages New, Contacted, Quoted, Won and Lost with Quoted selected, a follow-up on Thursday, October 22, and a note: quoted $240 for the move-out clean.",
    stage: <ClientsStage />,
  },
  {
    id: "social",
    chapter: "Post",
    title: (
      <>
        A month of posts. <span className="text-slate-400">You say yes.</span>
      </>
    ),
    captions: [
      { title: "AI drafts posts from your website.", body: "One tap fills the month." },
      { title: "Read each one.", body: "Edit the words, swap the photo, or approve." },
      { title: "Approved posts go out on schedule.", body: "Nothing posts without your OK." },
    ],
    summary:
      "Example: a November calendar for Sparkle & Co. Cleaning. “Fill my month with AI” adds twelve draft posts marked Needs approval. The owner approves the first ones and they turn Scheduled, like the November 12 post “Moving out this month? We’ll get your deposit back.”",
    stage: <SocialStage />,
    foot: (
      <p className="mt-5 text-[13px] text-slate-400">Needs a professional Instagram account.</p>
    ),
  },
];

function Scene({ scene, index }: { scene: SceneDef; index: number }) {
  const beats = scene.captions.length;
  const titleId = `${scene.id}-title`;
  return (
    <section
      id={scene.id}
      aria-labelledby={titleId}
      data-scene={scene.id}
      data-beats={beats}
      data-beat={beats - 1}
      data-pre={scene.pre ? "" : undefined}
      className="st-scene"
      style={{ "--beats": beats } as CSSProperties}
    >
      <div className="st-pin">
        {/* Celular: faixa do capítulo com a linha de progresso. */}
        <div className="relative flex h-10 shrink-0 items-center justify-between border-b border-white/10 text-[13px] font-semibold text-white lg:hidden">
          <span className="tabular-nums">
            {index + 1} / {SCENES.length} · {scene.chapter}
          </span>
          <span className="font-normal text-slate-400">
            {scene.id === "looks" ? "Example businesses" : "Example business"}
          </span>
          <span
            aria-hidden="true"
            className="st-progress absolute -bottom-px left-0 h-0.5 w-full bg-brand"
          />
        </div>

        <div className="st-body flex min-h-0 flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-center lg:gap-10">
          <div className="order-2 min-w-0 lg:order-1">
            <h2
              id={titleId}
              className="max-w-[16ch] font-display text-[clamp(1.625rem,3.4vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-white"
            >
              {scene.title}
            </h2>
            <ol className="st-caps mt-4 lg:mt-6">
              {scene.captions.map((caption) => (
                <li key={caption.title}>
                  <p className="font-display text-lg leading-[1.25] font-semibold tracking-[-0.015em] text-white lg:text-[1.375rem]">
                    {caption.title}
                  </p>
                  <p className="mt-1.5 max-w-[38ch] text-base leading-relaxed text-pretty text-slate-300">
                    {caption.body}
                  </p>
                </li>
              ))}
            </ol>
            {scene.foot}
          </div>

          <div aria-hidden="true" className="st-stage order-1 lg:order-2">
            {scene.stage}
          </div>
          <p className="sr-only">{scene.summary}</p>
        </div>
      </div>
    </section>
  );
}

export function Story() {
  // data-hide-mobile-cta: a barra fixa de CTA do celular cobriria as legendas das cenas presas.
  return (
    <section
      id="story"
      data-story="off"
      data-hide-mobile-cta
      aria-label="Product tour"
      className="st-theater relative bg-ink text-slate-300"
    >
      <div className={`${container} pt-6`}>
        <a
          href="#pricing"
          className={`inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-slate-300 underline decoration-white/30 underline-offset-4 hover:text-white hover:decoration-white ${focusDark}`}
        >
          Skip the tour → Pricing
        </a>
      </div>

      <div className={`${container} lg:grid lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-10`}>
        {/* Trilho de capítulos (computador). Fica parado ao lado das cenas o tempo todo. */}
        <div className="hidden lg:block">
          <nav
            aria-label="Tour"
            className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col justify-center"
          >
            <ol>
              {SCENES.map((scene, index) => (
                <li key={scene.id}>
                  <a
                    href={`#${scene.id}`}
                    data-rail-link
                    className={`st-rail relative flex min-h-11 items-center gap-2.5 rounded-sm pl-3.5 text-[13px] leading-tight font-semibold text-slate-400 transition-colors duration-200 hover:text-white ${focusDark}`}
                  >
                    <span className="tabular-nums opacity-70">{index + 1}</span>
                    {scene.chapter}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="min-w-0">
          {SCENES.map((scene, index) => (
            <Scene key={scene.id} scene={scene} index={index} />
          ))}
        </div>
      </div>

      <ScrollStage />
    </section>
  );
}
