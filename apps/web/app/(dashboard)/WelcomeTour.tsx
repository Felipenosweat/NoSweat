"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronRightIcon } from "@/components/DashboardUi";
import { GlassButton, GlassSheet, cx, focusRing } from "@/components/glass";
import {
  OnboardingResponse,
  TOUR_AUTO_PATH,
  TOUR_FINISH,
  TOUR_OPEN_EVENT,
  TOUR_WELCOME,
  clampStep,
  shouldAutoOpen,
  tourShortcuts,
  tourStorageKey,
  type OnboardingRequest,
  type TourConfig,
} from "@/lib/onboarding";
import { TourArt } from "./TourArt";
import {
  TOUR_PROGRESS_KEY,
  parseProgress,
  serializeProgress,
  shouldContinue,
  type TourProgress,
} from "./tour/progress";
import { SpotlightTour } from "./tour/SpotlightTour";
import {
  DESKTOP_MIN_WIDTH,
  nextAfterMissing,
  remapStepIndex,
  spotlightSteps,
  stepCounter,
  viewportFor,
  type TourViewport,
} from "./tour/steps";

// Tour de boas-vindas do painel, em três partes:
// 1. Folha de boas-vindas (desenho "welcome"): "Show me around" começa o passeio; "Skip" encerra.
// 2. Passeio pela tela de verdade (tour/SpotlightTour.tsx): escurece tudo menos o item do menu ou
//    o botão do passo, explica o que ele faz e vai trocando de página sozinho (Clients, Schedule,
//    Estimates, Invoices...). No celular aponta as abas e o "More".
// 3. Folha final, de volta à Home, com os atalhos para começar.
// Abre sozinho uma vez por conta, no /dashboard; "Take the tour" (menu e /guide) abre de novo pelo
// evento TOUR_OPEN_EVENT. Fechar de qualquer jeito (Skip, Esc, terminar, um atalho) conta como
// visto: grava no localStorage na hora (para nunca abrir duas vezes) e, com conta, no user_metadata
// (POST /api/me/onboarding). No modo "ver como" nada é gravado (config.persist = "none").
// O passo atual fica no sessionStorage: se a página recarregar no meio, o tour continua.

/** Espera antes de abrir sozinho: deixa o painel aparecer primeiro. */
const AUTO_OPEN_DELAY_MS = 450;

type Phase = "closed" | "welcome" | "spotlight" | "finish";

/** Abre o tour de novo (de qualquer lugar do painel). */
export function openWelcomeTour(): void {
  window.dispatchEvent(new Event(TOUR_OPEN_EVENT));
}

function readLocalDone(accountKey: string): boolean {
  try {
    return window.localStorage.getItem(tourStorageKey(accountKey)) !== null;
  } catch {
    return false;
  }
}

function writeLocalDone(accountKey: string): void {
  try {
    window.localStorage.setItem(tourStorageKey(accountKey), new Date().toISOString());
  } catch {
    // Navegador sem localStorage (janela privada, dados bloqueados): o servidor guarda.
  }
}

function readProgress(): TourProgress | null {
  try {
    return parseProgress(window.sessionStorage.getItem(TOUR_PROGRESS_KEY));
  } catch {
    return null;
  }
}

function writeProgress(progress: TourProgress): void {
  try {
    window.sessionStorage.setItem(TOUR_PROGRESS_KEY, serializeProgress(progress));
  } catch {
    // Sem sessionStorage: o tour só não continua depois de recarregar a página.
  }
}

function clearProgress(): void {
  try {
    window.sessionStorage.removeItem(TOUR_PROGRESS_KEY);
  } catch {
    // Idem.
  }
}

async function saveOnAccount(): Promise<void> {
  const body: OnboardingRequest = { tour: "done" };
  const res = await fetch("/api/me/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Um atalho da folha final troca de página logo em seguida: o pedido não pode morrer junto.
    keepalive: true,
  });
  if (!res.ok) throw new Error(`onboarding ${res.status}`);
  OnboardingResponse.parse(await res.json());
}

