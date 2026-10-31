// IndexNow: avisa os buscadores que um endereço mudou, para eles virem ler logo em vez de
// esperar a próxima visita do robô. Quem recebe: Bing, Yandex, Naver, Seznam e Yep (o Google
// não usa IndexNow; para ele valem o sitemap.xml e o Search Console).
//
// Como o buscador sabe que o aviso é nosso: a chave (INDEXNOW_KEY) fica pública em
// https://<host>/<chave>.txt em todo endereço que a No Sweat serve (nosweatfd.com e os
// domínios dos clientes; o proxy.ts responde esse arquivo). A chave não é segredo: o
// protocolo exige que ela esteja aberta no próprio site.
//
// Só manda de verdade em produção (VERCEL_ENV=production). Em prévias e no dev o resultado
// vem como "skipped", a não ser que INDEXNOW_ENDPOINT aponte para um receptor de teste.
// Nunca lança erro nem segura a publicação por mais que TIMEOUT_MS.

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY?.trim() || "43772a106d6c74824fb0b88a77d1a52c";

/** Caminho do arquivo da chave, ex.: "/43772a….txt". */
export const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY}.txt`;

const ENDPOINT = "https://api.indexnow.org/indexnow";
const TIMEOUT_MS = 3500;

/** Buscadores que recebem o aviso pelo IndexNow (mostrado ao dono depois de publicar). */
export const INDEXNOW_ENGINES = ["Bing", "Yandex", "Naver", "Seznam", "Yep"];

export type IndexNowResult = {
  status: "sent" | "skipped" | "failed";
  /** Endereços avisados (ou que seriam avisados, se "skipped"). */
  urls: string[];
  /** Código HTTP do IndexNow quando houve envio (200 e 202 = recebido). */
  httpStatus?: number;
  reason?: string;
};

/** Endereço que dá para avisar: https, com domínio de verdade (nada de localhost ou prévia). */
export function isNotifiableUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      hostname.includes(".") &&
      !hostname.endsWith(".vercel.app") &&
      !hostname.endsWith(".localhost") &&
      hostname !== "localhost"
    );
  } catch {
    return false;
  }
}

/**
 * Avisa o IndexNow de endereços que mudaram. Endereços de hosts diferentes vão em pedidos
 * separados (o protocolo pede um host por pedido). Devolve um resultado por host.
 */
export async function notifyIndexNow(urls: string[]): Promise<IndexNowResult[]> {
  const byHost = new Map<string, string[]>();
  for (const url of urls.filter(isNotifiableUrl)) {
    const host = new URL(url).hostname;
    byHost.set(host, [...(byHost.get(host) ?? []), url]);
  }
  if (byHost.size === 0) return [{ status: "skipped", urls, reason: "no public address" }];

  const endpoint = process.env.INDEXNOW_ENDPOINT?.trim() || ENDPOINT;
  const live = process.env.VERCEL_ENV === "production" || Boolean(process.env.INDEXNOW_ENDPOINT);
  if (!live) {
    return [...byHost.values()].map((list) => ({
      status: "skipped" as const,
      urls: list,
      reason: "only sent in production",
    }));
  }

  return Promise.all(
    [...byHost.entries()].map(async ([host, list]): Promise<IndexNowResult> => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host,
            key: INDEXNOW_KEY,
            keyLocation: `https://${host}${INDEXNOW_KEY_PATH}`,
            urlList: list,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const ok = res.status === 200 || res.status === 202;
        if (!ok) console.warn("IndexNow recusou", host, res.status);
        return { status: ok ? "sent" : "failed", urls: list, httpStatus: res.status };
      } catch (error) {
        console.warn("IndexNow falhou", host, error);
        return { status: "failed", urls: list, reason: "network" };
      }
    }),
  );
}
