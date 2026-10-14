import { fixtures } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import type { CSSProperties, ReactNode } from "react";
import { container } from "@/components/marketing/styles";
import { searchSnippet } from "@/components/site-metadata";

// "O que vem junto": cada recurso mostrado com a interface de verdade, não com desenho.
// - Ligar e domínio: o próprio <SiteRenderer> de um site de exemplo (negócio fictício), em
//   escala, inerte (`inert`: ninguém liga nem clica sem querer) e escondido de leitores de tela.
// - Pedidos, pedir mudança e busca: HTML que reproduz o que o produto faz hoje (o e-mail de
//   aviso, o painel "Describe a change" do editor e a regra de título/descrição dos sites).
// Conteúdo de exemplo sempre rotulado como exemplo.

const joe = fixtures["joes-plumbing"];
const sparkle = fixtures["sparkle-cleaning"];

/** Site de verdade em miniatura: largura real `width` (as consultas de container funcionam) e escala por CSS. */
function ScaledSite({
  spec,
  width,
  height,
  scale,
  className = "",
}: {
  spec: SiteSpec;
  width: number;
  height: number;
  /** Classes que definem --s (escala), ex.: "[--s:0.6] lg:[--s:0.7]". Vazio = herda do pai. */
  scale: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden ${scale} ${className}`}
      style={
        {
          width: `calc(${width}px * var(--s))`,
          height: `calc(${height}px * var(--s))`,
        } as CSSProperties
      }
    >
      <div
        inert
        className="absolute top-0 left-0 origin-top-left overflow-hidden"
        style={{ width, height, transform: "scale(var(--s))" }}
      >
        <SiteRenderer spec={spec} />
      </div>
    </div>
  );
}

function Feature({
  index,
  title,
  body,
  demo,
  note,
  flip = false,
}: {
  index: number;
  title: string;
  body: ReactNode;
  demo: ReactNode;
  note?: string;
  flip?: boolean;
}) {
  return (
    <li
      data-l-reveal
      className="grid grid-cols-1 items-center gap-10 border-t border-white/10 py-14 lg:grid-cols-12 lg:gap-8 lg:py-20"
    >
      <div className={`lg:col-span-4 ${flip ? "lg:order-2 lg:col-start-9" : ""}`}>
        <p className="text-sm font-semibold text-[#4da3ff] tabular-nums">
          {String(index).padStart(2, "0")}
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-white lg:text-3xl">{title}</h3>
        <div className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-slate-300">{body}</div>
        {note && <p className="mt-5 text-sm text-slate-400">{note}</p>}
      </div>
      <div
        className={`min-w-0 lg:col-span-7 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-6"}`}
      >
        {demo}
      </div>
    </li>
  );
}

/** Celular com o site de exemplo e a barra fixa de ligar; um toque leve mostra onde apertar. */
function CallDemo() {
  return (
    <div className="flex items-end justify-center gap-6 lg:justify-start">
      <div className="relative rounded-[2.6rem] bg-[#0b1a33] p-2.5 shadow-[0_40px_100px_-30px_rgb(0_0_0/.9)] ring-1 ring-white/15 [--s:0.7] sm:[--s:0.78]">
        <div className="overflow-hidden rounded-[2.1rem] bg-white">
          <ScaledSite spec={joe} width={390} height={780} scale="" />
        </div>
        {/* Onde o polegar aperta: em cima do "Call now" da barra fixa. */}
        <span
          aria-hidden="true"
          className="l-tap pointer-events-none absolute size-12 rounded-full border-2 border-[#4da3ff]"
          style={{
            left: "calc(0.625rem + 101px * var(--s) - 1.5rem)",
            top: "calc(0.625rem + 744px * var(--s) - 1.5rem)",
          }}
        />
      </div>
      <p className="hidden max-w-[13rem] pb-10 text-sm leading-relaxed text-slate-400 sm:block">
        <span className="mb-2 block h-px w-12 bg-[#4da3ff]" />
        The bar stays on screen while visitors scroll. “Call now” opens their phone’s dialer.
      </p>
    </div>
  );
}

