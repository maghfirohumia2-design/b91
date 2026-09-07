import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kas Keluarga - Keuangan & Kas Bersama",
    short_name: "Kas Keluarga",
    description: "Aplikasi manajemen kas, tagihan rutin, hutang piutang, dan target impian keluarga",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#10b981",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/umum.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/icons/umum.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
