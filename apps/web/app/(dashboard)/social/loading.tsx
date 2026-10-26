import { SocialCalendarSkeleton } from "./SocialCalendar";

// Esqueleto do /social: aparece na hora do clique (a página lê a sessão e o calendário no
// servidor), com a mesma estrutura do calendário pronto para nada pular quando ele chega.

const block = "rounded-2xl bg-(--glass-groove) motion-safe:animate-pulse";

export default function SocialLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your posts…</span>
      <div aria-hidden="true">
        <div className={`${block} h-10 w-36 rounded-xl lg:h-12`} />
        <div className={`${block} mt-2 h-5 w-96 max-w-full rounded-md`} />
        <SocialCalendarSkeleton />
      </div>
    </div>
  );
}