/** `matchMedia` como estado do React (no servidor: `false`). */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function WelcomeTour({
  config,
  latestSiteId,
}: {
  config: TourConfig;
  /** Site mais recente (atalho "Finish my website"); `null` = ainda sem site. */
  latestSiteId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("closed");
  const [index, setIndex] = useState(0);
  /** Para que lado o tour andava (passo sem alvo é pulado nesse sentido). */
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  /** Texto lido pelo leitor de tela ao trocar de passo. */
  const [announcement, setAnnouncement] = useState("");
  const startRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  /** Já abriu sozinho (ou continuou um tour guardado) neste carregamento: nunca duas vezes. */
  const triedRef = useRef(false);
  /** A conta já tem a marca no servidor (ou o pedido está a caminho). */
  const savedRef = useRef(!config.autoShow);

  const viewport: TourViewport = useMediaQuery(`(min-width: ${DESKTOP_MIN_WIDTH}px)`)
    ? "desktop"
    : "mobile";
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const steps = useMemo(() => spotlightSteps(viewport), [viewport]);

  // A tela passou de computador para celular (ou o contrário) no meio do passeio: a lista de
  // passos muda e o índice acompanha o mesmo passo (ajuste durante o render, sem efeito).
  const [stepsViewport, setStepsViewport] = useState<TourViewport>(viewport);
  if (stepsViewport !== viewport) {
    setStepsViewport(viewport);
    setIndex((i) => remapStepIndex(spotlightSteps(stepsViewport), steps, i));
  }

  const safeIndex = clampStep(index, steps.length);
  const step = steps[safeIndex];

  const announce = useCallback(
    (to: number) => {
      const target = steps[to];
      if (target) setAnnouncement(`Step ${stepCounter(to, steps.length)}: ${target.title}`);
    },
    [steps],
  );

  const start = useCallback(() => {
    triedRef.current = true;
    clearProgress();
    setIndex(0);
    setDirection("forward");
    setAnnouncement("");
    setPhase("welcome");
  }, []);

  // Continua um tour guardado nesta aba (a página recarregou no meio). Roda antes do auto-abrir.
  useEffect(() => {
    const progress = readProgress();
    const fromSteps = progress ? spotlightSteps(progress.viewport) : [];
    if (
      !progress ||
      !shouldContinue({
        progress,
        accountKey: config.accountKey,
        now: Date.now(),
        totalSteps: fromSteps.length,
      })
    ) {
      if (progress) clearProgress();
      return;
    }
    triedRef.current = true;
    // O setState só roda no timer (regra react-hooks/set-state-in-effect).
    const timer = window.setTimeout(() => {
      const here = spotlightSteps(viewportFor(window.innerWidth));
      setIndex(remapStepIndex(fromSteps, here, progress.index));
      setDirection("forward");
      setPhase(progress.phase);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [config.accountKey]);

  // Abre sozinho uma vez, no /dashboard, depois de o painel aparecer.
  useEffect(() => {
    if (
      !shouldAutoOpen({
        config,
        pathname,
        locallyDone: readLocalDone(config.accountKey),
        alreadyTried: triedRef.current,
      })
    ) {
      return;
    }
    const timer = window.setTimeout(start, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [config, pathname, start]);

  // "Take the tour" (menu, /guide): abre de novo, sempre do começo.
  useEffect(() => {
    window.addEventListener(TOUR_OPEN_EVENT, start);
    return () => window.removeEventListener(TOUR_OPEN_EVENT, start);
  }, [start]);

  // Guarda onde o passeio está (para continuar depois de recarregar).
  useEffect(() => {
    if (phase !== "spotlight" && phase !== "finish") return;
    writeProgress({
      v: 1,
      accountKey: config.accountKey,
      phase,
      index: safeIndex,
      viewport,
      savedAt: Date.now(),
    });
  }, [phase, safeIndex, viewport, config.accountKey]);

  /** Fim do tour (pulou, terminou ou saiu por um atalho): conta como visto, igual a antes. */
  const close = useCallback(() => {
    setPhase("closed");
    clearProgress();
    if (config.persist === "none") return;
    writeLocalDone(config.accountKey);
    if (config.persist !== "account" || savedRef.current) return;
    savedRef.current = true;
    saveOnAccount().catch((error: unknown) => {
      // Fica só no navegador desta vez; tenta de novo no próximo fechamento.
      savedRef.current = false;
      console.error("[onboarding] could not save the tour flag", error);
    });
  }, [config]);

  const showMeAround = () => {
    setIndex(0);
    setDirection("forward");
    announce(0);
    setPhase("spotlight");
  };

  /** Folha final, sempre na Home. */
  const finish = () => {
    // A folha abre com o título dela (o leitor de tela anuncia o diálogo).
    setPhase("finish");
    if (pathname !== TOUR_AUTO_PATH) router.push(TOUR_AUTO_PATH);
  };

  const goTo = (to: number, dir: "forward" | "back") => {
    setIndex(to);
    setDirection(dir);
    announce(to);
  };

  const next = () => {
    if (safeIndex + 1 >= steps.length) finish();
    else goTo(safeIndex + 1, "forward");
  };

  const back = () => {
    if (safeIndex > 0) goTo(safeIndex - 1, "back");
  };

  // O alvo do passo não apareceu (conta sem aquele botão, página com erro...): pula, no mesmo
  // sentido em que a pessoa andava. Nunca trava o tour.
  const onMissing = () => {
    const result = nextAfterMissing(safeIndex, direction, steps.length);
    if (result === "finish") finish();
    else goTo(result.index, result.direction);
  };

  const navigate = useCallback((route: string) => router.push(route), [router]);

  return (
    <>
      <GlassSheet
        open={phase === "welcome"}
        onClose={close}
        initialFocusRef={startRef}
        title={TOUR_WELCOME.title}
        description={TOUR_WELCOME.body}
        media={<TourArt art={TOUR_WELCOME.art} />}
        // No celular: folha presa embaixo, na largura toda (como as folhas do iOS).
        className="max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between gap-2">
          <GlassButton variant="ghost" onClick={close} className="-ml-2">
            Skip
          </GlassButton>
          <GlassButton
            ref={startRef}
            variant="primary"
            onClick={showMeAround}
            trailingIcon={<ChevronRightIcon />}
          >
            Show me around
          </GlassButton>
        </div>
      </GlassSheet>

      <GlassSheet
        open={phase === "finish"}
        onClose={close}
        initialFocusRef={doneRef}
        title={TOUR_FINISH.title}
        description={TOUR_FINISH.body}
        media={<TourArt art={TOUR_FINISH.art} />}
        className="max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid gap-2">
          <p className="text-[13px] font-semibold text-(--glass-fg-muted)">Start with one:</p>
          <ul className="grid gap-2">
            {tourShortcuts(latestSiteId).map((shortcut) => (
              <li key={shortcut.key} className="min-w-0">
                <GlassButton
                  href={shortcut.href}
                  variant="secondary"
                  fullWidth
                  onClick={close}
                  trailingIcon={<ChevronRightIcon />}
                >
                  {shortcut.label}
                </GlassButton>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[13px] text-(--glass-fg-muted)">
            Or{" "}
            <Link
              href="/guide"
              onClick={close}
              className={cx(
                "rounded font-semibold text-brand underline-offset-2 hover:underline",
                focusRing,
              )}
            >
              read the full guide
            </Link>
            .
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <GlassButton ref={doneRef} variant="primary" onClick={close}>
            Let’s go
          </GlassButton>
        </div>
      </GlassSheet>

      {phase === "spotlight" && step && (
        <SpotlightTour
          step={step}
          stepKey={`${viewport}:${safeIndex}:${step.id}`}
          index={safeIndex}
          total={steps.length}
          routeReady={pathname === step.route}
          reducedMotion={reducedMotion}
          announcement={announcement}
          onNavigate={navigate}
          onBack={back}
          onNext={next}
          onSkip={close}
          onMissing={onMissing}
        />
      )}
    </>
  );
}
