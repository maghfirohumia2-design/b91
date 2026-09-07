"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Phone, Wallet, ArrowLeft, PieChart, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { title: "Manajemen Pintar", desc: "Kelola kas Anda dengan lebih transparan & efisien.", icon: <Wallet size={56} className="text-white drop-shadow-md mb-3 mx-auto" /> },
    { title: "Laporan Real-Time", desc: "Pantau setiap mutasi masuk & keluar kapan saja.", icon: <PieChart size={56} className="text-white drop-shadow-md mb-3 mx-auto" /> },
    { title: "Aman & Terpercaya", desc: "Data Anda dienkripsi dan aman tersimpan di cloud.", icon: <ShieldCheck size={56} className="text-white drop-shadow-md mb-3 mx-auto" /> }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus kotak pertama saat masuk ke langkah 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setMessage({ text: "Nomor HP tidak valid.", type: "error" });
      return;
    }
    setMessage(null);
    setStep(2);
  };

  const handlePinChange = (index: number, value: string) => {
    // Hanya ambil angka terakhir yang diketik (mencegah paste lebih dari 1 jika bukan event paste)
    const val = value.replace(/\D/g, "").slice(-1);
    
    if (val) {
      const newPin = [...pin];
      newPin[index] = val;
      setPin(newPin);

      // Pindah ke kotak berikutnya
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Jika kotak terakhir terisi, langsung eksekusi login
        const fullPin = newPin.join("");
        if (fullPin.length === 6) {
          executeAuth(fullPin);
        }
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const newPin = [...pin];
      
      if (pin[index] === "") {
        // Jika kosong dan ditekan backspace, pindah ke kiri dan hapus
        if (index > 0) {
          newPin[index - 1] = "";
          setPin(newPin);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Jika ada isinya, hapus isinya saja
        newPin[index] = "";
        setPin(newPin);
      }
    }
  };

  // Support paste 6 digit langsung
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      
      // Fokus ke kotak yang tepat atau otomatis login
      if (pastedData.length === 6) {
        inputRefs.current[5]?.focus();
        executeAuth(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const executeAuth = async (fullPin: string) => {
    setLoading(true);
    setMessage(null);

    const dummyEmail = `hp_${phone}@kaskeluarga.com`;

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: dummyEmail, password: fullPin });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setMessage({ text: "❌ Nomor atau PIN salah. Hubungi Admin untuk mendaftarkan akun.", type: "error" });
        } else {
          throw error;
        }
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: unknown) {
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] flex flex-col justify-between relative overflow-hidden bg-emerald-900">
      {/* Glowing Orbs for Mesh Gradient */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-400 rounded-full mix-blend-screen filter blur-[130px] opacity-60 pointer-events-none" />
      <div className="absolute top-[15%] right-[-10%] w-[350px] h-[350px] bg-yellow-300 rounded-full mix-blend-screen filter blur-[120px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-[10%] left-[15%] w-[300px] h-[300px] bg-white rounded-full mix-blend-screen filter blur-[100px] opacity-25 pointer-events-none" />
      
      {/* Texture Layer */}
      <div className="absolute inset-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none mix-blend-overlay" />

      {/* Top Carousel Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm mx-auto relative min-h-[200px]">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                idx === currentSlide ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-8 pointer-events-none"
              }`}
            >
              {slide.icon}
              <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md text-center">
                {slide.title}
              </h1>
              <p className="text-emerald-100 mt-2 text-sm font-medium drop-shadow-sm text-center px-4 leading-relaxed">
                {slide.desc}
              </p>
            </div>
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className="flex gap-2 mt-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Sheet Drawer */}
      <div className="bg-white px-8 pt-6 pb-12 rounded-t-[40px] shadow-[0_-15px_40px_rgba(0,0,0,0.2)] w-full max-w-md mx-auto relative z-10">
        <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
        
        {step === 1 ? (
          // ================= STEP 1: NOMOR HP =================
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Login</h2>

            {message && (
              <div className={`p-3 rounded-xl text-sm font-medium mb-6 ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="0812-3456-7890"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 text-slate-800 text-xl font-bold tracking-wide transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={phone.length < 10}
                className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lanjut
              </button>
            </form>

            <div className="mt-8 text-center text-xs font-medium text-slate-400">
              Hubungi Admin untuk mendaftarkan akun baru.
            </div>
          </div>
        ) : (
          
          // ================= STEP 2: MASUKKAN PIN =================
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center mb-6">
              <button 
                onClick={() => { setStep(1); setMessage(null); setPin(["", "", "", "", "", ""]); }}
                className="w-10 h-10 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors mr-4"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-slate-800">
                Masukkan PIN
              </h2>
            </div>
            
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Ketik 6 digit PIN rahasia Anda untuk nomor <br/>
              <strong className="text-slate-800 tracking-wider font-bold">
                {phone.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3")}
              </strong>
            </p>

            {message && (
              <div className={`p-3 rounded-xl text-sm font-medium mb-6 ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {message.text}
              </div>
            )}

            <div 
              className="flex justify-between gap-2 mb-8"
              onPaste={handlePaste}
            >
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-slate-800"
                />
              ))}
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center text-emerald-600 gap-2 mb-4 animate-pulse">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-sm font-semibold">Memproses...</span>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
