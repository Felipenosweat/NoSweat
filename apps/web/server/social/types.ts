import type {
  SocialAccountStatus,
  SocialMedia,
  SocialPostSource,
  SocialPostStatus,
  SocialProvider,
  SocialSettings,
} from "@nosweat/schema";

// Tipos internos do módulo de redes sociais (o que fica no banco). O navegador nunca recebe estes
// tipos direto: as rotas convertem para os DTOs de @nosweat/schema (sem token).

export type SocialAccountRecord = {
  id: string;
  ownerId: string;
  provider: SocialProvider;
  /** Id da conta profissional no Instagram (usado nas chamadas /{id}/media). */
  externalId: string;
  /** Id "app-scoped" que vem nos avisos de desautorização e de exclusão de dados da Meta. */
  appScopedId: string | null;
  username: string;
  accountType: string | null;
  avatarUrl: string | null;
  /** Token criptografado (crypto.ts). `null` depois de desconectar. */
  accessTokenEnc: string | null;
  tokenKeyVersion: string | null;
  tokenExpiresAt: string | null;
  tokenRefreshedAt: string | null;
  scopes: string[];
  status: SocialAccountStatus;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
};

/** Campos que dá para mudar numa conta (o resto é fixo depois de criada). */
export type SocialAccountPatch = Partial<
  Pick<
    SocialAccountRecord,
    | "appScopedId"
    | "username"
    | "accountType"
    | "avatarUrl"
    | "accessTokenEnc"
    | "tokenKeyVersion"
    | "tokenExpiresAt"
    | "tokenRefreshedAt"
    | "scopes"
    | "status"
    | "lastError"
    | "revokedAt"
  >
>;

export type NewSocialAccount = Omit<SocialAccountRecord, "createdAt" | "updatedAt">;

export type SocialSettingsRecord = SocialSettings & {
  ownerId: string;
  /** Liberado pelo admin para publicar com o app da Meta em modo de desenvolvimento. */
  tester: boolean;
};

export type SocialSettingsPatch = Partial<SocialSettings & { tester: boolean }>;

export type SocialPostType = "image" | "carousel";

export type SocialPostRecord = {
  id: string;
  ownerId: string;
  accountId: string | null;
  siteId: string | null;
  postType: SocialPostType;
  caption: string;
  ownerNotePt: string | null;
  media: SocialMedia[];
  scheduledAt: string | null;
  status: SocialPostStatus;
  source: SocialPostSource;
  claimsFlagged: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  attempts: number;
  nextAttemptAt: string | null;
  lockedAt: string | null;
  igContainerId: string | null;
  igMediaId: string | null;
  permalink: string | null;
  lastError: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Para criar um post: só o essencial; o resto tem padrão. */
export type NewSocialPost = Pick<SocialPostRecord, "ownerId" | "caption" | "media"> &
  Partial<
    Pick<
      SocialPostRecord,
      | "accountId"
      | "siteId"
      | "ownerNotePt"
      | "scheduledAt"
      | "status"
      | "source"
      | "claimsFlagged"
      | "approvedAt"
      | "approvedBy"
      | "nextAttemptAt"
    >
  >;

export type SocialPostPatch = Partial<
  Omit<SocialPostRecord, "id" | "ownerId" | "createdAt" | "updatedAt" | "postType">
>;

/** Status que contam no limite de posts do plano (aprovados, na fila ou já publicados). */
export const COUNTED_POST_STATUSES: SocialPostStatus[] = [
  "approved",
  "scheduled",
  "publishing",
  "needs_check",
  "published",
  "manual_published",
];

export type SocialEventInput = {
  ownerId: string | null;
  accountId?: string | null;
  postId?: string | null;
  actorId?: string | null;
  /** Ex.: connect, disconnect, token_refresh, token_invalid, post_approved, publish_attempt,
   * publish_success, publish_failed, manual_published, deauthorize, deletion_request, admin_view. */
  action: string;
  /** Nunca colocar tokens aqui. */
  detail?: Record<string, unknown>;
};

export type DataDeletionRecord = {
  provider: string;
  externalUserId: string;
  confirmationCode: string;
  status: "received" | "completed";
  createdAt: string;
  completedAt: string | null;
};
