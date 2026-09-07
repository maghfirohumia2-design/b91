"use client";

import { useState, useEffect } from "react";
import { Users, X, Loader2, Edit2, Trash2, Check, Shield, User, RefreshCw, AlertCircle } from "lucide-react";
import { getUsersAction, deleteUserAction, updateUserAction, updateUserRoleAction } from "@/app/actions/admin";
import { supabase } from "@/lib/supabase";
import { AdminUser, UserProfile, UserRole } from "@/types/database";

interface MemberListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberListModal({ isOpen, onClose }: MemberListModalProps) {
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit State
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberPhone, setEditMemberPhone] = useState("");
  const [editMemberPin, setEditMemberPin] = useState("");
  const [editMemberRole, setEditMemberRole] = useState<UserRole>("member");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    setErrorMessage(null);
    try {
      const token = await getAccessToken();
      const res = await getUsersAction(token);

      if (res.success && res.users && res.users.length > 0) {
        setMembers(res.users);
      } else {
        // Fallback langsung ke database tabel profiles jika server action mengalami kendala
        const { data: profs, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profs && profs.length > 0) {
          const mapped: AdminUser[] = profs.map((p: UserProfile) => ({
            id: p.id,
            phone: "-",
            fullName: p.full_name || "Tanpa Nama",
            role: (p.role || "member") as UserRole,
            points: p.points || 0,
            createdAt: p.created_at,
          }));
          setMembers(mapped);
        } else if (pError) {
          setErrorMessage(res.error || "Gagal memuat data anggota.");
        } else {
          setMembers([]);
        }
      }
    } catch (err) {
      console.error("fetchMembers exception:", err);
      try {
        const { data: profs } = await supabase.from("profiles").select("*");
        if (profs && profs.length > 0) {
          const mapped: AdminUser[] = profs.map((p: UserProfile) => ({
            id: p.id,
            phone: "-",
            fullName: p.full_name || "Tanpa Nama",
            role: (p.role || "member") as UserRole,
            points: p.points || 0,
            createdAt: p.created_at,
          }));
          setMembers(mapped);
        } else {
          setErrorMessage("Terjadi kesalahan saat memuat daftar anggota.");
        }
      } catch {
        setErrorMessage("Terjadi kesalahan jaringan.");
      }
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadInitial() {
      setLoadingMembers(true);
      setErrorMessage(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || "";
        const res = await getUsersAction(token);

        if (res.success && res.users && res.users.length > 0) {
          if (isMounted) setMembers(res.users);
          return;
        }

        // Fallback langsung ke database tabel profiles
        const { data: profs, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profs && profs.length > 0) {
          const mapped: AdminUser[] = profs.map((p: UserProfile) => ({
            id: p.id,
            phone: "-",
            fullName: p.full_name || "Tanpa Nama",
            role: (p.role || "member") as UserRole,
            points: p.points || 0,
            createdAt: p.created_at,
          }));
          if (isMounted) setMembers(mapped);
        } else if (pError && isMounted) {
          setErrorMessage("Gagal memuat data profil anggota.");
        }
      } catch (err) {
        console.error("load members exception:", err);
        if (isMounted) {
          try {
            const { data: profs } = await supabase.from("profiles").select("*");
            if (profs && profs.length > 0) {
              const mapped: AdminUser[] = profs.map((p: UserProfile) => ({
                id: p.id,
                phone: "-",
                fullName: p.full_name || "Tanpa Nama",
                role: (p.role || "member") as UserRole,
                points: p.points || 0,
                createdAt: p.created_at,
              }));
              setMembers(mapped);
            }
          } catch {
            setErrorMessage("Terjadi kesalahan saat memuat anggota.");
          }
        }
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (m: AdminUser) => {
    setEditMemberId(m.id);
    setEditMemberName(m.fullName);
    setEditMemberPhone(m.phone !== "-" ? m.phone : "");
    setEditMemberPin("");
    setEditMemberRole(m.role);
  };

  const handleSaveEdit = async (userId: string) => {
    setIsSavingEdit(true);
    try {
      const token = await getAccessToken();
      const res = await updateUserAction(token, userId, editMemberPhone, editMemberName, editMemberPin);
      if (res.error) {
        // Fallback update profiles directly
        await supabase
          .from("profiles")
          .update({ full_name: editMemberName.trim(), role: editMemberRole })
          .eq("id", userId);
      } else {
        if (editMemberRole) {
          await updateUserRoleAction(token, userId, editMemberRole);
        }
      }
      setEditMemberId(null);
      await fetchMembers();
      alert("Data anggota berhasil diperbarui!");
    } catch {
      alert("Gagal memperbarui data anggota.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteMember = async (userId: string, memberName: string) => {
    if (confirm(`Yakin ingin menghapus anggota "${memberName}" dari sistem?\n(Catatan transaksi yang pernah dibuat akan tetap aman)`)) {
      setLoadingMembers(true);
      try {
        const token = await getAccessToken();
        const res = await deleteUserAction(token, userId);
        if (res.error) {
          // Coba hapus dari profiles
          const { error: pErr } = await supabase.from("profiles").delete().eq("id", userId);
          if (pErr) alert(res.error);
          else {
            alert("Anggota berhasil dihapus dari profil.");
            await fetchMembers();
          }
        } else {
          alert("Anggota berhasil dihapus.");
          await fetchMembers();
        }
      } catch {
        alert("Gagal menghapus anggota.");
      } finally {
        setLoadingMembers(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[85vh] flex flex-col pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>

        {/* Header Modal */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="text-blue-500" size={20} />
            Daftar Anggota Keluarga ({members.length})
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={fetchMembers}
              disabled={loadingMembers}
              className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              title="Muat Ulang"
            >
              <RefreshCw size={17} className={loadingMembers ? "animate-spin" : ""} />
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Kelola hak akses, perbarui nama/nomor HP/PIN, atau hapus akses anggota.
        </p>

        {/* Error Banner if any */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs mb-3 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{errorMessage}</p>
              <button
                type="button"
                onClick={fetchMembers}
                className="text-[11px] underline font-bold mt-1 text-red-800 block"
              >
                Coba Muat Ulang
              </button>
            </div>
          </div>
        )}

        {/* Member List Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loadingMembers ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-500 mb-2" size={28} />
              <p className="text-xs font-bold text-slate-400">Memuat anggota...</p>
            </div>
          ) : (
            members.map(m => {
              const isEditingThis = editMemberId === m.id;

              return (
                <div 
                  key={m.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    isEditingThis ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  {isEditingThis ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={editMemberName}
                          onChange={(e) => setEditMemberName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Nomor HP
                          </label>
                          <input
                            type="tel"
                            value={editMemberPhone}
                            onChange={(e) => setEditMemberPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="08..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Role Akses
                          </label>
                          <select
                            value={editMemberRole}
                            onChange={(e) => setEditMemberRole(e.target.value as UserRole)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="member">Anggota Biasa</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Reset PIN Baru (Opsional)
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          value={editMemberPin}
                          onChange={(e) => setEditMemberPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="Kosongkan jika tidak diubah"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditMemberId(null)}
                          className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isSavingEdit}
                          onClick={() => handleSaveEdit(m.id)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-blue-200"
                        >
                          {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-black text-sm shrink-0">
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-800">{m.fullName}</h4>
                            {m.role === 'super_admin' ? (
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Shield size={10} /> Admin
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <User size={10} /> Anggota
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {m.phone && m.phone !== "-" ? m.phone : "Terdaftar"} • {m.points || 0} Poin
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(m)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
                          title="Edit Anggota"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(m.id, m.fullName)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-colors"
                          title="Hapus Anggota"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {!loadingMembers && members.length === 0 && !errorMessage && (
            <div className="text-center py-12 text-slate-400">
              <Users className="mx-auto mb-2 opacity-40" size={32} />
              <p className="text-xs font-bold">Belum ada data anggota lain yang ditemukan.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
