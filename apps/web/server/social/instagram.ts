import { z } from "zod";
import {
  InstagramError,
  type ContainerStatus,
  type InstagramClient,
  type InstagramErrorKind,
  type InstagramProfile,
  type InstagramToken,
  type PublishedMedia,
} from "./client";

// Cliente real do Instagram ("Instagram API with Instagram Login"), só com fetch.
// O token vai no cabeçalho Authorization (nunca na URL), exceto nos endpoints de troca/renovação
// de token, que só aceitam o token na query; ali ele é tirado de qualquer mensagem de erro.
// Nunca registrar tokens em log.

export type LiveInstagramConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphVersion: string;
};

export const INSTAGRAM_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"];

const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_HOST = "https://graph.instagram.com";
const TIMEOUT_MS = 20_000;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

// ---------- erros ----------

const AUTH_SUBCODES = new Set([458, 459, 460, 463, 464, 467]);
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613]);
const TRANSIENT_CODES = new Set([1, 2, 9007]);

const GraphErrorBody = z.object({
  error: z
    .union([
      z.object({
        message: z.string().optional(),
        type: z.string().optional(),
        code: z.number().optional(),
        error_subcode: z.number().optional(),
        error_user_msg: z.string().optional(),
      }),
      z.string(),
    ])
    .optional(),
  // Formato dos endpoints de OAuth (api.instagram.com).
  error_type: z.string().optional(),
  code: z.number().optional(),
  error_message: z.string().optional(),
});

/** Tira tokens e segredos de um texto antes de mostrar ou guardar. */
export function redactSecrets(text: string, secrets: string[] = []): string {
  let out = text.replace(/(access_token|client_secret|code)=[^&\s"]+/gi, "$1=[redacted]");
  for (const secret of secrets) {
    if (secret && secret.length >= 6) out = out.split(secret).join("[redacted]");
  }
  return out;
}

const MESSAGES: Record<InstagramErrorKind, string> = {
  auth: "Instagram access expired or was removed. Please reconnect your Instagram account.",
  rate_limit: "Instagram limit reached for now. We'll try again later.",
  transient: "Instagram is not responding right now. We'll try again shortly.",
  permanent: "Instagram did not accept this post.",
};

function permanentMessage(code: number | undefined, subcode: number | undefined): string {
  if (code === 9004 || subcode === 2207052) {
    return "Instagram could not download the photo. Try uploading it again as a JPEG.";
  }
  if (code === 36003 || subcode === 2207009) {
    return "Instagram does not accept this photo shape. Crop it to square (1:1) or portrait (4:5).";
  }
  if (subcode === 2207026) return "Instagram does not accept this media format. Use a JPEG photo.";
  if (code === 36001 || subcode === 2207004) {
    return "This photo is too large for Instagram. Try a smaller image.";
  }
  if (subcode === 2207010) return "The caption is too long or has too many hashtags.";
  return MESSAGES.permanent;
}

/** Converte a resposta de erro da Graph API num InstagramError com mensagem segura. */
export function mapGraphError(status: number, body: unknown): InstagramError {
  const parsed = GraphErrorBody.safeParse(body);
  const data: z.infer<typeof GraphErrorBody> = parsed.success ? parsed.data : {};
  const inner = typeof data.error === "object" ? data.error : undefined;
  const code = inner?.code ?? data.code;
  const subcode = inner?.error_subcode;
  const type = inner?.type ?? data.error_type;

  let kind: InstagramErrorKind;
  if (code === 190 || (subcode !== undefined && AUTH_SUBCODES.has(subcode))) kind = "auth";
  else if (subcode === 2207042 || (code !== undefined && RATE_LIMIT_CODES.has(code))) {
    kind = "rate_limit";
  } else if ((code !== undefined && TRANSIENT_CODES.has(code)) || status >= 500 || status === 0) {
    kind = "transient";
  } else if (type === "OAuthException" && (status === 401 || code === 102)) kind = "auth";
  else kind = "permanent";

  const message = kind === "permanent" ? permanentMessage(code, subcode) : MESSAGES[kind];
  return new InstagramError(message, kind, code, subcode);
}

// ---------- respostas ----------

const TokenExchange = z.object({
  access_token: z.string().min(1),
  user_id: z.union([z.string(), z.number()]).optional(),
  permissions: z.union([z.array(z.string()), z.string()]).optional(),
});
// A Meta já devolveu a troca de código dentro de `data: [...]`: aceita os dois formatos.
const TokenExchangeResponse = z.union([
  TokenExchange,
  z.object({ data: z.array(TokenExchange).min(1) }),
]);
const LongLivedToken = z.object({
  access_token: z.string().min(1),
  expires_in: z.number(),
});
const Profile = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  user_id: z.union([z.string(), z.number()]),
  username: z.string(),
  account_type: z.string().nullish(),
  profile_picture_url: z.string().nullish(),
});
const IdResponse = z.object({ id: z.union([z.string(), z.number()]) });
const StatusResponse = z.object({
  status_code: z.enum(["IN_PROGRESS", "FINISHED", "PUBLISHED", "ERROR", "EXPIRED"]),
});
const MediaResponse = z.object({
  id: z.union([z.string(), z.number()]),
  permalink: z.string().nullish(),
});
const UsageResponse = z.object({
  data: z.array(z.object({ quota_usage: z.number().optional() })),
});

