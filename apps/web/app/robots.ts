import type { MetadataRoute } from "next";

// robots.txt da plataforma. Áreas logadas e a API não interessam a buscadores.

const ORIGIN = "https://nosweatfd.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/create", "/sites", "/admin", "/login"],
    },
    sitemap: `${ORIGIN}/sitemap.xml`,
    host: ORIGIN,
  };
}
