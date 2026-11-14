"use client";

import type { SiteSpec } from "@nosweat/schema";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { siteBlocks } from "./assemble";
import { BrowserFrame, PhoneFrame } from "./Frames";
import { tradeOf, tradeStore } from "./trades";
import { h2Class, shell } from "./type";

// "From a sentence to a live site" (#story). A mesma moldura do topo passa por três estados
// enquanto a pessoa rola: (1) o brief se escreve num campo, (2) o site se monta bloco a bloco e
// (3) o celular entra com a versão móvel e aparece a barra "Live at <ramo>.nosweatfd.com".
// O site é o do ramo escolhido no topo (tradeStore).
// - Computador (≥ 1024 px) com movimento: a seção fica presa (GSAP ScrollTrigger, carregado só
//   aqui, com import dinâmico) e uma linha do tempo ligada à rolagem (scrub) troca os estados.
//   power3/expo out, sem quique e sem loop.
// - Celular, "reduzir movimento" ou sem JavaScript: os três passos em sequência, parados, cada um
//   com a sua cena já no estado final (nada escondido).
// Os sites (ScaledSite) só montam quando a seção chega perto da tela.

const ScaledSite = dynamic(() => import("./ScaledSite"), { ssr: false });

const STEPS = [
  { title: "Write one sentence", body: "What you do and where. About a minute." },
  {
    title: "Get your first draft",
    body: "Pages, words and a contact form, set up for your business. Click to change anything, or ask the AI in plain words.",
  },
  { title: "Go live", body: "A free nosweatfd.com address, or your own domain on Pro." },
] as const;

const PIN_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

function StepCopy({ index }: { index: number }) {
  const step = STEPS[index];
  if (!step) return null;
  return (
    <>
      <p
        aria-hidden="true"
        className="font-display text-sm font-bold tracking-[-0.01em] text-brand tabular-nums"
      >
        0{index + 1}
      </p>
      <h3 className="mt-3 font-display text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[1.05] font-extrabold tracking-[-0.035em] text-ink">
        {step.title}
      </h3>
      <p className="mt-4 max-w-[30ch] text-lg leading-[1.55] text-pretty text-slate-600">
        {step.body}
      </p>
    </>
  );
}

/** O campo do /create com o brief (a cena 1). `typed` = o texto já escrito. */
function PromptCard({ typed, full }: { typed: string; full?: boolean }) {
  return (
    <div className="w-full max-w-[34rem] rounded-2xl bg-white p-5 text-left shadow-[0_30px_60px_-30px_rgb(7_27_51/0.35)] ring-1 ring-slate-200 sm:p-6">
      <p className="text-sm font-medium text-slate-600">Describe your business</p>
      <p className="mt-3 min-h-[3.2em] font-display text-[clamp(1.25rem,2vw,1.75rem)] leading-[1.25] font-bold tracking-[-0.025em] text-ink">
        <span data-typed>{typed}</span>
        <span
          aria-hidden="true"
          className={`ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] bg-brand ${full ? "hidden" : ""}`}
        />
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm text-slate-500">About a minute</span>
        <span className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white">
          Build my website
        </span>
      </div>
    </div>
  );
}

function LiveBar({ host }: { host: string }) {
  return (
    <p className="inline-flex items-center gap-3 rounded-full bg-ink py-2.5 pr-5 pl-4 text-[15px] font-medium text-white">
      <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
      Live at <span className="font-semibold">{host}.nosweatfd.com</span>
    </p>
  );
}

