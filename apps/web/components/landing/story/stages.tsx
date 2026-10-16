import Image from "next/image";
import { StatusBadge } from "@/components/DashboardUi";
import { DashboardHome } from "@/components/landing/demos/DashboardDemo";
import { EditorPanel } from "@/components/landing/demos/EditorDemo";
import { ClientCard, ClientList, RequestEmail } from "@/components/landing/demos/ClientsDemo";
import { DnsRecords } from "@/components/landing/demos/DomainDemo";
import { BrowserFrame, ExampleTag, PhoneFrame } from "@/components/landing/demos/Frames";
import { SocialCalendar, SocialPost } from "@/components/landing/demos/SocialDemo";

// O que aparece no "palco" de cada cena do tour (sempre aria-hidden; cada cena tem um resumo
// sr-only). O HTML do servidor já mostra o estado final de cada cena; as classes `st-*` são os
// ganchos que o landing.css usa para trocar as batidas (`data-beat` na <section>).
// Tudo é do negócio fictício Sparkle & Co. Cleaning, com o selo "Example".

/* ---------- 1. Describe ---------- */

export function DescribeStage() {
  return (
    <div className="relative w-full max-w-[620px] rounded-2xl bg-white p-5 text-ink shadow-[0_40px_100px_-30px_rgb(0_0_0/.7)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-500">Tell us about your business</p>
        <ExampleTag />
      </div>
      {/* O controle de rolagem reescreve só os nós de texto dentro de [data-typewriter]. */}
      <p className="mt-3 min-h-[4.7em] text-[clamp(1.0625rem,1.8vw,1.375rem)] leading-[1.55]">
        <span data-typewriter>
          {"Sparkle & Co. — "}
          <mark className="st-mark">house cleaning</mark>
          {" in "}
          <mark className="st-mark">Worcester, MA</mark>
          {". "}
          <mark className="st-mark">Weekly and move-out</mark>
          {" cleans. Call "}
          <mark className="st-mark">(508) 555-0142</mark>
          {"."}
        </span>
        <span className="st-caret" />
      </p>
      <p className="mt-4 flex flex-wrap gap-2">
        {["House cleaning", "Worcester, MA", "(508) 555-0142", "Weekly & move-out"].map((chip) => (
          <span
            key={chip}
            className="st-chip rounded-lg bg-brand/10 px-2.5 py-1.5 text-[13px] font-semibold text-brand-dark tabular-nums"
          >
            {chip}
          </span>
        ))}
      </p>
    </div>
  );
}

/* ---------- 2. Build ---------- */

// Posições (em % do quadro 1280×860) dos blocos do site de exemplo Sparkle & Co. na
// composição "modular", medidas no site renderizado (ver docs/design/README.md).
const LAYERS = {
  header: { x: 5, y: 2.79, w: 90, h: 7.44 },
  text: { x: 7.5, y: 13.49, w: 56.35, h: 62.06 },
  photo: { x: 64.79, y: 13.49, w: 27.71, h: 62.06 },
  hours: { x: 7.5, y: 76.95, w: 42.03, h: 18.37 },
} as const;

const box = (b: { x: number; y: number; w: number; h: number }) => ({
  left: `${b.x}%`,
  top: `${b.y}%`,
  width: `${b.w}%`,
  height: `${b.h}%`,
});

/** Uma camada do site de exemplo, recortada da captura (eager: são pequenas e entram já). */
function Layer({ name, sizes }: { name: "header" | "text" | "photo" | "hours"; sizes: string }) {
  return (
    <Image
      src={`/landing/build/${name}.webp`}
      alt=""
      fill
      sizes={sizes}
      loading="eager"
      className="object-cover"
    />
  );
}

const SIZES = {
  header: "(min-width: 1024px) 690px, 90vw",
  text: "(min-width: 1024px) 430px, 56vw",
  photo: "(min-width: 1024px) 215px, 28vw",
  hours: "(min-width: 1024px) 320px, 42vw",
} as const;

