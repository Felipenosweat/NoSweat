// Abertura da landing (forma do averaks.com): tela branca, o símbolo aparece, o nome "NoSweat"
// se escreve letra por letra com uma barrinha de progresso, e a cortina sobe. Só CSS, então
// sobe mesmo sem JavaScript. A cortina nunca segura cliques (pointer-events: none).
// Na primeira visita da aba ela dura ~1,6 s; nas próximas (sessionStorage `ns_intro`) é a
// versão rápida, decidida pelo script abaixo ANTES da primeira pintura. Com "reduzir
// movimento" não aparece.

const NAME = [..."No"]
  .map((c) => ({ c, blue: false }))
  .concat([..."Sweat"].map((c) => ({ c, blue: true })));

const DECIDE = `try{var d=document.documentElement;if(sessionStorage.getItem("ns_intro"))d.classList.add("ns-fastintro");sessionStorage.setItem("ns_intro","1")}catch(e){}`;

export function IntroCurtain() {
  return (
    <>
      {/* Precisa rodar antes de a cortina ser pintada: é síncrono e vem antes dela no HTML. */}
      <script dangerouslySetInnerHTML={{ __html: DECIDE }} />
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
                  className={`lp-intro-l ${l.blue ? "text-[#0066ff]" : "text-[#071b33]"}`}
                  style={{ "--d": i } as React.CSSProperties}
                >
                  {l.c}
                </span>
              ))}
            </span>
          </div>
          <span className="mt-7 block h-[2px] w-40 overflow-hidden rounded-full bg-[#071b33]/10">
            <span className="lp-intro-bar block h-full bg-[#071b33]" />
          </span>
        </div>
      </div>
    </>
  );
}
