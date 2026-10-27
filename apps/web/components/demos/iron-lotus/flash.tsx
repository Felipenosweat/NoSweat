import type { ReactNode } from "react";
import type { FlashId } from "./content";

// As 12 peças de flash da folha, desenhadas para esta demo em SVG (tinta preta + UM vermelho,
// como flash tradicional impresso). Não são trabalho dos artistas do estúdio: a página diz
// "drawn for this demo". Cores vêm das variáveis do tema (--il-ink, --il-red, --il-paper),
// então mudam junto com o resto. Cada peça tem a proporção da célula que ocupa na folha
// (1×1 e 2×2 = 100×100; 1×2 = 100×200; 2×1 = 200×100).

const INK = "var(--il-ink)";
const RED = "var(--il-red)";
const PAPER = "var(--il-paper)";

const line = {
  stroke: INK,
  strokeWidth: 2.6,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

/** Estrela de quatro pontas com lados côncavos (brilho de flash). */
function sparkle(cx: number, cy: number, r: number) {
  return `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
}

function point(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [+(cx + r * Math.cos(rad)).toFixed(2), +(cy + r * Math.sin(rad)).toFixed(2)];
}

function Lotus() {
  return (
    <>
      <path d={sparkle(16, 22, 6)} fill={INK} />
      <path d={sparkle(86, 16, 4.5)} fill={INK} />
      <path d={sparkle(88, 40, 3)} fill={RED} />
      <ellipse cx="50" cy="82" rx="36" ry="6.5" fill={INK} />
      <path d="M22 93H42M50 93H80" {...line} strokeWidth={2} />
      <path d="M48 80C30 80 14 70 7 51C24 51 40 61 48 80Z" fill={PAPER} {...line} />
      <path d="M52 80C70 80 86 70 93 51C76 51 60 61 52 80Z" fill={PAPER} {...line} />
      <path d="M15 56C27 62 37 70 45 78M85 56C73 62 63 70 55 78" {...line} strokeWidth={1.6} />
      <path d="M48 80C33 70 25 52 27 31C42 41 50 59 48 80Z" fill={RED} {...line} />
      <path d="M52 80C67 70 75 52 73 31C58 41 50 59 52 80Z" fill={RED} {...line} />
      <path d="M50 12C63 31 65 58 50 80C35 58 37 31 50 12Z" fill={RED} {...line} />
      <path
        d="M50 28V70M33 45C39 55 43 65 46.5 76M67 45C61 55 57 65 53.5 76"
        {...line}
        strokeWidth={1.6}
      />
      <path d="M44 30C45 26 46.5 22 48.5 19" stroke={PAPER} strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

function Dagger() {
  return (
    <>
      <path d="M50 10L61 118L50 131L39 118Z" fill={PAPER} {...line} />
      <path d="M50 10L54.8 58Q50 52 45.2 58Z" fill={RED} {...line} strokeWidth={1.8} />
      <path d="M50 64V118" {...line} strokeWidth={1.6} />
      <path d="M57.5 84C61.5 93 61.5 100 57.5 102C53.5 100 53.5 93 57.5 84Z" fill={RED} />
      <path d="M20 128Q50 117 80 128L80 137Q50 128 20 137Z" fill={INK} {...line} />
      <circle cx="18" cy="132.5" r="6" fill={INK} />
      <circle cx="82" cy="132.5" r="6" fill={INK} />
      <rect x="42.5" y="135" width="15" height="39" rx="3" fill={RED} {...line} />
      <path
        d="M42.5 144L57.5 140M42.5 152L57.5 148M42.5 160L57.5 156M42.5 168L57.5 164"
        {...line}
        strokeWidth={2}
      />
      <circle cx="50" cy="183" r="9.5" fill={INK} />
      <circle cx="46.5" cy="179.5" r="2.2" fill={PAPER} />
      <path d={sparkle(80, 30, 7)} fill={INK} />
      <path d={sparkle(20, 70, 4.5)} fill={INK} />
    </>
  );
}

function Swallow() {
  return (
    <>
      <path d="M64 58L97 72L85 75L98 90L70 74Z" fill={INK} {...line} />
      <path d="M50 60C46 74 34 84 15 91C25 79 33 68 39 57Z" fill={INK} {...line} />
      <path d="M43 47C50 27 70 12 96 9C84 22 76 36 66 53Z" fill={INK} {...line} />
      <path
        d="M58 44L82 19M54 49L74 30M63 40L89 13"
        stroke={PAPER}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M17 50C25 39 44 39 58 45C66 49 71 55 71 62C60 66 40 66 28 60C21 57 17 54 17 50Z"
        fill={INK}
        {...line}
      />
      <path
        d="M24 58C36 66 56 66 71 62C59 71 38 71 24 61Z"
        fill={PAPER}
        {...line}
        strokeWidth={2}
      />
      <path d="M19 53C23 58 28 59 33 57C29 52 24 51 19 53Z" fill={RED} />
      <path d="M18 50L7 53L19 55Z" fill={INK} {...line} strokeWidth={1.6} />
      <circle cx="26" cy="47.5" r="2.3" fill={PAPER} />
      <path d={sparkle(22, 24, 6)} fill={RED} />
    </>
  );
}

function Star() {
  const arms: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const a = -90 + i * 72;
    const [ox, oy] = point(50, 52, 46, a);
    const [lx, ly] = point(50, 52, 18.5, a - 36);
    const [rx, ry] = point(50, 52, 18.5, a + 36);
    arms.push(<path key={`r${i}`} d={`M50 52L${ox} ${oy}L${rx} ${ry}Z`} fill={RED} />);
    arms.push(<path key={`k${i}`} d={`M50 52L${ox} ${oy}L${lx} ${ly}Z`} fill={INK} />);
  }
  const outline = Array.from({ length: 10 }, (_, i) =>
    point(50, 52, i % 2 ? 18.5 : 46, -90 + i * 36).join(" "),
  ).join("L");
  return (
    <>
      {arms}
      <path d={`M${outline}Z`} fill="none" {...line} />
    </>
  );
}

function Rose() {
  return (
    <>
      <path d="M31 70C17 70 6 81 5 93C18 93 28 85 35 74Z" fill={INK} {...line} />
      <path d="M8 90C16 84 24 78 32 73" stroke={PAPER} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M69 72C83 72 94 82 95 94C82 94 72 86 65 76Z" fill={INK} {...line} />
      <path d="M92 91C84 85 76 80 68 75" stroke={PAPER} strokeWidth={1.6} strokeLinecap="round" />
      <path
        d="M50 12C71 10 86 27 84 46C82 65 67 78 50 78C31 78 16 63 18 44C20 27 33 14 50 12Z"
        fill={RED}
        {...line}
      />
      <path
        d="M50 30C60 30 64 40 57 44C50 48 44 41 50 37M35 40C37 27 56 23 67 31M31 52C37 64 58 67 69 54M24 45C22 60 37 73 54 71M71 35C78 43 76 56 67 63M42 44C40 52 46 58 54 56"
        fill="none"
        {...line}
        strokeWidth={2.4}
      />
      <path d="M38 21C43 18 48 17 53 17" stroke={PAPER} strokeWidth={2.2} strokeLinecap="round" />
    </>
  );
}

function Moth() {
  return (
    <>
      <path
        d="M47 30C42 20 36 15 29 13M53 30C58 20 64 15 71 13"
        fill="none"
        {...line}
        strokeWidth={2}
      />
      <path d="M47 38C34 22 12 18 6 30C2 44 22 54 46 52Z" fill={PAPER} {...line} />
      <path d="M53 38C66 22 88 18 94 30C98 44 78 54 54 52Z" fill={PAPER} {...line} />
      <path
        d="M13 29C22 34 34 40 44 46M87 29C78 34 66 40 56 46"
        fill="none"
        {...line}
        strokeWidth={1.5}
      />
      <path d="M47 54C32 56 18 66 22 80C26 90 40 82 48 64Z" fill={INK} {...line} />
      <path d="M53 54C68 56 82 66 78 80C74 90 60 82 52 64Z" fill={INK} {...line} />
      <circle cx="24" cy="36" r="7" fill={RED} {...line} strokeWidth={2} />
      <circle cx="76" cy="36" r="7" fill={RED} {...line} strokeWidth={2} />
      <circle cx="24" cy="36" r="2.4" fill={INK} />
      <circle cx="76" cy="36" r="2.4" fill={INK} />
      <circle cx="32" cy="72" r="2.6" fill={PAPER} />
      <circle cx="68" cy="72" r="2.6" fill={PAPER} />
      <ellipse cx="50" cy="54" rx="5.5" ry="20" fill={INK} />
      <circle cx="50" cy="32" r="5.5" fill={INK} />
      <path
        d="M46 56H54M46 62H54M46.5 68H53.5"
        stroke={PAPER}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </>
  );
}

function Snake() {
  const body = "M80 90C50 96 20 86 26 70C32 54 74 64 76 46C78 30 56 22 41 26";
  return (
    <>
      <path d="M93 83C89 88 85 90 80 90" fill="none" {...line} strokeWidth={4} />
      <path d={body} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d={body} fill="none" stroke={PAPER} strokeWidth={8} strokeLinecap="round" />
      <path d={body} fill="none" stroke={RED} strokeWidth={8} strokeDasharray="5 4.5" />
      <path
        d="M43 32C37 36 25 34 19 26C17 20 23 14 33 15C41 16 47 22 45 28Z"
        fill={INK}
        {...line}
      />
      <circle cx="29" cy="21" r="2.4" fill={PAPER} />
      <path
        d="M19 24L11 22.5L5 18.5M11 22.5L6 27.5"
        fill="none"
        stroke={RED}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={sparkle(84, 18, 5)} fill={INK} />
    </>
  );
}

function Heart() {
  return (
    <>
      <path
        d="M100 93C70 75 57 57 63 38C69 22 92 22 100 36C108 22 131 22 137 38C143 57 130 75 100 93Z"
        fill={RED}
        {...line}
      />
      <path d="M73 40C75 34 81 30 87 30" stroke={PAPER} strokeWidth={3} strokeLinecap="round" />
      <path d="M46 52L12 52L21 62.5L12 73L46 73Z" fill={INK} {...line} />
      <path d="M154 52L188 52L179 62.5L188 73L154 73Z" fill={INK} {...line} />
      <path d="M38 44Q100 38 162 44L162 67Q100 61 38 67Z" fill={PAPER} {...line} />
      <text
        x="100"
        y="61"
        textAnchor="middle"
        fill={INK}
        style={{
          fontFamily: "var(--font-il), sans-serif",
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: 4,
          fontVariationSettings: '"wdth" 75',
        }}
      >
        DENVER
      </text>
      <path d={sparkle(176, 22, 6)} fill={INK} />
      <path d={sparkle(24, 26, 4)} fill={RED} />
    </>
  );
}

function Web() {
  const cx = 6;
  const cy = 6;
  const angles = [0, 18, 36, 54, 72, 90];
  const rings = [26, 48, 70, 92];
  const spokes = angles.map((a) => point(cx, cy, 94, a));
  const arcs = rings.map((r) =>
    angles
      .slice(1)
      .map((a, i) => {
        const [x1, y1] = point(cx, cy, r, angles[i] ?? 0);
        const [x2, y2] = point(cx, cy, r, a);
        const [qx, qy] = point(cx, cy, r * 0.8, (a + (angles[i] ?? 0)) / 2);
        return `${i === 0 ? `M${x1} ${y1}` : ""}Q${qx} ${qy} ${x2} ${y2}`;
      })
      .join(""),
  );
  return (
    <>
      {spokes.map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${cx} ${cy}L${x} ${y}`} {...line} strokeWidth={1.8} />
      ))}
      {arcs.map((d) => (
        <path key={d} d={d} fill="none" {...line} strokeWidth={1.8} />
      ))}
      <path d="M58 44V70" {...line} strokeWidth={1.4} />
      <path
        d="M53 74C47 70 44 70 41 72M53 78C46 77 43 78 40 81M63 74C69 70 72 70 75 72M63 78C70 77 73 78 76 81M54 82C49 85 47 88 46 92M62 82C67 85 69 88 70 92"
        fill="none"
        {...line}
        strokeWidth={1.8}
      />
      <circle cx="58" cy="72" r="4" fill={INK} />
      <ellipse cx="58" cy="81" rx="6.5" ry="7.5" fill={INK} />
      <path d="M55.6 77.6H60.4L58 81L60.4 84.4H55.6L58 81Z" fill={RED} />
    </>
  );
}

