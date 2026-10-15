import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { panelText, textButton } from "@/components/DashboardUi";
import { getCurrentUser } from "@/server/auth/session";
import { ReviewList } from "./ReviewList";

export const metadata: Metadata = { title: "Review posts", robots: { index: false } };

type ReviewPageProps = { searchParams: Promise<{ month?: string }> };

/** Aprovar vários posts de uma vez: cada legenda inteira à vista + confirmação obrigatória. */
export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/social/review");
  const { month } = await searchParams;
  const initialMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={initialMonth ? `/social?month=${initialMonth}` : "/social"}
        className={`${textButton} -ml-1`}
      >
        <span aria-hidden="true">&larr;</span> Back to calendar
      </Link>
      <h1 className="mt-4 font-display text-3xl leading-tight font-bold tracking-[-0.03em] text-ink">
        Review your posts
      </h1>
      <p className={`mt-2 max-w-[60ch] ${panelText}`}>
        Read every caption before you approve. Edit anything that isn&rsquo;t right for your
        business from the calendar.
      </p>
      <ReviewList initialMonth={initialMonth} />
    </div>
  );
}
