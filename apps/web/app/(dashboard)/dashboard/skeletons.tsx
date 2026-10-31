import { cardClass } from "@/components/DashboardUi";

// Esqueletos da página inicial do painel: fallback de cada <Suspense> da página e o loading.tsx.
// Mesma grade e alturas parecidas com as seções prontas, para nada pular quando elas chegam.

const skeleton = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export function GreetingSummarySkeleton() {
  return (
    <span
      aria-hidden="true"
      className={`${skeleton} inline-block h-[1em] w-64 max-w-full rounded-md align-middle`}
    />
  );
}

export function OfficeSkeleton() {
  return (
    <div aria-hidden="true" className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="flex flex-col">
        <div className={`${skeleton} h-7 w-48 rounded-lg`} />
        <div className={`${skeleton} mt-3 h-40 flex-1 lg:h-auto`} />
      </div>
      <div>
        <div className={`${skeleton} h-7 w-24 rounded-lg`} />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${skeleton} h-[8.5rem]`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Os quatro atalhos do topo (Book a job, Send an estimate...). */
export function ActionsSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${skeleton} h-16 sm:h-[7.5rem]`} />
      ))}
    </div>
  );
}

export function NeedsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={`${skeleton} h-7 w-32 rounded-lg`} />
      <div className={`${skeleton} mt-3 h-48`} />
    </div>
  );
}

/** Cards de site vazios, um por site (mesma grade do SitesGrid), para nada pular ao chegar. */
export function SitesSkeleton({ count }: { count: number }) {
  return (
    <ul aria-hidden="true" className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
      {Array.from({ length: Math.min(count, 6) }, (_, i) => (
        <li key={i} className={`overflow-hidden ${cardClass}`}>
          <div className={`${skeleton} m-2 mb-0 aspect-[16/10] rounded-xl`} />
          <div className="px-4 pt-3.5 pb-3 sm:px-5">
            <div className={`${skeleton} h-6 w-2/3 rounded-md`} />
            <div className={`${skeleton} mt-1.5 h-4 w-1/2 rounded-md`} />
            <div className={`${skeleton} mt-4 h-11 w-20 rounded-full`} />
          </div>
        </li>
      ))}
    </ul>
  );
}