/** O e-mail de aviso como o dono recebe (mesmos campos de server/notify), com dados de exemplo. */
function InboxDemo() {
  return (
    <div aria-hidden="true" className="relative max-w-xl">
      <div className="rounded-2xl bg-white text-[15px] text-[#1a1a1a] shadow-[0_40px_100px_-30px_rgb(0_0_0/.9)]">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#0066ff] text-xs font-bold text-white">
            NS
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">No Sweat</p>
            <p className="text-xs text-slate-500">to service@joesplumbing.example.com</p>
          </div>
          <span className="text-xs text-slate-500">9:41 AM</span>
        </div>
        <div className="px-6 py-5">
          <p className="text-base font-semibold">New request from your website: Dana Moore</p>
          <p className="mt-4">
            You have a new request from <strong>Joe’s Plumbing</strong>’s website.
          </p>
          <dl className="mt-4 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5">
            <dt className="text-slate-500">Name</dt>
            <dd>Dana Moore</dd>
            <dt className="text-slate-500">Phone</dt>
            <dd className="tabular-nums">(512) 555-0187</dd>
            <dt className="text-slate-500">Email</dt>
            <dd>dana.moore@example.com</dd>
          </dl>
          <p className="mt-4 text-slate-500">Message</p>
          <p>The water heater in our garage is leaking. Could someone come by Thursday morning?</p>
          <p className="mt-4 font-medium text-[#0066ff] underline underline-offset-2">
            See all requests
          </p>
        </div>
      </div>
      <div className="absolute -right-3 -bottom-6 hidden w-60 rounded-xl bg-[#0b1a33] p-4 text-sm text-slate-200 shadow-xl ring-1 ring-white/10 sm:block lg:-right-10">
        <p className="text-xs font-semibold text-slate-400">Saved in your dashboard</p>
        <p className="mt-2 flex justify-between gap-3">
          <span className="font-semibold text-white">Dana Moore</span>
          <span className="text-slate-400">9:41 AM</span>
        </p>
        <p className="truncate text-slate-400">The water heater in our garage…</p>
      </div>
    </div>
  );
}

/** Painel "Describe a change" do editor e o topo do site antes e depois do pedido. */
function AskDemo() {
  const hero = sparkle.sections.find((s) => s.type === "hero");
  const before = hero?.type === "hero" ? hero.title : "";
  const after = "Come home to a clean house in Worcester";
  return (
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div className="rounded-2xl bg-white p-5 text-[#071b33] shadow-[0_40px_100px_-30px_rgb(0_0_0/.9)]">
        <p className="text-[15px] font-semibold">Describe a change</p>
        <p className="mt-3 rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-snug">
          Make the headline warmer and mention Worcester.
        </p>
        <p className="mt-3 inline-flex rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-semibold text-white">
          Apply
        </p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
          <p className="text-xs font-medium text-slate-500">Last change</p>
          <p className="mt-1 text-sm leading-relaxed">
            Changed the headline. Nothing else was touched.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Saved as a draft. Publish from your site page when you’re happy.
          </p>
        </div>
      </div>
      {/* Topo do site de exemplo nas cores e fontes dele (tema da fixture). */}
      <div
        className="flex flex-col justify-center rounded-2xl p-6 shadow-[0_40px_100px_-30px_rgb(0_0_0/.9)] sm:p-8"
        style={{ background: "#f4f7f6", color: sparkle.theme.text }}
      >
        <p className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">Draft</span>
          <span className="text-slate-600">Preview · Sparkle &amp; Co. Cleaning</span>
        </p>
        <p className="mt-5 text-sm text-slate-600 line-through decoration-slate-400">{before}</p>
        <p
          className="mt-2 text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.08] font-bold"
          style={{ fontFamily: "var(--ns-font-fresh-heading)" }}
        >
          <span className="bg-[linear-gradient(transparent_62%,#fde68a_62%)]">{after}</span>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          Weekly, biweekly and one-time house cleaning across Worcester County.
        </p>
        <p
          className="mt-5 inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ background: sparkle.theme.primary }}
        >
          Get a Cleaning Quote
        </p>
      </div>
    </div>
  );
}

