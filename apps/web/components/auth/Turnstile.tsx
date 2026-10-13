"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

// Captcha da Cloudflare (Turnstile): grátis, na maioria das vezes nem aparece para a pessoa.
// O token vai no campo escondido "captchaToken" e o Supabase confere no cadastro/login
// (Authentication → Attack Protection → Captcha, com a chave secreta da Cloudflare).
// Sem NEXT_PUBLIC_TURNSTILE_SITE_KEY, não mostra nada (dev local).

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
      action?: string;
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * `resetKey`: mude o valor para pedir um token novo (o token vale para um envio só; depois de
 * um erro do formulário, é preciso outro).
 */
export function Turnstile({ action, resetKey }: { action: string; resetKey?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ready || !box.current || !window.turnstile) return;
    const id = window.turnstile.render(box.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action,
      theme: "light",
      size: "flexible",
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
    widget.current = id;
    return () => {
      window.turnstile?.remove(id);
      widget.current = null;
    };
  }, [ready, action]);

  useEffect(() => {
    if (resetKey === undefined || !widget.current) return;
    setToken("");
    window.turnstile?.reset(widget.current);
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={box} className="min-h-[65px]" />
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  );
}
