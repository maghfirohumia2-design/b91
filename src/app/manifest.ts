import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "B91 - Keuangan & Kas Bersama",
    short_name: "B91",
    description: "Aplikasi manajemen kas, tagihan rutin, hutang piutang, dan target impian",
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
