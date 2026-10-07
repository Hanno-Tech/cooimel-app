import type { MetadataRoute } from "next";

// PWA: permite "Instalar app" / "Adicionar à tela inicial" com ícone e tela cheia.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "COOIMEL — Cooperativa de Irrigação de Meleiro",
    short_name: "COOIMEL",
    description: "Taxa de irrigação, boletos, Pix, avisos e cotação do arroz.",
    lang: "pt-BR",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#013220",
    theme_color: "#013220",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
