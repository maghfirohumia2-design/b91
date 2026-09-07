"use client";

import { useState, useRef, useEffect } from "react";
import { KeyRound, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ChangePinModalProps {
  isOpen: boolean;
  phone: string | null;
  onClose: () => void;
}

export default function ChangePinModal({ isOpen, phone, onClose }: ChangePinModalProps) {
  const [pinStep, setPinStep] = useState<"old" | "new">("old");
  const [oldPin, setOldPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPin, setNewPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [pinMessage, setPinMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loadingPin, setLoadingPin] = useState(false);

  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        pinInputRefs.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setPinStep("old");
    setOldPin(["", "", "", "", "", ""]);
    setNewPin(["", "", "", "", "", ""]);
    setPinMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentPinArray = pinStep === "old" ? oldPin : newPin;
  const setCurrentPinArray = pinStep === "old" ? setOldPin : setNewPin;

  const handlePinChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "").slice(-1);
    const updated = [...currentPinArray];
    updated[index] = val;
    setCurrentPinArray(updated);

    if (val && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }

    // Auto submit jika sudah 6 digit
    if (val && index === 5) {
      const fullPin = updated.join("");
      if (fullPin.length === 6) {
        if (pinStep === "old") {
          verifyOldPin(fullPin);
        } else {
          executeChangePin(fullPin);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !currentPinArray[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const updated = ["", "", "", "", "", ""];
      for (let i = 0; i < pastedData.length; i++) {
        updated[i] = pastedData[i];
      }
      setCurrentPinArray(updated);

      if (pastedData.length === 6) {
        pinInputRefs.current[5]?.focus();
        if (pinStep === "old") verifyOldPin(pastedData);
        else executeChangePin(pastedData);
      } else {
        pinInputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const verifyOldPin = async (fullPin: string) => {
    setLoadingPin(true);
    setPinMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `hp_${phone}@kaskeluarga.com`,
        password: fullPin,
      });
      if (error) throw error;

      setPinStep("new");
      setPinMessage(null);
      setTimeout(() => pinInputRefs.current[0]?.focus(), 150);
    } catch {
      setOldPin(["", "", "", "", "", ""]);
      pinInputRefs.current[0]?.focus();
      setPinMessage({ text: "PIN lama yang Anda masukkan salah.", type: "error" });
    } finally {
      setLoadingPin(false);
    }
  };

  const executeChangePin = async (fullPin: string) => {
    setLoadingPin(true);
    setPinMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: fullPin });
      if (error) throw error;

      setPinMessage({ text: "PIN berhasil diubah!", type: "success" });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: unknown) {
      setNewPin(["", "", "", "", "", ""]);
      pinInputRefs.current[0]?.focus();
      const msg = error instanceof Error ? error.message : "Gagal mengubah PIN.";
      setPinMessage({ text: msg, type: "error" });
    } finally {
      setLoadingPin(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <KeyRound className="text-emerald-500" size={20} />
            Ubah PIN Keamanan
          </h3>
          <button 
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-6">
          {pinStep === "old" 
            ? "Masukkan 6 digit PIN lama Anda untuk verifikasi keamanan:" 
            : "Masukkan 6 digit PIN baru yang ingin Anda gunakan:"}
        </p>

        {pinMessage && (
          <div className={`p-3 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2 ${
            pinMessage.type === "success" 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {pinMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{pinMessage.text}</span>
          </div>
        )}

        <div className="flex justify-between gap-2 mb-6">
          {currentPinArray.map((digit, i) => (
            <input
              key={`${pinStep}-${i}`}
              ref={(el) => { pinInputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              disabled={loadingPin}
              className="w-12 h-14 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-xl font-black text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner disabled:opacity-50"
            />
          ))}
        </div>

        {loadingPin && (
          <div className="flex justify-center items-center gap-2 text-xs font-bold text-emerald-600 mb-4">
            <Loader2 className="animate-spin" size={16} /> Memproses verifikasi...
          </div>
        )}

        <button 
          type="button"
          onClick={handleClose}
          className="w-full py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
