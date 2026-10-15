import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { panelText } from "@/components/DashboardUi";
import { getCurrentUser } from "@/server/auth/session";
import { SocialCalendar } from "./SocialCalendar";

export const metadata: Metadata = { title: "Social", robots: { index: false } };

type SocialPageProps = {
  searchParams: Promise<{ connected?: string; error?: string; approved?: string; month?: string }>;
};

// Erros que a volta do Instagram (/api/social/instagram/callback) manda em ?error=.
const CONNECT_ERRORS: Record<string, string> = {
  not_available:
    "Connecting Instagram isn't open for your account yet. You can still plan posts and share them yourself.",
  cancelled: "You canceled the Instagram connection. Nothing changed.",
  canceled: "You canceled the Instagram connection. Nothing changed.",
  not_business:
    "This is a personal Instagram account. In the Instagram app, switch it to a free Professional account (Business or Creator), then connect again.",
  missing_permission:
    "Instagram didn't give us permission to post. Connect again and leave every box checked.",
  account_in_use: "This Instagram account is already connected to another No Sweat account.",
  expired: "The connection took too long. Please try again.",
  invalid_state: "The connection link expired. Please try again.",
  payment_required: "Posting to Instagram is part of a paid plan. Pick a plan, then connect again.",
  not_configured: "Connecting Instagram isn't available right now. Please try again later.",
};

const GENERIC_CONNECT_ERROR = "We couldn't connect Instagram. Please try again in a minute.";

export default async function SocialPage({ searchParams }: SocialPageProps) {
  // Sempre na hora do request (dados do dono e da sessão).
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/social");
  const { connected, error, approved, month } = await searchParams;

  const initialMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null;
  const approvedCount = approved && /^\d{1,3}$/.test(approved) ? Number(approved) : 0;
  const errorText = error ? (CONNECT_ERRORS[error] ?? GENERIC_CONNECT_ERROR) : null;

  return (
    <div>
      <h1 className="font-display text-3xl leading-tight font-bold tracking-[-0.03em] text-ink lg:text-[2.5rem]">
        Social
      </h1>
      <p className={`mt-2 max-w-[60ch] ${panelText}`}>
        Plan a month of Instagram posts in minutes. Nothing goes out until you approve it.
      </p>

      {connected === "1" && !errorText && (
        <p
          role="status"
          className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900"
        >
          Instagram connected. Approved posts will go out at their scheduled time.
        </p>
      )}
      {errorText && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-[15px] text-red-700">
          {errorText}
          {error === "payment_required" && (
            <>
              {" "}
              <Link
                href="/billing?from=social"
                className="font-semibold underline underline-offset-4"
              >
                See plans
              </Link>
            </>
          )}
        </p>
      )}
      {approvedCount > 0 && (
        <p
          role="status"
          className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900"
        >
          {approvedCount} post{approvedCount === 1 ? "" : "s"} approved.
        </p>
      )}

      <SocialCalendar initialMonth={initialMonth} />
    </div>
  );
}
