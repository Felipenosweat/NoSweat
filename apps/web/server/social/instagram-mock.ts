import {
  InstagramError,
  type ContainerStatus,
  type InstagramClient,
  type InstagramProfile,
  type InstagramToken,
  type PublishedMedia,
} from "./client";

// Cliente do Instagram de mentira: sem rede, resultados previsíveis (dev local, testes e CI).
// Os testes podem forçar um erro na próxima chamada de um método com `failNext`.

export const MOCK_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"];
const SIXTY_DAYS_S = 60 * 24 * 60 * 60;

type MockMethod =
  | "exchangeCode"
  | "refresh"
  | "getProfile"
  | "createImageContainer"
  | "createCarouselContainer"
  | "getContainerStatus"
  | "publish"
  | "getMedia"
  | "getPublishingUsage";

export type MockInstagramOptions = {
  /** Para onde a "tela de autorização" volta (padrão: o callback, caminho relativo). */
  redirectUri?: string;
  scopes?: string[];
  appScopedId?: string;
  profile?: Partial<InstagramProfile>;
};

export class MockInstagramClient implements InstagramClient {
  readonly mode = "mock" as const;
  private counter = 0;
  private readonly failures = new Map<MockMethod, InstagramError>();
  private readonly statuses = new Map<string, ContainerStatus>();
  /** Chamadas feitas (para os testes conferirem). */
  readonly calls: { method: MockMethod; args: string[] }[] = [];

  constructor(private readonly options: MockInstagramOptions = {}) {}

  /** Faz a PRÓXIMA chamada de `method` lançar `error` (uma vez só). */
  failNext(method: MockMethod, error: InstagramError): void {
    this.failures.set(method, error);
  }

  /** Muda o status que um container devolve (ex.: simular PUBLISHED ou EXPIRED). */
  setContainerStatus(containerId: string, status: ContainerStatus): void {
    this.statuses.set(containerId, status);
  }

  private hit(method: MockMethod, ...args: string[]): void {
    this.calls.push({ method, args });
    const error = this.failures.get(method);
    if (error) {
      this.failures.delete(method);
      throw error;
    }
  }

  private nextId(): number {
    this.counter += 1;
    return this.counter;
  }

  authorizeUrl(state: string): string {
    const base = this.options.redirectUri ?? "/api/social/instagram/callback";
    const params = new URLSearchParams({ code: "mock", state });
    return `${base}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<InstagramToken> {
    this.hit("exchangeCode", code);
    if (!code) throw new InstagramError("Instagram did not send a login code.", "auth");
    return {
      accessToken: `mock-token-${code}`,
      expiresIn: SIXTY_DAYS_S,
      scopes: [...(this.options.scopes ?? MOCK_SCOPES)],
      appScopedId: this.options.appScopedId ?? "mock-app-scoped-1",
    };
  }

  async refresh(accessToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    this.hit("refresh");
    return {
      accessToken: `${accessToken.split("~")[0]}~r${this.nextId()}`,
      expiresIn: SIXTY_DAYS_S,
    };
  }

  async getProfile(): Promise<InstagramProfile> {
    this.hit("getProfile");
    return {
      id: "17841400000000001",
      username: "nosweat_demo",
      accountType: "BUSINESS",
      avatarUrl: null,
      ...this.options.profile,
    };
  }

  async createImageContainer(
    _accessToken: string,
    igUserId: string,
    input: { imageUrl: string; caption?: string; isCarouselItem?: boolean },
  ): Promise<string> {
    this.hit("createImageContainer", igUserId, input.imageUrl);
    return `mock-container-${this.nextId()}`;
  }

  async createCarouselContainer(
    _accessToken: string,
    igUserId: string,
    input: { children: string[]; caption: string },
  ): Promise<string> {
    this.hit("createCarouselContainer", igUserId, input.children.join(","));
    return `mock-container-${this.nextId()}`;
  }

  async getContainerStatus(_accessToken: string, containerId: string): Promise<ContainerStatus> {
    this.hit("getContainerStatus", containerId);
    return this.statuses.get(containerId) ?? "FINISHED";
  }

  async publish(_accessToken: string, igUserId: string, containerId: string): Promise<string> {
    this.hit("publish", igUserId, containerId);
    this.statuses.set(containerId, "PUBLISHED");
    return String(17900000000 + this.nextId());
  }

  async getMedia(_accessToken: string, mediaId: string): Promise<PublishedMedia> {
    this.hit("getMedia", mediaId);
    return { id: mediaId, permalink: `https://www.instagram.com/p/mock${mediaId}/` };
  }

  async getPublishingUsage(_accessToken: string, igUserId: string): Promise<number> {
    this.hit("getPublishingUsage", igUserId);
    return 0;
  }
}
