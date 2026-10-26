import { ListSkeleton } from "../office/_ui/skeletons";

// Esqueleto da lista de faturas.
export default function InvoicesLoading() {
  return <ListSkeleton label="Loading your invoices…" />;
}
