"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronRightIcon } from "@/components/DashboardUi";
import { GlassButton, GlassSheet, cx, focusRing } from "@/components/glass";
import {
  OnboardingResponse,
  TOUR_OPEN_EVENT,
  TOUR_STEPS,
  clampStep,
  shouldAutoOpen,
  tourShortcuts,
  tourStepAt,
  tourStorageKey,
  type OnboardingRequest,
  type TourConfig,
} from "@/lib/onboarding";
import { TourArt } from "./TourArt";

// Tour de boas-vindas do painel: uma folha de vidro com 6 passos curtos (centralizada no
// computador, presa embaixo no celular). Abre sozinho uma vez por conta, no /dashboard; "Take the
// tour" (menu e /guide) abre de novo pelo evento TOUR_OPEN_EVENT. Fechar de qualquer jeito (Skip,
// Esc, tocar fora, "Let's go", um atalho) conta como visto: grava no localStorage na hora (para
// nunca piscar duas vezes) e, com conta, no user_metadata (POST /api/me/onboarding).
// Teclado: Tab entre os botões, setas ← → trocam de passo, Esc fecha. "Reduzir movimento"
// desliga a animação (só `motion-safe:`).

/** Espera antes de abrir sozinho: deixa o painel aparecer primeiro. */
const AUTO_OPEN_DELAY_MS = 450;

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

async function saveOnAccount(): Promise<void> {
  const body: OnboardingRequest = { tour: "done" };
  const res = await fetch("/api/me/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Um atalho do último passo troca de página logo em seguida: o pedido não pode morrer junto.
    keepalive: true,
  });
  if (!res.ok) throw new Error(`onboarding ${res.status}`);
  OnboardingResponse.parse(await res.json());
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
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  /** Texto lido pelo leitor de tela ao trocar de passo. */
  const [announcement, setAnnouncement] = useState("");
  const nextRef = useRef<HTMLButtonElement>(null);
  /** Já abriu sozinho neste carregamento (nunca duas vezes). */
  const triedRef = useRef(false);
  /** A conta já tem a marca no servidor (ou o pedido está a caminho). */
  const savedRef = useRef(!config.autoShow);

  const total = TOUR_STEPS.length;
  const step = tourStepAt(index);
  const last = index >= total - 1;

  const start = useCallback(() => {
    triedRef.current = true;
    setIndex(0);
    setAnnouncement("");
    setOpen(true);
  }, []);

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
    // O setState só roda no timer (regra react-hooks/set-state-in-effect).
    const timer = window.setTimeout(start, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [config, pathname, start]);

  // "Take the tour" (menu, /guide): abre de novo, sempre do começo.
  useEffect(() => {
    window.addEventListener(TOUR_OPEN_EVENT, start);
    return () => window.removeEventListener(TOUR_OPEN_EVENT, start);
  }, [start]);

  // Trocou de passo e o botão com foco sumiu (ex.: "Back" no primeiro passo): o foco vai para
  // "Next", nunca para o fundo da página.
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (!active || active === document.body) nextRef.current?.focus();
  }, [open, index]);

  const close = useCallback(() => {
    setOpen(false);
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

  const go = (to: number) => {
    const target = clampStep(to, total);
    if (target === index) return;
    setIndex(target);
    setAnnouncement(`Step ${target + 1} of ${total}: ${tourStepAt(target).title}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
  };

  return (
    <GlassSheet
      open={open}
      onClose={close}
      initialFocusRef={nextRef}
      title={step.title}
      description={step.body}
      media={
        // `key`: o desenho novo entra com um fade curto a cada passo.
        <div key={step.id} className="motion-safe:animate-[ns-fade_220ms_ease-out_both]">
          <TourArt art={step.art} />
        </div>
      }
      // No celular: folha presa embaixo, na largura toda (como as folhas do iOS).
      className="max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]"
    >
      <div onKeyDown={onKeyDown}>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {last && (
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
        )}

        <ol aria-label="Tour steps" className={cx("flex items-center gap-0.5", last && "mt-5")}>
          {TOUR_STEPS.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1} of ${total}: ${item.title}`}
                aria-current={i === index ? "step" : undefined}
                className={cx("grid size-6 place-items-center rounded-full", focusRing)}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "block h-1.5 rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-200",
                    i === index ? "w-5 bg-brand" : "w-1.5 bg-slate-300 hover:bg-slate-400",
                  )}
                />
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex items-center justify-between gap-2">
          {last ? (
            <span />
          ) : (
            <GlassButton key="skip" variant="ghost" onClick={close} className="-ml-2">
              Skip
            </GlassButton>
          )}
          <div className="flex items-center gap-2">
            {index > 0 && (
              <GlassButton key="back" variant="secondary" onClick={() => go(index - 1)}>
                Back
              </GlassButton>
            )}
            <GlassButton
              key="next"
              ref={nextRef}
              variant="primary"
              onClick={() => (last ? close() : go(index + 1))}
            >
              {last ? "Let’s go" : "Next"}
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassSheet>
  );
}
