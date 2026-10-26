"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { GlassButton, cx } from "@/components/glass";
import { findTarget, isVisible, rectOf, waitForTarget } from "./dom";
import {
  isComfortablyVisible,
  isPhone,
  phoneDock,
  placePopover,
  ringRadius,
  ringRect,
  sameRect,
  zoomStartRect,
  type Placement,
  type Rect,
  type Side,
  type Size,
} from "./placement";
import { stepCopy, stepCounter, type SpotlightStep } from "./steps";

// Tour guiado ("coach marks"): escurece a tela inteira, deixa um buraco arredondado em volta do
// elemento de verdade (o anel de vidro pulsa de leve) e põe um cartão de texto do lado dele.
// - O anel nasce grande e encolhe até o alvo (~300 ms, o "zoom"); a página rola para o alvo ficar
//   no meio. Com "reduzir movimento": sem zoom, sem pulso, rolagem seca.
// - Nada atrás do tour é clicável (uma camada transparente pega os cliques e o resto da página
//   fica `inert`): só os botões do cartão. Esc pula o tour; ← → trocam de passo.
// - O cartão é um diálogo (role="dialog", aria-modal) com o foco preso nele.
// - No celular o cartão fica preso embaixo, acima da barra de abas (ou em cima, se cobrir o alvo).
// - Tudo é desmontado junto com o componente: nunca sobra tela escura presa.

/** Quanto esperar a troca de página antes de pular o passo. */
const NAV_TIMEOUT_MS = 8000;
/** Rolagem suave: no máximo isto até mostrar o buraco, mesmo que ela não "pare". */
const SETTLE_MAX_MS = 900;
/** Duração do "zoom" do anel. */
const ZOOM_MS = 300;
/** Celular: da borda de baixo da tela até a base do cartão (barra de abas 4rem + respiros). */
const PHONE_DOCK_BOTTOM = 84;

/** Cor do escurecido (a tinta da marca). */
const DIM = "rgb(7 27 51 / 0.58)";

// Animações próprias do tour (não existem no globals.css). O pulso só com movimento liberado.
const TOUR_CSS = `
@keyframes ns-tour-pulse {
  0% { box-shadow: 0 0 0 0 rgb(0 102 255 / 0.5); }
  70%, 100% { box-shadow: 0 0 0 14px rgb(0 102 255 / 0); }
}
@keyframes ns-tour-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ns-tour-in-late { from { opacity: 0; } to { opacity: 1; } }
.ns-tour-in { animation: ns-tour-in 180ms ease-out both; }
/* Procurando o alvo: o cartão só aparece se demorar (nada pisca a cada passo). */
.ns-tour-in-late { animation: ns-tour-in-late 200ms ease-out 500ms both; }
@media (prefers-reduced-motion: no-preference) {
  .ns-tour-pulse { animation: ns-tour-pulse 1.8s cubic-bezier(0.2, 0.7, 0.3, 1) infinite; }
}
`;

export type SpotlightTourProps = {
  step: SpotlightStep;
  /** Muda a cada passo (e a cada troca de tela): o destaque recomeça do zero. */
  stepKey: string;
  index: number;
  total: number;
  /** A página atual é a do passo. */
  routeReady: boolean;
  reducedMotion: boolean;
  /** Texto lido pelo leitor de tela ao trocar de passo. */
  announcement: string;
  onNavigate: (route: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  /** O alvo não apareceu a tempo (ou a página não abriu): o pai pula o passo. */
  onMissing: () => void;
};

export function SpotlightTour(props: SpotlightTourProps) {
  const { stepKey, announcement, onSkip, onNext, onBack, index } = props;
  const rootRef = useRef<HTMLDivElement>(null);

  // O resto da página fica inerte (nem clique, nem foco, nem leitor de tela) enquanto o tour
  // está aberto. Só mexe no que ele mesmo marcou, e desfaz ao desmontar.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const changed: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (child === root || !(child instanceof HTMLElement) || child.inert) continue;
      child.inert = true;
      changed.push(child);
    }
    return () => {
      for (const element of changed) element.inert = false;
    };
  }, []);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onSkip();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (index > 0) onBack();
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    document.addEventListener("keydown", listener, true);
    return () => document.removeEventListener("keydown", listener, true);
  }, []);

  return createPortal(
    // Sem opacidade/filtro aqui: o vidro do cartão precisa ver a página por trás.
    <div ref={rootRef} className="fixed inset-0 z-[100]">
      <style>{TOUR_CSS}</style>
      {/* Pega todo clique fora do cartão (o alvo também não é clicável durante o tour). */}
      <div aria-hidden="true" className="absolute inset-0 cursor-default" />
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <StepSpot key={stepKey} {...props} />
    </div>,
    document.body,
  );
}

