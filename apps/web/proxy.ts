import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import { isAppHost } from "@/server/domains/hosts";

// Páginas que exigem login. As rotas /api conferem o login sozinhas (respondem 401 em JSON).
const PROTECTED_PATHS = ["/dashboard", "/create", "/sites"];

const isProtected = (path: string) =>
  PROTECTED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

/**
 * 1. Domínio de cliente (joesplumbing.com): mostra o site publicado dele (rewrite para /d/<host>).
 * 2. Domínio da plataforma: renova a sessão do Supabase e manda para /login quem não está logado.
 */
export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  if (host && !isAppHost(host)) {
    const url = request.nextUrl.clone();
    url.pathname = `/d/${host}`;
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const auth = getSupabaseAuthConfig();
  if (!auth) return NextResponse.next(); // dev local sem Supabase: login desligado

  // Se o link de confirmação de e-mail cair fora de /auth/callback (Redirect URL não liberada
  // no Supabase), ele chega como ?code=... em outra página. Encaminha para o callback.
  const { pathname, searchParams } = request.nextUrl;
  if (searchParams.has("code") && !pathname.startsWith("/auth/")) {
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

  if (!data?.claims && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
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
