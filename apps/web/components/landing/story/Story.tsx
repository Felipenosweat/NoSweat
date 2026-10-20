import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BackdropPhoto, BackdropShade } from "@/components/landing/Backdrop";
import type { PhotoKey } from "@/components/photos";
import { container } from "@/components/marketing/styles";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import { ScrollStage } from "./ScrollStage";
import {
  BuildStage,
  ClientsStage,
  DashboardStage,
  DescribeStage,
  EditStage,
  LiveStage,
  LOOKS,
  LooksStage,
  SocialStage,
} from "./stages";

// O "teatro" da landing (#story, V7): oito cenas que ensinam a usar o produto, cada uma sobre
// uma foto de ofício em tela cheia (escurecida com ink + luz da marca + grão), com a legenda
// num painel de vidro e o produto se montando no palco. Uma só história: a Sparkle & Co.
// Cleaning (fictícia).
//
// Fundos: cada cena tem o seu (`.st-bg`), que começa uma tela ANTES da cena e fica preso
// (sticky) atrás dela. Com o tour ligado, ele entra por opacidade (`--in`, escrito pelo
// ScrollStage) enquanto a cena anterior sai: é o "cross-fade" entre fotos. A foto cresce bem
// devagar com o progresso da cena (`--p`, só transform). Como cada fundo fica dentro da sua
// cena, o carregamento preguiçoso do navegador baixa a foto mais ou menos uma cena antes.
//
// Sem JS, com movimento reduzido ou tela baixa, é uma versão empilhada e completa: cada cena
// mostra o estado final (o servidor já manda `data-beat` = última batida), todas as legendas
// em lista e cada foto parada atrás da sua cena.

type Caption = { title: string; body: ReactNode };

type SceneDef = {
  id: string;
  chapter: string;
  /** Título em duas partes: a frase principal e o complemento mais claro. */
  title: [string, string];
  /** A lição da cena, no imperativo ("How to"). */
  howTo: string;
  captions: Caption[];
  /** Resumo para leitores de tela do que o palco mostra (o palco é aria-hidden). */
  summary: string;
  stage: ReactNode;
  photo: PhotoKey;
  foot?: ReactNode;
};

