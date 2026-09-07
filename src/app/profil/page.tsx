"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  KeyRound, 
  Users, 
  LogOut, 
  ChevronRight, 
  Shield, 
  Tags, 
  Wallet, 
  UserPlus,
  BarChart3,
  Sparkles,
  Receipt,
  CircleDollarSign
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Account } from "@/types/database";

// Modular Components
import ProfileHeader from "@/components/profil/ProfileHeader";
import ChangePinModal from "@/components/profil/ChangePinModal";
import AddUserModal from "@/components/profil/AddUserModal";
import MemberListModal from "@/components/profil/MemberListModal";
import ManageKasModal from "@/components/profil/ManageKasModal";
import AiSettingsModal from "@/components/profil/AiSettingsModal";

export default function ProfilPage() {
  const router = useRouter();
  const { session, profile, refreshProfile } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Modals visibility
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showMemberListModal, setShowMemberListModal] = useState(false);
  const [showManageKasModal, setShowManageKasModal] = useState(false);
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);

  // Derived values from session & profile
  const userEmail = session?.user?.email || "";
  const phone = userEmail.startsWith("hp_") && userEmail.includes("@")
    ? userEmail.replace("hp_", "").split("@")[0]
    : null;
  const fullName = session?.user?.user_metadata?.full_name || profile?.full_name || "Pengguna";
  const avatarUrl = session?.user?.user_metadata?.avatar_url || profile?.avatar_url || null;

  const fetchKasAccounts = async () => {
    const { data } = await supabase.from("accounts").select("*").order("name", { ascending: true });
    if (data) setAccounts(data as Account[]);
  };

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from("accounts").select("*").order("name", { ascending: true });
      if (data) setAccounts(data as Account[]);
    }
    loadData();
  }, []);

  const handleProfileUpdated = () => {
    if (refreshProfile) refreshProfile();
  };

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  return (
    <main className="p-6 pb-28 min-h-screen bg-slate-50">
      {/* Header Page */}
      <header className="mb-4 pt-4">
        <h1 className="text-2xl font-black text-slate-800">Profil & Pengaturan</h1>
        <p className="text-xs text-slate-400 mt-0.5">Kelola akun, akses keluarga, dan preferensi aplikasi</p>
      </header>

      {/* Profile Avatar & Info Card */}
      <ProfileHeader
        profile={profile}
        phone={phone}
        fullName={fullName}
        avatarUrl={avatarUrl}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Menu Sections */}
      <div className="space-y-4">
        {/* Section: Akun & Keamanan */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Akun & Keamanan
          </h3>
          <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm space-y-1">
            <button
              onClick={() => setShowPinModal(true)}
              className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Ubah PIN Keamanan</h4>
                  <p className="text-[11px] text-slate-400">Ganti 6 digit PIN masuk Anda</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          </div>
        </div>

        {/* Section: Administrasi Keluarga (Super Admin Only) */}
        {profile?.role === "super_admin" && (
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-600" /> Administrasi Keluarga
            </h3>
            <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm space-y-1">
              <button
                onClick={() => setShowAddUserModal(true)}
                className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Tambah Anggota Keluarga</h4>
                    <p className="text-[11px] text-slate-400">Daftarkan nomor HP baru anggota</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>

              <button
                onClick={() => setShowMemberListModal(true)}
                className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Kelola Anggota Keluarga</h4>
                    <p className="text-[11px] text-slate-400">Ubah nama, reset PIN, atau hapus anggota</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>

              <button
                onClick={() => setShowManageKasModal(true)}
                className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Kelola Kas / Dompet ({accounts.length})</h4>
                    <p className="text-[11px] text-slate-400">Tambah, ubah nama, atau hapus kas</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>

              <Link
                href="/profil/kategori"
                className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Tags size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Kelola Kategori Transaksi</h4>
                    <p className="text-[11px] text-slate-400">Atur kategori pemasukan & pengeluaran</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
            </div>
          </div>
        )}

        {/* Section: Laporan & Arsip Data (Untuk Semua Anggota) */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Laporan & Pembukuan
          </h3>
          <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm space-y-1">
            <Link
              href="/tagihan"
              className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Receipt size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Tagihan Rutin & Pengingat</h4>
                  <p className="text-[11px] text-slate-400">Kelola listrik, WiFi, SPP, & status pembayaran</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>

            <Link
              href="/hutang-piutang"
              className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left border-t border-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CircleDollarSign size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Catatan Hutang & Piutang</h4>
                  <p className="text-[11px] text-slate-400">Buku pinjaman keluarga & rekap cicilan</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>

            <Link
              href="/laporan"
              className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left border-t border-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Laporan & Ekspor Arus Kas</h4>
                  <p className="text-[11px] text-slate-400">Analisis tren, cetak PDF, atau unduh CSV/Excel</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
          </div>
        </div>

        {/* Section: Fitur Cerdas & AI (Untuk Semua Anggota) */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Fitur Cerdas AI
          </h3>
          <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm space-y-1">
            <button
              type="button"
              onClick={() => setShowAiSettingsModal(true)}
              className="w-full p-3.5 flex items-center justify-between rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Pengaturan AI Gemini (Scan Struk)</h4>
                  <p className="text-[11px] text-slate-400">Atur & uji kunci API Google AI Studio</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          </div>
        </div>

        {/* Section: Keluar Akun */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full p-4 bg-white border border-red-100 rounded-3xl text-red-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 active:bg-red-100 transition-all shadow-sm"
          >
            <LogOut size={16} /> Keluar dari Aplikasi
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Modular Modals */}
      {/* ======================================================== */}
      <ChangePinModal
        isOpen={showPinModal}
        phone={phone}
        onClose={() => setShowPinModal(false)}
      />

      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={() => {}}
      />

      <MemberListModal
        isOpen={showMemberListModal}
        onClose={() => setShowMemberListModal(false)}
      />

      <ManageKasModal
        isOpen={showManageKasModal}
        accounts={accounts}
        phone={phone}
        onClose={() => setShowManageKasModal(false)}
        onKasChanged={fetchKasAccounts}
      />

      <AiSettingsModal
        isOpen={showAiSettingsModal}
        onClose={() => setShowAiSettingsModal(false)}
      />

    </main>
  );
}
