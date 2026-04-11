import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "家計簿",
    short_name: "家計簿",
    description: "シンプルで使いやすい家計簿アプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f3",
    theme_color: "#f5f5f3",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
