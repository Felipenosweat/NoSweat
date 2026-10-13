import type { NextConfig } from "next";

// Cabeçalhos de segurança para todas as páginas (plataforma e sites de clientes).
// - frame-ancestors/X-Frame-Options: ninguém de fora coloca nossas telas num iframe
//   (clickjacking); a landing mostra exemplos em iframe do próprio domínio, por isso "self".
// - HSTS fica com a Vercel (ela já manda); não usamos includeSubDomains porque os domínios
//   de clientes também passam por aqui.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/** Host do Storage do Supabase (fotos enviadas pelos donos), se o Supabase estiver configurado. */
function supabaseStoragePattern(): RemotePattern[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw.trim());
    return [
      {
        protocol: url.protocol === "http:" ? "http" : "https",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Os pacotes internos são publicados como código-fonte TypeScript.
  transpilePackages: ["@nosweat/schema", "@nosweat/fixtures", "@nosweat/templates"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    // Fotos dos sites: bancos de imagens (hotlink, como pedem as regras deles) e uploads do dono.
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...supabaseStoragePattern(),
    ],
  },
};

export default nextConfig;
