import { exitViewAs } from "@/server/auth/view-as-actions";
import { focusRing } from "./DashboardUi";

/**
 * Faixa do modo "ver como" (admin vendo o painel de outra conta, só leitura). Aparece no topo de
 * todas as páginas do painel enquanto o cookie `ns_view_as` vale. "Exit" apaga o cookie.
 */
export function ViewAsBanner({ email }: { email: string | null }) {
  return (
    <div
      role="status"
      className="border-b border-amber-200/80 bg-amber-50 px-5 py-2 text-sm text-amber-950 sm:px-8"
    >
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex min-w-0 items-center gap-2">
          {/* Olho: "você está só olhando". */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4 shrink-0 text-amber-700"
          >
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
            <circle cx="12" cy="12" r="2.75" />
          </svg>
          <span className="min-w-0">
            Viewing as{" "}
            <strong className="font-semibold break-all">{email ?? "this account"}</strong> ·
            read-only
          </span>
        </p>
        <form action={exitViewAs}>
          <button
            type="submit"
            className={`inline-flex min-h-11 items-center rounded-xl border border-amber-300 bg-white px-3.5 text-sm font-semibold text-amber-950 shadow-xs transition-colors duration-150 hover:bg-amber-100 sm:min-h-9 ${focusRing}`}
          >
            Exit
          </button>
        </form>
      </div>
    </div>
  );
}