// Sem caixas cinzas de "lugar reservado": cada batida só mostra conteúdo de verdade.
// Batida 0: topo e texto; 1: a foto entra; 2: o horário (de segunda a sexta).
export function BuildStage() {
  return (
    <BrowserFrame url="nosweatfd.com/create" ratio={1280 / 860}>
      <div className="absolute" style={box(LAYERS.header)}>
        <Layer name="header" sizes={SIZES.header} />
      </div>
      <div className="st-b-text absolute" style={box(LAYERS.text)}>
        <Layer name="text" sizes={SIZES.text} />
      </div>
      <div className="st-b-photo absolute overflow-hidden rounded-3xl" style={box(LAYERS.photo)}>
        <div className="st-b-photo-img absolute inset-0">
          <Layer name="photo" sizes={SIZES.photo} />
        </div>
      </div>
      <div className="st-b-hours absolute" style={box(LAYERS.hours)}>
        {/* A linha de sábado fica recortada: ela só aparece na cena Edit, com "Updated". */}
        <div className="st-hours-clip absolute inset-0">
          <Layer name="hours" sizes={SIZES.hours} />
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------- 3. Edit ---------- */

// O mesmo site da Sparkle & Co., agora no editor. Batidas: 0 a seção clicada ganha o contorno;
// 1 a IA acrescenta o sábado ("Updated"); 2 a foto do dono entra no lugar; 3 o estilo "Harbor"
// muda as cores (cópias com hue-rotate das camadas, que aparecem por opacidade).
export function EditStage() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <BrowserFrame
        url="nosweatfd.com/sites/sparkle/edit"
        ratio={1280 / 860}
        className="st-e-frame"
      >
        <div className="absolute" style={box(LAYERS.header)}>
          <Layer name="header" sizes={SIZES.header} />
          <div className="st-e-tint absolute inset-0">
            <Layer name="header" sizes={SIZES.header} />
          </div>
        </div>
        <div className="absolute" style={box(LAYERS.text)}>
          <Layer name="text" sizes={SIZES.text} />
          <div className="st-e-tint absolute inset-0">
            <Layer name="text" sizes={SIZES.text} />
          </div>
          <span className="st-e-outline absolute -inset-1 rounded-[1.6rem] ring-2 ring-brand" />
        </div>
        <div className="absolute overflow-hidden rounded-3xl" style={box(LAYERS.photo)}>
          <Layer name="photo" sizes={SIZES.photo} />
          <div className="st-e-photo absolute inset-0">
            <Image
              src="/photos/crew.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 215px, 28vw"
              quality={60}
              className="object-cover"
            />
          </div>
        </div>
        <div className="absolute" style={box(LAYERS.hours)}>
          <div className="st-e-hours st-hours-clip absolute inset-0">
            <Layer name="hours" sizes={SIZES.hours} />
            <div className="st-e-tint absolute inset-0">
              <Layer name="hours" sizes={SIZES.hours} />
            </div>
          </div>
          <span className="st-e-updated absolute -top-2.5 right-3">
            <StatusBadge tone="live">Updated</StatusBadge>
          </span>
        </div>
      </BrowserFrame>
      <div className="absolute right-0 bottom-[2%] w-[min(16rem,50%)]">
        <EditorPanel />
      </div>
    </div>
  );
}

/* ---------- 4. Five layouts ---------- */

/** As cinco composições, cada uma num site de exemplo (fixtures de @nosweat/fixtures). */
export const LOOKS = [
  {
    slug: "joes-plumbing",
    layout: "Service-led",
    business: "Joe’s Plumbing",
    place: "Austin, TX",
    body: "Phone and services first, for trades that live on calls.",
  },
  {
    slug: "sparkle-cleaning",
    layout: "Modular",
    business: "Sparkle & Co. Cleaning",
    place: "Worcester, MA",
    body: "Clear blocks for services, hours and the towns you cover.",
  },
  {
    slug: "glow-salon",
    layout: "Editorial",
    business: "Glow Salon",
    place: "Miami, FL",
    body: "A big photo and a magazine feel, for work that sells on looks.",
  },
  {
    slug: "rosas-kitchen",
    layout: "Immersive",
    business: "Rosa’s Kitchen",
    place: "San Diego, CA",
    body: "A full-screen photo that sets the mood.",
  },
  {
    slug: "hale-ortiz",
    layout: "Typographic",
    business: "Hale & Ortiz",
    place: "Denver, CO",
    body: "Type does the talking when you don’t have photos yet.",
  },
] as const;

