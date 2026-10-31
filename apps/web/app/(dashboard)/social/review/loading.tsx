import { skeletonBlock as block } from "../../office/_ui/ui";

// Esqueleto de "Review your posts": sem ele o toque mostraria o esqueleto do calendário
// (social/loading.tsx). Mesma estrutura da lista pronta: link de volta, título e cartões.

export default function SocialReviewLoading() {
  return (
    <div role="status" aria-live="polite" className="max-w-3xl">
      <span className="sr-only">Loading posts to review…</span>
      <div aria-hidden="true">
        <div className={`${block} h-5 w-36 rounded-md`} />
        <div className={`${block} mt-3 h-10 w-64 max-w-full rounded-xl lg:h-12`} />
        <div className={`${block} mt-2 h-5 w-[26rem] max-w-full rounded-md`} />
        <div className="mt-8 grid gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="glass grid gap-4 rounded-2xl p-4 sm:grid-cols-[10rem_1fr] sm:p-5"
            >
              <div className={`${block} aspect-square rounded-xl`} />
              <div className="grid content-start gap-3">
                <div className={`${block} h-4 w-1/3 rounded-md`} />
                <div className={`${block} h-3 w-full rounded-md`} />
                <div className={`${block} h-3 w-5/6 rounded-md`} />
                <div className={`${block} h-3 w-2/3 rounded-md`} />
                <div className="mt-2 flex gap-2">
                  <div className={`${block} h-11 w-28 rounded-full`} />
                  <div className={`${block} h-11 w-24 rounded-full`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
