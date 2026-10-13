import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getPhoto } from "@/components/photos";
import { safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient, getCurrentUser } from "@/server/auth/session";
import { AuthForm } from "./AuthForm";

export const metadata: Metadata = { title: "Log in" };

type LoginPageProps = { searchParams: Promise<{ next?: string; error?: string }> };

const ERRORS: Record<string, string> = {
  confirm: "That confirmation link is invalid or has expired. Please log in or sign up again.",
};

/** Lado direito (só em telas grandes): uma foto com crédito ou, sem foto, um painel calmo. */
function SidePanel() {
  const photo = getPhoto("stylist") ?? getPhoto("cleaner");
  if (!photo) {
    return (
      <div className="flex h-full flex-col items-start justify-end rounded-xl border border-slate-200 bg-surface p-10">
        <Image
          src="/brand/nosweat-mark-128.png"
          alt=""
          width={48}
          height={48}
          className="size-12"
        />
        <p className="mt-6 max-w-[22ch] font-display text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-ink">
          Your website, written from one sentence.
        </p>
      </div>
    );
  }
  return (
    <figure className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl ring-1 ring-black/5">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="45vw"
          className="object-cover"
          style={{ objectPosition: photo.focus }}
        />
      </div>
      <figcaption className="mt-2 text-xs text-slate-500">
        Photo:{" "}
        <a
          href={photo.credit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {photo.credit.name}
        </a>{" "}
        / {photo.credit.source} ({photo.credit.license})
      </figcaption>
    </figure>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  // Login desligado (dev local sem Supabase) ou já logado: segue direto.
  const supabase = await createSupabaseServerClient();
  if (!supabase || (await getCurrentUser())) redirect(next);

  return (
    <div className="min-h-svh bg-white lg:grid lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
      <div className="flex min-h-svh flex-col px-5 sm:px-8">
        <header className="flex h-16 items-center">
          <Logo />
        </header>
        <main className="flex flex-1 items-center py-10 lg:justify-center">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display text-3xl leading-tight font-bold tracking-[-0.03em] text-ink">
              Welcome
            </h1>
            <p className="mt-2 text-[15px] leading-[1.6] text-slate-600">
              Log in or create a free account to build your website.
            </p>
            <AuthForm next={next} initialError={params.error ? ERRORS[params.error] : undefined} />
          </div>
        </main>
      </div>
      <div className="hidden h-svh p-4 lg:sticky lg:top-0 lg:block">
        <SidePanel />
      </div>
    </div>
  );
}