export function BuildStory({ specs }: { specs: Record<string, SiteSpec> }) {
  const slug = useSyncExternalStore(tradeStore.subscribe, tradeStore.get, tradeStore.getServer);
  const trade = tradeOf(slug);
  const spec = specs[trade.slug];
  const brief = `${trade.phrase} in ${trade.city}.`;
  const section = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const onReady = useCallback((el: HTMLElement) => setRoot(el), []);

  // Monta os sites só quando a seção chega perto da tela.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Presa à rolagem só no computador e com movimento permitido.
  useEffect(() => {
    const query = window.matchMedia(PIN_QUERY);
    const update = () => setPinned(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // A linha do tempo (só no modo preso, depois que o site da moldura existe).
  useEffect(() => {
    const host = section.current;
    if (!pinned || !root || !host) return;
    let disposed = false;
    let revert: (() => void) | undefined;
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        const q = <T extends Element = HTMLElement>(sel: string) =>
          Array.from(host.querySelectorAll<T & HTMLElement>(sel));
        const copies = q("[data-copy]");
        const typed = host.querySelector<HTMLElement>("[data-typed]");
        const prompt = q("[data-prompt]");
        const blocks = siteBlocks(root);
        const site = root.querySelector<HTMLElement>(".ns-site");
        const frameHeight = root.clientHeight / (root.clientWidth / 1440 || 1);
        const pan = site ? Math.max(0, Math.min(1500, site.scrollHeight - frameHeight)) : 0;
        const text = { n: 0 };

        gsap.set(copies.slice(1), { autoAlpha: 0, y: 28 });
        gsap.set(blocks, { autoAlpha: 0, y: -40 });
        gsap.set(q("[data-phone]"), { xPercent: 120, autoAlpha: 0 });
        gsap.set(q("[data-live]"), { y: 24, autoAlpha: 0 });
        gsap.set(q("[data-address-live]"), { autoAlpha: 0 });
        if (typed) typed.textContent = "";

        const swap = (from: number, to: number) => {
          const tl = gsap.timeline();
          tl.to(copies[from] ?? [], { autoAlpha: 0, y: -28, duration: 0.4, ease: "power3.in" });
          tl.to(copies[to] ?? [], { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" });
          return tl;
        };

        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: {
            trigger: host.querySelector("[data-pin]"),
            start: "top top+=64",
            end: "+=320%",
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
          },
        });
        // 1. O brief se escreve.
        tl.to(text, {
          n: brief.length,
          duration: 1.4,
          ease: "none",
          onUpdate: () => {
            if (typed) typed.textContent = brief.slice(0, Math.round(text.n));
          },
        });
        tl.to({}, { duration: 0.3 });
        // 2. O campo sai e o site se monta, bloco a bloco, com a "câmera" descendo.
        tl.to(prompt, { autoAlpha: 0, y: -24, scale: 0.97, duration: 0.5, ease: "power3.in" });
        tl.add(swap(0, 1), "<");
        tl.to(
          blocks,
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.16, ease: "expo.out" },
          "<0.2",
        );
        if (site && pan > 0) {
          tl.to(site, { y: -pan, duration: 1.4, ease: "power2.inOut" }, "<0.5");
        }
        tl.to({}, { duration: 0.3 });
        // 3. No ar: o celular entra, o endereço muda e a barra aparece.
        tl.add(swap(1, 2));
        if (site && pan > 0) tl.to(site, { y: 0, duration: 0.9, ease: "power3.inOut" }, "<");
        tl.to(
          q("[data-phone]"),
          { xPercent: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out" },
          "<0.2",
        );
        tl.to(q("[data-address-draft]"), { autoAlpha: 0, duration: 0.3 }, "<0.3");
        tl.to(q("[data-address-live]"), { autoAlpha: 1, duration: 0.3 }, "<");
        tl.to(q("[data-live]"), { y: 0, autoAlpha: 1, duration: 0.6 }, "<0.1");
        tl.to({}, { duration: 0.4 });
      }, host);
      revert = () => ctx.revert();
    })();
    return () => {
      disposed = true;
      revert?.();
    };
  }, [pinned, root, brief]);

  const address = (
    <span className="relative inline-grid">
      <span data-address-draft className="col-start-1 row-start-1">
        nosweatfd.com/create
      </span>
      <span data-address-live className="col-start-1 row-start-1">
        {trade.host}.nosweatfd.com
      </span>
    </span>
  );

  return (
    <section
      ref={section}
      id="story"
      aria-labelledby="story-title"
      className="border-b border-slate-200 bg-white"
    >
      {pinned ? (
        <div data-pin className="h-[calc(100svh-4rem)] overflow-hidden">
          <div className={`${shell} grid h-full grid-cols-12 items-center gap-x-8`}>
            <div className="col-span-4">
              <h2 id="story-title" className={h2Class}>
                From a sentence to a live site.
              </h2>
              <ol className="relative mt-14 grid">
                {STEPS.map((step, index) => (
                  <li key={step.title} data-copy className="col-start-1 row-start-1">
                    <StepCopy index={index} />
                  </li>
                ))}
              </ol>
              <p className="mt-14 text-sm text-slate-600">Example site. The business is made up.</p>
            </div>
            <div className="relative col-span-8 col-start-5">
              <div aria-hidden="true" inert className="pointer-events-none relative">
                <BrowserFrame address={address}>
                  <div className="absolute inset-0">
                    {near && spec && (
                      <ScaledSite key={trade.slug} spec={spec} width={1440} onReady={onReady} />
                    )}
                  </div>
                  <div
                    data-prompt
                    className="absolute inset-0 flex items-center justify-center bg-surface p-10"
                  >
                    <PromptCard typed={brief} />
                  </div>
                </BrowserFrame>
                <div data-phone className="absolute -right-6 -bottom-12 w-[23%]">
                  <PhoneFrame>
                    {near && spec && <ScaledSite key={trade.slug} spec={spec} width={390} />}
                  </PhoneFrame>
                </div>
                <div data-live className="absolute -bottom-6 left-8">
                  <LiveBar host={trade.host} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${shell} py-24 lg:py-32`}>
          <h2 id="story-title" className={`lp-reveal ${h2Class} max-w-[14ch]`}>
            From a sentence to a live site.
          </h2>
          <ol className="mt-14 grid gap-20 lg:mt-20 lg:gap-28">
            {STEPS.map((step, index) => (
              <li key={step.title} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-x-8">
                <div className="lg:col-span-4">
                  <StepCopy index={index} />
                </div>
                <div aria-hidden="true" inert className="pointer-events-none lg:col-span-8">
                  {index === 0 && (
                    <div className="flex justify-center rounded-[10px] bg-surface px-5 py-12 sm:py-16">
                      <PromptCard typed={brief} full />
                    </div>
                  )}
                  {index === 1 && (
                    <BrowserFrame address={`${trade.host}.nosweatfd.com`}>
                      {near && spec && <ScaledSite key={trade.slug} spec={spec} width={1440} />}
                    </BrowserFrame>
                  )}
                  {index === 2 && (
                    <div className="flex flex-col items-center gap-8 rounded-[10px] bg-surface px-5 py-12">
                      <PhoneFrame className="w-[min(68%,260px)]">
                        {near && spec && <ScaledSite key={trade.slug} spec={spec} width={390} />}
                      </PhoneFrame>
                      <LiveBar host={trade.host} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-slate-600">Example sites. The businesses are made up.</p>
        </div>
      )}
    </section>
  );
}