function Eye() {
  const rays: ReactNode[] = [];
  for (let a = -160; a <= -20; a += 20) {
    const [x1, y1] = point(0, 0, 1, a);
    rays.push(
      <path
        key={a}
        d={`M${100 + x1 * 78} ${52 + y1 * 42}L${100 + x1 * 94} ${52 + y1 * 50}`}
        {...line}
        strokeWidth={3}
      />,
    );
  }
  return (
    <>
      {rays}
      <path
        d="M28 52C58 17 142 17 172 52C142 87 58 87 28 52Z"
        fill={PAPER}
        {...line}
        strokeWidth={3}
      />
      <circle cx="100" cy="52" r="20" fill={RED} {...line} />
      <circle cx="100" cy="52" r="8.5" fill={INK} />
      <circle cx="106" cy="46" r="3" fill={PAPER} />
      <path d="M100 82C104 89 104 94 100 96C96 94 96 89 100 82Z" fill={RED} />
      <path d={sparkle(22, 22, 5)} fill={INK} />
      <path d={sparkle(180, 84, 5)} fill={INK} />
    </>
  );
}

function Dice() {
  return (
    <>
      <g transform="rotate(-14 36 50)">
        <rect x="16" y="30" width="40" height="40" rx="7" fill={PAPER} {...line} />
        {[
          [26, 40],
          [46, 40],
          [36, 50],
          [26, 60],
          [46, 60],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="3.6" fill={INK} />
        ))}
      </g>
      <g transform="rotate(12 65 59)">
        <rect x="46" y="40" width="38" height="38" rx="7" fill={RED} {...line} />
        {[
          [55, 49],
          [65, 59],
          [75, 69],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="3.4" fill={PAPER} />
        ))}
      </g>
    </>
  );
}

