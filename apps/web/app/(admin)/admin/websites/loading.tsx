import {
  CardSkeleton,
  HeaderSkeleton,
  SkeletonPage,
  TableSkeleton,
  ToolbarSkeleton,
} from "../AdminSkeletons";

// Esqueleto da lista de sites: aparece na hora do clique em "Websites".

export default function AdminWebsitesLoading() {
  return (
    <SkeletonPage label="Loading websites…">
      <HeaderSkeleton titleWidth="w-44" />
      <ToolbarSkeleton segments={5} />
      <TableSkeleton rows={8} columns={6} />
      <CardSkeleton lines={2} />
    </SkeletonPage>
  );
}
