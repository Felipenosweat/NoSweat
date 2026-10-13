import type { NextConfig } from "next";

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
  images: {
    // AVIF primeiro (menor), WebP como alternativa.
    formats: ["image/avif", "image/webp"],
    // Fotos dos sites: bancos de imagens (hotlink, como pedem as regras deles) e uploads do dono.
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...supabaseStoragePattern(),
    ],
  },
};

export default nextConfig;
