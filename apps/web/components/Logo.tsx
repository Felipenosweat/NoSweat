import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  /** Mostra a linha "AI websites for businesses" embaixo do nome (ex.: rodapé). */
  tagline?: boolean;
};

/** Logo oficial da NoSweat: símbolo "N" com brilho + nome "No" (navy) "Sweat" (azul). */
export function Logo({ tagline = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="NoSweat home"
      className="inline-flex items-center gap-2.5 whitespace-nowrap"
    >
      <Image
        src="/brand/nosweat-mark-128.png"
        alt=""
        width={34}
        height={34}
        priority
        className="size-[34px] shrink-0"
      />
      <span className="flex flex-col">
        <span className="font-display text-xl leading-none font-bold tracking-[-0.03em]">
          <span className="text-ink">No</span>
          <span className="text-brand">Sweat</span>
        </span>
        {tagline && (
          <span className="mt-1.5 text-[10px] leading-none font-semibold tracking-[0.18em] text-slate-500 uppercase">
            AI websites for businesses
          </span>
        )}
      </span>
    </Link>
  );
}
