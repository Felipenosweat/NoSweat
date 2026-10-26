import { HeaderSkeleton, SkeletonPage, skeletonBlock } from "../../AdminSkeletons";

// Esqueleto do estúdio de modelos: aparece na hora do clique em "Models". Fica no grupo (list)
// para valer só na lista: o editor e a prévia de um modelo não herdam esta grade de cartões.

export default function AdminModelsLoading() {
  return (
    <SkeletonPage label="Loading models…">
      <div className="flex flex-col gap-10">
        <HeaderSkeleton titleWidth="w-52" />
        {[0, 1].map((section) => (
          <div key={section}>
            <div className={`${skeletonBlock} h-7 w-40 rounded-lg`} />
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((card) => (
                <li key={card} className="glass flex flex-col overflow-hidden rounded-2xl">
                  <div
                    className={`${skeletonBlock} aspect-[16/10] rounded-none border-b border-(--glass-rim)`}
                  />
                  <div className="grid gap-2.5 p-4 sm:p-5">
                    <div className={`${skeletonBlock} h-5 w-2/3 rounded-md`} />
                    <div className={`${skeletonBlock} h-3.5 w-1/2 rounded-md`} />
                    <div className={`${skeletonBlock} h-6 w-24 rounded-full`} />
                    <div className={`${skeletonBlock} mt-2 h-10 w-full rounded-full`} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
