"use client";

import type { DomainResponse } from "@nosweat/schema";
import { useEffect, useState, type FocusEvent, type ReactNode } from "react";
import { ClockIcon, LinkIcon } from "@/app/(dashboard)/NavIcons";
import {
  ChevronRightIcon,
  IconTile,
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  secondaryButton,
} from "@/components/DashboardUi";
import { DomainPanel, rememberedDomain } from "./DomainPanel";

// Seções recolhidas da página do site (/sites/[id]): o dono vê uma linha só e abre quando
// precisar. O hash da URL (#domain, #versions) abre a seção certa: o checklist do painel, o
// editor e a revisão da IA linkam direto para elas.

/**
 * Abre a seção quando o hash da URL é o dela (ao chegar na página e quando o hash muda).
 * `pendingDomainOf`: abre também se há um domínio deste site esperando a prova de dono.
 */
function useOpenOnHash(
  hash: string,
  setOpen: (open: boolean) => void,
  pendingDomainOf: string | null = null,
) {
  useEffect(() => {
    const check = () => {
      const pending = pendingDomainOf !== null && rememberedDomain(pendingDomainOf) !== null;
      if (window.location.hash === hash || pending) setOpen(true);
    };
    // Fora do corpo do efeito (regra react-hooks/set-state-in-effect). No quadro seguinte o hash
    // já é o novo também na navegação pelo cliente (link do painel para /sites/<id>#domain).
    const frame = requestAnimationFrame(check);
    const onHashChange = () => {
      if (window.location.hash === hash) setOpen(true);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [hash, setOpen, pendingDomainOf]);
}

/**
 * "Use your own domain": uma linha com "Connect" que abre o DomainPanel. Já começa aberta com
 * domínio salvo, com #domain na URL ou com um domínio esperando a prova de dono (TXT).
 */
export function DomainSection({
  siteId,
  initial,
  isPublished,
}: {
  siteId: string;
  initial: DomainResponse;
  isPublished: boolean;
}) {
  const [open, setOpen] = useState(Boolean(initial.domain));
  useOpenOnHash("#domain", setOpen, siteId);

  function expand() {
    setOpen(true);
    // Depois de mostrar o formulário, o foco vai para o campo do domínio.
    requestAnimationFrame(() => document.getElementById("domain-input")?.focus());
  }

  // O "Connect domain" da janela de publicar foca a seção (sem mudar o hash): abre também.
  function handleFocus(event: FocusEvent<HTMLElement>) {
    if (!open && event.target === event.currentTarget) expand();
  }

  return (
    <section
      id="domain"
      tabIndex={-1}
      aria-labelledby="domain-title"
      onFocus={handleFocus}
      className={`${panelClass} scroll-mt-24 focus:outline-none`}
    >
      <div className="flex items-center gap-3">
        <IconTile>
          <LinkIcon className="size-[18px]" />
        </IconTile>
        <h2 id="domain-title" className={`min-w-0 flex-1 ${panelTitle}`}>
          {initial.domain ? (
            "Your own domain"
          ) : (
            <>
              Use your own domain{" "}
              <span className="font-normal text-(--glass-fg-muted)">(like yourbusiness.com)</span>
            </>
          )}
        </h2>
        {!open && (
          <button type="button" onClick={expand} className={`${secondaryButton} shrink-0`}>
            Connect
          </button>
        )}
      </div>
      {open && (
        <>
          {!initial.domain && (
            <p className={`mt-3 max-w-[60ch] ${panelText}`}>
              Already own one? Connect it here. Don&rsquo;t have one yet? Buy it at any registrar
              (GoDaddy, Namecheap, Hostinger&hellip;) and come back.
            </p>
          )}
          <DomainPanel siteId={siteId} initial={initial} isPublished={isPublished} />
        </>
      )}
    </section>
  );
}

/** "Restore an earlier version": recolhida; abre no clique ou com #versions na URL. */
export function VersionsSection({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useOpenOnHash("#versions", setOpen);

  return (
    <section
      id="versions"
      aria-labelledby="versions-title"
      className={`${panelClass} scroll-mt-24`}
    >
      <h2 id="versions-title" className={panelTitle}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="versions-body"
          onClick={() => setOpen((current) => !current)}
          className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl text-left ${focusRing}`}
        >
          <IconTile tone="slate">
            <ClockIcon className="size-[18px]" />
          </IconTile>
          <span className="min-w-0 flex-1">Restore an earlier version</span>
          <ChevronRightIcon
            className={`size-4 shrink-0 text-(--glass-fg-muted) transition-transform duration-150 motion-reduce:transition-none ${
              open ? "rotate-90" : ""
            }`}
          />
        </button>
      </h2>
      <div id="versions-body" hidden={!open}>
        <p className={`mt-3 max-w-[60ch] ${panelText}`}>
          Every time you save, we keep a copy. Restore an older one if you change your mind.
        </p>
        {children}
      </div>
    </section>
  );
}
