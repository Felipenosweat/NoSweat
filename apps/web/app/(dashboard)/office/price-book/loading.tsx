import { ListSkeleton } from "../_ui/skeletons";

// Esqueleto da tabela de preços.
export default function PriceBookLoading() {
  return <ListSkeleton label="Loading your price book…" tiles={0} />;
}
