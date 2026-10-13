import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight whitespace-nowrap text-ink"
    >
      <span className="flex size-8 items-center justify-center rounded-[0.6rem] bg-linear-to-br from-brand to-accent text-white shadow-sm">
        {/* Gota de suor estilizada: "no sweat". */}
        <svg viewBox="0 0 24 24" className="size-4.5" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5c-.4 0-.8.2-1 .6C9.3 6 6 10.6 6 14.5a6 6 0 0 0 12 0c0-3.9-3.3-8.5-5-11.4-.2-.4-.6-.6-1-.6Zm-2.2 12.1c.4 0 .7.3.7.7 0 1.1.9 2 2 2 .4 0 .7.3.7.7s-.3.7-.7.7a3.4 3.4 0 0 1-3.4-3.4c0-.4.3-.7.7-.7Z" />
        </svg>
      </span>
      No Sweat
    </Link>
  );
}
