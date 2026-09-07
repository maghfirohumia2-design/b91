import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kas Keluarga - Keuangan & Kas Bersama",
  description: "Aplikasi manajemen kas, tagihan rutin, hutang piutang, dan target impian keluarga",
  applicationName: "Kas Keluarga",
  appleWebApp: {
    capable: true,
    title: "Kas Keluarga",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import AuthProvider from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-100`}>
        <AuthProvider>
          <div className="mobile-container pb-24">
            {children}
            <PWAInstallPrompt />
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
