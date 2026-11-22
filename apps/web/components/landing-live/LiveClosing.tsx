import Link from "next/link";
import { onBlueButton } from "./styles";

// Fim (bloco azul): o título do herói de volta, em escala de cartaz, e o botão branco.
// O único efeito de rolagem da página: o título cresce de leve ao entrar (live.css, .live-grow).
// `data-live-hide-bar`: a barra fixa do celular some aqui (o botão já está na tela).

export function LiveClosing() {
  return (
    <section
      aria-labelledby="closing-title"
      data-live-hide-bar
      className="overflow-hidden bg-brand text-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
        <h2
          id="closing-title"
          className="live-d live-grow text-[clamp(3.25rem,12vw,11rem)] leading-[0.9] font-extrabold tracking-[-0.045em]"
        >
          Your website,
          <span className="live-serif block pt-[0.04em] text-[1.08em] leading-[0.95]">
            no sweat.
          </span>
        </h2>
        <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/create" className={onBlueButton}>
            Start my website
          </Link>
          <p className="text-[17px] text-white">Describing your business is free.</p>
        </div>
      </div>
    </section>
  );
}