type Layout = {
  ring: Rect;
  viewport: Size;
  /** Computador/tablet: cartão ao lado do alvo. */
  placement: Placement | null;
  /** Celular: cartão preso embaixo ou em cima. */
  dock: "bottom" | "top" | null;
};

function sameLayout(a: Layout | null, b: Layout): boolean {
  if (!a) return false;
  return (
    sameRect(a.ring, b.ring) &&
    a.viewport.width === b.viewport.width &&
    a.viewport.height === b.viewport.height &&
    a.dock === b.dock &&
    a.placement?.side === b.placement?.side &&
    a.placement?.top === b.placement?.top &&
    a.placement?.left === b.placement?.left &&
    a.placement?.arrow === b.placement?.arrow
  );
}

/** Um passo: acha o alvo, rola até ele, faz o zoom e acompanha rolagem e tamanho da tela. */
function StepSpot({
  step,
  index,
  total,
  routeReady,
  reducedMotion,
  onNavigate,
  onBack,
  onNext,
  onSkip,
  onMissing,
}: SpotlightTourProps) {
  const titleId = useId();
  const bodyId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  /** O elemento em destaque (pode ser trocado se a página o redesenhar). */
  const elementRef = useRef<HTMLElement | null>(null);

  const [targetId, setTargetId] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [shown, setShown] = useState(false);
  /** Muda quando o alvo some de vez: procura de novo. */
  const [seekRound, setSeekRound] = useState(0);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [zoom, setZoom] = useState<"start" | "moving" | "done">(reducedMotion ? "done" : "start");

  const last = index >= total - 1;
  const copy = stepCopy(step, targetId);

  const missing = useEffectEvent(() => onMissing());
  const navigate = useEffectEvent((route: string) => onNavigate(route));

  // O foco entra no cartão (o "Next").
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, []);

  // 1. Página errada: vai para a do passo. Se não abrir a tempo, pula o passo.
  useEffect(() => {
    if (routeReady) return;
    navigate(step.route);
    const timer = window.setTimeout(() => missing(), NAV_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [routeReady, step.route]);

  // 2. Na página certa: espera o alvo aparecer (até ~4 s). Não apareceu: pula o passo.
  useEffect(() => {
    if (!routeReady) return;
    const controller = new AbortController();
    void waitForTarget(step.targets, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      if (!result) {
        missing();
        return;
      }
      elementRef.current = result.element;
      setTargetId(result.target.id);
      setFound(true);
    });
    return () => controller.abort();
  }, [routeReady, step.targets, seekRound]);

  /** Mede o alvo e reposiciona anel e cartão. `false` = o alvo sumiu e não há outro. */
  const measure = useEffectEvent((): boolean => {
    let element = elementRef.current;
    if (!element || !isVisible(element)) {
      // Redesenhado (streaming, troca de tamanho de tela): o mesmo alvo ou o alternativo.
      const again = findTarget(step.targets);
      if (!again) return false;
      element = again.element;
      elementRef.current = element;
      if (again.target.id !== targetId) setTargetId(again.target.id);
    }
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const ring = ringRect(rectOf(element), viewport);
    const popover = popoverRef.current;
    const size = popover
      ? { width: popover.offsetWidth, height: popover.offsetHeight }
      : { width: 0, height: 0 };
    const phone = isPhone(viewport);
    const next: Layout = {
      ring,
      viewport,
      placement: phone ? null : placePopover({ ring, popover: size, viewport }),
      dock: phone
        ? phoneDock({ ring, popoverHeight: size.height, viewport, bottomOffset: PHONE_DOCK_BOTTOM })
        : null,
    };
    setLayout((prev) => (sameLayout(prev, next) ? prev : next));
    return true;
  });

  // 3. Achou: rola até o alvo (se precisar), espera a rolagem parar e mostra o buraco.
  useEffect(() => {
    if (!found) return;
    const element = elementRef.current;
    if (!element) return;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    if (!isComfortablyVisible(rectOf(element), viewport)) {
      element.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
    const started = performance.now();
    let previous: Rect | null = null;
    let stable = 0;
    let frame = 0;
    const settle = () => {
      const current = elementRef.current ? rectOf(elementRef.current) : null;
      stable = sameRect(current, previous) ? stable + 1 : 0;
      previous = current;
      if (stable >= 3 || performance.now() - started > SETTLE_MAX_MS) {
        frame = 0;
        if (measure()) setShown(true);
        else missing();
        return;
      }
      frame = window.requestAnimationFrame(settle);
    };
    frame = window.requestAnimationFrame(settle);
    return () => window.cancelAnimationFrame(frame);
  }, [found, reducedMotion]);

  // 4. O "zoom": o anel parte grande e encolhe até o alvo.
  useEffect(() => {
    if (!shown || reducedMotion) return;
    let inner = 0;
    // Dois quadros: o navegador pinta o anel grande antes de começar a transição.
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setZoom("moving"));
    });
    const timer = window.setTimeout(() => setZoom("done"), ZOOM_MS + 80);
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
      window.clearTimeout(timer);
    };
  }, [shown, reducedMotion]);

  const lost = useEffectEvent(() => {
    // O alvo sumiu de vez (ex.: a tela mudou): volta a procurar (e pula se não voltar).
    elementRef.current = null;
    setShown(false);
    setFound(false);
    setLayout(null);
    setZoom(reducedMotion ? "done" : "start");
    setSeekRound((n) => n + 1);
  });

  // 5. Acompanha rolagem (também dentro de contêineres), tamanho da tela e do conteúdo.
  useEffect(() => {
    if (!shown) return;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!measure()) lost();
      });
    };
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
    if (elementRef.current) observer.observe(elementRef.current);
    if (popoverRef.current) observer.observe(popoverRef.current);
    return () => {
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [shown]);

  // Foco preso no cartão (Tab e Shift+Tab dão a volta).
  const onPopoverKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const popover = popoverRef.current;
    if (!popover) return;
    const items = Array.from(
      popover.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"),
    );
    const first = items[0];
    const lastItem = items.at(-1);
    if (!first || !lastItem) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !popover.contains(active))) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && (active === lastItem || !popover.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  const ready = shown && layout !== null;
  const drawnRing = ready
    ? zoom === "start"
      ? zoomStartRect(layout.ring, layout.viewport)
      : layout.ring
    : null;

  return (
    <>
      {drawnRing ? (
        // O buraco: o anel com uma sombra enorme que escurece todo o resto.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed"
          style={{
            top: drawnRing.top,
            left: drawnRing.left,
            width: drawnRing.width,
            height: drawnRing.height,
            borderRadius: ringRadius(drawnRing),
            boxShadow: `0 0 0 200vmax ${DIM}`,
            transition:
              zoom === "moving"
                ? `top ${ZOOM_MS}ms cubic-bezier(0.2,0.8,0.2,1), left ${ZOOM_MS}ms cubic-bezier(0.2,0.8,0.2,1), width ${ZOOM_MS}ms cubic-bezier(0.2,0.8,0.2,1), height ${ZOOM_MS}ms cubic-bezier(0.2,0.8,0.2,1), border-radius ${ZOOM_MS}ms ease-out`
                : undefined,
          }}
        >
          {/* Borda de vidro clara + brilho da marca. */}
          <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_rgb(255_255_255/0.95),0_0_0_3px_rgb(0_102_255/0.55),0_10px_40px_rgb(0_102_255/0.35)]" />
          <span className="ns-tour-pulse absolute inset-0 rounded-[inherit]" />
        </div>
      ) : (
        // Procurando o alvo (ou rolando até ele): tela toda escurecida.
        <div
          aria-hidden="true"
          // Só o primeiro passo entra com fade; entre passos a tela já está escura.
          className={cx("pointer-events-none fixed inset-0", index === 0 && "ns-tour-in")}
          style={{ background: DIM }}
        />
      )}

      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={onPopoverKeyDown}
        className={cx(
          "glass-strong fixed rounded-[24px] p-5 text-(--glass-fg)",
          ready ? "ns-tour-in" : "ns-tour-in-late",
          ready && layout.dock
            ? "inset-x-3"
            : !ready
              ? "inset-x-3 sm:inset-x-auto sm:left-1/2 sm:w-[22rem] sm:-translate-x-1/2"
              : "w-[min(22rem,calc(100vw-1.5rem))]",
        )}
        style={popoverStyle(ready ? layout : null)}
      >
        {ready && layout.placement && (
          <Arrow side={layout.placement.side} at={layout.placement.arrow} />
        )}
        <p className="text-[13px] font-semibold text-brand tabular-nums">
          {stepCounter(index, total)}
        </p>
        <h2
          id={titleId}
          className="mt-1 font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] break-words"
        >
          {copy.title}
        </h2>
        <p id={bodyId} className="mt-1 text-[15px] leading-[1.55] text-(--glass-fg-muted)">
          {copy.body}
        </p>
        <div
          aria-hidden="true"
          className="mt-4 h-1 overflow-hidden rounded-full bg-(--glass-groove)"
        >
          <div
            className="h-full rounded-full bg-brand motion-safe:transition-[width] motion-safe:duration-300"
            style={{ width: `${Math.round(((index + 1) / total) * 100)}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <GlassButton variant="ghost" onClick={onSkip} className="-ml-2 px-3">
            Skip tour
          </GlassButton>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <GlassButton variant="secondary" onClick={onBack}>
                Back
              </GlassButton>
            )}
            <GlassButton ref={nextRef} variant="primary" onClick={onNext}>
              {last ? "Finish" : "Next"}
            </GlassButton>
          </div>
        </div>
      </div>
    </>
  );
}

/** Posição do cartão: ao lado do alvo, preso embaixo/em cima (celular) ou no meio, procurando. */
function popoverStyle(layout: Layout | null): CSSProperties {
  if (!layout) return { bottom: "calc(max(0.75rem, env(safe-area-inset-bottom)) + 4.5rem)" };
  if (layout.dock === "top") return { top: "calc(env(safe-area-inset-top) + 0.75rem)" };
  if (layout.dock === "bottom") {
    return { bottom: "calc(max(0.75rem, env(safe-area-inset-bottom)) + 4.5rem)" };
  }
  return { top: layout.placement?.top ?? 0, left: layout.placement?.left ?? 0 };
}

/** Setinha na borda do cartão, apontando para o alvo (só fora do celular). */
function Arrow({ side, at }: { side: Side; at: number }) {
  const vertical = side === "right" || side === "left";
  // Uma "janela" de 10×20 px fora do cartão, mostrando meio losango (sem sobrepor o vidro).
  const box: CSSProperties = vertical
    ? { top: at - 10, width: 10, height: 20 }
    : { left: at - 10, width: 20, height: 10 };
  const where = {
    right: "right-full",
    left: "left-full",
    bottom: "bottom-full",
    top: "top-full",
  }[side];
  const diamond: CSSProperties =
    side === "right"
      ? { left: 3, top: 3 }
      : side === "left"
        ? { left: -7, top: 3 }
        : side === "bottom"
          ? { left: 3, top: 3 }
          : { left: 3, top: -7 };
  return (
    <span aria-hidden="true" className={cx("absolute overflow-hidden", where)} style={box}>
      <span
        className="absolute size-[14px] rotate-45 bg-(--glass-solid-strong) shadow-[0_0_0_1px_var(--glass-rim)]"
        style={diamond}
      />
    </span>
  );
}
