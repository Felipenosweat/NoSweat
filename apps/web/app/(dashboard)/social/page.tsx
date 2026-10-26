import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/DashboardUi";
import type { CurrentUser } from "@/server/auth/session";
import { getViewer } from "@/server/auth/viewer";
import { getSocialState } from "@/server/social/api";
import { currentMonth, monthRangeUtc, toPublicPost } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";
import { ReadOnlySocial, loadReadOnlySocial } from "./ReadOnlySocial";
import {
  SocialCalendar,
  SocialCalendarSkeleton,
  type SocialCalendarInitial,
} from "./SocialCalendar";

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

/**
 * A primeira tela do calendário lida no servidor: o mesmo que /api/social/state e
 * /api/social/posts devolvem para o mês mostrado. Sem isto o navegador fazia duas idas e voltas
 * (estado, depois posts) antes de desenhar qualquer coisa. Erro = `null`: o calendário busca pela
 * API como antes (e mostra o erro e o "Try again" de sempre).
 */
async function loadInitialSocial(
  user: CurrentUser,
  initialMonth: string | null,
): Promise<SocialCalendarInitial | null> {
  try {
    const store = getSocialStore();
    // Em paralelo: as configurações (fuso) para achar o mês dos posts, e o estado completo.
    const [state, posts] = await Promise.all([
      getSocialState(user),
      store.getSettings(user.id).then((settings) => {
        const month = initialMonth ?? currentMonth(settings.timezone);
        const { fromIso, toIso } = monthRangeUtc(month, settings.timezone);
        return store
          .listPosts(user.id, fromIso, toIso)
          .then((list) => ({ month, timezone: settings.timezone, list }));
      }),
    ]);
    // As duas leituras das configurações discordaram (salvou no meio): deixa o navegador buscar.
    if (posts.timezone !== state.settings.timezone) return null;
    return { state, month: posts.month, posts: posts.list.map(toPublicPost) };
  } catch (error) {
    console.error("[social] could not preload the calendar", error);
    return null;
  }
}

async function PreloadedCalendar({
  user,
  initialMonth,
}: {
  user: CurrentUser;
  initialMonth: string | null;
}) {
  const initial = await loadInitialSocial(user, initialMonth);
  return <SocialCalendar initialMonth={initialMonth} initial={initial} />;
}

export default async function SocialPage({ searchParams }: SocialPageProps) {
  // Sempre na hora do request (dados do dono e da sessão).
  await connection();
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/social");

  // Modo "ver como" do admin: o calendário busca pela API com a conta logada (a do admin), então
  // aqui o servidor mostra a lista da conta vista, só para ler.
  if (viewer.viewingAs) {
    const data = await loadReadOnlySocial(viewer.ownerId);
    return (
      <div>
        <PageHeader
          title="Social"
          description={
            <>
              Read-only list of this account&rsquo;s Instagram posts. Planning and approving are off
              while you view another account.
            </>
          }
        />
        <ReadOnlySocial data={data} />
      </div>
    );
  }

  const { connected, error, approved, month } = await searchParams;

  const initialMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null;
  const approvedCount = approved && /^\d{1,3}$/.test(approved) ? Number(approved) : 0;
  const errorText = error ? (CONNECT_ERRORS[error] ?? GENERIC_CONNECT_ERROR) : null;

  return (
    <div>
      <PageHeader
        title="Social"
        description="Plan a month of Instagram posts in minutes. Nothing goes out until you approve it."
      />

      {connected === "1" && !errorText && (
        <p
          role="status"
          className="glass-edge mt-6 rounded-2xl bg-emerald-50/85 px-4 py-3 text-[15px] text-emerald-950"
        >
          Instagram connected. Approved posts will go out at their scheduled time.
        </p>
      )}
      {errorText && (
        <p
          role="alert"
          className="glass-edge mt-6 rounded-2xl bg-red-50/85 px-4 py-3 text-[15px] text-red-700"
        >
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
          className="glass-edge mt-6 rounded-2xl bg-emerald-50/85 px-4 py-3 text-[15px] text-emerald-950"
        >
          {approvedCount} post{approvedCount === 1 ? "" : "s"} approved.
        </p>
      )}

      {/* O topo aparece na hora; o calendário chega em streaming, já com os dados. */}
      <Suspense fallback={<SocialCalendarSkeleton />}>
        <PreloadedCalendar user={viewer.user} initialMonth={initialMonth} />
      </Suspense>
    </div>
  );
}
