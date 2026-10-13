import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  /** Mostra a linha "AI websites for businesses" embaixo do nome (ex.: rodapé). */
  tagline?: boolean;
  /** "dark": em fundo escuro ("No" em branco). */
  tone?: "light" | "dark";
};

/** Logo oficial da NoSweat: símbolo "N" com brilho + nome "No" (navy) "Sweat" (azul). */
export function Logo({ tagline = false, tone = "light" }: LogoProps) {
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
          <span className={tone === "dark" ? "text-white" : "text-ink"}>No</span>
          <span className={tone === "dark" ? "text-[#3d8bff]" : "text-brand"}>Sweat</span>
        </span>
        {tagline && (
          <span
            className={`mt-1.5 text-[10px] leading-none font-semibold tracking-[0.18em] uppercase ${tone === "dark" ? "text-slate-400" : "text-slate-500"}`}
          >
            AI websites for businesses
          </span>
        )}
      </span>
    </Link>
  );
}
