import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ehonzdcmzbnkmyxqexby.supabase.co',
      },
    ],
  },
};

export default nextConfig;
