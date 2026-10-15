import type { SocialCapability } from "@nosweat/schema";
import { isAdmin } from "@/server/admin";
import type { CurrentUser } from "@/server/auth/session";
import type { InstagramClient } from "./client";
import { socialCryptoConfigured } from "./crypto";
import { LiveInstagramClient } from "./instagram";
import { MockInstagramClient } from "./instagram-mock";
import type { SocialSettingsRecord } from "./types";

// Configuração do Instagram (app da Meta). Sem as chaves: cliente de mentira no dev/testes;
// em produção com Supabase e sem chaves, nada de Instagram (as rotas avisam "not available").

export type InstagramConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphVersion: string;
};

const DEFAULT_APP_URL = "https://nosweatfd.com";
/** Versão da Graph API (v26.0 saiu em julho de 2026). Trocar por META_GRAPH_VERSION. */
export const DEFAULT_GRAPH_VERSION = "v26.0";
export const CALLBACK_PATH = "/api/social/instagram/callback";

/** Endereço de volta do OAuth (precisa ser igual ao cadastrado no app da Meta). */
export function instagramRedirectUri(): string {
  const explicit = process.env.INSTAGRAM_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_APP_URL;
  return `${base.replace(/\/+$/, "")}${CALLBACK_PATH}`;
}

export function getInstagramConfig(): InstagramConfig | null {
  const appId = process.env.INSTAGRAM_APP_ID?.trim();
  const appSecret = process.env.INSTAGRAM_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;
  return {
    appId,
    appSecret,
    redirectUri: instagramRedirectUri(),
    graphVersion: process.env.META_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION,
  };
}

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Uma instância só do cliente de mentira (os ids dele seguem um contador).
let mockClient: MockInstagramClient | null = null;

/** Cliente real com as chaves; de mentira no dev/testes; `null` em produção sem chaves. */
export function getInstagramClient(): InstagramClient | null {
  const config = getInstagramConfig();
  if (config) return new LiveInstagramClient(config);
  if (!supabaseConfigured() || process.env.NODE_ENV !== "production") {
    mockClient ??= new MockInstagramClient();
    return mockClient;
  }
  return null;
}

/** App da Meta em modo de desenvolvimento: só testadores publicam. Padrão: true. */
export function socialTesterOnly(): boolean {
  const raw = process.env.SOCIAL_TESTER_ONLY?.trim().toLowerCase();
  return raw ? raw !== "false" && raw !== "0" : true;
}

function testerEmails(): string[] {
  return (process.env.SOCIAL_TESTER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Pode conectar o Instagram e publicar sozinho? (senão: modo manual, o dono posta à mão) */
export async function canAutoPublish(
  user: CurrentUser,
  settings: SocialSettingsRecord,
): Promise<boolean> {
  if (!socialCryptoConfigured()) return false;
  const client = getInstagramClient();
  if (!client) return false;
  if (client.mode === "mock") return true;
  if (!socialTesterOnly() || settings.tester) return true;
  const email = user.email?.trim().toLowerCase();
  if (email && testerEmails().includes(email)) return true;
  return isAdmin(user.id);
}

export async function socialCapability(
  user: CurrentUser,
  settings: SocialSettingsRecord,
): Promise<SocialCapability> {
  const client = getInstagramClient();
  const configured = client !== null && socialCryptoConfigured();
  const auto = configured && (await canAutoPublish(user, settings));
  return {
    configured,
    publishMode: auto ? "auto" : "manual",
    testerOnly: client?.mode === "live" && socialTesterOnly(),
  };
}
