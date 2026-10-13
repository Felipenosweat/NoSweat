import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient, getCurrentUser } from "@/server/auth/session";
import { AuthForm } from "./AuthForm";

export const metadata: Metadata = { title: "Log in" };

type LoginPageProps = { searchParams: Promise<{ next?: string; error?: string }> };

const ERRORS: Record<string, string> = {
  confirm: "That confirmation link is invalid or has expired. Please log in or sign up again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  // Login desligado (dev local sem Supabase) ou já logado: segue direto.
  const supabase = await createSupabaseServerClient();
  if (!supabase || (await getCurrentUser())) redirect(next);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight">Welcome</h1>
        <p className="mt-2 text-slate-600">
          Log in or create a free account to build your website.
        </p>
        <AuthForm next={next} initialError={params.error ? ERRORS[params.error] : undefined} />
      </div>
    </main>
  );
}
