import { ActionsSkeleton, NeedsSkeleton, OfficeSkeleton } from "./skeletons";

// Esqueleto da página inicial: aparece na hora do clique (antes da sessão e dos dados), com a
// mesma grade das seções que chegam depois em streaming (ver page.tsx).

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your home…</span>
      <div aria-hidden="true">
        <div className={`${block} h-5 w-44 rounded-md`} />
        <div className={`${block} mt-1 h-10 w-80 max-w-full rounded-xl lg:h-12`} />
        <div className={`${block} mt-1.5 h-5 w-64 max-w-full rounded-md`} />
        <div className="mt-6 grid gap-10 sm:gap-12 lg:mt-8 lg:gap-14">
          <ActionsSkeleton />
          <NeedsSkeleton />
          <OfficeSkeleton />
        </div>
      </div>
    </div>
  );
}