const focusDark =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const SCENES: SceneDef[] = [
  {
    id: "describe",
    chapter: "Describe",
    photo: "shopOwner",
    title: ["Describe it once.", "We do the rest."],
    howTo: "Type one sentence about your business.",
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
    photo: "cleaner",
    title: ["Watch your site", "build itself."],
    howTo: "Tap Build my website and watch it come together.",
    captions: [
      {
        title: "Your name and what you do, up top.",
        body: "Written from your sentence, in plain English.",
      },
      {
        title: "A photo picked for your trade.",
        body: "From a stock library, credited to the photographer.",
      },
      { title: "Phone, hours, contact form.", body: "Always included, on every plan." },
    ],
    summary:
      "Example: the Sparkle & Co. Cleaning website appears piece by piece: the header with the business name and the headline “A Spotless Home Without Lifting a Finger” with a quote button and the phone number, then a photo, then the hours.",
    stage: <BuildStage />,
  },
  {
    id: "edit",
    chapter: "Edit",
    photo: "crew",
    title: ["Change anything.", "Click it or ask."],
    howTo: "Tap any part of your site to change it, or ask the AI.",
    captions: [
      {
        title: "Click any part to edit it.",
        body: "Its text and photo open next to a live preview of your site.",
      },
      {
        title: "Or just ask.",
        body: "“Add Saturday hours, 9 to 2.” You get a new draft to check first.",
      },
      { title: "Use your own photos.", body: "Upload JPG, PNG or WebP photos from your phone." },
      {
        title: "Make it look like you.",
        body: "Ready-made styles, your own colors and ten font pairings. Nothing goes live until you publish.",
      },
    ],
    summary:
      "Example: the Sparkle & Co. Cleaning site in the editor. The owner clicks the headline and its fields open: Headline and Button. Then they ask the AI “Add Saturday hours, 9 to 2” and the hours show Saturday, marked Updated, in a new draft. Then they upload their own photo, and pick the ready-made style Harbor, which changes the site’s colors.",
    stage: <EditStage />,
  },
  {
    id: "looks",
    chapter: "Pick a look",
    photo: "stylist",
    title: ["Five businesses,", "five layouts."],
    howTo: "Open Style and pick a layout. Switch anytime.",
    captions: LOOKS.map((look) => ({
      title: look.layout,
      body: (
        <>
          {look.body}{" "}
          <span className="text-slate-300">
            Shown: {look.business}, {look.place}.
          </span>
        </>
      ),
    })),
    summary:
      "Five example websites, each in a different layout: Joe’s Plumbing in Service-led, Sparkle & Co. Cleaning in Modular, Glow Salon in Editorial, Rosa’s Kitchen in Immersive and Hale & Ortiz in Typographic. All five businesses are fictional.",
    stage: <LooksStage />,
    foot: (
      <div className="mt-4">
        <p className="text-[13px] text-slate-300">We pick the one that fits. See each example:</p>
        <ul className="mt-1 flex flex-wrap gap-x-4 text-sm font-semibold">
          {LOOKS.map((look) => (
            <li key={look.slug}>
              <Link
                href={`/examples/${look.slug}`}
                className={`inline-flex min-h-11 items-center rounded-sm text-white underline decoration-accent decoration-2 underline-offset-4 hover:decoration-white ${focusDark}`}
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
    photo: "storefront",
    title: ["Publish.", "Pick up the phone."],
    howTo: "Tap Publish. Add your own domain whenever you’re ready.",
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
    photo: "plumber",
    title: ["A request comes in.", "It’s already a client."],
    howTo: "Open Clients. Every request is already there.",
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
    photo: "cook",
    title: ["A month of posts.", "You say yes."],
    howTo: "Connect Instagram, fill the month, approve what you like.",
    captions: [
      { title: "AI drafts posts from your website.", body: "One tap fills the month." },
      { title: "Read each one.", body: "Edit the words, swap the photo, or approve." },
      // Enquanto SOCIAL_TESTER_ONLY=true (app da Meta sem App Review), clientes postam à mão
      // pelo calendário. Com SOCIAL_TESTER_ONLY=false, voltar ao título original:
      // "Approved posts go out on schedule."
      { title: "Approved posts wait on your calendar.", body: "Nothing posts without your OK." },
    ],
    summary:
      "Example: a November calendar for Sparkle & Co. Cleaning. “Fill my month with AI” adds twelve draft posts marked Needs approval. The owner approves the first ones and they turn Scheduled, like the November 12 post “Moving out this month? We’ll get your deposit back.”",
    stage: <SocialStage />,
    foot: (
      <p className="mt-4 text-[13px] text-slate-300">Needs a professional Instagram account.</p>
    ),
  },
  {
    id: "dashboard",
    chapter: "Your day",
    photo: "landscaper",
    title: ["Every morning,", "one short list."],
    howTo: "Open your dashboard and clear what needs you.",
    captions: [
      {
        title: "Start with Needs you.",
        body: "Posts to approve, follow-ups due and new requests, most urgent first.",
      },
      { title: "Tap a row to handle it.", body: "Each one opens right where you need to be." },
      {
        title: "See the whole business at a glance.",
        body: "Your website, clients and posts, counted for you.",
      },
    ],
    summary:
      "Example: the No Sweat dashboard on Thursday, October 22. Under Needs you: 7 posts are waiting for your approval; follow up with Maria Chen, due today; 1 new client is waiting for a reply; and the next post goes out Tuesday, November 3. Under Your office: 1 live website, 5 clients with 1 new, and 5 posts scheduled in the next 30 days.",
    stage: <DashboardStage />,
  },
];

function Scene({ scene, index }: { scene: SceneDef; index: number }) {
  const beats = scene.captions.length;
  const titleId = `${scene.id}-title`;
  const step = `Step ${index + 1} of ${SCENES.length}`;
  return (
    <section
      id={scene.id}
      aria-labelledby={titleId}
      data-scene={scene.id}
      data-beats={beats}
      data-beat={beats - 1}
      className="st-scene relative"
      style={{ "--beats": beats } as CSSProperties}
    >
      {/* Fundo da cena: foto + sombra + luz + grão (decorativo). */}
      <div aria-hidden="true" className="st-bg">
        <div className="st-bg-pin">
          <div className="st-bg-img absolute inset-0">
            <BackdropPhoto photo={scene.photo} />
          </div>
          <BackdropShade side="left" />
        </div>
      </div>

      <div className="st-pin relative z-10">
        <div className={`${container} st-inner lg:pl-[13rem]`}>
          {/* Celular: faixa do capítulo com a linha de progresso. */}
          <div className="relative flex h-10 shrink-0 items-center justify-between border-b border-white/15 text-[13px] font-semibold text-white lg:hidden">
            <span className="tabular-nums">
              {step} · {scene.chapter}
            </span>
            <span className="font-normal text-slate-300">
              {scene.id === "looks" ? "Example businesses" : "Example business"}
            </span>
            <span
              aria-hidden="true"
              className="st-progress absolute -bottom-px left-0 h-0.5 w-full bg-accent"
            />
          </div>

          <div className="st-body flex min-h-0 flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:gap-12">
            <div className="st-caption order-2 min-w-0 lg:order-1">
              <p className="hidden text-xs font-semibold tracking-[0.16em] text-accent uppercase tabular-nums lg:block">
                {step}
              </p>
              <h2
                id={titleId}
                className="max-w-[14ch] font-display text-[clamp(1.75rem,3.6vw,4rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-balance text-white lg:mt-3"
              >
                <TightPunctuation strong>{scene.title[0]}</TightPunctuation>{" "}
                <span className="text-slate-300">
                  <TightPunctuation strong>{scene.title[1]}</TightPunctuation>
                </span>
              </h2>
              <p className="mt-3 flex max-w-[40ch] items-baseline gap-2 text-[15px] leading-snug font-medium text-white lg:mt-5 lg:text-lg">
                <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.08em] text-accent uppercase ring-1 ring-white/15">
                  How to
                </span>
                <span className="text-pretty">{scene.howTo}</span>
              </p>
              <ol className="st-caps mt-4 lg:mt-7">
                {scene.captions.map((caption) => (
                  <li key={caption.title}>
                    <p className="font-display text-lg leading-[1.2] font-bold tracking-[-0.02em] text-white lg:text-[1.625rem]">
                      <TightPunctuation strong>{caption.title}</TightPunctuation>
                    </p>
                    <p className="mt-1.5 max-w-[40ch] text-base leading-relaxed text-pretty text-slate-200 lg:text-lg">
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
      className="st-theater relative overflow-clip bg-ink text-slate-200"
    >
      <div className={`${container} relative z-10 pt-4`}>
        <a
          href="#pricing"
          className={`inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-slate-300 underline decoration-white/30 underline-offset-4 hover:text-white hover:decoration-white ${focusDark}`}
        >
          Skip the tour → Pricing
        </a>
      </div>

      <div className="relative">
        {/* Trilho de capítulos (computador): por cima das cenas, preso ao lado o tempo todo. */}
        <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
          <div className={`${container} h-full`}>
            <nav
              aria-label="Tour"
              className="pointer-events-auto sticky top-16 flex h-[calc(100svh-4rem)] w-36 flex-col justify-center"
            >
              <ol>
                {SCENES.map((scene, index) => (
                  <li key={scene.id}>
                    <a
                      href={`#${scene.id}`}
                      data-rail-link
                      className={`st-rail relative flex min-h-11 items-center gap-2.5 rounded-sm pl-3.5 text-[13px] leading-tight font-semibold text-slate-300 transition-colors duration-200 hover:text-white ${focusDark}`}
                    >
                      <span className="tabular-nums opacity-70">{index + 1}</span>
                      {scene.chapter}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        {SCENES.map((scene, index) => (
          <Scene key={scene.id} scene={scene} index={index} />
        ))}
      </div>

      <ScrollStage />
    </section>
  );
}
