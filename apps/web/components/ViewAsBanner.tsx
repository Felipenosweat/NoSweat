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
      className="border-b border-amber-300 bg-amber-50 px-5 py-2 text-sm text-amber-950 sm:px-8"
    >
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="min-w-0">
          Viewing as <strong className="font-semibold break-all">{email ?? "this account"}</strong>{" "}
          · read-only
        </p>
        <form action={exitViewAs}>
          <button
            type="submit"
            className={`inline-flex min-h-9 items-center rounded-lg border border-amber-400 bg-white px-3 text-sm font-semibold text-amber-950 transition-colors duration-150 hover:bg-amber-100 ${focusRing}`}
          >
            Exit
          </button>
        </form>
      </div>
    </div>
  );
}
