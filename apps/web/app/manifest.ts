import type { MetadataRoute } from "next";

// Manifesto da plataforma (adicionar à tela inicial). Ícones: os mesmos da marca.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "No Sweat",
    short_name: "No Sweat",
    description: "Describe your business and get a website you can edit and publish.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/brand/nosweat-mark-128.png", sizes: "128x128", type: "image/png" },
      { src: "/brand/nosweat-mark-256.png", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
