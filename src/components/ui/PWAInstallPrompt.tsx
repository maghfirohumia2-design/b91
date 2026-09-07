"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Cek apakah sudah running dalam mode PWA Standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // Cek apakah user pernah dismiss prompt dalam 7 hari terakhir
    const dismissedAt = localStorage.getItem("pwa_prompt_dismissed_at");
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10);
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Deteksi iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSSafari = /iphone|ipad|ipod/.test(userAgent) && !/crios|fxios|opios/.test(userAgent);

    // Tampilkan untuk iOS setelah beberapa detik
    let timer: NodeJS.Timeout | null = null;
    if (isIOSSafari) {
      timer = setTimeout(() => {
        setIsIOS(true);
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_prompt_dismissed_at", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-slate-700/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <Smartphone size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Pasang Aplikasi Kas Keluarga</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isIOS
                ? "Ketuk ikon Bagikan (Share) ➔ 'Tambahkan ke Layar Utama'"
                : "Akses cepat & lebih hemat kuota langsung dari layar HP"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md transition-all"
            >
              <Download size={13} />
              <span>Install</span>
            </button>
          )}
          {isIOS && (
            <div className="px-2.5 py-1 bg-white/10 rounded-xl text-[10px] font-bold text-slate-300 flex items-center gap-1">
              <Share size={12} />
              <span>Layar Utama</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
