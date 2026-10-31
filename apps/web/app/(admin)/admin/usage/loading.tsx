import { HeaderSkeleton, SkeletonPage, TableSkeleton, TileSkeleton } from "../AdminSkeletons";

// Esqueleto do uso da IA: aparece na hora do clique em "Usage".

export default function AdminUsageLoading() {
  return (
    <SkeletonPage label="Loading AI usage…">
      <HeaderSkeleton titleWidth="w-36" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <TileSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={5} columns={5} />
    </SkeletonPage>
  );
}
