"use client";

import { useState } from "react";
import { UserPlus, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createUserAction } from "@/app/actions/admin";
import { supabase } from "@/lib/supabase";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [newPhone, setNewPhone] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserMessage, setAddUserMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      
      const res = await createUserAction(token, newPhone, newPin, newFullName);
      if (res.error) {
        setAddUserMessage({ text: res.error, type: "error" });
      } else {
        setAddUserMessage({ text: "Anggota baru berhasil ditambahkan!", type: "success" });
        setTimeout(() => {
          setNewPhone("");
          setNewFullName("");
          setNewPin("");
          setAddUserMessage(null);
          onUserAdded();
          onClose();
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem, silakan coba lagi.";
      setAddUserMessage({ text: msg, type: "error" });
    } finally {
      setAddUserLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <UserPlus className="text-emerald-500" size={20} />
            Tambah Anggota Keluarga
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-5">
          Daftarkan nomor HP dan buatkan PIN 6 digit untuk anggota keluarga Anda.
        </p>

        {addUserMessage && (
          <div className={`p-3 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2 ${
            addUserMessage.type === "success" 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {addUserMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{addUserMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nama Lengkap
            </label>
            <input 
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="Contoh: Ayah, Ibu, Kakak"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nomor WhatsApp / HP
            </label>
            <input 
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="Contoh: 081234567890"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              PIN Default (6 Digit Angka)
            </label>
            <input 
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="6 Digit PIN"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all tracking-widest text-center"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={addUserLoading || newPin.length !== 6 || !newPhone || !newFullName}
              className="flex-1 py-3.5 text-white font-bold bg-emerald-600 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {addUserLoading ? <Loader2 className="animate-spin" size={18} /> : "Daftarkan Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
