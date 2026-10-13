import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { hasCompleteProfile } from "@/lib/signup-rules";
import { safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";
import { signOut } from "../login/actions";
import { ProfileForm } from "./ProfileForm";

// "Complete your profile": quem entrou pelo Google/Apple (ou tem conta de antes desta regra)
// informa nome e data de nascimento (18+) antes de usar o painel. O proxy.ts manda para cá.

export const metadata: Metadata = { title: "Complete your profile", robots: { index: false } };

type SearchParams = Promise<{ next?: string }>;

/** Primeiro e último nome que o Google/Apple já mandaram (só para pré-preencher). */
function nameDefaults(metadata: Record<string, unknown>): {
  firstName?: string;
  lastName?: string;
} {
  const full = [metadata.full_name, metadata.name].find((v) => typeof v === "string") as
    string | undefined;
  const given = typeof metadata.given_name === "string" ? metadata.given_name : undefined;
  const family = typeof metadata.family_name === "string" ? metadata.family_name : undefined;
  if (given || family) return { firstName: given, lastName: family };
  if (!full) return {};
  const [first, ...rest] = full.trim().split(/\s+/);
  return { firstName: first, lastName: rest.join(" ") || undefined };
}

export default async function WelcomePage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNextPath((await searchParams).next);
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(next);

  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  if (hasCompleteProfile(metadata)) redirect(next);

  return (
    <div className="flex min-h-dvh flex-col bg-white px-5 py-6 sm:px-10 sm:py-8">
      <header className="flex items-center justify-between gap-4">
        <Logo />
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Log out
          </button>
        </form>
      </header>
      <main className="flex flex-1 items-center justify-center py-12 sm:py-16">
        <div className="w-full max-w-[400px]">
          <h1 className="font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
            One more step
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Tell us who you are. No Sweat is for business owners 18 and older.
          </p>
          <div className="mt-8">
            <ProfileForm next={next} defaults={nameDefaults(metadata)} />
          </div>
        </div>
      </main>
    </div>
  );
}
