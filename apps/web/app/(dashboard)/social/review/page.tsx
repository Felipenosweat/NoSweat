import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { BackLink, PageHeader } from "@/components/DashboardUi";
import { getViewer } from "@/server/auth/viewer";
import { ReviewList } from "./ReviewList";

export const metadata: Metadata = { title: "Review posts", robots: { index: false } };

type ReviewPageProps = { searchParams: Promise<{ month?: string }> };

/** Aprovar vários posts de uma vez: cada legenda inteira à vista + confirmação obrigatória. */
export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  await connection();
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/social/review");
  // Modo "ver como" do admin: aprovar é escrita (e a lista viria da conta do admin pela API).
  if (viewer.viewingAs) redirect("/social");
  const { month } = await searchParams;
  const initialMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null;

  return (
    <div className="max-w-3xl">
      <PageHeader
        back={
          <BackLink href={initialMonth ? `/social?month=${initialMonth}` : "/social"}>
            Social
          </BackLink>
        }
        title="Review your posts"
        description={
          <>
            Read every caption before you approve. Edit anything that isn&rsquo;t right for your
            business from the calendar.
          </>
        }
      />
      <ReviewList initialMonth={initialMonth} />
    </div>
  );
}
