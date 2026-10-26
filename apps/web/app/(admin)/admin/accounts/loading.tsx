import {
  CardSkeleton,
  HeaderSkeleton,
  SkeletonPage,
  TableSkeleton,
  ToolbarSkeleton,
} from "../AdminSkeletons";

// Esqueleto da lista de contas: aparece na hora do clique em "Accounts".

export default function AdminAccountsLoading() {
  return (
    <SkeletonPage label="Loading accounts…">
      <HeaderSkeleton titleWidth="w-44" />
      <ToolbarSkeleton segments={2} />
      <TableSkeleton rows={8} columns={7} />
      <CardSkeleton lines={2} />
    </SkeletonPage>
  );
}
