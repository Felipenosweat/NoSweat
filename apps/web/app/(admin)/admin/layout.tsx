import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { Logo } from "@/components/Logo";
import { isAdminUser } from "@/server/admin";
import { getCurrentUser } from "@/server/auth/session";

/** Painel principal da No Sweat. Só admins (public.platform_admins); para os outros, 404. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await isAdminUser(user))) notFound();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white px-2 py-1 text-slate-900">
              <Logo />
            </div>
            <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-slate-950">
              ADMIN
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-300">
            <Link href="/admin" className="hover:text-white">
              Overview
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              My sites
            </Link>
            <form action={signOut}>
              <button type="submit" className="hover:text-white">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
