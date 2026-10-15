// Contrato do cliente do Instagram (API "Instagram API with Instagram Login", Graph API).
// Duas implementações: a real (instagram.ts, fetch para graph.instagram.com) e a de mentira
// (instagram-mock.ts, usada sem as chaves da Meta: dev local, testes e CI).
// Nada aqui guarda token: quem chama passa o token já descriptografado e joga fora depois.

/** Token trocado no OAuth (o de curta duração já foi trocado pelo de 60 dias). */
export type InstagramToken = {
  accessToken: string;
  /** Segundos até vencer (o de longa duração dura ~60 dias). */
  expiresIn: number;
  /** Permissões concedidas pelo dono (ex.: instagram_business_content_publish). */
  scopes: string[];
  /** `user_id` devolvido na troca do código (id "app-scoped" da Meta). */
  appScopedId: string | null;
};

export type InstagramProfile = {
  /** Id da conta profissional (IG_ID), usado em /{id}/media e /{id}/media_publish. */
  id: string;
  username: string;
  /** "BUSINESS", "MEDIA_CREATOR" ou "PERSONAL" (conta pessoal não pode publicar pela API). */
  accountType: string | null;
  avatarUrl: string | null;
};

/** Status do container de mídia antes de publicar. */
export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "PUBLISHED" | "ERROR" | "EXPIRED";

export type PublishedMedia = { id: string; permalink: string | null };

/**
 * Tipos de erro que o publicador trata de jeitos diferentes:
 * - auth: token inválido, vencido ou acesso retirado (código 190): pede para reconectar;
 * - rate_limit: limite de chamadas ou de posts do dia: tenta mais tarde;
 * - transient: rede, 5xx, timeouts: tenta de novo com espera;
 * - permanent: o post em si tem problema (foto inválida, legenda proibida...): para e avisa.
 */
export type InstagramErrorKind = "auth" | "rate_limit" | "transient" | "permanent";

export class InstagramError extends Error {
  constructor(
    message: string,
    readonly kind: InstagramErrorKind,
    readonly code?: number,
    readonly subcode?: number,
  ) {
    super(message);
    this.name = "InstagramError";
  }
}

export interface InstagramClient {
  /** "mock" sem as chaves da Meta; "live" com o app de verdade. */
  readonly mode: "mock" | "live";
  /** URL da tela de autorização do Instagram (o navegador vai para lá). */
  authorizeUrl(state: string): string;
  /** Troca o código do OAuth pelo token de longa duração (60 dias). */
  exchangeCode(code: string): Promise<InstagramToken>;
  /** Renova o token de longa duração (precisa ter mais de 24 h e ainda não ter vencido). */
  refresh(accessToken: string): Promise<{ accessToken: string; expiresIn: number }>;
  getProfile(accessToken: string): Promise<InstagramProfile>;
  /** Cria o container de UMA foto (JPEG em URL pública). Devolve o id do container. */
  createImageContainer(
    accessToken: string,
    igUserId: string,
    input: { imageUrl: string; caption?: string; isCarouselItem?: boolean },
  ): Promise<string>;
  /** Cria o container do carrossel a partir dos containers das fotos (2 a 10). */
  createCarouselContainer(
    accessToken: string,
    igUserId: string,
    input: { children: string[]; caption: string },
  ): Promise<string>;
  getContainerStatus(accessToken: string, containerId: string): Promise<ContainerStatus>;
  /** Publica o container. Devolve o id da mídia publicada. */
  publish(accessToken: string, igUserId: string, containerId: string): Promise<string>;
  /** Link do post publicado (para mostrar ao dono). */
  getMedia(accessToken: string, mediaId: string): Promise<PublishedMedia>;
  /** Quantos posts a conta já publicou pela API nas últimas 24 h (limite da Meta: 100). */
  getPublishingUsage(accessToken: string, igUserId: string): Promise<number>;
}
