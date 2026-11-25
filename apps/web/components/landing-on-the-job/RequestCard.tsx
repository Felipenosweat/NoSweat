// "O cartão de pedido": o aviso que a No Sweat mostra quando chega um pedido pelo formulário do
// site, desenhado como a linha da tela Clients (selo "New" azul com ponto, iniciais num círculo
// azul-claro, botão "Reply" azul com o envelope). É interface do produto, não enfeite: sempre com a
// legenda "Example request" (nome e serviço inventados). Não é clicável (o "Reply" é só desenho).

export function RequestCard({
  name,
  job,
  time,
  caption,
  className = "",
}: {
  name: string;
  job: string;
  time: string;
  caption: string;
  className?: string;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <figure
      className={`w-full max-w-[22rem] rounded-xl border border-slate-200 bg-white p-4 text-left text-ink shadow-[0_1px_2px_rgb(7_27_51/.08),0_18px_40px_-16px_rgb(7_27_51/.45)] ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-brand/10 px-2 text-[13px] font-semibold text-brand">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
          New
        </span>
        <span className="min-w-0 flex-1 text-[14px] font-semibold">
          New request from your website
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-[14px] font-semibold text-brand"
        >
          {initials}
        </span>
        <p className="min-w-0 flex-1 text-[15px] leading-snug">
          <span className="font-semibold">{name}</span>
          <span className="text-slate-600"> · {job}</span>
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] whitespace-nowrap text-slate-500">
          <span>{caption}</span>
          <span aria-hidden="true" className="max-[359px]:hidden">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            {time}
          </span>
        </figcaption>
        <span
          aria-hidden="true"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-[14px] font-semibold text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3.5 6.5 8.5 6 8.5-6" />
          </svg>
          Reply
        </span>
      </div>
    </figure>
  );
}
