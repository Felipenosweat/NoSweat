"use client";

import { useEffect } from "react";

// Motor do tour da landing (pequeno de propósito). Um ouvinte de rolagem passivo, limitado a um
// quadro por vez (requestAnimationFrame), e um IntersectionObserver para só calcular as cenas
// que estão na tela. Escreve direto no DOM, sem estado do React por quadro:
// - `data-story="on"` no #story (liga as cenas fixas no CSS);
// - em cada cena: `--p` (0–1), `--in` (0–1, o fundo da cena entrando por cima do anterior) e
//   `data-beat` (o CSS troca as batidas com transições);
// - no hero [data-hero]: `--hero-p` (0–1, os celulares se endireitam e sobem);
// - o pedaço da frase digitada em [data-typewriter];
// - `aria-current="step"` no capítulo ativo do trilho;
// - na faixa [data-lights]: `--l` (0–1) e `data-lit` (texto escuro depois da metade).
// Sem ouvintes de roda/toque, sem preventDefault, sem snap. Com movimento reduzido ou tela
// baixa (< 600px) não liga nada: fica a versão estática que veio do servidor.

/** Altura do cabeçalho fixo (h-16): é onde a cena começa a ficar presa. */
const HEADER = 64;
/** Parte da primeira batida em que a frase termina de ser digitada. */
const TYPE_UNTIL = 0.8;
/** Distância (px) antes de fixar em que a cena ainda está no estado "antes" (data-pre). */
const PRE_MARGIN = 32;
/** Parte da tela (de baixo para cima) em que o fundo da próxima cena aparece por inteiro. */
const FADE_SPAN = 0.7;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function ScrollStage() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-story]");
    if (!root) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"));
    const rail = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-rail-link]"));
    const lights = document.querySelector<HTMLElement>("[data-lights]");
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const finalBeats = new Map(scenes.map((scene) => [scene, scene.dataset.beat ?? "0"]));

    // Texto da frase: cada nó de texto guarda o seu pedaço completo.
    const writer = root.querySelector<HTMLElement>("[data-typewriter]");
    const writerScene = writer?.closest<HTMLElement>("[data-scene]") ?? null;
    const pieces: { node: Text; text: string }[] = [];
    if (writer) {
      const walker = document.createTreeWalker(writer, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        pieces.push({ node: node as Text, text: node.textContent ?? "" });
      }
    }
    const total = pieces.reduce((sum, piece) => sum + piece.text.length, 0);
    let typed = -1;
    const type = (count: number) => {
      if (!writer || count === typed) return;
      typed = count;
      let left = count;
      for (const piece of pieces) {
        const next = piece.text.slice(0, Math.max(0, left));
        if (piece.node.data !== next) piece.node.data = next;
        left -= piece.text.length;
      }
      if (count < total) writer.dataset.typing = "";
      else delete writer.dataset.typing;
    };

    const media = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (min-height: 600px)",
    );
    const onScreen = new Set<Element>();
    // Quem acabou de sair da tela ganha uma última medida (o fundo não fica pela metade).
    const leaving = new Set<Element>();
    let frame = 0;
    let active = -1;
    let enabled = false;

    const setActive = (index: number) => {
      if (index === active) return;
      active = index;
      rail.forEach((link, i) => {
        if (i === index) link.setAttribute("aria-current", "step");
        else link.removeAttribute("aria-current");
      });
    };

    const measure = (scene: HTMLElement, vh: number) => {
      const beats = Number(scene.dataset.beats) || 1;
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(1, rect.height - vh + HEADER);
      const p = clamp((HEADER - rect.top) / travel);
      scene.style.setProperty("--p", p.toFixed(3));
      // O fundo começa uma tela antes da cena: entra enquanto o topo dela sobe pela tela.
      scene.style.setProperty("--in", clamp((vh - rect.top) / (vh * FADE_SPAN)).toFixed(3));
      const pre = scene.hasAttribute("data-pre") && rect.top > HEADER + PRE_MARGIN;
      const beat = pre ? "-1" : String(Math.min(beats - 1, Math.floor(p * beats)));
      if (scene.dataset.beat !== beat) scene.dataset.beat = beat;
      if (scene === writerScene) type(Math.round(clamp(p / (TYPE_UNTIL / beats)) * total));
      return rect;
    };

    const update = (all = false) => {
      frame = 0;
      const vh = window.innerHeight;
      scenes.forEach((scene, index) => {
        if (!all && !onScreen.has(scene) && !leaving.has(scene)) return;
        const rect = measure(scene, vh);
        if (rect.top <= vh / 2 && rect.bottom > vh / 2) setActive(index);
      });
      if (hero && (all || onScreen.has(hero) || leaving.has(hero))) {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty("--hero-p", clamp(-rect.top / Math.max(1, rect.height)).toFixed(3));
      }
      if (lights && (all || onScreen.has(lights))) {
        const rect = lights.getBoundingClientRect();
        const l = clamp((vh - rect.top) / (rect.height + vh * 0.4));
        lights.style.setProperty("--l", l.toFixed(3));
        const lit = l > 0.5 ? "true" : "false";
        if (lights.dataset.lit !== lit) lights.dataset.lit = lit;
      }
      leaving.clear();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => update());
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else if (onScreen.delete(entry.target)) leaving.add(entry.target);
      }
      schedule();
    });

    const enable = () => {
      if (enabled) return;
      enabled = true;
      root.dataset.story = "on";
      scenes.forEach((scene) => observer.observe(scene));
      if (lights) observer.observe(lights);
      if (hero) observer.observe(hero);
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      // Primeira passada em todas as cenas: cada uma já começa na batida certa.
      update(true);
    };

    const disable = () => {
      if (!enabled) return;
      enabled = false;
      observer.disconnect();
      onScreen.clear();
      leaving.clear();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      frame = 0;
      root.dataset.story = "off";
      // Volta ao estado estático do servidor.
      scenes.forEach((scene) => {
        scene.dataset.beat = finalBeats.get(scene) ?? "0";
        scene.style.removeProperty("--p");
        scene.style.removeProperty("--in");
      });
      type(total);
      setActive(-1);
      hero?.style.removeProperty("--hero-p");
      if (lights) {
        lights.style.removeProperty("--l");
        delete lights.dataset.lit;
      }
    };

    const sync = () => (media.matches ? enable() : disable());
    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
      disable();
    };
  }, []);

  return null;
}
