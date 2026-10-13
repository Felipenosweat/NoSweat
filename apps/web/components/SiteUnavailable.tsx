/** Mostrado no lugar do site publicado quando o plano do dono acabou (volta ao renovar). */
export function SiteUnavailable({ name }: { name: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
        <p className="mt-3 text-slate-600">This website is temporarily unavailable.</p>
      </div>
    </main>
  );
}
