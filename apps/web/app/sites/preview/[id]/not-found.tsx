import Link from "next/link";

export default function PreviewNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-extrabold">We couldn&rsquo;t find that site</h1>
      <p className="max-w-md text-slate-600">
        Previews are kept in memory during development, so they disappear when the server restarts.
      </p>
      <Link href="/create" className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white">
        Create a new site
      </Link>
    </main>
  );
}
