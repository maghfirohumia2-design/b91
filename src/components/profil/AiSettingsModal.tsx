"use client";

import { useState } from "react";
import { Sparkles, X, Key, Check, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { testGeminiApiKeyAction } from "@/app/actions/ocr";

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiSettingsModal({ isOpen, onClose }: AiSettingsModalProps) {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kas_gemini_api_key") || "";
    }
    return "";
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setTestResult(null);
    onClose();
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kas_gemini_api_key", apiKey.trim());
      alert("✅ Kunci Gemini API berhasil disimpan!");
      handleCloseModal();
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      alert("Masukkan API Key terlebih dahulu untuk diuji.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testGeminiApiKeyAction(apiKey);
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        message: "Terjadi kesalahan jaringan saat menguji koneksi AI.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[85vh] flex flex-col pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Pengaturan AI Gemini</h3>
              <p className="text-[10px] text-slate-400 font-medium">Kunci API untuk fitur scan nota belanja</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 pt-2">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
            <p className="font-bold mb-1">💡 Dapatkan Gemini API Key Gratis:</p>
            <p className="text-[11px] text-amber-800 mb-2">
              Anda dapat menggunakan API Key bawaan proyek atau membuat API Key gratis dari Google AI Studio dalam waktu 1 menit.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-amber-900 underline text-[11px]"
            >
              Buka Google AI Studio <ExternalLink size={12} />
            </a>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Key size={12} /> Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              )}
              <p className="font-medium text-[11px] leading-tight flex-1">{testResult.message}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isTesting ? <Loader2 size={14} className="animate-spin" /> : "Tes Koneksi"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-200 hover:brightness-105 active:scale-95 transition-all"
            >
              <Check size={16} /> Simpan Kunci
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
