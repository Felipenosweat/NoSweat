import { MODEL_UNSPLASH_PHOTOS } from "@nosweat/fixtures";

// Depois de publicado (#clients e #social, no escuro): a lista de Clientes que se enche com os
// pedidos do formulário e o calendário de posts do Instagram que esperam o OK do dono.
// Desenhos fiéis das telas /clients e /social com o exemplo da Still Water Spa (fictícia).
// As fotos dos posts são as da galeria do site de exemplo (Unsplash, hotlink com crédito).

const STAGES = {
  new: { label: "New", dot: "bg-sky-400" },
  quoted: { label: "Quoted", dot: "bg-amber-400" },
  won: { label: "Won", dot: "bg-emerald-400" },
} as const;

const CLIENTS: { name: string; ask: string; when: string; stage: keyof typeof STAGES }[] = [
  { name: "Hannah Brooks", ask: "Couples massage, Saturday", when: "Just now", stage: "new" },
  { name: "Luis Ortega", ask: "Facial and hot stone", when: "Today", stage: "quoted" },
  { name: "Priya Raman", ask: "Gift card for her mom", when: "Oct 21", stage: "won" },
  { name: "Dana Whitfield", ask: "Prenatal massage", when: "Oct 19", stage: "won" },
];

function ClientsMock() {
  return (
    <div className="rounded-2xl bg-white p-2 text-[#071b33] shadow-[0_50px_100px_-40px_rgb(0_0_0/.7)]">
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

const photos = MODEL_UNSPLASH_PHOTOS["still-water-spa"]?.gallery ?? [];

/** URL menor da mesma foto do Unsplash (o hotlink pede o parâmetro w). */
function small(url: string) {
  return url.replace(/([?&])w=\d+/, "$1w=640");
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
    <div className="rounded-2xl bg-white p-2 text-[#071b33] shadow-[0_50px_100px_-40px_rgb(0_0_0/.7)]">
      <div className="flex items-center justify-between px-3 pt-2 pb-3">
        <p className="text-[15px] font-semibold">This week on Instagram</p>
        <span className="rounded-full border border-[#071b33]/15 px-2 py-0.5 text-[11px] font-semibold text-[#071b33]/60">
          Example
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {POSTS.map((post, index) => {
          const photo = photos[index % Math.max(photos.length, 1)];
          return (
            <li key={post.day} className="min-w-0 rounded-xl ring-1 ring-[#071b33]/10">
              <span className="block aspect-square overflow-hidden rounded-t-xl bg-[#071b33]/10">
                {photo && (
                  // Hotlink do Unsplash (exigido pelas regras deles); o otimizador do Next não entra.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={small(photo.url)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
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
      {photos.length > 0 && (
        <p className="px-3 pt-3 pb-1 text-[11px] text-[#071b33]/55">
          Photos by{" "}
          {photos.slice(0, 3).map((photo, index, list) => (
            <span key={photo.url}>
              {photo.credit?.url ? (
                <a href={photo.credit.url} className="underline underline-offset-2">
                  {photo.credit.name}
                </a>
              ) : (
                photo.credit?.name
              )}
              {index < list.length - 1 ? ", " : ""}
            </span>
          ))}{" "}
          on{" "}
          <a
            href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
            className="underline underline-offset-2"
          >
            Unsplash
          </a>
        </p>
      )}
    </div>
  );
}

export function AfterLaunch() {
  return (
    <section aria-labelledby="after-title" className="lp-night py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <h2
          id="after-title"
          data-lp-rise
          className="lp-serif max-w-[14ch] text-[clamp(2.4rem,5.5vw,5rem)] leading-[0.95] text-white"
        >
          After it goes <em>live</em>
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-14 lg:mt-14 lg:grid-cols-2 lg:gap-12">
          <article id="clients" className="scroll-mt-24">
            <div data-lp-rise>
              <h3 className="lp-serif text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-white">
                Requests turn into <em>clients</em>
              </h3>
              <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.7] text-white/70">
                When someone fills out your contact form, they show up in Clients with their
                message, phone and email. Move each one from new to quoted to won, and keep notes as
                you go.
              </p>
            </div>
            <div data-lp-rise className="mt-8">
              <ClientsMock />
            </div>
          </article>

          <article id="social" className="scroll-mt-24">
            <div data-lp-rise>
              <h3 className="lp-serif text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-white">
                Posts that wait for your <em>OK</em>
              </h3>
              <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.7] text-white/70">
                We draft Instagram posts from your site and your photos and put them on a calendar.
                Nothing is posted until you approve it. Needs an Instagram professional account.
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
