// Um site de exemplo DESENHADO em HTML (sem foto nem captura): barra do navegador, menu, título em
// serifa, botões e linhas de serviços. Negócio fictício (Still Water Spa). Usado no hero e nos
// passos. Decorativo para leitor de tela (o texto ao redor explica).

export function MiniSite({ address = "nosweatfd.com/s/still-water-spa" }: { address?: string }) {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl bg-white shadow-[0_30px_60px_-30px_rgb(7_27_51/.35)] ring-1 ring-[var(--lp-line)]"
    >
      <div className="flex h-9 items-center gap-3 border-b border-[var(--lp-line)] px-3">
        <span className="flex gap-1.5">
          <span className="size-2 rounded-full bg-[#071b33]/15" />
          <span className="size-2 rounded-full bg-[#071b33]/15" />
          <span className="size-2 rounded-full bg-[#071b33]/15" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-[#071b33]/[0.05] px-3 py-0.5 text-[11px] text-[#071b33]/65">
          {address}
        </span>
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between text-[11px] text-[#071b33]/70">
          <span className="lp-serif text-[15px]">Still Water Spa</span>
          <span className="hidden gap-4 sm:flex">
            <span>About</span>
            <span>Services</span>
            <span>Contact</span>
          </span>
          <span className="rounded-full bg-[#0066ff] px-3 py-1 font-semibold text-white">
            Book a treatment
          </span>
        </div>
        <p className="lp-serif mt-8 max-w-[11ch] text-[clamp(2rem,4vw,3.25rem)]">
          Slow down, <em>you’re here.</em>
        </p>
        <p className="mt-4 max-w-[34ch] text-[12px] leading-relaxed text-[#071b33]/65">
          Massage and facials in Old Town Scottsdale. Open daily 9 to 8.
        </p>
        <div className="mt-5 flex gap-2">
          <span className="rounded-full bg-[#071b33] px-4 py-1.5 text-[11px] font-semibold text-white">
            Book a treatment
          </span>
          <span className="rounded-full border border-[#071b33]/20 px-4 py-1.5 text-[11px] font-semibold text-[#071b33]">
            (480) 555-0171
          </span>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-2">
          {["Massage", "Facials", "Hot stone"].map((service) => (
            <span
              key={service}
              className="rounded-lg bg-[var(--lp-tint)] px-3 py-3 text-[11px] font-semibold text-[#071b33]/80 ring-1 ring-[var(--lp-line)]"
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