function scopesOf(raw: string[] | string | undefined): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.split(",");
  return list.map((s) => s.trim()).filter(Boolean);
}

// ---------- cliente ----------

export class LiveInstagramClient implements InstagramClient {
  readonly mode = "live" as const;
  private readonly fetchImpl: FetchLike;

  constructor(
    private readonly config: LiveInstagramConfig,
    fetchImpl?: FetchLike,
  ) {
    this.fetchImpl = fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private graphUrl(path: string, query: Record<string, string> = {}): string {
    const url = new URL(`${GRAPH_HOST}/${this.config.graphVersion}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    return url.toString();
  }

  /** Faz o pedido e devolve o JSON; erro de rede, timeout ou resposta de erro viram InstagramError. */
  private async request<T>(
    schema: z.ZodType<T>,
    url: string,
    init: RequestInit,
    secrets: string[],
  ): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new InstagramError(MESSAGES.transient, "transient");
    }
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      const error = mapGraphError(res.status, body);
      // Para o log: só o código e um trecho sem tokens da mensagem original.
      const raw = GraphErrorBody.safeParse(body);
      const rawMessage =
        raw.success && typeof raw.data.error === "object"
          ? raw.data.error.message
          : raw.success
            ? raw.data.error_message
            : undefined;
      if (rawMessage) {
        console.warn(
          `[instagram] ${res.status} ${error.code ?? "-"}/${error.subcode ?? "-"}: ${redactSecrets(rawMessage, secrets).slice(0, 200)}`,
        );
      }
      throw error;
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new InstagramError("Instagram sent an unexpected response.", "transient");
    }
    return parsed.data;
  }

  private bearer(accessToken: string): HeadersInit {
    return { Authorization: `Bearer ${accessToken}` };
  }

  private async graphGet<T>(
    schema: z.ZodType<T>,
    accessToken: string,
    path: string,
    query: Record<string, string> = {},
  ): Promise<T> {
    return this.request(
      schema,
      this.graphUrl(path, query),
      { method: "GET", headers: this.bearer(accessToken) },
      [accessToken],
    );
  }

  private async graphPost<T>(
    schema: z.ZodType<T>,
    accessToken: string,
    path: string,
    form: Record<string, string>,
  ): Promise<T> {
    return this.request(
      schema,
      this.graphUrl(path),
      { method: "POST", headers: this.bearer(accessToken), body: new URLSearchParams(form) },
      [accessToken],
    );
  }

  authorizeUrl(state: string): string {
    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set("client_id", this.config.appId);
    url.searchParams.set("redirect_uri", this.config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", INSTAGRAM_SCOPES.join(","));
    url.searchParams.set("state", state);
    return url.toString();
  }

  async exchangeCode(code: string): Promise<InstagramToken> {
    const secrets = [this.config.appSecret, code];
    const short = await this.request(
      TokenExchangeResponse,
      TOKEN_URL,
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          grant_type: "authorization_code",
          redirect_uri: this.config.redirectUri,
          code,
        }),
      },
      secrets,
    );
    const first = "data" in short ? short.data[0] : short;
    if (!first) throw new InstagramError("Instagram sent an unexpected response.", "transient");

    // Troca o token de 1 hora pelo de 60 dias (este endpoint só aceita o token na query).
    const url = new URL(`${GRAPH_HOST}/access_token`);
    url.searchParams.set("grant_type", "ig_exchange_token");
    url.searchParams.set("client_secret", this.config.appSecret);
    url.searchParams.set("access_token", first.access_token);
    const long = await this.request(LongLivedToken, url.toString(), { method: "GET" }, [
      ...secrets,
      first.access_token,
    ]);
    return {
      accessToken: long.access_token,
      expiresIn: long.expires_in,
      scopes: scopesOf(first.permissions),
      appScopedId: first.user_id === undefined ? null : String(first.user_id),
    };
  }

  async refresh(accessToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const url = new URL(`${GRAPH_HOST}/refresh_access_token`);
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", accessToken);
    const res = await this.request(LongLivedToken, url.toString(), { method: "GET" }, [
      accessToken,
    ]);
    return { accessToken: res.access_token, expiresIn: res.expires_in };
  }

  async getProfile(accessToken: string): Promise<InstagramProfile> {
    const me = await this.graphGet(Profile, accessToken, "me", {
      fields: "user_id,username,account_type,profile_picture_url",
    });
    return {
      id: String(me.user_id),
      username: me.username,
      accountType: me.account_type ?? null,
      avatarUrl: me.profile_picture_url ?? null,
    };
  }

  async createImageContainer(
    accessToken: string,
    igUserId: string,
    input: { imageUrl: string; caption?: string; isCarouselItem?: boolean },
  ): Promise<string> {
    const form: Record<string, string> = { image_url: input.imageUrl };
    if (input.isCarouselItem) form.is_carousel_item = "true";
    else if (input.caption) form.caption = input.caption;
    const res = await this.graphPost(IdResponse, accessToken, `${igUserId}/media`, form);
    return String(res.id);
  }

  async createCarouselContainer(
    accessToken: string,
    igUserId: string,
    input: { children: string[]; caption: string },
  ): Promise<string> {
    const res = await this.graphPost(IdResponse, accessToken, `${igUserId}/media`, {
      media_type: "CAROUSEL",
      children: input.children.join(","),
      caption: input.caption,
    });
    return String(res.id);
  }

  async getContainerStatus(accessToken: string, containerId: string): Promise<ContainerStatus> {
    const res = await this.graphGet(StatusResponse, accessToken, containerId, {
      fields: "status_code",
    });
    return res.status_code;
  }

  async publish(accessToken: string, igUserId: string, containerId: string): Promise<string> {
    const res = await this.graphPost(IdResponse, accessToken, `${igUserId}/media_publish`, {
      creation_id: containerId,
    });
    return String(res.id);
  }

  async getMedia(accessToken: string, mediaId: string): Promise<PublishedMedia> {
    const res = await this.graphGet(MediaResponse, accessToken, mediaId, { fields: "permalink" });
    return { id: String(res.id), permalink: res.permalink ?? null };
  }

  async getPublishingUsage(accessToken: string, igUserId: string): Promise<number> {
    const res = await this.graphGet(
      UsageResponse,
      accessToken,
      `${igUserId}/content_publishing_limit`,
      { fields: "quota_usage" },
    );
    return res.data[0]?.quota_usage ?? 0;
  }
}
