import Image from "next/image";
import Link from "next/link";

// Logo branco para os fundos azul e ink da landing "Live". O Logo.tsx não tem versão branca
// (o "Sweat" azul some no azul), então aqui é o MESMO símbolo (nosweat-mark) pintado de branco
// por filtro e o nome na mesma fonte e peso do Logo, todo em branco.

export function LiveLogo({ size = 34 }: { size?: number }) {
  return (
    <Link
      href="/"
      aria-label="NoSweat home"
      className="inline-flex min-h-11 items-center gap-2.5 rounded-md whitespace-nowrap text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      <Image
        src="/brand/nosweat-mark-128.png"
        alt=""
        width={size}
        height={size}
        className="shrink-0 brightness-0 invert"
        style={{ width: size, height: size }}
      />
      <span className="font-display text-xl leading-none font-bold tracking-[-0.03em]">
        NoSweat
      </span>
    </Link>
  );
}
