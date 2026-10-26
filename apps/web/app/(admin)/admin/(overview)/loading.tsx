import { CardSkeleton, HeaderSkeleton, SkeletonPage, TileItemsSkeleton } from "../AdminSkeletons";

// Esqueleto da visão geral: aparece na hora do clique em "Overview" (a página lê o banco). Fica
// no grupo (overview) para valer só no /admin: as outras abas têm o próprio esqueleto, e o editor
// de modelos não herda este.

export default function AdminOverviewLoading() {
  return (
    <SkeletonPage label="Loading the command center…">
      <div className="grid grid-cols-1 gap-8">
        <HeaderSkeleton titleWidth="w-64" />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TileItemsSkeleton count={8} />
        </ul>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
        </div>
      </div>
    </SkeletonPage>
  );
}