function Moon() {
  return (
    <>
      <path
        d="M113 7C83 11 64 31 64 54C64 78 86 96 115 94C97 86 87 72 87 54C87 34 97 18 113 7Z"
        fill={RED}
        {...line}
      />
      <path d="M76 36C74 42 73 48 73 54" stroke={PAPER} strokeWidth={2.4} strokeLinecap="round" />
      <path d={sparkle(136, 32, 10)} fill={INK} />
      <path d={sparkle(156, 66, 7)} fill={INK} />
      <path d={sparkle(40, 40, 8)} fill={INK} />
      <path d={sparkle(176, 22, 4.5)} fill={RED} />
      <path d={sparkle(30, 74, 4.5)} fill={INK} />
      <circle cx="142" cy="84" r="2" fill={INK} />
      <circle cx="54" cy="18" r="2" fill={INK} />
    </>
  );
}

const ART: Record<FlashId, { box: string; draw: () => ReactNode }> = {
  lotus: { box: "0 0 100 100", draw: Lotus },
  dagger: { box: "0 0 100 200", draw: Dagger },
  swallow: { box: "0 0 100 100", draw: Swallow },
  star: { box: "0 0 100 100", draw: Star },
  rose: { box: "0 0 100 100", draw: Rose },
  moth: { box: "0 0 100 100", draw: Moth },
  snake: { box: "0 0 100 100", draw: Snake },
  heart: { box: "0 0 200 100", draw: Heart },
  web: { box: "0 0 100 100", draw: Web },
  eye: { box: "0 0 200 100", draw: Eye },
  dice: { box: "0 0 100 100", draw: Dice },
  moon: { box: "0 0 200 100", draw: Moon },
};

/** Uma peça de flash. Decorativa (o botão ou a legenda em volta diz o nome). */
export function Flash({ id, className = "" }: { id: FlashId; className?: string }) {
  const art = ART[id];
  return (
    <svg viewBox={art.box} aria-hidden="true" focusable="false" className={className}>
      {art.draw()}
    </svg>
  );
}

/** Marca do estúdio (o lótus) em tamanho pequeno, para o trilho e o rodapé. */
export function LotusMark({ className = "" }: { className?: string }) {
  return <Flash id="lotus" className={className} />;
}
