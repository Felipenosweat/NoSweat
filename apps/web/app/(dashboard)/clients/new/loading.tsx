// Esqueleto do cadastro (/clients/new): sem ele apareceria o da lista.

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function NewClientLoading() {
  return (
    <div role="status" aria-live="polite" className="max-w-2xl">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <div className={`${block} h-9 w-40`} />
        <div className={`${block} mt-8 h-96`} />
      </div>
    </div>
  );
}
