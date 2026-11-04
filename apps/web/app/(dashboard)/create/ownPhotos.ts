import { UpdateSiteResponse, type SiteImage, type SiteSpec } from "@nosweat/schema";
import { uploadImage } from "@/app/sites/[id]/edit/images";
import { MAX_OWN_PHOTOS, placeOwnerPhotos } from "./photos";

// Passo "Photos" do /create, lado do navegador: depois que o site é gerado (sem fotos de banco),
// envia as fotos que o dono escolheu e coloca no topo e na galeria. Nunca lança erro: se algo
// falhar, o site continua valendo e o aviso diz o que fazer (o editor aceita as fotos depois).

const GUEST_NOTICE =
  "Photo uploads need a free account, so your site starts without photos. Create an account, then add yours in the editor.";
const NO_PHOTOS_NOTICE = "You didn’t choose any photos yet. Add yours in the editor.";
const NOT_PLACED_NOTICE =
  "Your photos were uploaded, but we couldn’t place them. Add them in the editor.";

export type OwnPhotosResult = { spec: SiteSpec; notice: string | null };

export async function addOwnPhotos(
  siteId: string,
  spec: SiteSpec,
  files: File[],
  signedIn: boolean,
): Promise<OwnPhotosResult> {
  if (!signedIn) return { spec, notice: GUEST_NOTICE };
  if (files.length === 0) return { spec, notice: NO_PHOTOS_NOTICE };

  const uploaded: SiteImage[] = [];
  let failure: string | null = null;
  const name = spec.business.name.trim() || "Our business";
  for (const [index, file] of files.slice(0, MAX_OWN_PHOTOS).entries()) {
    const result = await uploadImage(siteId, file, `${name} photo ${index + 1}`.slice(0, 160));
    if (result.ok) {
      uploaded.push(result.image);
      continue;
    }
    failure = result.message;
    // Upload desligado ou sem conta: tentar outro arquivo não adianta.
    if (result.unavailable || result.signup) break;
  }
  if (uploaded.length === 0) return { spec, notice: failure ?? NO_PHOTOS_NOTICE };

  const placed = placeOwnerPhotos(spec, uploaded);
  const partial = failure
    ? `Some photos didn’t upload. ${failure} You can add them in the editor.`
    : null;
  try {
    const res = await fetch(`/api/sites/${encodeURIComponent(siteId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec: placed }),
    });
    if (!res.ok) return { spec, notice: NOT_PLACED_NOTICE };
    const parsed = UpdateSiteResponse.safeParse(await res.json().catch(() => null));
    return { spec: parsed.success ? parsed.data.spec : placed, notice: partial };
  } catch {
    return { spec, notice: NOT_PLACED_NOTICE };
  }
}
