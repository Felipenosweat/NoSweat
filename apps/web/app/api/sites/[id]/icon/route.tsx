import { ImageResponse } from "next/og";
import { siteInitial, textColorOn } from "@/components/site-metadata";
import { handle, notFound } from "@/server/http";
import { liveSpec } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** 64 px = favicon da aba; 180 px = ícone do iPhone (tela inicial). */
const DEFAULT_SIZE = 64;
const APPLE_SIZE = 180;

/**
 * GET /api/sites/[id]/icon[?size=180] → PNG com a primeira letra do negócio na cor do site.
 * Público (é o favicon do site publicado, também no domínio do cliente: o proxy deixa /api
 * passar). Só para sites no ar; senão 404. Sem logo enviado pelo dono por enquanto.
 */
export async function GET(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const site = await getSiteStore().get(id);
    if (!site || site.status !== "published") return notFound();

    const { business, theme } = liveSpec(site);
    const size =
      new URL(request.url).searchParams.get("size") === String(APPLE_SIZE)
        ? APPLE_SIZE
        : DEFAULT_SIZE;
    const initial = siteInitial(business.name);

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.primary,
          color: textColorOn(theme.primary),
          fontSize: Math.round(size * 0.6),
          fontWeight: 700,
          // A Apple arredonda sozinha (e não aceita transparência); a aba fica com cantos suaves.
          borderRadius: size === APPLE_SIZE ? 0 : Math.round(size * 0.22),
        }}
      >
        {initial ?? ""}
      </div>,
      {
        width: size,
        height: size,
        // O endereço muda com a cor (?v=… em siteMetadata); o nome raramente muda.
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
      },
    );
  });
}
