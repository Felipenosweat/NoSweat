"use client";

import { useEffect } from "react";
import { PLAN_COOKIE, PLAN_COOKIE_MAX_AGE, parsePlanId } from "@/lib/chosen-plan";

// Guarda o plano que veio da /pricing (?plan=pro) num cookie, para o /billing destacar a mesma
// escolha depois. Sem plano válido, não faz nada (não apaga uma escolha anterior).
export function RememberPlan({ plan }: { plan: string | null | undefined }) {
  useEffect(() => {
    const id = parsePlanId(plan);
    if (!id) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${PLAN_COOKIE}=${id}; Path=/; Max-Age=${PLAN_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }, [plan]);
  return null;
}
