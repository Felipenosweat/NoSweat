import { ImageResponse } from "next/og";
import { SITE_OG_SIZE, textColorOn } from "@/components/site-metadata";
import { handle, notFound } from "@/server/http";
import { liveSpec } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/sites/[id]/og → imagem de compartilhamento (1200×630) de um site publicado sem foto
 * no topo: nome do negócio e "categoria · cidade" sobre a cor principal do site. Só usa o que
 * está no SiteSpec (nada inventado). Público; sites fora do ar: 404.
 */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const site = await getSiteStore().get(id);
    if (!site || site.status !== "published") return notFound();

    const { business, theme } = liveSpec(site);
    const where = [business.city, business.state].filter(Boolean).join(", ");
    const subtitle = [business.category, where].filter(Boolean).join(" · ");
    const color = textColorOn(theme.primary);
    const name = business.name.trim();

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background: theme.primary,
          color,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: name.length > 28 ? 68 : 92,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1040,
          }}
        >
          {name}
        </div>
        {subtitle ? (
          <div style={{ display: "flex", marginTop: 24, fontSize: 40, opacity: 0.85 }}>
            {subtitle}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            marginTop: 48,
            width: 120,
            height: 6,
            borderRadius: 3,
            background: color,
            opacity: 0.5,
          }}
        />
      </div>,
      {
        ...SITE_OG_SIZE,
        headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
      },
    );
  }, "/api/sites/[id]/og");
}
