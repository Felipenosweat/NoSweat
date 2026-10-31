import {
  CardSkeleton,
  SkeletonPage,
  TableSkeleton,
  TileSkeleton,
  skeletonBlock,
} from "../../AdminSkeletons";

// Esqueleto da ficha de uma conta: aparece na hora do clique numa conta da lista.

export default function AdminClientLoading() {
  return (
    <SkeletonPage label="Loading the account…">
      <div className={`${skeletonBlock} h-6 w-28 rounded-lg`} />
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className={`${skeletonBlock} h-8 w-64 max-w-full rounded-xl`} />
        <div className={`${skeletonBlock} mt-2 h-4 w-48 rounded-md`} />
        <div className="mt-4 flex gap-1.5">
          <div className={`${skeletonBlock} h-6 w-28 rounded-full`} />
          <div className={`${skeletonBlock} h-6 w-20 rounded-full`} />
        </div>
        <div className={`${skeletonBlock} mt-4 h-3.5 w-72 max-w-full rounded-md`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <TileSkeleton key={i} />
        ))}
      </div>
      <div>
        <div className={`${skeletonBlock} h-6 w-32 rounded-lg`} />
        <div className="mt-3">
          <TableSkeleton rows={3} columns={5} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={5} />
      </div>
      <CardSkeleton lines={3} />
    </SkeletonPage>
  );
}
