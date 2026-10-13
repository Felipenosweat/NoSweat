"use client";

import type { SiteSpec } from "@nosweat/schema";
import { SiteRenderer } from "@nosweat/templates";
import { useEffect, useState, type MouseEvent, type SyntheticEvent } from "react";
import { EditorMessage, postToEditor, readMessage } from "../messages";

function scrollToSection(index: number) {
  const target = document.querySelector(`[data-section-index="${index}"]`);
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ block: "start", behavior: reduce ? "instant" : "smooth" });
}

/**
 * Site do cliente em modo de edição, dentro do iframe do editor.
 * - Recebe o rascunho do editor (só da mesma origem e só da janela pai; validado pelo SiteSpec).
 * - Clique numa seção avisa o editor, que abre o painel dela.
 * - Links e formulário não navegam aqui dentro: a prévia é só para ver e escolher.
 */
export function EditorCanvas({ initialSpec }: { initialSpec: SiteSpec }) {
  const [spec, setSpec] = useState(initialSpec);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = readMessage(EditorMessage, event, window.parent);
      if (!message) return;
      if (message.type === "spec") {
        setSpec(message.spec);
        return;
      }
      setSelected(message.index);
      if (message.scroll && message.index !== null) {
        // Espera o desenho da seção (pode ter acabado de ser adicionada).
        const index = message.index;
        requestAnimationFrame(() => scrollToSection(index));
      }
    }
    window.addEventListener("message", onMessage);
    postToEditor({ type: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest("a")) event.preventDefault();
    const section = event.target.closest<HTMLElement>("[data-section-index]");
    if (!section) return;
    const index = Number(section.dataset.sectionIndex);
    if (!Number.isInteger(index)) return;
    setSelected(index);
    postToEditor({ type: "select", index });
  }

  function preventSubmit(event: SyntheticEvent) {
    event.preventDefault();
  }

  return (
    // A cor do contorno das seções vem daqui (marca No Sweat), não do template.
    <div
      onClickCapture={onClickCapture}
      onSubmitCapture={preventSubmit}
      className="[--ns-edit-outline-text:#fff] [--ns-edit-outline:var(--color-brand,#0066ff)]"
    >
      <SiteRenderer spec={spec} editable selectedSection={selected} />
    </div>
  );
}
