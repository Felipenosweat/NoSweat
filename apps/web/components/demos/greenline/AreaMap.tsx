// Mapa esquemático da área atendida (sem mapa embutido, como pede patterns.md: "distâncias em
// vez de mapa"). As posições vêm das coordenadas reais das cidades, em km a partir do centro
// de Charlotte (x para leste, y para o sul), e o anel é a I-485 desenhada à mão: é um esquema
// (estradas simplificadas), não um mapa, e diz isso. Os nomes são HTML por cima do SVG para ficarem legíveis no celular.

const W = 640;
const H = 580;
const X0 = 320; // origem (centro de Charlotte) dentro do viewBox
const Y0 = 280;

type Place = { name: string; x: number; y: number; align?: "left" | "right"; main?: boolean };

// km × 10 a partir do centro de Charlotte (lat/long reais das cidades).
const PLACES: Place[] = [
  { name: "Charlotte", x: 0, y: 0, main: true, align: "right" },
  { name: "Huntersville", x: 0, y: -203, align: "right" },
  { name: "Mint Hill", x: 178, y: 52, align: "right" },
  { name: "Matthews", x: 108, y: 122, align: "right" },
  { name: "Pineville", x: -45, y: 160, align: "right" },
  { name: "Fort Mill", x: -93, y: 244, align: "right" },
];

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

export function AreaMap() {
  return (
    <figure className="g-map relative">
      <div className="relative" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          className="absolute inset-0 size-full text-[var(--g-ink)]"
        >
          {/* Grade de planta (linhas finas) */}
          <g stroke="currentColor" strokeOpacity="0.07" strokeWidth="1">
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2={H} />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 80} x2={W} y2={i * 80} />
            ))}
          </g>
          {/* Divisa NC / SC */}
          <path
            d={`M0 ${Y0 + 138} L${X0 - 40} ${Y0 + 192} L${W} ${Y0 + 262}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.2"
            strokeDasharray="2 6"
            strokeLinecap="round"
          />
          {/* I-77 */}
          <path
            d={`M${X0 - 22} 0 L${X0 - 10} ${Y0 - 60} L${X0 - 20} ${Y0 + 60} L${X0 - 104} ${H}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="2"
          />
          {/* I-485, o anel */}
          <ellipse
            data-g-draw
            cx={X0 + 10}
            cy={Y0 + 4}
            rx="176"
            ry="192"
            fill="none"
            stroke="var(--g-pine)"
            strokeWidth="2.5"
            pathLength={1}
          />
          {/* As cidades atendidas (Charlotte em barro) */}
          {PLACES.map((place) => (
            <circle
              key={place.name}
              cx={X0 + place.x}
              cy={Y0 + place.y}
              r={place.main ? 9 : 7}
              fill={place.main ? "var(--g-clay)" : "var(--g-paper)"}
              stroke={place.main ? "var(--g-clay)" : "var(--g-pine)"}
              strokeWidth="2.5"
            />
          ))}
        </svg>
        <span
          className="g-caps absolute text-[10px] text-[var(--g-ink)]/75"
          style={{ left: pct(X0 + 100, W), top: pct(Y0 - 186, H) }}
          aria-hidden="true"
        >
          I-485
        </span>
        <span
          className="g-caps absolute text-[10px] text-[var(--g-ink)]/75"
          style={{ left: pct(14, W), top: pct(Y0 + 112, H) }}
          aria-hidden="true"
        >
          NC
        </span>
        <span
          className="g-caps absolute text-[10px] text-[var(--g-ink)]/75"
          style={{ left: pct(14, W), top: pct(Y0 + 162, H) }}
          aria-hidden="true"
        >
          SC
        </span>
        <ul aria-label="Towns served">
          {PLACES.map((place) => (
            <li
              key={place.name}
              className={`absolute -translate-y-1/2 leading-none whitespace-nowrap ${
                place.align === "right" ? "pl-4" : "-translate-x-full pr-4"
              } ${place.main ? "g-display text-[clamp(1.1rem,2.2vw,1.6rem)] text-[var(--g-ink)]" : "text-[clamp(0.85rem,1.4vw,1rem)] font-semibold text-[var(--g-ink)]"}`}
              style={{ left: pct(X0 + place.x, W), top: pct(Y0 + place.y, H) }}
            >
              {place.name}
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-[13px] text-[var(--g-ink)]/75">
        Schematic: towns sit where they are, roads are simplified. The ring is I-485.
      </figcaption>
    </figure>
  );
}
