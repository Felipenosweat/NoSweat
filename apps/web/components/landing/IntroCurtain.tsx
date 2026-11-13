// Abertura da landing (forma do averaks.com): tela branca, o símbolo aparece, o nome "NoSweat"
// se escreve letra por letra com uma barrinha de progresso, e a cortina sobe (pedido do fundador).
// Curta (~0,9 s; os tempos ficam em landing.css), uma vez por sessão e nunca com "reduzir
// movimento": fica escondida por padrão e só aparece quando o script inline de
// app/(landing)/layout.tsx marca .lp[data-ns-intro="play"]. Sem JavaScript não há abertura.
// A cortina nunca segura cliques (pointer-events: none).

const NAME = [..."No"]
  .map((c) => ({ c, blue: false }))
  .concat([..."Sweat"].map((c) => ({ c, blue: true })));

export function IntroCurtain() {
  return (
    <div className="lp-intro" aria-hidden="true">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/nosweat-mark-128.png"
            alt=""
            width={48}
            height={48}
            className="lp-intro-mark size-12"
          />
          <span className="font-display text-[2.5rem] leading-none font-bold tracking-[-0.03em]">
            {NAME.map((l, i) => (
              <span
                key={i}
                className={`lp-intro-l ${l.blue ? "text-brand" : "text-ink"}`}
                style={{ "--d": i } as React.CSSProperties}
              >
                {l.c}
              </span>
            ))}
          </span>
        </div>
        <span className="mt-7 block h-[2px] w-40 overflow-hidden rounded-full bg-ink/10">
          <span className="lp-intro-bar block h-full bg-ink" />
        </span>
      </div>
    </div>
  );
}
