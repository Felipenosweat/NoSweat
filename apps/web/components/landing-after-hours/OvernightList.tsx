"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// A lista da madrugada: os cartões entram um por um quando a lista aparece na tela (uma vez só).
// No HTML do servidor eles já estão visíveis; o JS só os esconde se a lista ainda estiver fora da
// tela e o visitante não pediu "reduzir movimento" (ver .ah-reveal em after-hours.css).

type Reveal = "static" | "wait" | "shown";

export function OvernightList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const list = useRef<HTMLOListElement>(null);
  const [reveal, setReveal] = useState<Reveal>("static");

  useEffect(() => {
    const node = list.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Já na tela ao carregar: fica como veio do servidor.
    const box = node.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;
    const frame = requestAnimationFrame(() => setReveal("wait"));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setReveal("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <ol ref={list} data-reveal={reveal} className={`ah-reveal ${className}`}>
      {children}
    </ol>
  );
}
