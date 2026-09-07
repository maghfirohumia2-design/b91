"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  Loader2, 
  CheckCircle2, 
  Store, 
  Coins, 
  Tag, 
  FileText, 
  Key, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { scanReceiptAction } from "@/app/actions/ocr";
import { ReceiptScanResult } from "@/lib/gemini";
import { formatRupiah } from "@/lib/format";

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCategories: string[];
  onApplyScan: (data: {
    amount: number;
    description: string;
    category?: string;
    file: File;
  }) => void;
  onOpenAiSettings?: () => void;
}

export default function ReceiptScannerModal({
  isOpen,
  onClose,
  availableCategories,
  onApplyScan,
  onOpenAiSettings,
}: ReceiptScannerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setScanResult(null);
    setErrorMessage(null);
    onClose();
  };

  const getSavedApiKey = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kas_gemini_api_key") || "";
    }
    return "";
  };

  const processScan = async (file: File) => {
    setIsScanning(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      // Konversi File ke Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const apiKey = getSavedApiKey();

      const res = await scanReceiptAction({
        base64Image: base64Data,
        mimeType: file.type || "image/jpeg",
        availableCategories,
        customApiKey: apiKey || undefined,
      });

      if (res.success && res.data) {
        setScanResult(res.data);
      } else {
        setErrorMessage(res.error || "Gagal membaca struk belanja.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setErrorMessage("Terjadi kesalahan saat memproses gambar struk.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setScanResult(null);
      setErrorMessage(null);

      // Otomatis mulai scan setelah foto dipilih
      processScan(file);
    }
  };

  const handleApply = () => {
    if (!scanResult || !selectedFile) return;

    onApplyScan({
      amount: scanResult.amount,
      description: scanResult.description || `${scanResult.merchant} - Belanja`,
      category: scanResult.suggestedCategory,
      file: selectedFile,
    });

    handleCloseModal();
  };

  const savedApiKey = getSavedApiKey();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] flex flex-col pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Smart AI Scan Struk</h3>
              <p className="text-[10px] text-slate-400 font-medium">Ekstraksi otomatis nominal & detail belanja</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. Upload / Capture State */}
          {!previewUrl ? (
            <div className="space-y-3 pt-2">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Camera size={28} />
                </div>
                <h4 className="text-xs font-black text-slate-800 mb-1">Ambil Foto Struk Belanja</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mb-4">
                  Foto struk belanjaan (Indomaret, Alfamart, SPBU, supermarket, dll) agar AI membaca total belanjaan Anda secara otomatis.
                </p>

                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-200 active:scale-95 transition-all"
                  >
                    <Camera size={15} />
                    <span>Buka Kamera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Upload size={15} />
                    <span>Pilih Galeri</span>
                  </button>
                </div>
              </div>

              {/* API Key hint */}
              {!savedApiKey && (
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={14} className="text-amber-600 shrink-0" />
                    <span className="text-[11px] font-medium">Gunakan Gemini API Key milik Anda?</span>
                  </div>
                  {onOpenAiSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseModal();
                        onOpenAiSettings();
                      }}
                      className="text-[10px] font-bold text-amber-700 underline"
                    >
                      Atur Kunci
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 2. Image Preview & Scan Result State */
            <div className="space-y-4">
              {/* Image Preview with Laser Scanning Effect */}
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
                <Image
                  src={previewUrl}
                  alt="Struk Belanja"
                  fill
                  className="object-contain opacity-90"
                />

                {isScanning && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                    {/* Glowing Laser Scan Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 shadow-[0_0_15px_#f59e0b] animate-bounce" />
                    <Loader2 size={32} className="animate-spin text-amber-400 mb-2" />
                    <p className="text-xs font-black tracking-wider uppercase animate-pulse">
                      AI Sedang Memindai Struk...
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message & Retry */}
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="font-bold flex-1">{errorMessage}</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => selectedFile && processScan(selectedFile)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <RefreshCw size={12} /> Coba Scan Lagi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                      }}
                      className="px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold text-xs"
                    >
                      Ganti Foto
                    </button>
                  </div>
                </div>
              )}

              {/* Scan Results Card */}
              {scanResult && (
                <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/60 border border-emerald-200 p-4 rounded-3xl space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={13} /> Berhasil Terdeteksi
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                        setScanResult(null);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                    >
                      Foto Ulang
                    </button>
                  </div>

                  {/* Nominal Card */}
                  <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Coins size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pembayaran</p>
                        <h4 className="text-lg font-black text-emerald-600">
                          {formatRupiah(scanResult.amount)}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Merchant & Kategori Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-3 rounded-2xl border border-emerald-100/80 shadow-sm">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <Store size={12} /> Toko / Tempat
                      </div>
                      <p className="font-bold text-slate-800 truncate">{scanResult.merchant}</p>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-emerald-100/80 shadow-sm">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <Tag size={12} /> Kategori Saran
                      </div>
                      <p className="font-bold text-emerald-700 truncate">
                        {scanResult.suggestedCategory || "Belanja"}
                      </p>
                    </div>
                  </div>

                  {/* Ringkasan Keterangan */}
                  {scanResult.description && (
                    <div className="bg-white p-3 rounded-2xl border border-emerald-100/80 shadow-sm text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <FileText size={12} /> Keterangan Otomatis
                      </div>
                      <p className="font-medium text-slate-700 text-[11px] leading-relaxed">
                        {scanResult.description}
                      </p>
                    </div>
                  )}

                  {/* Items Chips */}
                  {scanResult.items && scanResult.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {scanResult.items.slice(0, 5).map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-white/80 border border-emerald-200/60 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {scanResult && (
          <div className="pt-4 border-t border-slate-100 mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-200 active:scale-95 transition-all"
            >
              <CheckCircle2 size={16} />
              <span>Gunakan Hasil Scan</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
