// Filtro SVG da refração do vidro líquido (styles.css, `.ns-glass`): só o Chromium o usa, dentro
// de `backdrop-filter: url(#ns-liquid)`; Safari e Firefox ignoram e ficam na camada de base.
// O mapa de deslocamento é um degradê esticado no tamanho do elemento (vermelho = horizontal,
// verde = vertical, 50% = parado): perto das bordas o fundo é empurrado para dentro, como numa
// lente. Escala pequena (10) para o texto por baixo continuar legível.
// Vários sites na mesma página (editor + prévia) repetem o mesmo `id` com o mesmo conteúdo: o
// navegador usa o primeiro e nada quebra. O SVG não usa display:none (alguns navegadores
// descartam o filtro assim); fica com 0 × 0 e fora do fluxo.

// R: sobe nas bordas esquerda/direita; G: sobe nas bordas de cima/de baixo. Somados por "screen".
const MAP = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" preserveAspectRatio="none">` +
    `<defs>` +
    `<linearGradient id="x" x1="0" x2="1" y1="0" y2="0">` +
    `<stop offset="0" stop-color="rgb(255,0,0)"/><stop offset="0.06" stop-color="rgb(128,0,0)"/>` +
    `<stop offset="0.94" stop-color="rgb(128,0,0)"/><stop offset="1" stop-color="rgb(0,0,0)"/>` +
    `</linearGradient>` +
    `<linearGradient id="y" x1="0" x2="0" y1="0" y2="1">` +
    `<stop offset="0" stop-color="rgb(0,255,0)"/><stop offset="0.3" stop-color="rgb(0,128,0)"/>` +
    `<stop offset="0.7" stop-color="rgb(0,128,0)"/><stop offset="1" stop-color="rgb(0,0,0)"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="100" height="100" fill="rgb(0,0,0)"/>` +
    `<rect width="100" height="100" fill="url(#x)"/>` +
    `<rect width="100" height="100" fill="url(#y)" style="mix-blend-mode:screen"/>` +
    `</svg>`,
);

export function GlassDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      className="ns-glass-defs"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter
          id="ns-liquid"
          x="0"
          y="0"
          width="1"
          height="1"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={`data:image/svg+xml,${MAP}`}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
