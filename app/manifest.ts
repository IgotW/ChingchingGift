import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChingChingGift — Secret Santa, sorted",
    short_name: "ChingChingGift",
    description:
      "Create a Christmas gift exchange, draw names fairly, and share wishlists privately.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f1e3",
    theme_color: "#0d3527",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
