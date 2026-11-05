// Depois de publicado (#clients e #social, no escuro): a lista de Clientes que se enche com os
// pedidos do formulário e o calendário de posts do Instagram que esperam o OK do dono.
// Desenhos fiéis das telas /clients e /social com o exemplo da Still Water Spa (fictícia).
// Sem fotos: o quadrado do post é só um espaço colorido (pedido do fundador).

const STAGES = {
  new: { label: "New", dot: "bg-[#00c2ff]" },
  quoted: { label: "Quoted", dot: "bg-amber-500" },
  won: { label: "Won", dot: "bg-emerald-500" },
} as const;

const CLIENTS: { name: string; ask: string; when: string; stage: keyof typeof STAGES }[] = [
  { name: "Hannah Brooks", ask: "Couples massage, Saturday", when: "Just now", stage: "new" },
  { name: "Luis Ortega", ask: "Facial and hot stone", when: "Today", stage: "quoted" },
  { name: "Priya Raman", ask: "Gift card for her mom", when: "Oct 21", stage: "won" },
  { name: "Dana Whitfield", ask: "Prenatal massage", when: "Oct 19", stage: "won" },
];

function ClientsMock() {
  return (
    <div className="rounded-2xl bg-white p-2 text-[#071b33] shadow-[0_40px_80px_-40px_rgb(7_27_51/.35)] ring-1 ring-[var(--lp-line)]">
      <div className="flex items-center justify-between px-3 pt-2 pb-3">
        <p className="text-[15px] font-semibold">Clients</p>
        <span className="rounded-full border border-[#071b33]/15 px-2 py-0.5 text-[11px] font-semibold text-[#071b33]/60">
          Example
        </span>
      </div>
      <ul className="divide-y divide-[#071b33]/10 rounded-xl ring-1 ring-[#071b33]/10">
        {CLIENTS.map((client, index) => (
          <li
            key={client.name}
            className={`flex items-center gap-3 px-3 py-3 ${index === 0 ? "bg-[#071b33]/[0.04]" : ""}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#071b33]/[0.07] text-[12px] font-semibold">
              {client.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{client.name}</span>
              <span className="block truncate text-[12px] text-[#071b33]/60">
                {client.ask} · {client.when}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#071b33]/75">
              <span className={`size-1.5 rounded-full ${STAGES[client.stage].dot}`} />
              {STAGES[client.stage].label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const POSTS = [
  {
    day: "Tue",
    time: "10:00 AM",
    text: "Hot stone massage is back on the menu this fall.",
    ok: true,
  },
  { day: "Thu", time: "6:30 PM", text: "Our couples suite is open on Sundays now.", ok: false },
  { day: "Sat", time: "9:00 AM", text: "Walking over from Old Town? Parking is free.", ok: false },
];

function SocialMock() {
  return (
    <div className="rounded-2xl bg-white p-2 text-[#071b33] shadow-[0_40px_80px_-40px_rgb(7_27_51/.35)] ring-1 ring-[var(--lp-line)]">
      <div className="flex items-center justify-between px-3 pt-2 pb-3">
        <p className="text-[15px] font-semibold">This week on Instagram</p>
        <span className="rounded-full border border-[#071b33]/15 px-2 py-0.5 text-[11px] font-semibold text-[#071b33]/60">
          Example
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {POSTS.map((post) => {
          return (
            <li key={post.day} className="min-w-0 rounded-xl ring-1 ring-[#071b33]/10">
              <span className="block aspect-[4/3] rounded-t-xl bg-[var(--lp-tint)] p-2 text-[11px] font-semibold text-[#0066ff]">
                Photo
              </span>
              <span className="block p-2">
                <span className="block text-[11px] font-semibold text-[#071b33]/55">
                  {post.day} · {post.time}
                </span>
                <span className="mt-1 line-clamp-3 block text-[12px] leading-snug">
                  {post.text}
                </span>
                <span
                  className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${
                    post.ok ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${post.ok ? "bg-emerald-600" : "bg-amber-500"}`}
                  />
                  {post.ok ? "Approved" : "Needs your OK"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AfterLaunch() {
  return (
    <section aria-labelledby="after-title" className="py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <h2
          id="after-title"
          data-lp-rise
          className="lp-serif text-center text-[clamp(2rem,4.4vw,3.5rem)]"
        >
          After it goes <em>live.</em>
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-14 lg:mt-14 lg:grid-cols-2 lg:gap-12">
          <article id="clients" className="scroll-mt-24">
            <div data-lp-rise>
              <h3 className="lp-serif text-[clamp(1.5rem,2.4vw,2rem)]">
                Requests turn into <em>clients</em>
              </h3>
              <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.7] text-[#071b33]/70">
                Every contact form request lands in one list, ready to follow up.
              </p>
            </div>
            <div data-lp-rise className="mt-8">
              <ClientsMock />
            </div>
          </article>

          <article id="social" className="scroll-mt-24">
            <div data-lp-rise>
              <h3 className="lp-serif text-[clamp(1.5rem,2.4vw,2rem)]">
                Posts that wait for your <em>OK</em>
              </h3>
              <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.7] text-[#071b33]/70">
                We draft them, you approve them. Needs an Instagram professional account.
              </p>
            </div>
            <div data-lp-rise className="mt-8">
              <SocialMock />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
