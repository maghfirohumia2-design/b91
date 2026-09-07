"use client";

import { useState } from "react";
import Image from "next/image";
import { Wallet, Plus, Edit2, Trash2, X, Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Account } from "@/types/database";

export const AVAILABLE_KAS_ICONS = [
  { label: "Rumah / Keluarga", path: "/icons/rumah.jpg" },
  { label: "Pendidikan / PAUD", path: "/icons/pendidikan.jpg" },
  { label: "SPV / Gedung", path: "/icons/spv.jpg" },
  { label: "Belanja / Toko", path: "/icons/belanja.jpg" },
  { label: "IT / Tabungan", path: "/icons/it.jpg" },
  { label: "Mobil / Kendaraan", path: "/icons/mobil.jpg" },
  { label: "Kantor / Bisnis", path: "/icons/kantor.jpg" },
  { label: "Kas Umum / Dompet", path: "/icons/umum.jpg" },
];

interface ManageKasModalProps {
  isOpen: boolean;
  accounts: Account[];
  phone: string | null;
  onClose: () => void;
  onKasChanged: () => void;
}

export default function ManageKasModal({
  isOpen,
  accounts,
  phone,
  onClose,
  onKasChanged
}: ManageKasModalProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  // State: Tambah Kas
  const [newKasName, setNewKasName] = useState("");
  const [newKasDesc, setNewKasDesc] = useState("");
  const [newKasIcon, setNewKasIcon] = useState("/icons/umum.jpg");
  const [isSubmittingKas, setIsSubmittingKas] = useState(false);

  // State: Edit Kas
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKasToEdit, setSelectedKasToEdit] = useState<Account | null>(null);
  const [editKasName, setEditKasName] = useState("");
  const [editKasDesc, setEditKasDesc] = useState("");
  const [editKasIcon, setEditKasIcon] = useState("/icons/umum.jpg");
  const [isEditingKasLoading, setIsEditingKasLoading] = useState(false);
  const [editKasMessage, setEditKasMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  // State: Hapus Kas (Secure PIN)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedKasToDelete, setSelectedKasToDelete] = useState<Account | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [isDeletingKasLoading, setIsDeletingKasLoading] = useState(false);
  const [deleteKasMessage, setDeleteKasMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  if (!isOpen) return null;

  // --- Handlers Tambah Kas ---
  const handleAddKas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKasName.trim()) return;

    setIsSubmittingKas(true);
    try {
      const { error } = await supabase.from("accounts").insert({
        name: newKasName.trim(),
        description: newKasDesc.trim() || null,
        icon: newKasIcon || "/icons/umum.jpg"
      });

      if (error) throw error;

      setNewKasName("");
      setNewKasDesc("");
      setNewKasIcon("/icons/umum.jpg");
      setActiveTab("list");
      onKasChanged();
    } catch {
      alert("Gagal menambahkan Kas.");
    } finally {
      setIsSubmittingKas(false);
    }
  };

  // --- Handlers Edit Kas ---
  const handleOpenEdit = (acc: Account) => {
    setSelectedKasToEdit(acc);
    setEditKasName(acc.name);
    setEditKasDesc(acc.description || "");
    setEditKasIcon(acc.icon || "/icons/umum.jpg");
    setEditKasMessage(null);
    setShowEditModal(true);
  };

  const handleSaveEditKas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasToEdit || !editKasName.trim()) return;

    setIsEditingKasLoading(true);
    setEditKasMessage(null);
    try {
      const { error } = await supabase.from("accounts").update({
        name: editKasName.trim(),
        description: editKasDesc.trim() || null,
        icon: editKasIcon || "/icons/umum.jpg"
      }).eq("id", selectedKasToEdit.id);

      if (error) throw error;

      setEditKasMessage({ text: "Perubahan Kas berhasil disimpan!", type: "success" });
      setTimeout(() => {
        setShowEditModal(false);
        setEditKasMessage(null);
        onKasChanged();
      }, 1000);
    } catch {
      setEditKasMessage({ text: "Gagal mengubah data Kas.", type: "error" });
    } finally {
      setIsEditingKasLoading(false);
    }
  };

  // --- Handlers Hapus Kas ---
  const handleOpenDelete = (acc: Account) => {
    setSelectedKasToDelete(acc);
    setDeletePin("");
    setDeleteKasMessage(null);
    setShowDeleteModal(true);
  };

  const handleSecureDeleteKas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasToDelete || deletePin.length !== 6) return;

    setIsDeletingKasLoading(true);
    setDeleteKasMessage(null);

    try {
      // 1. Verifikasi PIN Super Admin
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `hp_${phone}@kaskeluarga.com`,
        password: deletePin,
      });

      if (authError) {
        throw new Error("PIN yang Anda masukkan salah.");
      }

      // 2. Bersihkan transfer berpasangan
      const { data: linkedTxs } = await supabase
        .from("transactions")
        .select("linked_tx_id")
        .eq("account_id", selectedKasToDelete.id)
        .not("linked_tx_id", "is", null);

      if (linkedTxs && linkedTxs.length > 0) {
        const linkedIds = linkedTxs.map(t => t.linked_tx_id).filter(Boolean);
        if (linkedIds.length > 0) {
          await supabase.from("transactions").delete().in("id", linkedIds);
        }
      }

      // 3. Hapus transaksi & kas
      await supabase.from("transactions").delete().eq("account_id", selectedKasToDelete.id);
      const { error: delError } = await supabase.from("accounts").delete().eq("id", selectedKasToDelete.id);

      if (delError) throw delError;

      setDeleteKasMessage({ text: `Kas "${selectedKasToDelete.name}" berhasil dihapus!`, type: "success" });
      setTimeout(() => {
        setShowDeleteModal(false);
        setSelectedKasToDelete(null);
        setDeletePin("");
        setDeleteKasMessage(null);
        onKasChanged();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus Kas.";
      setDeleteKasMessage({ text: msg, type: "error" });
    } finally {
      setIsDeletingKasLoading(false);
    }
  };

  return (
    <>
      {/* Modal Utama: Kelola Kas */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe max-h-[90vh] flex flex-col">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Wallet className="text-emerald-500" size={20} />
              Kelola Kas & Ikon
            </h3>
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "list" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Daftar Kas ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === "add" ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Plus size={14} /> Tambah Kas Baru
            </button>
          </div>

          {activeTab === "list" ? (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 p-0.5 relative overflow-hidden shadow-sm shrink-0">
                      <Image
                        src={acc.icon || "/icons/umum.jpg"}
                        alt={acc.name}
                        fill
                        className="object-cover rounded-xl"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{acc.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{acc.description || "Tanpa deskripsi"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
                      title="Ubah Nama & Ikon Kas"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(acc)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-colors"
                      title="Hapus Kas"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleAddKas} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Kas / Dompet
                </label>
                <input
                  type="text"
                  required
                  value={newKasName}
                  onChange={(e) => setNewKasName(e.target.value)}
                  placeholder="Contoh: Kas Operasional, Kas Liburan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={newKasDesc}
                  onChange={(e) => setNewKasDesc(e.target.value)}
                  placeholder="Contoh: Dompet khusus belanja dapur bulanan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Pilih Gambar Ikon 3D
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_KAS_ICONS.map((ic) => (
                    <button
                      key={ic.path}
                      type="button"
                      onClick={() => setNewKasIcon(ic.path)}
                      className={`p-1.5 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                        newKasIcon === ic.path
                          ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30 scale-105"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl relative overflow-hidden">
                        <Image src={ic.path} alt={ic.label} fill className="object-cover" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 truncate max-w-full">
                        {ic.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingKas || !newKasName.trim()}
                className="w-full py-3.5 text-white font-bold bg-emerald-600 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                {isSubmittingKas ? <Loader2 className="animate-spin" size={18} /> : "Simpan Kas Baru"}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 mt-3">
            <button 
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Modal: Edit Nama & Ikon Kas */}
      {showEditModal && selectedKasToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <h4 className="text-base font-black text-slate-800 mb-1">Ubah Nama & Ikon Kas</h4>
            <p className="text-xs text-slate-400 mb-4">Ganti nama atau ikon visual untuk kas ini.</p>

            {editKasMessage && (
              <div className={`p-3 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2 ${
                editKasMessage.type === "success" 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {editKasMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{editKasMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditKas} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Kas
                </label>
                <input
                  type="text"
                  required
                  value={editKasName}
                  onChange={(e) => setEditKasName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Deskripsi Singkat
                </label>
                <input
                  type="text"
                  value={editKasDesc}
                  onChange={(e) => setEditKasDesc(e.target.value)}
                  placeholder="Deskripsi kas..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Pilih Gambar Ikon 3D
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_KAS_ICONS.map((ic) => (
                    <button
                      key={ic.path}
                      type="button"
                      onClick={() => setEditKasIcon(ic.path)}
                      className={`p-1.5 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                        editKasIcon === ic.path
                          ? "bg-blue-50 border-blue-500 ring-2 ring-blue-400/30 scale-105"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl relative overflow-hidden">
                        <Image src={ic.path} alt={ic.label} fill className="object-cover" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 truncate max-w-full">
                        {ic.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditingKasLoading || !editKasName.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center shadow-md shadow-blue-200"
                >
                  {isEditingKasLoading ? <Loader2 className="animate-spin" size={16} /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Hapus Kas dengan PIN */}
      {showDeleteModal && selectedKasToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-3">
              <Lock size={24} />
            </div>
            <h4 className="text-base font-black text-slate-800 mb-1">Hapus Kas {selectedKasToDelete.name}?</h4>
            <p className="text-xs text-red-600 font-medium mb-4">
              Peringatan: Seluruh riwayat transaksi di kas ini akan terhapus permanen. Masukkan 6 digit PIN Anda untuk konfirmasi:
            </p>

            {deleteKasMessage && (
              <div className={`p-3 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2 ${
                deleteKasMessage.type === "success" 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {deleteKasMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{deleteKasMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSecureDeleteKas} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, ""))}
                placeholder="6 Digit PIN"
                className="w-full px-4 py-3 bg-slate-50 border border-red-200 rounded-2xl text-center text-lg font-black text-slate-800 tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeletingKasLoading || deletePin.length !== 6}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center shadow-md shadow-red-200 disabled:opacity-50"
                >
                  {isDeletingKasLoading ? <Loader2 className="animate-spin" size={16} /> : "Hapus Permanen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
