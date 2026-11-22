"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cleanText, createHref, NAME_LIMIT } from "./personalize";

// Estado da página "Your name on it": o que o visitante digitou (na hora, para o campo) e a
// versão com atraso (debounce) que repinta as prévias e os títulos que usam o nome.
// O renderer dos sites só é carregado depois que a página fica ociosa (o LCP é o título).

type Typed = { name: string; city: string };

type YourNameState = {
  /** O que está no campo agora. */
  typed: Typed;
  /** O mesmo, 250 ms depois da última tecla: é o que as prévias desenham. */
  settled: Typed;
  setTyped: (next: Partial<Typed>) => void;
  /** A página já ficou ociosa: pode baixar e desenhar o <SiteRenderer>. */
  rendererReady: boolean;
};

const EMPTY: Typed = { name: "", city: "" };
const DEBOUNCE_MS = 250;

const YourNameContext = createContext<YourNameState>({
  typed: EMPTY,
  settled: EMPTY,
  setTyped: () => {},
  rendererReady: false,
});

export function useYourName(): YourNameState {
  return useContext(YourNameContext);
}

export function YourNameProvider({ children }: { children: ReactNode }) {
  const [typed, setTypedState] = useState<Typed>(EMPTY);
  const [settled, setSettled] = useState<Typed>(EMPTY);
  const [rendererReady, setRendererReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latest = useRef<Typed>(EMPTY);

  const setTyped = useCallback((next: Partial<Typed>) => {
    const value = { ...latest.current, ...next };
    latest.current = value;
    setTypedState(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSettled(value), DEBOUNCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Carrega o renderer quando o navegador fica livre (ou em até 1,5 s), nunca antes do título.
  useEffect(() => {
    const ready = () => setRendererReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(ready, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(ready, 600);
    return () => window.clearTimeout(id);
  }, []);

  const value = useMemo(
    () => ({ typed, settled, setTyped, rendererReady }),
    [typed, settled, setTyped, rendererReady],
  );
  return <YourNameContext.Provider value={value}>{children}</YourNameContext.Provider>;
}

/** O nome digitado (sem espaços sobrando) ou o texto padrão, para títulos da página. */
export function TypedName({ fallback }: { fallback: string }) {
  const { settled } = useYourName();
  const name = cleanText(settled.name, NAME_LIMIT);
  return <>{name || fallback}</>;
}

/** Link para o /create levando o nome (e a cidade) digitados, se houver. */
export function StartLink({ className, children }: { className: string; children: ReactNode }) {
  const { typed } = useYourName();
  return (
    <Link href={createHref(typed.name, typed.city)} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
