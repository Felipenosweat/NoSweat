import { BUSINESS, SCENES } from "./content";
import { PHOTOS, type PhotoKey } from "./photos";
import { Photo, RailMark } from "./ui";

// O palco: a primeira dobra e as 14 horas de um brisket no mesmo lugar. Sem JS, com "reduzir
// movimento" ou em máquina fraca, é uma pilha de cenas (herói + 4 cenas, cada uma com a sua
// hora escrita). Com movimento completo, o SmokeMotion marca `data-staged`: a seção fica alta,
// o palco fica preso (sticky) e a rolagem vira o relógio: o contador rola de 00 a 14, as fotos
// se dissolvem (fogo → fumaça → casca → corte) e a linha de trilho embaixo enche de brasa.
// Os botões das estações levam a cada cena; o resto do texto está sempre no HTML.

const SCENE_PHOTO: Record<string, PhotoKey> = {
  fire: "fire",
  smoke: "smoker",
  bark: "bark",
  cut: "sliced",
};

const two = (value: number) => String(value).padStart(2, "0");

export function Stage() {
  return (
    <section
      id="top"
      data-sr-stage
      aria-labelledby="sr-title"
      className="sr-stage relative bg-[var(--sr-coal)] text-[var(--sr-smoke)]"
    >
      {/* Âncora do capítulo "Fourteen hours": no modo preso, a posição da primeira cena. */}
      <span id="pit" className="sr-stage-anchor" aria-hidden="true" />
      <div className="sr-stage-pin">
        {/* CENA 0: a primeira dobra */}
        <div className="sr-scene sr-scene-hero" data-scene="0">
          <div className="sr-scene-media" data-sr-media>
            <Photo
              photo={PHOTOS.hero}
              sizes="100vw"
              priority
              className="size-full object-cover object-[60%_50%]"
            />
          </div>
          <div className="sr-veil sr-veil-hero" />
          <div className="sr-scene-copy sr-wrap" data-sr-copy>
            <p className="sr-label sr-hero-in flex items-center gap-3 text-[12px] text-[var(--sr-ember)]">
              <RailMark className="h-3 w-6" />
              Smoke &amp; Rail BBQ · {BUSINESS.street}, {BUSINESS.city}
            </p>
            <h1
              id="sr-title"
              className="sr-display sr-hero-title mt-5 max-w-[11ch] text-[clamp(3.3rem,8.6vw,9.2rem)] leading-[0.84]"
            >
              Kansas City barbecue in the West Bottoms
            </h1>
            <p className="sr-hero-in mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-[var(--sr-smoke)]/85 sm:text-[18px]">
              Brisket, burnt ends and ribs from our pit next to the rail yard, open Thursday to
              Saturday until we sell out. The truck is at the Crossroads on Tuesdays and River
              Market on Wednesdays.
            </p>
            <div className="sr-hero-in mt-7 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
              <a
                href={BUSINESS.order}
                target="_blank"
                rel="noopener noreferrer"
                className="sr-btn sr-focus inline-flex h-12 items-center px-4 text-[12px] sm:px-6 sm:text-[13px]"
              >
                Preorder for pickup
              </a>
              <a
                href="#menu"
                className="sr-btn-ghost sr-focus inline-flex h-12 items-center px-4 text-[12px] sm:px-6 sm:text-[13px]"
              >
                See the menu
              </a>
            </div>
          </div>
        </div>

        <h2 className="sr-only">Fourteen hours over hickory</h2>
        {SCENES.map((scene) => {
          const photo = PHOTOS[SCENE_PHOTO[scene.key] ?? "fire"];
          return (
            <article
              key={scene.key}
              className="sr-scene"
              data-scene={scene.key}
              data-hour={scene.hour}
              aria-labelledby={`sr-scene-${scene.key}`}
            >
              <div className="sr-scene-media" data-sr-media>
                <Photo photo={photo} sizes="100vw" className="size-full object-cover" />
              </div>
              <div className="sr-veil" />
              <div className="sr-scene-copy sr-wrap" data-sr-copy>
                <p className="sr-scene-hour sr-display text-[clamp(4.5rem,14vw,9rem)] leading-[0.8] text-[var(--sr-ember)]">
                  <span className="sr-only">Hour </span>
                  {two(scene.hour)}
                  <span className="sr-label ml-3 align-top text-[12px] leading-none text-[var(--sr-smoke)]">
                    hrs
                  </span>
                </p>
                <p className="sr-label text-[12px] text-[var(--sr-ember)]">{scene.label}</p>
                <h3
                  id={`sr-scene-${scene.key}`}
                  className="sr-display mt-3 max-w-[13ch] text-[clamp(2.8rem,6.4vw,6.4rem)] leading-[0.86]"
                >
                  {scene.title}
                </h3>
                <p className="mt-5 max-w-[40ch] text-[17px] leading-[1.6] text-[var(--sr-smoke)]/85 sm:text-[18px]">
                  {scene.body}
                </p>
              </div>
            </article>
          );
        })}

        {/* Fumaça que atravessa o palco (só no modo preso). */}
        <div className="sr-smoke-layer" aria-hidden="true" data-sr-smoke>
          <Photo photo={PHOTOS.smoke} sizes="100vw" alt="" className="size-full object-cover" />
        </div>

        {/* O relógio: só aparece no modo preso. Decoração; a hora de cada cena está no texto. */}
        <div className="sr-hud" aria-hidden="true">
          <p className="sr-label hidden text-[12px] text-[var(--sr-smoke)]/80 sm:block">
            Brisket · 14 hours over hickory
          </p>
          <div className="sr-odo sr-display">
            <span className="sr-odo-win">
              <span className="sr-odo-col" data-sr-tens>
                <span>0</span>
                <span>1</span>
              </span>
            </span>
            <span className="sr-odo-win">
              <span className="sr-odo-col" data-sr-units>
                {Array.from({ length: 15 }, (_, hour) => (
                  <span key={hour}>{hour % 10}</span>
                ))}
              </span>
            </span>
          </div>
        </div>

        {/* Linha de trilho: 15 dormentes (horas 0–14), brasa que enche, estações clicáveis. */}
        <div className="sr-rail sr-wrap" data-sr-rail>
          <div className="sr-rail-track" aria-hidden="true">
            {Array.from({ length: 15 }, (_, hour) => (
              <span key={hour} className="sr-rail-tie" style={{ left: `${(hour / 14) * 100}%` }} />
            ))}
            <span className="sr-rail-fill" data-sr-fill />
          </div>
          <ol className="sr-rail-stations" aria-label="Jump to a moment in the smoke">
            {SCENES.map((scene) => (
              <li key={scene.key} style={{ left: `${(scene.hour / 14) * 100}%` }}>
                <button
                  type="button"
                  data-sr-jump={scene.key}
                  className="sr-label sr-focus sr-station min-h-11 text-[11px]"
                >
                  <span aria-hidden="true">{two(scene.hour)} </span>
                  {scene.station}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