export function LooksStage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <div className="flex w-full max-w-[760px] gap-0.5 rounded-lg border border-white/15 bg-ink/60 p-[3px] backdrop-blur-md">
        {LOOKS.map((look, index) => (
          <span
            key={look.slug}
            className={`st-seg st-seg-${index} relative min-w-0 flex-1 truncate rounded-md px-1 py-2 text-center text-[11px] font-semibold sm:text-xs`}
          >
            <span className="relative">{look.layout}</span>
          </span>
        ))}
      </div>
      <BrowserFrame url="nosweatfd.com/examples" ratio={1.6} className="[--st-offset:5.5rem]">
        {LOOKS.map((look, index) => (
          <div key={look.slug} className={`st-look st-look-${index} absolute inset-0 bg-white`}>
            <Image
              src={`/landing/wall/${look.slug}-top.webp`}
              alt=""
              fill
              sizes="(min-width: 1024px) 760px, 92vw"
              className="object-cover object-top"
            />
          </div>
        ))}
      </BrowserFrame>
    </div>
  );
}

/* ---------- 5. Go live ---------- */

export function LiveStage() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <BrowserFrame
        ratio={1.6}
        className="st-live-frame"
        badge={
          <span className="hidden sm:inline-flex">
            <StatusBadge tone="live">Published</StatusBadge>
          </span>
        }
        url={
          <>
            <span className="st-url-free col-start-1 row-start-1 truncate">
              nosweatfd.com/s/<span className="font-semibold text-brand">sparkle-co-cleaning</span>
            </span>
            <span className="st-url-own col-start-1 row-start-1 truncate font-semibold text-ink">
              sparkle-cleaning.example
            </span>
          </>
        }
      >
        <Image
          src="/landing/wall/sparkle-cleaning-top.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 760px, 92vw"
          className="object-cover object-top"
        />
      </BrowserFrame>
      <div className="st-live-phone absolute right-[2%] bottom-0 w-[min(11rem,30%)]">
        <PhoneFrame src="/landing/wall/phone-sparkle-cleaning-top.webp" sizes="180px" />
      </div>
      <div className="st-live-dns absolute bottom-[4%] left-0 w-[min(22rem,66%)]">
        <DnsRecords />
      </div>
    </div>
  );
}

/* ---------- 6. Clients ---------- */

export function ClientsStage() {
  const layer = "absolute inset-0 px-5 pt-10 pb-5 sm:px-6";
  return (
    <div className="relative h-[min(100%,26rem)] w-full max-w-[640px] overflow-hidden rounded-2xl bg-white text-ink shadow-[0_40px_100px_-30px_rgb(0_0_0/.7)]">
      <ExampleTag className="absolute top-3 right-3 z-10" />
      <div className={`st-c-mail ${layer}`}>
        <RequestEmail />
      </div>
      <div className={`st-c-list ${layer}`}>
        <ClientList />
      </div>
      <div className={`st-c-card ${layer}`}>
        <ClientCard />
      </div>
    </div>
  );
}

/* ---------- 7. Instagram ---------- */

export function SocialStage() {
  return (
    <div className="relative w-full max-w-[640px] rounded-2xl bg-white p-4 text-ink shadow-[0_40px_100px_-30px_rgb(0_0_0/.7)] sm:p-5">
      <SocialCalendar />
      <div className="st-s-post absolute right-3 bottom-3 w-[min(14rem,52%)]">
        <SocialPost />
      </div>
    </div>
  );
}

/* ---------- 8. Your day ---------- */

export function DashboardStage() {
  return (
    <div className="relative max-h-full w-full max-w-[600px] overflow-hidden rounded-2xl bg-surface p-4 shadow-[0_40px_100px_-30px_rgb(0_0_0/.7)] sm:p-5">
      <DashboardHome />
    </div>
  );
}
