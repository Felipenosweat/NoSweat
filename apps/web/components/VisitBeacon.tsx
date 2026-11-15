"use client";

import { useEffect } from "react";

/**
 * Conta uma visita ao site publicado: um POST sem corpo para /api/public/sites/<id>/visit, uma
 * vez por aba (sessionStorage; recarregar a página não conta de novo). Não desenha nada, não usa
 * cookie e não manda nenhum dado do visitante. Navegador automatizado não conta.
 */
export function VisitBeacon({ siteId }: { siteId: string }) {
  useEffect(() => {
    if (navigator.webdriver) return;
    const key = `ns_visit_${siteId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Sem sessionStorage (modo privado antigo): conta a cada carregamento.
    }
    const url = `/api/public/sites/${siteId}/visit`;
    if (!navigator.sendBeacon?.(url)) {
      void fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
    }
  }, [siteId]);
  return null;
}
