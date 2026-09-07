"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { 
  Gift, 
  Coins, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Edit3, 
  Trash2, 
  X,
  ShoppingBag,
  Loader2
} from "lucide-react";
import { Reward, RewardClaim } from "@/types/database";
import { RewardsSkeleton } from "@/components/ui/Skeleton";
import FamilyLeaderboard from "@/components/rewards/FamilyLeaderboard";

const PRESET_REWARD_ICONS = ["🎁", "🍦", "🧋", "🎮", "🍕", "🎬", "🎟️", "🧸", "👟", "🍰", "🍔", "🍫", "🍩", "📚"];

export default function RewardsPage() {
  const { profile, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State: Tambah / Edit Hadiah
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardCost, setRewardCost] = useState("");
  const [rewardIcon, setRewardIcon] = useState("🎁");
  const [isSavingReward, setIsSavingReward] = useState(false);

  // Filter / Tab State
  const [activeTab, setActiveTab] = useState<"catalog" | "claims">("catalog");

  const refreshData = async () => {
    const { data: rData } = await supabase.from("rewards").select("*").order("points_cost", { ascending: true });
    if (rData) setRewards(rData as Reward[]);

    if (profile?.role === "super_admin") {
      const { data: cData } = await supabase
        .from("reward_claims")
        .select("*, profiles(full_name), rewards(title, points_cost, icon)")
        .order("created_at", { ascending: false });
      if (cData) setClaims(cData as RewardClaim[]);
    } else if (profile?.id) {
      const { data: cData } = await supabase
        .from("reward_claims")
        .select("*, rewards(title, icon, points_cost)")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      if (cData) setClaims(cData as RewardClaim[]);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: rData } = await supabase.from("rewards").select("*").order("points_cost", { ascending: true });
      if (rData) setRewards(rData as Reward[]);

      if (profile?.role === "super_admin") {
        const { data: cData } = await supabase
          .from("reward_claims")
          .select("*, profiles(full_name), rewards(title, points_cost, icon)")
          .order("created_at", { ascending: false });
        if (cData) setClaims(cData as RewardClaim[]);
      } else if (profile?.id) {
        const { data: cData } = await supabase
          .from("reward_claims")
          .select("*, rewards(title, icon, points_cost)")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });
        if (cData) setClaims(cData as RewardClaim[]);
      }
      setLoading(false);
    }
    loadData();
  }, [profile]);

  // --- Handlers Buat / Edit Hadiah (Super Admin) ---
  const handleOpenCreateReward = () => {
    setEditingReward(null);
    setRewardTitle("");
    setRewardCost("");
    setRewardIcon("🎁");
    setShowRewardModal(true);
  };

  const handleOpenEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setRewardTitle(reward.title);
    setRewardCost(reward.points_cost.toString());
    setRewardIcon(reward.icon || "🎁");
    setShowRewardModal(true);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const numCost = parseInt(rewardCost.replace(/\D/g, ""), 10) || 0;
    if (!rewardTitle.trim() || numCost <= 0) {
      alert("Mohon isi judul hadiah dan biaya poin yang valid!");
      return;
    }

    setIsSavingReward(true);
    try {
      if (editingReward) {
        const { error } = await supabase
          .from("rewards")
          .update({
            title: rewardTitle.trim(),
            points_cost: numCost,
            icon: rewardIcon
          })
          .eq("id", editingReward.id);

        if (error) throw error;
        alert("Hadiah berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("rewards")
          .insert({
            title: rewardTitle.trim(),
            points_cost: numCost,
            icon: rewardIcon
          });

        if (error) throw error;
        alert("Hadiah baru berhasil ditambahkan!");
      }

      setShowRewardModal(false);
      refreshData();
    } catch {
      alert("Gagal menyimpan data hadiah.");
    } finally {
      setIsSavingReward(false);
    }
  };

  const handleDeleteReward = async (reward: Reward) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus hadiah "${reward.title}"?`)) return;

    try {
      const { error } = await supabase.from("rewards").delete().eq("id", reward.id);
      if (error) throw error;
      alert("Hadiah berhasil dihapus.");
      refreshData();
    } catch {
      alert("Gagal menghapus hadiah.");
    }
  };

  // --- Handlers Tukar Hadiah (Member) ---
  const handleClaim = async (reward: Reward) => {
    if (!profile) return;
    if (profile.points < reward.points_cost) {
      alert(`Poin kamu tidak cukup! Kamu membutuhkan ${reward.points_cost} Poin, sementara poinmu saat ini ${profile.points} Poin.`);
      return;
    }

    const confirm = window.confirm(`Tukar ${reward.points_cost} Poin untuk "${reward.title}"? Permintaan akan dikirimkan ke Admin untuk disetujui.`);
    if (!confirm) return;

    try {
      const { error } = await supabase.from("reward_claims").insert({
        user_id: profile.id,
        reward_id: reward.id,
        status: "pending"
      });

      if (error) throw error;
      alert("🎉 Permintaan penukaran berhasil dikirim! Tunggu konfirmasi dari Super Admin ya.");
      refreshData();
    } catch {
      alert("Gagal menukar poin. Silakan coba lagi.");
    }
  };

  // --- Handlers Approval (Super Admin) ---
  const handleApprove = async (claim: RewardClaim) => {
    try {
      const cost = claim.rewards?.points_cost || 0;
      
      const { data: uData, error: uError } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", claim.user_id)
        .single();

      if (uError || !uData) {
        alert("Gagal memverifikasi poin pengguna.");
        return;
      }

      if (uData.points < cost) {
        alert(`Poin pengguna tidak mencukupi saat ini (Poin: ${uData.points}, Biaya: ${cost}).`);
        return;
      }

      const { error: deductError } = await supabase
        .from("profiles")
        .update({ points: uData.points - cost })
        .eq("id", claim.user_id);

      if (deductError) throw deductError;

      const { error: claimError } = await supabase
        .from("reward_claims")
        .update({ status: "approved" })
        .eq("id", claim.id);

      if (claimError) throw claimError;

      alert(`✅ Penukaran hadiah berhasil disetujui! Poin ${claim.profiles?.full_name} telah dipotong sebanyak ${cost} Poin.`);
      refreshData();
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error("Gagal menyetujui klaim:", e);
      alert("Terjadi kesalahan saat menyetujui klaim.");
    }
  };

  const handleReject = async (claimId: string) => {
    if (!confirm("Apakah Anda yakin ingin menolak permintaan penukaran poin ini?")) return;
    try {
      const { error } = await supabase.from("reward_claims").update({ status: "rejected" }).eq("id", claimId);
      if (error) throw error;
      alert("Permintaan penukaran telah ditolak.");
      refreshData();
    } catch {
      alert("Gagal menolak klaim.");
    }
  };

  const pendingClaimsCount = claims.filter(c => c.status === "pending").length;

  if (loading) {
    return <RewardsSkeleton />;
  }

  return (
    <main className="p-6 pb-28 min-h-screen bg-slate-50">
      {/* Header */}
      <header className="mb-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Gift className="text-pink-500" />
            Toko Keluarga
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Tukarkan poin reward dengan hadiah seru</p>
        </div>

        {profile?.role === "super_admin" && (
          <button 
            onClick={handleOpenCreateReward}
            className="text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-pink-200 hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={16} /> Tambah Hadiah
          </button>
        )}
      </header>

      {/* Family Leaderboard Podium */}
      <FamilyLeaderboard />

      {/* Member Points Card */}
      {profile?.role === "member" && (
        <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white p-5 rounded-3xl shadow-xl shadow-pink-200/60 mb-6 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] text-white/10 select-none pointer-events-none">
            <Coins size={130} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-pink-200 animate-spin" />
              <p className="text-[11px] font-bold text-pink-100 uppercase tracking-widest">Poin Reward Kamu</p>
            </div>
            <h2 className="text-3xl font-black mb-2">{profile?.points || 0} <span className="text-lg font-bold text-pink-200">Poin</span></h2>
            <p className="text-xs text-pink-100/90 max-w-[280px]">
              Dapatkan +1 Poin setiap patungan Rp 1.000 untuk impian keluarga!
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Catalog vs Claims) */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "catalog" 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingBag size={14} /> Katalog Hadiah ({rewards.length})
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === "claims" 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock size={14} /> Riwayat Klaim
          {profile?.role === "super_admin" && pendingClaimsCount > 0 && (
            <span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              {pendingClaimsCount}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: KATALOG HADIAH */}
      {/* ======================================================== */}
      {activeTab === "catalog" && (
        <section>
          <div className="grid grid-cols-2 gap-4">
            {rewards.map(reward => {
              const canAfford = (profile?.points || 0) >= reward.points_cost;
              const pointsNeeded = Math.max(0, reward.points_cost - (profile?.points || 0));

              return (
                <div 
                  key={reward.id} 
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center group hover:border-pink-200 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                >
                  {profile?.role === "super_admin" && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditReward(reward)}
                        className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        title="Edit Hadiah"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteReward(reward)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Hadiah"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="w-16 h-16 bg-pink-50 text-3xl flex items-center justify-center rounded-2xl mx-auto mb-3 shadow-inner border border-pink-100 group-hover:scale-110 transition-transform">
                      {reward.icon || "🎁"}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[34px]">{reward.title}</h4>
                  </div>

                  <div className="w-full mt-3">
                    <div className="bg-pink-50 text-pink-600 text-xs font-black py-1 px-3 rounded-full mb-3 inline-block">
                      {reward.points_cost} Poin
                    </div>

                    {profile?.role === "member" && (
                      <button 
                        onClick={() => handleClaim(reward)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          canAfford 
                            ? 'bg-slate-900 text-white hover:bg-pink-600 active:scale-95 shadow-slate-200' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed text-[11px]'
                        }`}
                      >
                        {canAfford ? "Tukar Hadiah" : `Kurang ${pointsNeeded} Poin`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {rewards.length === 0 && (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
              <Gift size={40} className="mx-auto mb-3 text-pink-400 opacity-40" />
              <h3 className="font-bold text-slate-800 text-sm mb-1">Belum Ada Hadiah</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                {profile?.role === "super_admin" 
                  ? "Tambahkan hadiah menarik untuk memotivasi anggota keluarga berhemat & berpatungan." 
                  : "Admin belum menambahkan hadiah di toko saat ini."}
              </p>
              {profile?.role === "super_admin" && (
                <button 
                  onClick={handleOpenCreateReward}
                  className="text-xs font-bold text-white bg-pink-500 px-4 py-2 rounded-xl shadow-md shadow-pink-200 hover:bg-pink-600 transition-all inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Tambah Hadiah Sekarang
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RIWAYAT KLAIM */}
      {/* ======================================================== */}
      {activeTab === "claims" && (
        <section className="space-y-3">
          {claims.map(claim => (
            <div 
              key={claim.id} 
              className={`bg-white p-4 rounded-2xl border transition-all ${
                claim.status === "pending" ? 'border-orange-200 shadow-sm' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-xl flex items-center justify-center rounded-xl border border-slate-100 shrink-0">
                    {claim.rewards?.icon || "🎁"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{claim.rewards?.title || "Hadiah"}</h4>
                    <p className="text-[10px] text-slate-400">
                      {claim.profiles?.full_name ? `Oleh: ${claim.profiles.full_name} • ` : ""}
                      {new Date(claim.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div>
                  {claim.status === 'pending' && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 inline-flex items-center gap-1">
                      <Clock size={11} /> Menunggu
                    </span>
                  )}
                  {claim.status === 'approved' && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 size={11} /> Disetujui
                    </span>
                  )}
                  {claim.status === 'rejected' && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 inline-flex items-center gap-1">
                      <XCircle size={11} /> Ditolak
                    </span>
                  )}
                </div>
              </div>

              {profile?.role === "super_admin" && claim.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-3">
                  <button 
                    onClick={() => handleApprove(claim)} 
                    className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
                  >
                    Setujui (Potong {claim.rewards?.points_cost} Poin)
                  </button>
                  <button 
                    onClick={() => handleReject(claim.id)} 
                    className="py-2 px-4 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 transition-colors"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          ))}

          {claims.length === 0 && (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
              <Clock size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-xs font-bold text-slate-400">Belum ada riwayat klaim penukaran hadiah.</p>
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* MODAL: Tambah / Edit Hadiah (Super Admin) */}
      {/* ======================================================== */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Gift className="text-pink-500" size={20} />
                {editingReward ? "Edit Hadiah" : "Tambah Hadiah Baru"}
              </h2>
              <button 
                type="button"
                onClick={() => setShowRewardModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-4">
              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih Template Cepat
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { title: "Es Krim Favorit", cost: 15, icon: "🍦" },
                    { title: "Main Game 1 Jam", cost: 30, icon: "🎮" },
                    { title: "Pilih Menu Makan Malam", cost: 25, icon: "🍕" },
                    { title: "Nonton Bioskop Weekend", cost: 50, icon: "🎬" },
                    { title: "Uang Jajan Tambahan", cost: 40, icon: "💵" },
                  ].map((tpl) => (
                    <button
                      key={tpl.title}
                      type="button"
                      onClick={() => {
                        setRewardTitle(tpl.title);
                        setRewardCost(tpl.cost.toString());
                        setRewardIcon(tpl.icon);
                      }}
                      className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span>{tpl.icon}</span>
                      <span>{tpl.title}</span>
                      <span className="text-[10px] opacity-75">({tpl.cost} Pts)</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Hadiah
                </label>
                <input
                  type="text"
                  required
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="Contoh: Traktir Minuman Boba, Voucher Game"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Biaya Poin untuk Menukar
                </label>
                <input
                  type="number"
                  required
                  value={rewardCost}
                  onChange={(e) => setRewardCost(e.target.value)}
                  placeholder="Contoh: 50"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Ikon Hadiah
                </label>
                <div className="grid grid-cols-7 gap-2 pt-1">
                  {PRESET_REWARD_ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setRewardIcon(ic)}
                      className={`text-2xl p-2 rounded-2xl border transition-all flex items-center justify-center ${
                        rewardIcon === ic 
                          ? 'bg-pink-50 border-pink-500 shadow-sm scale-105' 
                          : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowRewardModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSavingReward}
                  className="flex-1 py-3.5 text-white font-bold bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-pink-200 disabled:opacity-50"
                >
                  {isSavingReward ? <Loader2 className="animate-spin" size={18} /> : (editingReward ? "Simpan Perubahan" : "Tambah Hadiah")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
