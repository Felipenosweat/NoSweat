import { CardSkeleton, HeaderSkeleton, SkeletonPage, TileSkeleton } from "../AdminSkeletons";

// Esqueleto das finanças: aparece na hora do clique em "Finance" (a página lê o banco).

export default function AdminFinanceLoading() {
  return (
    <SkeletonPage label="Loading finance…">
      <HeaderSkeleton titleWidth="w-40" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={i === 4 ? "col-span-2 lg:col-span-1" : undefined}>
            <TileSkeleton />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardSkeleton lines={9} className="lg:col-span-2" />
        <CardSkeleton lines={6} />
      </div>
      <CardSkeleton lines={4} />
    </SkeletonPage>
  );
}
