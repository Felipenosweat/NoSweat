import { HeaderSkeleton, SkeletonPage, TableSkeleton } from "../AdminSkeletons";

// Esqueleto do registro de auditoria: aparece na hora do clique em "Audit".

export default function AdminAuditLoading() {
  return (
    <SkeletonPage label="Loading the audit log…">
      <HeaderSkeleton titleWidth="w-36" />
      <TableSkeleton rows={8} columns={5} />
    </SkeletonPage>
  );
}
