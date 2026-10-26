import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasCompleteProfile } from "@/lib/signup-rules";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import {
  VIEW_AS_COOKIE,
  VIEW_AS_READ_ONLY_MESSAGE,
  isWriteBlockedWhileViewing,
  verifyViewAsToken,
} from "@/server/auth/view-as-token";
import { isAppHost } from "@/server/domains/hosts";
import { GUEST_COOKIE } from "@/server/guest-cookie";
import { INDEXNOW_KEY, INDEXNOW_KEY_PATH } from "@/server/seo/indexnow";

// Páginas que exigem login. As rotas /api conferem o acesso sozinhas (respondem 401 em JSON).
const PROTECTED_PATHS = [
  "/dashboard",
  "/sites",
  "/admin",
  "/social",
  "/clients",
  "/account",
  "/schedule",
  "/team",
  "/estimates",
  "/invoices",
  "/office",
  "/reviews",
];

// Exceções: visitantes sem conta criam (/create, público), editam e veem a prévia do próprio
// site. A página confere se o site é mesmo do visitante (senão, 404).
const GUEST_PATHS = [/^\/sites\/[^/]+\/edit(\/canvas)?\/?$/, /^\/sites\/preview\/[^/]+\/?$/];

const isProtected = (path: string) =>
  !GUEST_PATHS.some((pattern) => pattern.test(path)) &&
  PROTECTED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

/** 403 do modo "ver como" (admin vendo outra conta só para ler). */
function readOnlyResponse(): NextResponse {
  return NextResponse.json(
    { error: { code: "unauthorized", message: VIEW_AS_READ_ONLY_MESSAGE } },
    { status: 403 },
  );
}

/**
 * 1. Domínio de cliente (joesplumbing.com): mostra o site publicado dele (rewrite para /d/<host>).
 * 2. Domínio da plataforma: renova a sessão do Supabase e manda para /login quem não está logado.
 */
export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "")
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, ""); // "joes.com." (ponto final) é o mesmo domínio
  // Chave do IndexNow (aviso aos buscadores), aberta em todo host que a No Sweat serve: é como o
  // Bing confere que o aviso de "site novo" veio do dono do endereço (ver server/seo/indexnow.ts).
  if (request.nextUrl.pathname === INDEXNOW_KEY_PATH) {
    return new NextResponse(INDEXNOW_KEY, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // No domínio do cliente, só a API pública (ex.: formulário de contato) passa direto.
  if (host && !isAppHost(host) && !request.nextUrl.pathname.startsWith("/api/")) {
    // O site do cliente é uma página só: robots.txt e sitemap.xml simples para o Google.
    const safeHost = /^[a-z0-9.-]+$/.test(host);
    if (safeHost && request.nextUrl.pathname === "/robots.txt") {
      return new NextResponse(`User-agent: *\nAllow: /\nSitemap: https://${host}/sitemap.xml\n`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    if (safeHost && request.nextUrl.pathname === "/sitemap.xml") {
      // Feito na rota /d/<host>/sitemap.xml: ela confere se o site está no ar e põe a data.
      const url = request.nextUrl.clone();
      url.pathname = `/d/${host}/sitemap.xml`;
      url.search = "";
      return NextResponse.rewrite(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = `/d/${host}`;
    url.search = "";
    return NextResponse.rewrite(url);
  }

  // Modo "ver como" (cookie ns_view_as): nenhuma escrita na API passa (só GET; o formulário
  // público dos sites, links de e-mail, webhooks e crons continuam). Sair do modo é uma Server
  // Action (não é /api), então sempre funciona.
  const viewAsToken = request.cookies.get(VIEW_AS_COOKIE)?.value;
  const blockedWrite =
    Boolean(viewAsToken) && isWriteBlockedWhileViewing(request.method, request.nextUrl.pathname);

  const auth = getSupabaseAuthConfig();
  if (!auth) {
    // dev local sem Supabase: login desligado
    return blockedWrite ? readOnlyResponse() : NextResponse.next();
  }

  // Se o link de confirmação de e-mail cair fora de /auth/callback (Redirect URL não liberada
  // no Supabase), ele chega como ?code=... em outra página. Encaminha para o callback.
  const { pathname, searchParams } = request.nextUrl;
  // Não mexe no ?code= da API (volta do OAuth do Instagram) nem no código de exclusão de dados
  // da Meta em /data-deletion: esses não são do login.
  if (
    searchParams.has("code") &&
    !pathname.startsWith("/auth/") &&
    !pathname.startsWith("/api/") &&
    pathname !== "/data-deletion"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(auth.url, auth.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Não colocar nada entre createServerClient e getClaims (recomendação do Supabase).
  const { data } = await supabase.auth.getClaims();

  if (viewAsToken && blockedWrite) {
    // O cookie é amarrado ao admin que o pediu: só bloqueia se valer para quem está logado.
    // Cookie velho (venceu, ou outra pessoa entrou neste navegador) é apagado e o pedido segue.
    const sub = data?.claims?.sub;
    const viewing = typeof sub === "string" ? await verifyViewAsToken(viewAsToken, sub) : null;
    if (viewing) {
      const blocked = readOnlyResponse();
      response.cookies.getAll().forEach((cookie) => blocked.cookies.set(cookie));
      return blocked;
    }
    response.cookies.delete(VIEW_AS_COOKIE);
  }

  if (!data?.claims && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    // Quem já criou um site como visitante ainda não tem conta: vai direto para o cadastro.
    url.pathname = request.cookies.has(GUEST_COOKIE) ? "/signup" : "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  // Conta sem nome e data de nascimento (login social, ou criada antes dessa regra): completa o
  // perfil antes de usar o painel. O JWT do Supabase traz o user_metadata.
  if (data?.claims && isProtected(pathname) && !hasCompleteProfile(data.claims.user_metadata)) {
    const url = request.nextUrl.clone();
    url.pathname = "/welcome";
    url.search = "";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo, menos arquivos estáticos e imagens.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
