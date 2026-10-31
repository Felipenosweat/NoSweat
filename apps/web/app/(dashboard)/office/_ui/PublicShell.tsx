import type { ReactNode } from "react";
import { companyLabel, phoneHref } from "@/lib/office";

// Moldura das páginas públicas do orçamento (/q/...) e da fatura (/i/...): fundo cinza bem claro,
// papel branco no centro, contato da empresa embaixo. Sem o painel, sem vidro pesado. Na
// impressão só o papel sai.

export function PublicShell({
  children,
  company,
}: {
  children: ReactNode;
  company: { companyName: string; phone: string | null; email: string | null };
}) {
  return (
    <div className="min-h-dvh bg-slate-100/80 print:bg-white">
      <main
        id="main"
        className="mx-auto grid w-full max-w-3xl gap-4 px-3 pt-4 pb-16 sm:px-6 sm:pt-10 print:max-w-none print:p-0"
      >
        {children}
        {(company.phone || company.email) && (
          <p className="px-2 text-center text-sm leading-6 text-slate-600 print:hidden">
            Questions? Contact {companyLabel(company.companyName)}
            {company.phone && (
              <>
                {" · "}
                <a
                  href={`tel:${phoneHref(company.phone)}`}
                  className="inline-flex min-h-11 items-center font-semibold text-brand underline-offset-4 hover:underline"
                >
                  {company.phone}
                </a>
              </>
            )}
            {company.email && (
              <>
                {" · "}
                <a
                  href={`mailto:${company.email}`}
                  className="inline-flex min-h-11 items-center font-semibold break-all text-brand underline-offset-4 hover:underline"
                >
                  {company.email}
                </a>
              </>
            )}
          </p>
        )}
        <p className="text-center text-xs text-slate-400 print:hidden">
          Sent with{" "}
          <a href="https://www.nosweatfd.com" className="underline-offset-4 hover:underline">
            No Sweat
          </a>
        </p>
      </main>
    </div>
  );
}

/** Faixa de situação acima do papel (aprovado, vencido, pago...). */
export function StatusBanner({
  tone,
  title,
  children,
  action,
}: {
  tone: "emerald" | "red" | "amber" | "slate" | "blue";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    red: "bg-red-50 text-red-900 ring-red-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
    slate: "bg-white text-slate-800 ring-slate-200",
    blue: "bg-blue-50 text-[#0b2a5c] ring-blue-200",
  } as const;
  return (
    <div
      role="status"
      className={`flex flex-col gap-3 rounded-2xl px-5 py-4 ring-1 sm:flex-row sm:items-center sm:justify-between print:hidden ${tones[tone]}`}
    >
      <div>
        <p className="text-[15px] font-semibold">{title}</p>
        {children && <div className="mt-0.5 text-sm leading-6 opacity-90">{children}</div>}
      </div>
      {action}
    </div>
  );
}