/** Barra de endereço com o site de exemplo e os dois registros de DNS que o produto pede. */
function DomainDemo() {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgb(0_0_0/.9)]">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-[#f1f5f9] px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-white px-3 py-1 text-sm text-[#071b33]">
            <svg
              viewBox="0 0 16 16"
              className="size-3.5 shrink-0 text-slate-500"
              fill="currentColor"
            >
              <path d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2h.5A1.5 1.5 0 0 1 13.5 8.5v5A1.5 1.5 0 0 1 12 15H4a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 4 7h.5Zm1.5 0h4V5a2 2 0 1 0-4 0v2Z" />
            </svg>
            <span className="truncate font-medium">joesplumbing.com</span>
          </span>
        </div>
        <ScaledSite
          spec={joe}
          width={1280}
          height={600}
          scale="[--s:0.27] min-[400px]:[--s:0.28] sm:[--s:0.46] md:[--s:0.55] lg:[--s:0.355] xl:[--s:0.425]"
          className="max-w-full"
        />
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#0b1a33] p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">DNS records</p>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            Connected · example
          </p>
        </div>
        <table className="mt-3 w-full text-left font-mono text-[13px] text-slate-300">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-1 font-normal">Type</th>
              <th className="pb-1 font-normal">Name</th>
              <th className="pb-1 font-normal">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-0.5">A</td>
              <td>@</td>
              <td>76.76.21.21</td>
            </tr>
            <tr>
              <td className="py-0.5">CNAME</td>
              <td>www</td>
              <td className="break-all">cname.vercel-dns.com</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Resultado de busca com o título e a descrição que o site de exemplo realmente publica. */
function SearchDemo() {
  const { title, description } = searchSnippet(joe);
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="rounded-2xl bg-white p-5 font-[arial,sans-serif] shadow-[0_40px_100px_-30px_rgb(0_0_0/.9)]">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#1D4ED8] text-[10px] font-bold text-white">
            JP
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm text-[#202124]">Joe’s Plumbing</span>
            <span className="block truncate text-xs text-[#4d5156]">https://joesplumbing.com</span>
          </span>
        </div>
        <p className="mt-2 text-xl leading-snug text-[#1a0dab]">{title}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#4d5156]">{description}</p>
      </div>
      <dl className="grid gap-2 rounded-2xl border border-white/10 bg-[#0b1a33] p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-400">Page title</dt>
          <dd className="mt-0.5 text-slate-200">Business name and city</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Description</dt>
          <dd className="mt-0.5 text-slate-200">The summary from the top of the site</dd>
        </div>
      </dl>
    </div>
  );
}

export function Features() {
  return (
    <section aria-labelledby="features-title" className="relative py-28 lg:py-40">
      <div className={container}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            id="features-title"
            data-l-reveal
            className="l-display text-[clamp(2.5rem,5.5vw,5rem)] text-white lg:col-span-7"
          >
            A website that <span className="l-serif l-gradient-text">answers the phone</span> for
            you.
          </h2>
          <p
            data-l-reveal="0.1"
            className="text-lg leading-relaxed text-slate-300 lg:col-span-4 lg:col-start-9"
          >
            Every plan comes with the editor, a contact form and AI edits. No plugins, nothing to
            install, nothing to learn.
          </p>
        </div>

        <ol className="mt-16 border-b border-white/10">
          <Feature
            index={1}
            title="A call button on every page"
            body="On a phone, the call button stays at the bottom of the screen while visitors read. Every page is laid out for small screens first, then for computers."
            note="Shown: the fictional Joe’s Plumbing example on a phone."
            demo={<CallDemo />}
          />
          <Feature
            index={2}
            flip
            title="Requests in your inbox"
            body="When someone fills in your contact form, you get an email with their name, phone, email and message. Every request is also saved on your site’s page in the dashboard."
            note="Example request. The names and details are made up."
            demo={<InboxDemo />}
          />
          <Feature
            index={3}
            title="Change it by asking"
            body="Type the change in your own words. You get a new draft and a short summary of what changed. Nothing goes live until you publish, and you can undo."
            demo={<AskDemo />}
          />
          <li
            data-l-reveal
            className="grid grid-cols-1 gap-14 border-t border-white/10 py-14 lg:grid-cols-2 lg:gap-12 lg:py-20"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#4da3ff] tabular-nums">04</p>
              <h3 className="mt-3 text-2xl font-semibold text-white lg:text-3xl">
                Your own domain
              </h3>
              <p className="mt-4 mb-8 max-w-[44ch] text-[17px] leading-relaxed text-slate-300">
                On Pro and Premium, connect a domain you already own. We show the two records to add
                at your domain company and check them for you.
              </p>
              <DomainDemo />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#4da3ff] tabular-nums">05</p>
              <h3 className="mt-3 text-2xl font-semibold text-white lg:text-3xl">
                Set up for search
              </h3>
              <p className="mt-4 mb-8 max-w-[44ch] text-[17px] leading-relaxed text-slate-300">
                Every site gets a page title and a description written from your business details,
                so search results say who you are and where you work. Rankings are up to the search
                engines.
              </p>
              <SearchDemo />
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
