import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-emerald-500 text-sm text-white">
        NS
      </span>
      No Sweat
    </Link>
  );
}
