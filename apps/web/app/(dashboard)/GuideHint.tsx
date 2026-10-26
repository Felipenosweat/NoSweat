import Link from "next/link";
import { cx, focusRing } from "@/components/glass";
import { guideHref, type GuideSectionId } from "@/lib/guide";

// "New here? See how it works": uma linha pequena nos estados vazios, levando à seção certa do
// /guide. Sem "use client" (serve em server e client components). Vai no `footnote` do EmptyState.

export function GuideHint({ section }: { section: GuideSectionId }) {
  return (
    <>
      New here?{" "}
      <Link
        href={guideHref(section)}
        className={cx(
          "rounded font-semibold text-brand underline-offset-2 hover:underline",
          focusRing,
        )}
      >
        See how it works
      </Link>
    </>
  );
}
