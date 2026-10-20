import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Imagem de compartilhamento do marketing (1200×630): fundo ink e o endereço como motivo.
// Usada pela landing (app/(landing)/opengraph-image.tsx) e por /pricing
// (app/(marketing)/pricing/opengraph-image.tsx). Nunca na raiz do app: os sites publicados dos
// clientes (/s/…, domínio próprio) têm a própria foto e não podem herdar esta.
// O Next exige que alt/size/contentType sejam declarados literalmente em cada
// opengraph-image.tsx; OG_ALT e OG_SIZE ficam aqui só para o desenho e para conferência.

export const OG_ALT =
  "No Sweat: describe your business, get a website. nosweatfd.com/s/your-business";
export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#071B33";
const ACCENT = "#00C2FF";

/** Desenha a imagem 1200×630. Os arquivos opengraph-image.tsx só repassam o resultado. */
export async function renderOgImage(): Promise<ImageResponse> {
  const mark = await readFile(join(process.cwd(), "public/brand/nosweat-mark-256.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: INK,
        color: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) só aceita <img> */}
        <img src={markSrc} width={64} height={64} alt="" />
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
          No Sweat
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          Describe your business. Get a website by lunch.
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 44 }}>
          <span style={{ color: "#CBD5E1" }}>nosweatfd.com/s/</span>
          <span style={{ color: ACCENT, marginLeft: -10 }}>your-business</span>
          <span
            style={{ display: "flex", width: 4, height: 44, marginLeft: 6, background: ACCENT }}
          />
        </div>
      </div>

      <div style={{ display: "flex", height: 1, background: "rgba(255,255,255,0.15)" }} />
    </div>,
    OG_SIZE,
  );
}
